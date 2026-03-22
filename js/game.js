// Main game engine

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'girl';
document.body.className = `theme-${savedTheme}`;

// Game state
let gameConfig = null;
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;
let startTime = null;
let timerInterval = null;
let questions = [];
let scoreSaved = false;

// Boss battle state
let bossHP = 10;
let consecutiveCorrect = 0;
let totalAttempts = 0;
const BOSS_MAX_ATTEMPTS = 60;

// Initialize game
function initGame() {
    // Load game configuration
    const configData = localStorage.getItem('currentGame');
    if (!configData) {
        alert('Nincs játék beállítva!');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        gameConfig = JSON.parse(configData);
    } catch (e) {
        console.error('Error parsing game config:', e);
        window.location.href = 'index.html';
        return;
    }

    if (gameConfig.mode === 'boss') {
        initBossMode();
    } else {
        // Generate all questions
        questions = generateQuestions(gameConfig.numQuestions);
        document.getElementById('totalQuestions').textContent = gameConfig.numQuestions;
    }
    
    // Start first question
    nextQuestion();
}

// Set up the boss battle UI
function initBossMode() {
    const boss = BOSS_ENEMIES.find(b => b.id === gameConfig.bossId) || BOSS_ENEMIES[0];
    bossHP = 10;
    consecutiveCorrect = 0;
    totalAttempts = 0;

    const bossSection = document.getElementById('bossSection');
    if (bossSection) {
        bossSection.style.display = '';
        document.getElementById('bossEmoji').textContent = boss.emoji;
        document.getElementById('bossName').textContent = boss.name;
        updateBossHP();
    }

    // Hide normal progress display; show boss progress instead
    const progressEl = document.getElementById('progressDisplay');
    if (progressEl) progressEl.style.display = 'none';

    // Pre-generate a fixed buffer of boss questions
    questions = generateQuestions(BOSS_MAX_ATTEMPTS);
    document.getElementById('totalQuestions').textContent = '?';
}

// Generate all questions for the game
function generateQuestions(count) {
    const questions = [];
    
    for (let i = 0; i < count; i++) {
        questions.push(generateQuestion());
    }
    
    return questions;
}

// Generate a single question
function generateQuestion() {
    if (gameConfig.type === 'multiply') {
        return generateMultiplyQuestion();
    } else if (gameConfig.type === 'precedence') {
        return generatePrecedenceQuestion();
    } else {
        return generateAddQuestion();
    }
}

// Return the storage key used to track a question's result
function getTaskKey(question) {
    if (gameConfig.type === 'multiply') {
        // Extract actual base and multiplier from the question regardless of operator
        const base = question.operator === '×' ? question.num1 : question.num2;
        const multiplier = question.operator === '×' ? question.num2 : question.answer;
        return `multiply:${base}:${multiplier}`;
    } else if (gameConfig.type === 'precedence') {
        return `precedence:${gameConfig.config}:${question.expressionKey}`;
    } else {
        const limit = gameConfig.config;
        const op = question.operator === '+' ? 'add' : 'sub';
        return `add:${limit}:${question.num1}:${question.num2}:${op}`;
    }
}

// Calculate selection weight for a task.
// Returns 1 (base weight) when no errors or no data, higher when errors exceed correct answers.
function getTaskWeight(stats) {
    if (!stats || stats.wrong === 0) return 1;
    return Math.max(1, 1 + stats.wrong - stats.correct);
}

// Weighted random selection from an array of { weight, ... } objects
function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of items) {
        rand -= item.weight;
        if (rand <= 0) return item;
    }
    return items[items.length - 1];
}

// Generate multiplication/division question with weighted selection
function generateMultiplyQuestion() {
    const maxBase = gameConfig.config;
    const taskStats = getTaskStats(gameConfig.playerName);

    // Build a weighted list of candidate (base, multiplier) pairs.
    // When includeLowerNumbers is set, all bases from 2..maxBase are included;
    // otherwise only the selected base is used.
    const bases = gameConfig.includeLowerNumbers
        ? Array.from({ length: maxBase - 1 }, (_, i) => i + 2)  // [2 .. maxBase]
        : [maxBase];

    const choices = [];
    for (const b of bases) {
        for (let i = 1; i <= 10; i++) {
            const key = `multiply:${b}:${i}`;
            choices.push({ base: b, multiplier: i, weight: getTaskWeight(taskStats[key]) });
        }
    }

    const selected = weightedRandom(choices);
    const base = selected.base;
    const multiplier = selected.multiplier;

    // 50% chance of multiplication, 50% division
    const isMultiply = Math.random() < 0.5;

    if (isMultiply) {
        return {
            num1: base,
            num2: multiplier,
            operator: '×',
            answer: base * multiplier
        };
    } else {
        const product = base * multiplier;
        return {
            num1: product,
            num2: base,
            operator: '÷',
            answer: multiplier
        };
    }
}

