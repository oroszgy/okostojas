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

// Generate multiplication/division question
function generateMultiplyQuestion() {
    const maxBase = gameConfig.config;
    const base = gameConfig.includeLowerNumbers
        ? Math.floor(Math.random() * (maxBase - 1)) + 2  // random from 2 to maxBase
        : maxBase;
    const multiplier = Math.floor(Math.random() * 10) + 1;
    
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

// Generate addition/subtraction question
function generateAddQuestion() {
    const limit = gameConfig.config;
    
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
    document.getElementById('answer').value = '';
    document.getElementById('answer').focus();
    
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
});

// End game and show results
function endGame() {
    stopTimer();
    
    const accuracy = Math.round((correctAnswers / questions.length) * 100);
    
    // Display results
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctAnswers').textContent = `${correctAnswers} / ${questions.length}`;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    
    // Check for new hero title
    const oldStats = getPlayerStats();
    const newHeroTitle = checkNewHeroTitle(oldStats.totalPoints, oldStats.totalPoints + score);
    
    if (newHeroTitle) {
        document.getElementById('newHeroTitle').textContent = `🎉 Új cím feloldva: ${newHeroTitle}! 🎉`;
    }
    
    // Load saved player name if available
    const savedName = localStorage.getItem('playerName') || '';
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
