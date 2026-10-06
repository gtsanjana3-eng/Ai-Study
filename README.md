# 🎓 StudySync AI — Smart Study Planner

> An intelligent, real-time academic copilot and daily schedule optimizer for college students.

---

## 🌟 Key Features

- **⏱️ Real-Time Scheduling Engine:** Dynamically generates an optimized daily study schedule calculated directly from the current time.
- **📚 Intelligent Weighting:** Prioritizes difficult subjects and upcoming deadlines while automatically embedding structured rest periods (Pomodoro, hourly, deep work).
- **📊 Real-Time Analytics (Chart.js):** Live Doughnut chart for subject focus distribution and Bar chart for weekly study tracker.
- **⚡ Catch-Up Mode ("I'm Falling Behind"):** Instantly re-optimizes your study blocks to save time and refocus on high-priority exam topics.
- **⏱️ Integrated Pomodoro Focus Timer:** Interactive circular SVG timer with session tracking, tab title live updates, and synthesized Web Audio chime alerts.
- **🎨 Modern SaaS UI:** Responsive layout with light/dark theme toggle, glassmorphism aesthetics, live status badges, and toast notifications.
- **💾 Client-Side Persistence:** Zero database setup required; all user state is automatically synced to browser `localStorage`.

---

## 🛠️ Tech Stack

- **Backend:** Python / Flask
- **Frontend:** HTML5, CSS3 (Modern Glassmorphism & Custom Properties), JavaScript (ES6+), Bootstrap 5, FontAwesome
- **Data Visualization:** Chart.js
- **Audio Feedback:** Web Audio API

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/StudySync-AI.git
cd StudySync-AI
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the application
```bash
python app.py
```

### 4. Open in browser
Navigate to `http://127.0.0.1:5000` to start planning your study sessions!

---

## 📄 License
MIT License