// Generate addition/subtraction question with weighted selection for known failing tasks
function generateAddQuestion() {
    const limit = gameConfig.config;
    const taskStats = getTaskStats(gameConfig.playerName);

    // Collect previously-failed tasks for this limit
    const failedTasks = [];
    for (const [key, stats] of Object.entries(taskStats)) {
        if (key.startsWith(`add:${limit}:`) && stats.wrong > 0) {
            failedTasks.push({ key, weight: getTaskWeight(stats) });
        }
    }

    const totalFailedWeight = failedTasks.reduce((sum, t) => sum + t.weight, 0);

    // Select a previously-failed task with probability proportional to the failure weight.
    // A fixed base weight of 10 represents the "generate a fresh random question" option,
    // ensuring a uniform distribution when there are no failures and a gradual shift
    // towards failed tasks as failure weight grows.
    const BASE_RANDOM_WEIGHT = 10;
    if (failedTasks.length > 0 && Math.random() * (totalFailedWeight + BASE_RANDOM_WEIGHT) < totalFailedWeight) {
        const selected = weightedRandom(failedTasks);
        // key format: add:{limit}:{num1}:{num2}:{op}
        const parts = selected.key.split(':');
        const num1 = parseInt(parts[2]);
        const num2 = parseInt(parts[3]);
        const op = parts[4];
        if (op === 'add') {
            return { num1, num2, operator: '+', answer: num1 + num2 };
        } else {
            return { num1, num2, operator: '−', answer: num1 - num2 };
        }
    }

    // 50% chance of addition, 50% subtraction
    const isAdd = Math.random() < 0.5;
    
    if (isAdd) {
        // Generate two numbers that add up to less than limit
        const num1 = Math.floor(Math.random() * (limit + 1));
        const num2 = Math.floor(Math.random() * (limit - num1 + 1));
        
        return {
            num1: num1,
            num2: num2,
            operator: '+',
            answer: num1 + num2
        };
    } else {
        // Generate subtraction with positive result
        const num1 = Math.floor(Math.random() * (limit + 1));
        const num2 = Math.floor(Math.random() * (num1 + 1));
        
        return {
            num1: num1,
            num2: num2,
            operator: '−',
            answer: num1 - num2
        };
    }
}

// Generate operator-precedence question with adaptive selection
function generatePrecedenceQuestion() {
    const limit = gameConfig.config;
    const taskStats = getTaskStats(gameConfig.playerName);

    // Collect previously-failed tasks for this limit
    const failedTasks = [];
    for (const [key, stats] of Object.entries(taskStats)) {
        if (key.startsWith(`precedence:${limit}:`) && stats.wrong > 0) {
            failedTasks.push({ key, weight: getTaskWeight(stats) });
        }
    }

    const totalFailedWeight = failedTasks.reduce((sum, t) => sum + t.weight, 0);
    const BASE_RANDOM_WEIGHT = 10;

    // Replay a previously failed task with proportional probability
    if (failedTasks.length > 0 && Math.random() * (totalFailedWeight + BASE_RANDOM_WEIGHT) < totalFailedWeight) {
        const selected = weightedRandom(failedTasks);
        // key format: precedence:{limit}:{expressionKey}
        const expressionKey = selected.key.slice(`precedence:${limit}:`.length);
        // Safe eval: keys contain only digits, +, -, *, /, (, )
        const answer = Function(`"use strict"; return (${expressionKey})`)();
        const expression = expressionKeyToDisplay(expressionKey);
        return { expression, expressionKey, answer };
    }

    return generateFreshPrecedenceQuestion(limit);
}

