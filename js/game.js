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
    
    // Generate all questions
    questions = generateQuestions(gameConfig.numQuestions);
    
    // Update UI
    document.getElementById('totalQuestions').textContent = gameConfig.numQuestions;
    
    // Start first question
    nextQuestion();
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
    
    if (currentQuestion >= questions.length) {
        endGame();
        return;
    }
    
    const question = questions[currentQuestion];
    
    // Update UI
    document.getElementById('questionNumber').textContent = currentQuestion + 1;
    document.getElementById('num1').textContent = question.num1;
    document.getElementById('operator').textContent = question.operator;
    document.getElementById('num2').textContent = question.num2;
    
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
    
    // Move to next question after delay
    currentQuestion++;
    setTimeout(() => {
        nextQuestion();
    }, 2000);
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
    
    const accuracy = Math.round((correctAnswers / questions.length) * 100);
    
    // Display results
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctAnswers').textContent = `${correctAnswers} / ${questions.length}`;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    
    // Check for new hero title
    const oldStats = getPlayerStats(gameConfig.playerName);
    const newHeroTitle = checkNewHeroTitle(oldStats.totalPoints, oldStats.totalPoints + score);
    
    if (newHeroTitle) {
        document.getElementById('newHeroTitle').textContent = `🎉 Új cím feloldva: ${newHeroTitle}! 🎉`;
    }
    
    // Pre-fill player name from game config (set before game started)
    const savedName = gameConfig.playerName || localStorage.getItem('playerName') || '';
    document.getElementById('playerName').value = savedName;
    
    // Show result modal
    document.getElementById('resultModal').style.display = 'flex';
}

// Save and return to menu
function saveAndReturn() {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (playerName) {
        localStorage.setItem('playerName', playerName);
    }
    
    // Save score to leaderboard
    saveScore(
        playerName,
        score,
        gameConfig.type,
        correctAnswers,
        questions.length
    );
    
    // Return to main menu
    window.location.href = 'index.html';
}

// Play again
function playAgain() {
    // Reset game state
    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    
    // Update score display
    document.getElementById('score').textContent = score;
    
    // Generate new questions
    questions = generateQuestions(gameConfig.numQuestions);
    
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
