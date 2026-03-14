// Configuration and utility functions

// Hero titles based on total points
// Evenly spaced at 500-pt intervals so each tier requires ~40 correct answers
const HERO_TITLES = [
    { points: 0, title: null },
    { points: 500, title: 'Tojáscsíra 🌱' },
    { points: 1000, title: 'Repedező Tojás 🥚' },
    { points: 1500, title: 'Frissen Kelt Számolós 🐣' },
    { points: 2000, title: 'Okos Tojás 🧠' },
    { points: 2500, title: 'Számolásmester 🔢' },
    { points: 3000, title: 'Tojászseni 💡' },
    { points: 3500, title: 'Tojásvarázsló 🪄' },
    { points: 4000, title: 'Aranytojás 🥇' },
    { points: 4500, title: 'A Nagy Tojás 👑' }
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
    'Tojásszuperhős! 🦸',
    'Elolvadt az agyam az okosságodtól! 🧠',
    'A matekkönyv sír örömében! 📖😭',
    'Sherlock sem számolt ilyen gyorsan! 🔍',
    'Azt hittem, csak a tanárod tudja! 😄',
    'Robot vagy, vagy csak nagyon okos?! 🤖',
    'Pumpáld meg a bicepszed! 💪🦾',
    'Az osztály legokosabb agyveleje! 🧠🥇',
    'Ilyen tempóval a Hold sem elég távol! 🌙🚀',
    'Tojásból kikelt a zsenialitás! 🐣💡',
    'Ez nem tojás, ez egy szuperszámológép! 🥚🔢',
    'Aranytojást tojt az agyad! 🥇🥚',
    'Gyorsabb vagy, mint egy friss reggeli tojás! 🍳⚡',
    'Így kell ezt! A tojások büszkék rád! 🥚🎖️',
    'Krakk! Megrepesztette a feladatot! 💥🥚',
    'Annyira okos vagy, hogy tojást is tudsz kotlani! 🐔🧠',
    'Tojás-tikus vagy! 🐣🔥',
    'Ez nem volt tyúklépés, ez óriásugrás! 🐔🚀',
    'A héjad fényesedik az okosságtól! ✨🥚',
    'Villámgyors tojásész! ⚡🥚'
];

// Error messages for wrong answers
const ERROR_MESSAGES = [
    'Nem baj, próbáld újra! 💪',
    'Majdnem! Ne add fel! 🌟',
    'Jó próbálkozás! Tovább! ⭐',
    'Tanulás közben vagy! 📚',
    'Rajta, következő! 🎯',
    'A számok csavarosak! 😅',
    'Minden mester volt egyszer kezdő! 🎓',
    'A kalkulátor is téved néha! 🤭',
    'Ez csak bemelegítés volt! 🏃',
    'Még a tanár is téved néha! 👨‍🏫',
    'Az agyad gondolkodik, csak lassan! 🐢',
    'Fel a fejjel, okos tojás! 🦁',
    'Tovább! A matematikaolimpia vár! 🏅',
    'Ilyenkor tanulunk a legtöbbet! 💡',
    'A zsenik is tévednek néha! 🤓',
    'Próbálkozás teszi a mestert! 🔄',
    'Egy kicsi hiba, de annál nagyobb szív! ❤️',
    'Ne add fel, a szám csak viccelt! 😜',
    'Gyerünk, te ezt tudod! 🙌',
    'Az agyad épp felmelegszik! 🧠🔥',
    'Hibák nélkül nincs tanulás! 📝',
    'Figyelj csak, majd sikerül! 👀',
    'A tojás sem lesz egyszerre főtt – türelem! 🥚⏳',
    'Minden okos tojás így kezdte! 🐣',
    'Repedés nélkül nem kel ki a tudás! 🥚💡',
    'A nagy tojások is így tanultak! 🐔📖',
    'Szusszanj, és vágj bele újra! 😤🥚',
    'Ejj, ez majdnem kilyukasztotta a héjamat! 🥚😬',
    'Ettől még a sárgájám is beleremegett! 🍳😱'
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
// Correct: 10 base pts + speed bonus (0–9 pts for answers under 10 s) → 10–19 pts
// Wrong: -5 pts (roughly half a correct answer lost per mistake)
// At ~12 pts average per correct answer, each 500-pt tier gap takes ~40 correct answers.
function calculateScore(timeInSeconds, isCorrect) {
    if (!isCorrect) return -5;

    const basePoints = 10;
    const speedBonus = Math.max(0, Math.floor(10 - timeInSeconds));
    return basePoints + speedBonus;
}

// Format time display
function formatTime(seconds) {
    return seconds.toFixed(1);
}

// Boss enemies for boss battle mode
const BOSS_ENEMIES = [
    {
        id: 'giraffe',
        name: 'Zavaros Zsiráf',
        emoji: '🦒',
        description: 'A hosszú nyakú számzavaró! Csak 10 hibátlan válasszal győzhető le!'
    },
    {
        id: 'mummy',
        name: 'Matek Múmia',
        emoji: '🧟',
        description: 'Az ősrégi számpörgető! Kevered össze a számait!'
    },
    {
        id: 'dragon',
        name: 'Számtani Sárkány',
        emoji: '🐉',
        description: 'Lángok helyett számokat köpköd! Állítsd meg!'
    }
];