// Convert an ASCII expressionKey back to the display string with Unicode operators
function expressionKeyToDisplay(key) {
    return key
        .replace(/\*/g, ' × ')
        .replace(/\//g, ' ÷ ')
        .replace(/-/g, ' − ')
        .replace(/\+/g, ' + ')
        .replace(/\s+/g, ' ')
        // Fix spacing inside parentheses: "( " -> "(" and " )" -> ")"
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')');
}

// Generate a fresh random precedence question for the given limit
function generateFreshPrecedenceQuestion(limit) {
    // Templates available for all limits (A-H)
    const baseTemplates = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    // Additional 3-op templates for limit >= 20
    const advancedTemplates = limit >= 20 ? ['J', 'K', 'L'] : [];
    const templates = [...baseTemplates, ...advancedTemplates];

    // Try templates in random order until one produces a valid question
    const shuffled = templates.slice().sort(() => Math.random() - 0.5);

    const maxMul = gameConfig.maxMultiplier || 10;
    for (const tpl of shuffled) {
        const q = tryTemplate(tpl, limit, maxMul);
        if (q) return q;
    }

    // Fallback: simple addition (always valid)
    const a = rand(1, Math.min(limit, 9));
    const b = rand(1, Math.min(limit - a, 9));
    return makeQuestion(`${a} + ${b}`, a + b);
}

// Random integer in [min, max]
function rand(min, max) {
    if (max < min) return null;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Build a question object from a display expression and answer
function makeQuestion(displayExpr, answer) {
    const expressionKey = displayExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\s+/g, '');
    return { expression: displayExpr, expressionKey, answer };
}

// Attempt to generate a valid question for the given template, limit, and max multiplier/divisor.
// Returns null if constraints cannot be satisfied.
function tryTemplate(template, limit, maxMul) {
    switch (template) {
        case 'A': { // a + b × c
            const b = rand(2, Math.min(maxMul, limit));
            const c = rand(2, Math.min(maxMul, Math.floor(limit / b)));
            if (!b || !c || b * c > limit) return null;
            const a = rand(1, limit - b * c);
            if (!a) return null;
            return makeQuestion(`${a} + ${b} × ${c}`, a + b * c);
        }
        case 'B': { // a − b × c
            const b = rand(2, Math.min(maxMul, limit));
            const c = rand(2, Math.min(maxMul, Math.floor(limit / b)));
            if (!b || !c) return null;
            const product = b * c;
            if (product > limit) return null;
            const a = rand(product, limit);
            if (a === null) return null;
            return makeQuestion(`${a} − ${b} × ${c}`, a - product);
        }
        case 'C': { // a × b + c
            const a = rand(2, Math.min(maxMul, limit));
            const maxB = Math.min(maxMul, Math.floor(2 * limit / a));
            const b = rand(2, maxB);
            if (!b) return null;
            const c = rand(1, Math.min(limit, 9));
            return makeQuestion(`${a} × ${b} + ${c}`, a * b + c);
        }
        case 'D': { // a × b − c
            const a = rand(2, Math.min(maxMul, limit));
            const maxB = Math.min(maxMul, Math.floor(limit / a));
            const b = rand(2, maxB);
            if (!b) return null;
            const product = a * b;
            const c = rand(1, product);
            if (!c) return null;
            return makeQuestion(`${a} × ${b} − ${c}`, product - c);
        }
        case 'E': { // (a + b) × c
            const c = rand(2, maxMul);
            if (!c) return null;
            const maxSum = Math.min(limit, Math.floor(2 * limit / c));
            const a = rand(1, maxSum - 1);
            if (!a) return null;
            const b = rand(1, maxSum - a);
            if (!b) return null;
            return makeQuestion(`(${a} + ${b}) × ${c}`, (a + b) * c);
        }
        case 'F': { // (a − b) × c
            const c = rand(2, maxMul);
            if (!c) return null;
            const a = rand(2, Math.min(limit, 9));
            const b = rand(1, a - 1);
            if (!b) return null;
            return makeQuestion(`(${a} − ${b}) × ${c}`, (a - b) * c);
        }
        case 'G': { // a ÷ b + c  (a = b * q)
            const b = rand(2, maxMul);
            if (!b) return null;
            const q = rand(2, Math.min(9, Math.floor(limit / b)));
            if (!q) return null;
            const a = b * q;
            if (a > limit) return null;
            const c = rand(1, Math.min(limit - a / b, 9));
            if (!c) return null;
            return makeQuestion(`${a} ÷ ${b} + ${c}`, q + c);
        }
        case 'H': { // a + b ÷ c  (b = c * q)
            const c = rand(2, maxMul);
            if (!c) return null;
            const q = rand(1, Math.min(9, Math.floor(limit / c)));
            if (!q) return null;
            const b = c * q;
            if (b > limit) return null;
            const a = rand(1, Math.min(limit - b, 9));
            if (!a) return null;
            return makeQuestion(`${a} + ${b} ÷ ${c}`, a + q);
        }
        case 'I': { // (a + b) ÷ c
            const c = rand(2, maxMul);
            if (!c) return null;
            const q = rand(1, Math.min(9, Math.floor(limit / c)));
            if (!q) return null;
            const sum = c * q;
            if (sum > limit || sum < 2) return null;
            const a = rand(1, sum - 1);
            const b = sum - a;
            if (b < 1) return null;
            return makeQuestion(`(${a} + ${b}) ÷ ${c}`, q);
        }
        case 'J': { // a + b × c − d
            const b = rand(2, Math.min(maxMul, limit));
            const c = rand(2, Math.min(maxMul, Math.floor(limit / b)));
            if (!c || b * c > limit) return null;
            const a = rand(1, limit);
            const product = b * c;
            const d = rand(1, Math.min(a, product, 9));
            if (!d) return null;
            return makeQuestion(`${a} + ${b} × ${c} − ${d}`, a + product - d);
        }
        case 'K': { // (a + b) × c + d
            const c = rand(2, Math.min(maxMul, 4));
            if (!c) return null;
            const maxSum = Math.min(Math.floor(limit / c), 9);
            const a = rand(1, maxSum - 1);
            if (!a) return null;
            const b = rand(1, maxSum - a);
            if (!b) return null;
            const d = rand(1, Math.min(limit, 9));
            return makeQuestion(`(${a} + ${b}) × ${c} + ${d}`, (a + b) * c + d);
        }
        case 'L': { // (a + b) × (c − d)
            const a = rand(1, Math.min(9, limit));
            const b = rand(1, Math.min(9, limit - a));
            if (!b) return null;
            const c = rand(3, Math.min(maxMul, 9, Math.floor(limit / (a + b))));
            if (!c) return null;
            const d = rand(1, c - 1);
            return makeQuestion(`(${a} + ${b}) × (${c} − ${d})`, (a + b) * (c - d));
        }
        default:
            return null;
    }
}

