// Mascot - visual Okostojás character that evolves with points

// Map hero title index to mascot tier
// Tier 0: plain egg, 1: sprout, 2: crack+sprout, 3: eyes+smile,
// 4: sunglasses, 5-6: viking helmet, 7-8: skater cap, 9: crown
function getMascotTier(totalPoints, playerName) {
    let baseTier = 0;
    for (let i = HERO_TITLES.length - 1; i >= 0; i--) {
        if (HERO_TITLES[i].title && totalPoints >= HERO_TITLES[i].points) {
            baseTier = i;
            break;
        }
    }

    // Apply regression for inactivity: penalty starts at 4+ days without practice
    const days = getDaysSinceLastPractice(playerName);
    if (days !== null && days >= 4) {
        const penalty = Math.floor((days - 2) / 2);
        baseTier = Math.max(0, baseTier - penalty);
    }

    return baseTier;
}

// Return a regression warning message if the player has been inactive, or null
function getMascotRegressionMessage(playerName) {
    const days = getDaysSinceLastPractice(playerName);
    if (days === null || days < 3) return null;
    // Penalty formula: Math.floor((days - 2) / 2), so at days=3 penalty is still 0
    const penalty = Math.floor((days - 2) / 2);
    if (penalty === 0) {
        return `${days} napja nem gyakoroltál! Holnap már elveszítheted a kiegészítőidet! ⚠️`;
    }
    if (penalty === 1) {
        return `${days} napja nem gyakoroltál! Egy kiegészítőd eltűnt... Gyere vissza! 😢`;
    }
    return `${days} napja nem gyakoroltál! Visszafejlődtél! Gyerünk, vissza a gyakorláshoz! 🌱`;
}

// Render the mascot SVG into the element with the given id
function renderMascot(containerId, tier) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.className = `mascot-container mascot-tier-${tier}`;
    container.innerHTML = `
        <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" class="mascot-svg" role="img" aria-label="Okostojás karakter">
            <!-- Sprout (tier 1+) -->
            <g class="mascot-acc mascot-sprout">
                <line x1="50" y1="30" x2="50" y2="10" stroke="#4CAF50" stroke-width="3"/>
                <ellipse cx="41" cy="10" rx="11" ry="6" fill="#66BB6A" transform="rotate(-25 41 10)"/>
                <ellipse cx="59" cy="12" rx="11" ry="6" fill="#4CAF50" transform="rotate(20 59 12)"/>
            </g>

            <!-- Viking helmet (tier 5-6) -->
            <g class="mascot-acc mascot-viking">
                <ellipse cx="50" cy="34" rx="34" ry="13" fill="#C0972A"/>
                <rect x="16" y="28" width="68" height="10" rx="5" fill="#8B6914"/>
                <path d="M 19 30 Q 5 22 11 11 Q 16 20 21 28" fill="#DAA520"/>
                <path d="M 81 30 Q 95 22 89 11 Q 84 20 79 28" fill="#DAA520"/>
            </g>

            <!-- Skater cap (tier 7-8) -->
            <g class="mascot-acc mascot-skater">
                <ellipse cx="50" cy="35" rx="35" ry="12" fill="#212121"/>
                <rect x="15" y="33" width="70" height="8" rx="4" fill="#1a1a1a"/>
                <rect x="10" y="39" width="28" height="5" rx="3" fill="#333"/>
            </g>

            <!-- Crown (tier 9) -->
            <g class="mascot-acc mascot-crown">
                <polygon points="16,38 28,18 40,32 50,12 60,32 72,18 84,38" fill="#FFD700" stroke="#FF8F00" stroke-width="1.5"/>
                <circle cx="50" cy="15" r="5" fill="#FF1744"/>
                <circle cx="28" cy="20" r="3.5" fill="#2979FF"/>
                <circle cx="72" cy="20" r="3.5" fill="#00E676"/>
                <rect x="16" y="35" width="68" height="8" rx="3" fill="#FFC107"/>
            </g>

            <!-- Egg body -->
            <ellipse cx="50" cy="78" rx="38" ry="48" fill="#FFF8E1" stroke="#BCAAA4" stroke-width="2.5"/>

            <!-- Crack (tier 2) -->
            <g class="mascot-acc mascot-crack">
                <polyline points="44,32 50,44 44,52 50,62" stroke="#A1887F" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
            </g>

            <!-- Eyes (tier 3+) -->
            <g class="mascot-acc mascot-eyes">
                <circle cx="38" cy="68" r="8" fill="white" stroke="#555" stroke-width="1.5"/>
                <circle cx="62" cy="68" r="8" fill="white" stroke="#555" stroke-width="1.5"/>
                <circle cx="40" cy="70" r="4" fill="#333"/>
                <circle cx="64" cy="70" r="4" fill="#333"/>
                <circle cx="41.5" cy="68.5" r="1.5" fill="white"/>
                <circle cx="65.5" cy="68.5" r="1.5" fill="white"/>
            </g>

            <!-- Smile (tier 3+) -->
            <g class="mascot-acc mascot-smile">
                <path d="M 38 84 Q 50 96 62 84" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </g>

            <!-- Cheeks (tier 3+) -->
            <g class="mascot-acc mascot-cheeks">
                <ellipse cx="28" cy="80" rx="8" ry="5" fill="#FFCDD2" opacity="0.6"/>
                <ellipse cx="72" cy="80" rx="8" ry="5" fill="#FFCDD2" opacity="0.6"/>
            </g>

            <!-- Sunglasses (tier 4) -->
            <g class="mascot-acc mascot-sunglasses">
                <rect x="27" y="63" width="20" height="12" rx="6" fill="#1a1a2e" opacity="0.92"/>
                <rect x="53" y="63" width="20" height="12" rx="6" fill="#1a1a2e" opacity="0.92"/>
                <line x1="47" y1="69" x2="53" y2="69" stroke="#1a1a2e" stroke-width="2"/>
                <line x1="27" y1="69" x2="22" y2="67" stroke="#1a1a2e" stroke-width="2"/>
                <line x1="73" y1="69" x2="78" y2="67" stroke="#1a1a2e" stroke-width="2"/>
            </g>
        </svg>`;
}
