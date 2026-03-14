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
    'Profi vagy! 🌈',
    'Számgéniusz! 🤓',
    'A kalkulátor féltékeny rád! 🔢',
    'Meghajolok előtted! 🙇',
    'Matekszuperhős! 🦸',
    'Elolvadt az agyam az okosságodtól! 🧠',
    'A matek könyv sír örömében! 📖😭',
    'Sherlock sem számolt ilyen gyorsan! 🔍',
    'Azt hittem csak a tanárod tudja! 😄',
    'Robot vagy, vagy csak nagyon okos?! 🤖',
    'Pumpáld meg a bicepszed! 💪🦾',
    'Az osztály legokosabb agyveleje! 🧠🥇',
    'Ilyen tempóval a Hold sem elég távol! 🌙🚀'
];

// Error messages for wrong answers
const ERROR_MESSAGES = [
    'Nem baj, próbáld újra! 💪',
    'Majdnem! Nem adod fel! 🌟',
    'Jó próbálkozás! Tovább! ⭐',
    'Tanulás közben vagy! 📚',
    'Rajta, következő! 🎯',
    'A számok csavarosak! 😅',
    'Minden mester volt egyszer kezdő! 🎓',
    'A kalkulátor is elhibázza néha! 🤭',
    'Ez csak bemelegítés volt! 🏃',
    'Még a tanár is téved néha! 👨‍🏫',
    'Az agyad gondolkodik, csak lassan! 🐢',
    'Fel a fejjel, matek bajnok! 🦁',
    'Tovább! A matematikaolimpia vár! 🏅',
    'Ilyenkor tanulunk a legtöbbet! 💡',
    'A zsenik is tévednek néha! 🤓',
    'Próbálkozás teszi a mestert! 🔄',
    'Egy kicsi hiba, de annál nagyobb szív! ❤️',
    'Ne add fel, a szám csak viccelt! 😜',
    'Gyerünk, te ezt tudod! 🙌',
    'Az agy felmelegedés közben! 🧠🔥',
    'Hibák nélkül nincs tanulás! 📝',
    'Figyelj csak, majd sikerül! 👀'
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