// Display next question
function nextQuestion() {
    // Clear feedback
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    
    // Clear answer input
    const answerInput = document.getElementById('answer');
    answerInput.value = '';

    // Only auto-focus the input when the numpad is hidden so that
    // the native virtual keyboard does not pop up on touch devices
    // while the custom numpad is in use.
    if (document.getElementById('numpad').style.display !== 'block') {
        answerInput.focus();
    }

    if (gameConfig.mode === 'boss') {
        // Boss mode: end when max attempts reached (boss escaped)
        if (totalAttempts >= BOSS_MAX_ATTEMPTS) {
            endGame();
            return;
        }
    } else if (currentQuestion >= questions.length) {
        endGame();
        return;
    }
    
    const question = questions[currentQuestion];

    // Update UI
    document.getElementById('questionNumber').textContent = currentQuestion + 1;
    const isPrecedence = gameConfig.type === 'precedence';
    document.getElementById('expressionDisplay').style.display = isPrecedence ? '' : 'none';
    document.getElementById('num1').style.display = isPrecedence ? 'none' : '';
    document.getElementById('operator').style.display = isPrecedence ? 'none' : '';
    document.getElementById('num2').style.display = isPrecedence ? 'none' : '';
    if (isPrecedence) {
        document.getElementById('expressionDisplay').textContent = question.expression;
    } else {
        document.getElementById('num1').textContent = question.num1;
        document.getElementById('operator').textContent = question.operator;
        document.getElementById('num2').textContent = question.num2;
    }

    // Start timer
    startTime = Date.now();
    startTimer();
}

// Start timer
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        document.getElementById('timer').textContent = formatTime(elapsed);
    }, 100);
}

// Stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Submit answer
function submitAnswer() {
    const answerInput = document.getElementById('answer');
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) {
        alert('Kérlek, írj be egy számot!');
        return;
    }
    
    stopTimer();
    
    const question = questions[currentQuestion];
    const timeInSeconds = (Date.now() - startTime) / 1000;
    const isCorrect = userAnswer === question.answer;
    
    // Calculate points
    const points = calculateScore(timeInSeconds, isCorrect);
    score = Math.max(0, score + points); // Don't allow negative total score
    
    // Update score display
    document.getElementById('score').textContent = score;
    
    // Show feedback
    const feedback = document.getElementById('feedback');
    if (isCorrect) {
        correctAnswers++;
        feedback.textContent = getEncouragementMessage();
        feedback.className = 'feedback correct';
        playSound('correct');
    } else {
        feedback.textContent = `${getErrorMessage()} (Helyes: ${question.answer})`;
        feedback.className = 'feedback wrong';
        playSound('wrong');
    }

    // Track task result for adaptive question selection
    updateTaskResult(getTaskKey(question), isCorrect, gameConfig.playerName);

    // Boss mode: update HP and check win/reset
    if (gameConfig.mode === 'boss') {
        totalAttempts++;
        if (isCorrect) {
            consecutiveCorrect++;
            bossHP = Math.max(0, 10 - consecutiveCorrect);
            updateBossHP();
            if (consecutiveCorrect >= 10) {
                currentQuestion++;
                setTimeout(() => endGame(), 2000);
                return;
            }
        } else {
            consecutiveCorrect = 0;
            bossHP = 10;
            updateBossHP();
        }
    }
    
    // Move to next question after delay
    currentQuestion++;
    setTimeout(() => {
        nextQuestion();
    }, 2000);
}

// Update the boss HP hearts display
function updateBossHP() {
    const hpEl = document.getElementById('bossHpHearts');
    const streakEl = document.getElementById('bossStreak');
    if (hpEl) {
        hpEl.textContent = '❤️'.repeat(bossHP) + '🖤'.repeat(10 - bossHP);
    }
    if (streakEl) {
        streakEl.textContent = `${consecutiveCorrect}/10 egymás utáni helyes`;
    }
}

// Handle Enter key press
document.addEventListener('DOMContentLoaded', () => {
    const answerInput = document.getElementById('answer');
    if (answerInput) {
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitAnswer();
            }
        });
    }

    // Restore numpad preference
    const numpad = document.getElementById('numpad');
    const toggleBtn = document.getElementById('numpadToggle');
    if (numpad && toggleBtn) {
        const showNumpad = localStorage.getItem('showNumpad') === '1';
        numpad.style.display = showNumpad ? 'block' : 'none';
        toggleBtn.classList.toggle('active', showNumpad);
        if (answerInput && showNumpad) {
            answerInput.setAttribute('inputmode', 'none');
        }
    }
});

// Toggle the on-screen numeric keypad
function toggleNumpad() {
    const numpad = document.getElementById('numpad');
    const toggleBtn = document.getElementById('numpadToggle');
    const answerInput = document.getElementById('answer');
    const isVisible = numpad.style.display !== 'none';

    numpad.style.display = isVisible ? 'none' : 'block';
    toggleBtn.classList.toggle('active', !isVisible);

    // Suppress the native virtual keyboard when the custom numpad is shown
    if (!isVisible) {
        answerInput.setAttribute('inputmode', 'none');
        answerInput.blur();
    } else {
        answerInput.removeAttribute('inputmode');
        answerInput.focus();
    }

    localStorage.setItem('showNumpad', !isVisible ? '1' : '0');
}

// Append a digit via the on-screen numpad
function numpadPress(digit) {
    const answerInput = document.getElementById('answer');
    answerInput.value += digit;
}

// Delete the last character via the on-screen numpad
function numpadBackspace() {
    const answerInput = document.getElementById('answer');
    answerInput.value = answerInput.value.slice(0, -1);
}

