// LocalStorage management for leaderboard and statistics

const STORAGE_KEY = 'mathGameLeaderboard';
const STATS_KEY = 'mathGameStats';
const TASK_STATS_KEY = 'mathGameTaskStats';
const LAST_PRACTICE_KEY = 'mathGameLastPractice';

// Get the timestamp (ms) of the last practice session for a user, or null if never
function getLastPracticeTimestamp(playerName) {
    const user = normaliseUser(playerName);
    const val = localStorage.getItem(LAST_PRACTICE_KEY);
    if (!val) return null;

    try {
        const parsed = JSON.parse(val);
        // New per-user format: { userName: timestampMs }
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            const ts = parsed[user];
            if (!ts) return null;
            const num = parseInt(ts, 10);
            return Number.isFinite(num) ? num : null;
        }
        // Old format (single integer string) — cannot attribute to a user; discard
        return null;
    } catch (e) {
        // Old format: plain integer string
        return null;
    }
}

// Record the current time as the last practice timestamp for a user
function setLastPracticeTimestamp(playerName) {
    const user = normaliseUser(playerName);
    const val = localStorage.getItem(LAST_PRACTICE_KEY);
    let allTimestamps = {};

    if (val) {
        try {
            const parsed = JSON.parse(val);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                allTimestamps = parsed;
            }
            // Old flat format: discard and start fresh per-user structure
        } catch (e) {
            // Old plain-integer format: discard
        }
    }

    allTimestamps[user] = Date.now();
    try {
        localStorage.setItem(LAST_PRACTICE_KEY, JSON.stringify(allTimestamps));
    } catch (e) {
        console.error('Error saving last practice timestamp:', e);
    }
}

// Return whole days since last practice for a user, or null if no practice recorded
function getDaysSinceLastPractice(playerName) {
    const last = getLastPracticeTimestamp(playerName);
    if (last === null) return null;
    return Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
}

// Helper: normalise a player name for use as a storage key
function normaliseUser(playerName) {
    return (playerName && playerName.trim()) || 'Névtelen';
}

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
        
        // Update per-user statistics
        updateStatistics(score, gameType, playerName);
        
        return true;
    } catch (e) {
        console.error('Error saving score:', e);
        return false;
    }
}

// Get player statistics for a specific user
function getPlayerStats(playerName) {
    const user = normaliseUser(playerName);
    const defaultStats = {
        totalGames: 0,
        totalPoints: 0,
        bestScore: 0,
        multiply: { games: 0, bestScore: 0 },
        add: { games: 0, bestScore: 0 }
    };
    const data = localStorage.getItem(STATS_KEY);
    if (!data) return defaultStats;
    
    try {
        const parsed = JSON.parse(data);
        // Detect old flat format (has a numeric 'totalGames' at the top level)
        if (typeof parsed.totalGames === 'number') {
            return defaultStats;
        }
        const stats = parsed[user];
        if (!stats) return defaultStats;
        // Ensure per-type fields exist for older saved data
        if (!stats.multiply) stats.multiply = { games: 0, bestScore: 0 };
        if (!stats.add) stats.add = { games: 0, bestScore: 0 };
        return stats;
    } catch (e) {
        console.error('Error parsing statistics:', e);
        return defaultStats;
    }
}

// Update player statistics for a specific user
function updateStatistics(newScore, gameType, playerName) {
    const user = normaliseUser(playerName);
    const data = localStorage.getItem(STATS_KEY);
    let allStats = {};

    if (data) {
        try {
            const parsed = JSON.parse(data);
            // Migrate old flat format: discard (cannot be attributed to a user)
            if (typeof parsed.totalGames !== 'number') {
                allStats = parsed;
            }
        } catch (e) {
            console.error('Error parsing statistics:', e);
        }
    }

    if (!allStats[user]) {
        allStats[user] = {
            totalGames: 0,
            totalPoints: 0,
            bestScore: 0,
            multiply: { games: 0, bestScore: 0 },
            add: { games: 0, bestScore: 0 }
        };
    }

    const stats = allStats[user];
    if (!stats.multiply) stats.multiply = { games: 0, bestScore: 0 };
    if (!stats.add) stats.add = { games: 0, bestScore: 0 };

    stats.totalGames += 1;
    stats.totalPoints += Math.max(0, newScore); // Don't count negative scores
    stats.bestScore = Math.max(stats.bestScore, newScore);
    
    if (gameType && stats[gameType]) {
        stats[gameType].games += 1;
        stats[gameType].bestScore = Math.max(stats[gameType].bestScore, newScore);
    }
    
    setLastPracticeTimestamp(playerName);

    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
    } catch (e) {
        console.error('Error saving statistics:', e);
    }
}

