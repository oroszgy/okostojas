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

// Get raw task event history from localStorage
// Format: { taskKey: [{ c: 1|0, t: timestampMs }, ...], ... }
function getTaskHistory() {
    const data = localStorage.getItem(TASK_STATS_KEY);
    if (!data) return {};
    try {
        const parsed = JSON.parse(data);
        // Migrate old aggregate format ({ correct, wrong }) to event arrays by discarding
        // (old entries had no timestamps so date-range filtering is not possible for them)
        const result = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (Array.isArray(value)) {
                result[key] = value;
            }
            // Old-format entries without timestamps are silently dropped
        }
        return result;
    } catch (e) {
        console.error('Error parsing task history:', e);
        return {};
    }
}

// Get task statistics filtered by an optional date range.
// fromDate / toDate are Date objects or null (null means no limit).
// Returns: { taskKey: { correct, wrong, total }, ... }
function getTaskStatsByDateRange(fromDate, toDate) {
    const history = getTaskHistory();
    const stats = {};
    const fromTs = fromDate ? fromDate.getTime() : 0;
    const toTs = toDate ? toDate.getTime() : Date.now();

    for (const [key, events] of Object.entries(history)) {
        const filtered = events.filter(e => e.t >= fromTs && e.t <= toTs);
        if (filtered.length > 0) {
            const correct = filtered.filter(e => e.c === 1).length;
            const wrong = filtered.filter(e => e.c === 0).length;
            stats[key] = { correct, wrong, total: correct + wrong };
        }
    }
    return stats;
}

// Get task statistics (all-time) for weighted question selection
function getTaskStats() {
    return getTaskStatsByDateRange(null, null);
}

// Update individual task result for adaptive question selection
function updateTaskResult(taskKey, isCorrect) {
    const history = getTaskHistory();
    if (!history[taskKey]) {
        history[taskKey] = [];
    }
    history[taskKey].push({ c: isCorrect ? 1 : 0, t: Date.now() });
    // Cap at 500 events per task; trim to 450 to avoid slicing on every update
    if (history[taskKey].length > 500) {
        history[taskKey] = history[taskKey].slice(-450);
    }
    try {
        localStorage.setItem(TASK_STATS_KEY, JSON.stringify(history));
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
