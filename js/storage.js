// LocalStorage management for leaderboard and statistics

const STORAGE_KEY = 'mathGameLeaderboard';
const STATS_KEY = 'mathGameStats';
const TASK_STATS_KEY = 'mathGameTaskStats';

// Get leaderboard from localStorage
function getLeaderboard() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    try {
        const scores = JSON.parse(data);
        // Sort by score descending
        return scores.sort((a, b) => b.score - a.score);
    } catch (e) {
        console.error('Error parsing leaderboard:', e);
        return [];
    }
}

// Save score to leaderboard
function saveScore(playerName, score, gameType, correct, total) {
    const scores = getLeaderboard();
    
    const newScore = {
        playerName: playerName || 'Névtelen',
        score: score,
        gameType: gameType,
        correct: correct,
        total: total,
        accuracy: Math.round((correct / total) * 100),
        date: new Date().toISOString()
    };
    
    scores.push(newScore);
    
    // Keep only top 100 scores
    const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 100);
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(topScores));
        
        // Update statistics
        updateStatistics(score, gameType);
        
        return true;
    } catch (e) {
        console.error('Error saving score:', e);
        return false;
    }
}

// Get player statistics
function getPlayerStats() {
    const data = localStorage.getItem(STATS_KEY);
    if (!data) {
        return {
            totalGames: 0,
            totalPoints: 0,
            bestScore: 0,
            multiply: { games: 0, bestScore: 0 },
            add: { games: 0, bestScore: 0 }
        };
    }
    
    try {
        const stats = JSON.parse(data);
        // Ensure per-type fields exist for older saved data
        if (!stats.multiply) stats.multiply = { games: 0, bestScore: 0 };
        if (!stats.add) stats.add = { games: 0, bestScore: 0 };
        return stats;
    } catch (e) {
        console.error('Error parsing statistics:', e);
        return {
            totalGames: 0,
            totalPoints: 0,
            bestScore: 0,
            multiply: { games: 0, bestScore: 0 },
            add: { games: 0, bestScore: 0 }
        };
    }
}

// Update player statistics
function updateStatistics(newScore, gameType) {
    const stats = getPlayerStats();
    
    stats.totalGames += 1;
    stats.totalPoints += Math.max(0, newScore); // Don't count negative scores
    stats.bestScore = Math.max(stats.bestScore, newScore);
    
    if (gameType && stats[gameType]) {
        stats[gameType].games += 1;
        stats[gameType].bestScore = Math.max(stats[gameType].bestScore, newScore);
    }
    
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error('Error saving statistics:', e);
    }
}

// Get task statistics (per-question tracking for weighted selection)
function getTaskStats() {
    const data = localStorage.getItem(TASK_STATS_KEY);
    if (!data) return {};
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('Error parsing task stats:', e);
        return {};
    }
}

// Update individual task result for adaptive question selection
function updateTaskResult(taskKey, isCorrect) {
    const stats = getTaskStats();
    if (!stats[taskKey]) {
        stats[taskKey] = { correct: 0, wrong: 0 };
    }
    if (isCorrect) {
        stats[taskKey].correct += 1;
    } else {
        stats[taskKey].wrong += 1;
    }
    try {
        localStorage.setItem(TASK_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error('Error saving task stats:', e);
    }
}

// Clear all data (for testing or reset)
function clearAllData() {
    if (confirm('Biztosan törölni szeretnéd az összes adatot?')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(TASK_STATS_KEY);
        alert('Az összes adat törölve!');
        location.reload();
    }
}