// End game and show results
function endGame() {
    stopTimer();
    
    const totalAnswered = gameConfig.mode === 'boss' ? totalAttempts : questions.length;
    const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    
    // Display results
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctAnswers').textContent = `${correctAnswers} / ${totalAnswered}`;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    
    // Boss mode: show victory or defeat banner
    const bossBanner = document.getElementById('bossBanner');
    if (gameConfig.mode === 'boss' && bossBanner) {
        const boss = BOSS_ENEMIES.find(b => b.id === gameConfig.bossId) || BOSS_ENEMIES[0];
        if (consecutiveCorrect >= 10) {
            bossBanner.textContent = `🎉 Legyőzted a(z) ${boss.emoji} ${boss.name}-t! Tojáshős vagy! 🏆`;
            bossBanner.className = 'boss-banner boss-victory';
        } else {
            bossBanner.textContent = `${boss.emoji} ${boss.name} elmenekült... de majd legközelebb! 💪`;
            bossBanner.className = 'boss-banner boss-defeat';
        }
        bossBanner.style.display = '';
    }

    // Check for new hero title (boss battles never change totalPoints)
    const oldStats = getPlayerStats(gameConfig.playerName);
    let newHeroTitle = null;
    let newTotalPoints;

    if (gameConfig.mode === 'boss') {
        newTotalPoints = oldStats.totalPoints;
    } else {
        newTotalPoints = oldStats.totalPoints + Math.max(0, score);
        newHeroTitle = checkNewHeroTitle(oldStats.totalPoints, newTotalPoints);
    }

    if (newHeroTitle) {
        document.getElementById('newHeroTitle').textContent = `🎉 Új cím feloldva: ${newHeroTitle}! 🎉`;
    }

    // Show cumulative level progress
    const progress = getProgressToNextTitle(newTotalPoints);
    document.getElementById('resultTotalPoints').textContent =
        `Összes pontod: ${newTotalPoints.toLocaleString('hu-HU')} pont`;
    if (progress.nextTitle) {
        document.getElementById('resultProgressLabel').textContent = `Következő cím: ${progress.nextTitle}`;
        document.getElementById('resultProgressFill').style.width = `${progress.percent}%`;
        document.getElementById('resultProgressText').textContent = `még ${progress.needed.toLocaleString('hu-HU')} pont`;
    } else {
        document.getElementById('resultProgressLabel').textContent = 'Elérted a legmagasabb szintet! 👑';
        document.getElementById('resultProgressFill').style.width = '100%';
        document.getElementById('resultProgressText').textContent = '';
    }
    document.getElementById('resultLevelProgress').style.display = '';

    // Level-up boss prompt: show only for normal games that unlocked a new title
    document.getElementById('bossPrompt').style.display =
        (newHeroTitle && gameConfig.mode !== 'boss') ? '' : 'none';

    // Boss mode: hide name input (score not saved), change button label
    const nameGroup = document.getElementById('playerNameGroup');
    const saveBtn = document.getElementById('saveReturnBtn');
    if (gameConfig.mode === 'boss') {
        nameGroup.style.display = 'none';
        saveBtn.textContent = 'Főmenü 🏠';
    } else {
        nameGroup.style.display = '';
        saveBtn.textContent = 'Mentés és Főmenü';
    }

    // Pre-fill player name from game config (set before game started)
    const savedName = gameConfig.playerName || localStorage.getItem('playerName') || '';
    document.getElementById('playerName').value = savedName;

    // Show result modal
    document.getElementById('resultModal').style.display = 'flex';
}

// Save and return to menu
function saveAndReturn() {
    const playerName = document.getElementById('playerName').value.trim() ||
        gameConfig.playerName || 'Névtelen';
    if (playerName) localStorage.setItem('playerName', playerName);

    // Boss battles never affect the leaderboard or totalPoints
    if (gameConfig.mode !== 'boss' && !scoreSaved) {
        scoreSaved = true;
        saveScore(playerName, score, gameConfig.type, correctAnswers, questions.length);
    }

    window.location.href = 'index.html';
}

// Play again
function playAgain() {
    // Reset game state
    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    bossHP = 10;
    consecutiveCorrect = 0;
    totalAttempts = 0;
    scoreSaved = false;
    
    // Update score display
    document.getElementById('score').textContent = score;

    // Hide boss banner
    const bossBanner = document.getElementById('bossBanner');
    if (bossBanner) bossBanner.style.display = 'none';
    
    // Re-initialize based on mode
    if (gameConfig.mode === 'boss') {
        initBossMode();
    } else {
        // Generate new questions
        questions = generateQuestions(gameConfig.numQuestions);
    }
    
    // Hide modal
    document.getElementById('resultModal').style.display = 'none';
    
    // Start first question
    nextQuestion();
}

// Play sound effect
function playSound(type) {
    // Generate sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'correct') {
        // Happy ascending sound
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    } else {
        // Error descending sound
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    }
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Initialize game on page load
document.addEventListener('DOMContentLoaded', initGame);
