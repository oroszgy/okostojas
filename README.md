# 🥚 OkosTojás - Math Game for 2nd Graders

A fun, gamified math practice webapp for Hungarian 2nd grade students. Practice multiplication, division, addition, and subtraction with a kid-friendly interface!

## ✨ Features

- **Two Game Modes:**
  - 🔢 Multiplication & Division (configurable base number 2-10)
  - ➕ Addition & Subtraction (configurable upper limit: 10, 20, 50, 100)

- **Customizable Experience:**
  - Choose number of questions (10, 15, 20, 25, or 30)
  - Two themes: Girl Theme (pink/purple) and Boy Theme (blue/green)
  - Theme preference is saved

- **Engaging Gameplay:**
  - Time-based scoring (faster = more points!)
  - Encouraging messages
  - Sound effects for correct/wrong answers
  - Real-time feedback

- **Progress Tracking:**
  - Local leaderboard with player names
  - Hero titles to unlock (from "Kezdő Matematikus" to "Tojásvarázsló")
  - Statistics tracking (total games, points, best score)

- **Mobile-Friendly:**
  - Fully responsive design
  - Works on tablets and phones

## 🚀 How to Play

1. **Choose a Theme:** Select Girl or Boy theme on the main menu
2. **Select Game Type:** Choose between Multiplication/Division or Addition/Subtraction
3. **Configure Game:** 
   - Set the base number (for multiplication) or upper limit (for addition)
   - Choose how many questions you want
4. **Play:** Answer questions as quickly as you can!
5. **View Results:** See your score, save to leaderboard, and check for new hero titles

## 📊 Scoring System

- **Base Points:** 100 points per correct answer
- **Speed Bonus:** Up to 100 extra points (faster = more bonus)
- **Wrong Answer Penalty:** -20 points (total score never goes below 0)

## 🏆 Hero Titles

Unlock these titles as you collect points:
- 100 points: Kezdő Matematikus (Beginner Mathematician)
- 500 points: Számok Barátja (Friend of Numbers)
- 1000 points: Okos Tojás (Smart Egg)
- 2000 points: Számolásmester (Master Calculator)
- 5000 points: Tojásvarázsló (Egg Wizard)

## 🛠️ Technical Details

- Pure HTML, CSS, and JavaScript (no dependencies!)
- Uses localStorage for data persistence
- Web Audio API for sound effects
- Fully responsive CSS with mobile-first approach

## 📦 Deployment to GitHub Pages

1. **Enable GitHub Pages:**
   - Go to your repository Settings
   - Navigate to "Pages" section
   - Under "Source", select "main" branch
   - Click Save

2. **Access Your Game:**
   - Your game will be available at: `https://oroszgy.github.io/gameth/`

## 🧪 Local Testing

To test locally:

```bash
# Using Python
python3 -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## 📁 Project Structure

```
gameth/
├── index.html          # Main menu
├── game.html           # Game interface
├── leaderboard.html    # Leaderboard and statistics
├── css/
│   └── style.css       # All styles with themes
├── js/
│   ├── config.js       # Game configuration and utilities
│   ├── storage.js      # localStorage management
│   └── game.js         # Main game engine
└── assets/
    └── sounds/         # (Reserved for future audio files)
```

## 🎨 Customization

### Adding New Themes

Edit `css/style.css` to add new themes. Follow the pattern:

```css
.theme-custom {
    background: linear-gradient(135deg, #color1 0%, #color2 100%);
}
```

### Adding New Hero Titles

Edit `js/config.js` and modify the `HERO_TITLES` array:

```javascript
const HERO_TITLES = [
    { points: 0, title: null },
    { points: 100, title: 'Your Title' },
    // Add more...
];
```

## 🤝 Contributing

Feel free to fork this project and add your own features!

## 📝 License

This project is free to use for educational purposes.

---

Made with ❤️ for young mathematicians!