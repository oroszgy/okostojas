// Configuration and utility functions

// Hero titles based on total points
const HERO_TITLES = [
    { points: 0, title: null },
    { points: 100, title: 'Kezdő Matematikus' },
    { points: 500, title: 'Számok Barátja' },
    { points: 1000, title: 'Matek Bajnok' },
    { points: 2000, title: 'Számolásmester' },
    { points: 5000, title: 'Matek Varázsló' }
];

// Get hero title based on points
function getHeroTitle(points) {
    let title = null;
    for (let i = HERO_TITLES.length - 1; i >= 0; i--) {
        if (points >= HERO_TITLES[i].points && HERO_TITLES[i].title) {
            title = HERO_TITLES[i].title;
            break;
        }
    }
    return title;
}

// Check if a new hero title was unlocked
function checkNewHeroTitle(oldPoints, newPoints) {
    const oldTitle = getHeroTitle(oldPoints);
    const newTitle = getHeroTitle(newPoints);
    
    if (oldTitle !== newTitle && newTitle !== null) {
        return newTitle;
    }
    return null;
}

// Encouragement messages for correct answers
const ENCOURAGEMENT_MESSAGES = [
    'Szuper! 🎉',
    'Nagyszerű! ⭐',
    'Ügyes vagy! 👏',
    'Fantasztikus! 🌟',
    'Remek munka! 💪',
    'Tökéletes! 🎯',
    'Briliáns! 💎',
    'Kitűnő! 🏆',
    'Zseniális! 🚀',
    'Profi vagy! 🌈'
];

// Error messages for wrong answers
const ERROR_MESSAGES = [
    'Nem baj, próbáld újra! 💪',
    'Majdnem! Nem adod fel! 🌟',
    'Jó próbálkozás! Tovább! ⭐',
    'Tanulás közben vagy! 📚',
    'Rajta, következő! 🎯'
];

// Get random encouragement message
function getEncouragementMessage() {
    return ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
}

// Get random error message
function getErrorMessage() {
    return ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
}

// Calculate score based on time
function calculateScore(timeInSeconds, isCorrect) {
    if (!isCorrect) return -20;
    
    const basePoints = 100;
    const speedBonus = Math.max(0, Math.floor(100 - timeInSeconds));
    return basePoints + speedBonus;
}

// Format time display
function formatTime(seconds) {
    return seconds.toFixed(1);
}