// Get raw task event history from localStorage for a specific user.
// Format (new): { username: { taskKey: [{ c: 1|0, t: timestampMs }, ...], ... }, ... }
function getTaskHistory(playerName) {
    const user = normaliseUser(playerName);
    const data = localStorage.getItem(TASK_STATS_KEY);
    if (!data) return {};
    try {
        const parsed = JSON.parse(data);
        // Detect old flat format: values at the top level are arrays, not objects.
        const firstValue = Object.values(parsed)[0];
        if (firstValue === undefined) return {};
        if (Array.isArray(firstValue)) {
            // Old global format — cannot map to individual users; return empty.
            return {};
        }
        // New per-user format
        const userHistory = parsed[user] || {};
        const result = {};
        for (const [key, value] of Object.entries(userHistory)) {
            if (Array.isArray(value)) {
                result[key] = value;
            } else {
                console.warn('Unexpected non-array task history entry for key:', key);
            }
        }
        return result;
    } catch (e) {
        console.error('Error parsing task history:', e);
        return {};
    }
}

// Get task statistics filtered by an optional date range for a specific user.
// fromDate / toDate are Date objects or null (null means no limit).
// Returns: { taskKey: { correct, wrong, total }, ... }
function getTaskStatsByDateRange(fromDate, toDate, playerName) {
    const history = getTaskHistory(playerName);
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

// Get task statistics (all-time) for a specific user, used for weighted question selection
function getTaskStats(playerName) {
    return getTaskStatsByDateRange(null, null, playerName);
}

// Update individual task result for adaptive question selection, scoped to a user
function updateTaskResult(taskKey, isCorrect, playerName) {
    const user = normaliseUser(playerName);
    const data = localStorage.getItem(TASK_STATS_KEY);
    let allHistory = {};

    if (data) {
        try {
            const parsed = JSON.parse(data);
            const firstValue = Object.values(parsed)[0];
            // If old flat format, start fresh with the new per-user structure
            if (firstValue !== undefined && !Array.isArray(firstValue)) {
                allHistory = parsed;
            }
        } catch (e) {
            console.error('Error parsing task stats:', e);
        }
    }

    if (!allHistory[user]) allHistory[user] = {};
    if (!allHistory[user][taskKey]) allHistory[user][taskKey] = [];

    allHistory[user][taskKey].push({ c: isCorrect ? 1 : 0, t: Date.now() });
    // Cap at 500 events per task; trim to 450 to avoid slicing on every update
    if (allHistory[user][taskKey].length > 500) {
        allHistory[user][taskKey] = allHistory[user][taskKey].slice(-450);
    }
    try {
        localStorage.setItem(TASK_STATS_KEY, JSON.stringify(allHistory));
    } catch (e) {
        console.error('Error saving task stats:', e);
    }
}

// Return the list of all users who have task statistics stored
function getAllUsers() {
    const data = localStorage.getItem(TASK_STATS_KEY);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        const firstValue = Object.values(parsed)[0];
        if (firstValue === undefined || Array.isArray(firstValue)) return [];
        return Object.keys(parsed).sort();
    } catch (e) {
        return [];
    }
}

// Clear all data (for testing or reset)
function clearAllData() {
    if (confirm('Biztosan törölni szeretnéd az összes adatot?')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(TASK_STATS_KEY);
        localStorage.removeItem(LAST_PRACTICE_KEY);
        alert('Az összes adat törölve!');
        location.reload();
    }
}
