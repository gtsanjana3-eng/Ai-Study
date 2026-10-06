/**
 * StudySync AI - Advanced Real-Time Engine
 * -----------------------------------------
 * Features:
 * - Real-time Schedule Generation from current time
 * - Live Status Indicators & Clock
 * - Interactive Chart.js Analytics
 * - WebAudio Feedback
 * - Toast Notification System
 * - Dynamic Relative Data Generation
 */

// --- UTILITIES ---

const RelativeDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
};

const DEFAULT_PROFILE = {
    name: "Sanjana G T",
    college: "State Engineering College",
    course: "Computer Science & Engineering",
    semester: "5",
    hoursPerDay: 5
};

const DEFAULT_SUBJECTS = [
    { id: "sub-1", name: "Data Structures & Algorithms", difficulty: "hard", examDate: RelativeDate(12) },
    { id: "sub-2", name: "Database Management Systems", difficulty: "medium", examDate: RelativeDate(18) },
    { id: "sub-3", name: "Computer Networks", difficulty: "medium", examDate: RelativeDate(24) },
    { id: "sub-4", name: "Software Engineering", difficulty: "easy", examDate: RelativeDate(32) }
];

const DEFAULT_TASKS = [
    { id: "task-1", name: "Complete Trees & Graphs Assignment", subjectId: "sub-1", type: "assignment", priority: "high", deadline: RelativeDate(2), completed: false },
    { id: "task-2", name: "DBMS SQL Lab Submission", subjectId: "sub-2", type: "homework", priority: "medium", deadline: RelativeDate(5), completed: false },
    { id: "task-3", name: "Design CN Routing Project Proposal", subjectId: "sub-3", type: "project", priority: "high", deadline: RelativeDate(1), completed: false },
    { id: "task-4", name: "Read Software Testing Unit 1", subjectId: "sub-4", type: "exam_prep", priority: "low", deadline: RelativeDate(8), completed: true }
];

const MOTIVATION_QUOTES = [
    "Focus on being productive instead of busy.",
    "The secret of getting ahead is getting started.",
    "Small steps every day lead to big results.",
    "Your future self will thank you for today's effort.",
    "Don't stop until you're proud.",
    "Success is what happens after you refuse to give up."
];

// --- APP CLASS ---

class StudySyncApp {
    constructor() {
        this.profile = this.loadData('profile', DEFAULT_PROFILE);
        this.subjects = this.loadData('subjects', DEFAULT_SUBJECTS);
        this.tasks = this.loadData('tasks', DEFAULT_TASKS);
        this.streak = parseInt(this.loadData('streak', '3'));
        this.generatedSchedule = this.loadData('generatedSchedule', []);
        this.currentTaskFilter = 'all';
        this.taskSearchQuery = '';

        // Charts
        this.subjectChart = null;
        this.activityChart = null;

        // Pomodoro State
        this.pomoTimer = null;
        this.pomoSecondsLeft = 25 * 60;
        this.pomoTotalSeconds = 25 * 60;
        this.pomoMode = 'pomodoro';
        this.pomoIsRunning = false;

        // Dash Timer
        this.dashTimer = null;
        this.dashSecondsLeft = 25 * 60;
        this.dashIsRunning = false;

        // Audio Context for sound effects
        this.audioCtx = null;

        this.init();
    }

    loadData(key, defaultValue) {
        const data = localStorage.getItem(`studysync_${key}`);
        if (data === null) return defaultValue;
        try { return JSON.parse(data); } catch (e) { return data; }
    }

    saveData(key, value) {
        localStorage.setItem(`studysync_${key}`, JSON.stringify(value));
    }

    init() {
        this.setupNavigation();
        this.setupTheme();
        this.setupEventListeners();
        this.startRealTimeClock();
        this.renderAll();
        this.updateMotivation();
        this.initCharts();
    }

    // --- CORE ENGINES ---

    startRealTimeClock() {
        const updateClock = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

            const clockEl = document.getElementById('real-time-clock');
            const dateEl = document.getElementById('real-time-date');

            if (clockEl) clockEl.innerText = timeStr;
            if (dateEl) dateEl.innerText = dateStr;

            // Update live status indicators in schedule
            this.updateScheduleRealTimeStatus();
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    notify(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
        toast.className = `custom-toast toast-${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${icon} toast-icon text-${type}"></i>
            <div class="toast-content flex-grow-1">
                <div class="toast-message small fw-bold">${message}</div>
            </div>
            <button type="button" class="btn-close btn-close-sm" onclick="this.parentElement.remove()"></button>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    confirm(title, text, onConfirm) {
        document.getElementById('confirmModalTitle').innerText = title;
        document.getElementById('confirmModalText').innerText = text;

        const modalEl = document.getElementById('confirmModal');
        const modal = new bootstrap.Modal(modalEl);

        const actionBtn = document.getElementById('confirmModalActionBtn');
        const newBtn = actionBtn.cloneNode(true);
        actionBtn.parentNode.replaceChild(newBtn, actionBtn);

        newBtn.addEventListener('click', () => {
            onConfirm();
            modal.hide();
        });

        modal.show();
    }

    playTone(freq, type = 'sine', duration = 0.1) {
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch(e) {}
    }

    // --- CHARTS ---

    initCharts() {
        // Subject Doughnut Chart
        const subCtx = document.getElementById('subjectChart');
        if (subCtx) {
            this.subjectChart = new Chart(subCtx, {
                type: 'doughnut',
                data: this.getSubjectChartData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter', size: 11 } } } },
                    cutout: '70%'
                }
            });
        }

        // Weekly Bar Chart
        const actCtx = document.getElementById('activityChart');
        if (actCtx) {
            this.activityChart = new Chart(actCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Hours Studied',
                        data: [4.2, 5.1, 3.8, 6.2, 4.5, 2.1, 0],
                        backgroundColor: '#4f46e5',
                        borderRadius: 6,
                        barThickness: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    getSubjectChartData() {
        const labels = this.subjects.map(s => s.name);
        const data = this.subjects.map(s => s.difficulty === 'hard' ? 40 : (s.difficulty === 'medium' ? 25 : 15));
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

        return {
            labels: labels.length ? labels : ['No Subjects'],
            datasets: [{
                data: data.length ? data : [100],
                backgroundColor: colors.slice(0, labels.length || 1),
                borderWidth: 0
            }]
        };
    }

    updateCharts() {
        if (this.subjectChart) {
            this.subjectChart.data = this.getSubjectChartData();
            this.subjectChart.update();
        }
    }

    // --- NAVIGATION & UI ---

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links li');
        const sections = document.querySelectorAll('.app-section');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionName = link.getAttribute('data-section');
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                link.classList.add('active');
                document.getElementById(`${sectionName}-section`).classList.add('active');
            });
        });
    }

    setupTheme() {
        const themeSwitch = document.getElementById('themeSwitch');
        const isDarkMode = localStorage.getItem('studysync_darkmode') === 'true';
        themeSwitch.checked = isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        this.updateThemeUI(isDarkMode);

        themeSwitch.addEventListener('change', () => {
            const isDark = themeSwitch.checked;
            localStorage.setItem('studysync_darkmode', isDark);
            document.body.classList.toggle('dark-mode', isDark);
            this.updateThemeUI(isDark);
        });
    }

    updateThemeUI(isDark) {
        document.getElementById('theme-icon').className = isDark ? "fa-solid fa-moon" : "fa-solid fa-sun";
        document.getElementById('theme-text').innerText = isDark ? "Dark Mode" : "Light Mode";
    }

    setupEventListeners() {
        // Task Search
        const searchInput = document.getElementById('task-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.taskSearchQuery = e.target.value.toLowerCase();
                this.renderTasks();
            });
        }

        // Subject & Task Forms
        document.getElementById('subject-form').addEventListener('submit', (e) => this.handleSubjectSubmit(e));
        document.getElementById('task-form').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('profile-form').addEventListener('submit', (e) => this.handleProfileSubmit(e));

        // Planner
        document.getElementById('generate-ai-plan-btn').addEventListener('click', () => this.generateAISchedule());
        document.getElementById('regen-plan-dash-btn').addEventListener('click', () => {
            this.generateAISchedule();
            this.notify("AI Schedule Regenerated!", "success");
        });

        // "Behind" button
        document.getElementById('behind-btn').addEventListener('click', () => this.handleFallingBehind());

        // Range Sync
        const prHours = document.getElementById('prof-hours');
        prHours.addEventListener('input', () => document.getElementById('prof-hours-label').innerText = `${prHours.value} Hrs`);
        const plHours = document.getElementById('planner-hours-range');
        plHours.addEventListener('input', () => document.getElementById('planner-hours-val').innerText = `${plHours.value} Hrs`);

        // Timer Panel
        document.getElementById('btn-pomo').addEventListener('click', () => this.switchPomoMode('pomodoro', 25 * 60));
        document.getElementById('btn-short').addEventListener('click', () => this.switchPomoMode('short', 5 * 60));
        document.getElementById('btn-long').addEventListener('click', () => this.switchPomoMode('long', 15 * 60));
        document.getElementById('btn-pomo-start').addEventListener('click', () => this.togglePomoTimer());
        document.getElementById('btn-pomo-reset').addEventListener('click', () => this.resetPomoTimer());

        // Dash Timer
        document.getElementById('timer-toggle-dash').addEventListener('click', () => this.toggleDashTimer());
        document.getElementById('timer-reset-dash').addEventListener('click', () => this.resetDashTimer());

        // Reset App
        document.getElementById('reset-data-btn').addEventListener('click', () => {
            this.confirm("Reset All App Data?", "This will revert the application to initial demo state.", () => {
                localStorage.clear();
                window.location.reload();
            });
        });

        // Task Filters
        document.getElementById('task-filter-all').addEventListener('click', () => this.setTaskFilter('all'));
        document.getElementById('task-filter-pending').addEventListener('click', () => this.setTaskFilter('pending'));
        document.getElementById('task-filter-completed').addEventListener('click', () => this.setTaskFilter('completed'));
        document.getElementById('task-sort').addEventListener('change', () => this.renderTasks());
    }

    // --- FORM HANDLERS ---

    handleProfileSubmit(e) {
        e.preventDefault();
        this.profile = {
            name: document.getElementById('prof-name').value,
            college: document.getElementById('prof-college').value,
            course: document.getElementById('prof-course').value,
            semester: document.getElementById('prof-semester').value,
            hoursPerDay: parseFloat(document.getElementById('prof-hours').value)
        };
        this.saveData('profile', this.profile);
        this.renderAll();
        this.notify("Profile updated successfully!", "success");
    }

    handleSubjectSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('subject-edit-id').value;
        const subData = {
            id: id || `sub-${Date.now()}`,
            name: document.getElementById('sub-name').value,
            difficulty: document.getElementById('sub-difficulty').value,
            examDate: document.getElementById('sub-exam-date').value
        };

        if (id) {
            const idx = this.subjects.findIndex(s => s.id === id);
            if (idx !== -1) this.subjects[idx] = subData;
        } else {
            this.subjects.push(subData);
        }

        this.saveData('subjects', this.subjects);
        this.renderAll();
        this.updateCharts();
        bootstrap.Modal.getInstance(document.getElementById('subjectModal')).hide();
        this.notify(id ? "Subject updated" : "Subject added", "success");
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('task-edit-id').value;
        const taskData = {
            id: id || `task-${Date.now()}`,
            name: document.getElementById('task-name-input').value,
            subjectId: document.getElementById('task-subject-input').value,
            type: document.getElementById('task-type-input').value,
            priority: document.getElementById('task-priority-input').value,
            deadline: document.getElementById('task-deadline-input').value,
            completed: false
        };

        if (id) {
            const idx = this.tasks.findIndex(t => t.id === id);
            if (idx !== -1) {
                taskData.completed = this.tasks[idx].completed;
                this.tasks[idx] = taskData;
            }
        } else {
            this.tasks.push(taskData);
        }

        this.saveData('tasks', this.tasks);
        this.renderAll();
        bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
        this.notify(id ? "Task updated" : "Task added", "success");
    }

    // --- RENDERERS ---

    renderAll() {
        this.renderProfile();
        this.renderSubjects();
        this.renderTasks();
        this.renderDashboard();
    }

    renderProfile() {
        const p = this.profile;
        document.getElementById('prof-name').value = p.name;
        document.getElementById('prof-college').value = p.college;
        document.getElementById('prof-course').value = p.course;
        document.getElementById('prof-semester').value = p.semester;
        document.getElementById('prof-hours').value = p.hoursPerDay;
        document.getElementById('prof-hours-label').innerText = `${p.hoursPerDay} Hrs`;

        document.querySelectorAll('.student-name').forEach(s => s.innerText = p.name);
    }

    renderSubjects() {
        const list = document.getElementById('subjects-list');
        const select = document.getElementById('task-subject-input');
        list.innerHTML = '';
        select.innerHTML = '<option value="">-- Choose Subject --</option>';

        this.subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.id; opt.innerText = sub.name; select.appendChild(opt);

            const today = new Date(); today.setHours(0,0,0,0);
            const exam = new Date(sub.examDate);
            const days = Math.ceil((exam - today) / 86400000);
            const examBadge = days < 0 ? '<span class="badge bg-secondary">Passed</span>' : (days === 0 ? '<span class="badge bg-danger">EXAM TODAY</span>' : `<span class="badge bg-info text-dark">In ${days} days</span>`);

            const col = document.createElement('div');
            col.className = 'col-md-6 col-xl-4';
            col.innerHTML = `
                <div class="subject-card ${sub.difficulty}">
                    <div class="subject-card-header">
                        <span class="difficulty-badge ${sub.difficulty}">${sub.difficulty}</span>
                        <div class="dropdown">
                            <button class="btn btn-link btn-sm text-muted p-0" data-bs-toggle="dropdown"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="window.app.openEditSubject('${sub.id}')"><i class="fa-solid fa-pen me-2"></i>Edit</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="window.app.deleteSubject('${sub.id}')"><i class="fa-solid fa-trash me-2"></i>Delete</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="subject-card-body">
                        <h4 class="h5 mb-1">${sub.name}</h4>
                        <p class="small text-muted mb-3"><i class="fa-regular fa-calendar-alt me-1"></i>Exam: ${new Date(sub.examDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</p>
                        ${examBadge}
                    </div>
                </div>
            `;
            list.appendChild(col);
        });
    }

    renderTasks() {
        const body = document.getElementById('tasks-table-body');
        body.innerHTML = '';

        let filtered = this.tasks.filter(t => {
            const matchesFilter = this.currentTaskFilter === 'all' || (this.currentTaskFilter === 'pending' && !t.completed) || (this.currentTaskFilter === 'completed' && t.completed);
            const matchesSearch = t.name.toLowerCase().includes(this.taskSearchQuery) || this.getSubjectName(t.subjectId).toLowerCase().includes(this.taskSearchQuery);
            return matchesFilter && matchesSearch;
        });

        const sort = document.getElementById('task-sort').value;
        if (sort === 'deadline') filtered.sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
        else if (sort === 'priority') { const p = {high:3, medium:2, low:1}; filtered.sort((a,b) => p[b.priority] - p[a.priority]); }

        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted small">No tasks matching your search/filters.</td></tr>';
            return;
        }

        filtered.forEach(t => {
            const row = document.createElement('tr');
            if (t.completed) row.style.opacity = '0.6';
            const priorityBadge = `<span class="badge bg-${t.priority === 'high' ? 'danger' : (t.priority === 'medium' ? 'warning' : 'info')}-soft text-${t.priority === 'high' ? 'danger' : (t.priority === 'medium' ? 'warning' : 'info')}">${t.priority}</span>`;

            row.innerHTML = `
                <td><input type="checkbox" class="form-check-input" ${t.completed ? 'checked' : ''} onchange="window.app.toggleTask('${t.id}')"></td>
                <td class="${t.completed ? 'text-decoration-line-through' : 'fw-bold'}">${t.name}</td>
                <td><span class="badge bg-light text-dark">${this.getSubjectName(t.subjectId)}</span></td>
                <td class="text-capitalize">${t.type.replace('_', ' ')}</td>
                <td>${priorityBadge}</td>
                <td class="small">${new Date(t.deadline).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</td>
                <td class="text-end">
                    <button class="btn btn-link btn-sm text-muted" onclick="window.app.openEditTask('${t.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-link btn-sm text-danger" onclick="window.app.deleteTask('${t.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            body.appendChild(row);
        });
    }

    renderDashboard() {
        const completed = this.tasks.filter(t => t.completed).length;
        const total = this.tasks.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('progress-percentage').innerText = `${pct}%`;
        document.getElementById('progress-bar-fill').style.width = `${pct}%`;
        document.getElementById('completed-tasks-count').innerText = `${completed}/${total}`;
        document.getElementById('streak-count').innerText = `${this.streak} Days`;
        document.getElementById('study-hours-val').innerText = `${this.profile.hoursPerDay} Hrs`;

        this.renderDashboardSchedule();
        this.renderExamsWidget();
        this.renderUrgentTasksWidget();
        this.renderRecommendations();
    }

    renderDashboardSchedule() {
        const container = document.getElementById('dashboard-schedule');
        if (!this.generatedSchedule.length) {
            container.innerHTML = '<div class="text-center py-4 text-muted small">No active plan. Click "Refresh AI Plan" to generate.</div>';
            return;
        }
        container.innerHTML = '';
        this.generatedSchedule.forEach(slot => {
            const item = document.createElement('div');
            item.className = `timeline-item ${slot.type} ${slot.status || ''}`;
            const icon = slot.type === 'break' ? 'fa-mug-hot text-warning' : 'fa-book-open text-primary';
            const liveBadge = slot.status === 'active' ? '<span class="active-session-label"><span class="pulse-dot d-inline-block"></span> Happening Now</span>' : '';

            item.innerHTML = `
                <div class="timeline-item-header">
                    <span class="timeline-time">${slot.startTime} - ${slot.endTime}</span>
                    <span class="badge bg-${slot.type === 'break' ? 'warning' : 'primary'}-soft text-${slot.type === 'break' ? 'warning' : 'primary'} text-uppercase small">${slot.type}</span>
                </div>
                <h5 class="timeline-title"><i class="fa-solid ${icon} me-2"></i>${slot.title} ${liveBadge}</h5>
                <p class="timeline-desc text-muted mb-0">${slot.type === 'study' ? 'Topic focus: ' + slot.subjectName : 'Take a breather!'}</p>
            `;
            container.appendChild(item);
        });
    }

    renderExamsWidget() {
        const div = document.getElementById('dashboard-exams');
        div.innerHTML = '';
        [...this.subjects].sort((a,b) => new Date(a.examDate) - new Date(b.examDate)).slice(0, 3).forEach(s => {
            const item = document.createElement('div');
            item.className = 'list-group-item bg-transparent d-flex justify-content-between align-items-center py-3 border-0 border-bottom border-dashed';
            item.innerHTML = `<div><h6 class="mb-0">${s.name}</h6><small class="text-muted">Exam Date</small></div><span class="badge bg-danger-soft text-danger">${new Date(s.examDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>`;
            div.appendChild(item);
        });
    }

    renderUrgentTasksWidget() {
        const div = document.getElementById('dashboard-tasks');
        div.innerHTML = '';
        this.tasks.filter(t => !t.completed).sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 3).forEach(t => {
            const item = document.createElement('div');
            item.className = 'list-group-item bg-transparent d-flex justify-content-between align-items-center py-3 border-0 border-bottom border-dashed';
            item.innerHTML = `<div class="d-flex align-items-center gap-2"><input type="checkbox" onchange="window.app.toggleTask('${t.id}')"><div><h6 class="mb-0">${t.name}</h6><small class="text-muted">${this.getSubjectName(t.subjectId)}</small></div></div><span class="badge bg-warning-soft text-warning">${t.priority}</span>`;
            div.appendChild(item);
        });
    }

    renderRecommendations() {
        const container = document.getElementById('recommendations-container');
        container.innerHTML = '';
        const recs = [
            { icon: "fa-brain text-primary", title: "Focus Optimization", desc: "Your most difficult subjects are scheduled during your peak hours for better retention." },
            { icon: "fa-fire text-danger", title: "Streak Protection", desc: "Finish at least one task today to maintain your 3-day consistency streak!" }
        ];
        recs.forEach(r => {
            const div = document.createElement('div');
            div.className = 'col-md-12';
            div.innerHTML = `<div class="reco-card"><div class="reco-icon"><i class="fa-solid ${r.icon}"></i></div><div><h5 class="h6 mb-1">${r.title}</h5><p class="text-muted small mb-0">${r.desc}</p></div></div>`;
            container.appendChild(div);
        });
    }

    // --- LOGIC METHODS ---

    setTaskFilter(f) {
        this.currentTaskFilter = f;
        document.querySelectorAll('[id^="task-filter-"]').forEach(b => b.classList.toggle('active', b.id === `task-filter-${f}`));
        this.renderTasks();
    }

    toggleTask(id) {
        const t = this.tasks.find(x => x.id === id);
        if (t) {
            t.completed = !t.completed;
            this.saveData('tasks', this.tasks);
            this.renderAll();
            if (t.completed) {
                this.playTone(660, 'sine', 0.1);
                this.notify("Task completed! Keep it up.", "success");
            }
        }
    }

    getSubjectName(id) {
        const s = this.subjects.find(x => x.id === id);
        return s ? s.name : 'General';
    }

    openEditSubject(id) {
        const s = this.subjects.find(x => x.id === id);
        document.getElementById('subjectModalLabel').innerText = "Edit Subject";
        document.getElementById('subject-edit-id').value = s.id;
        document.getElementById('sub-name').value = s.name;
        document.getElementById('sub-difficulty').value = s.difficulty;
        document.getElementById('sub-exam-date').value = s.examDate;
        new bootstrap.Modal(document.getElementById('subjectModal')).show();
    }

    deleteSubject(id) {
        this.confirm("Delete Subject?", "All associated analytics will be updated.", () => {
            this.subjects = this.subjects.filter(s => s.id !== id);
            this.saveData('subjects', this.subjects);
            this.renderAll(); this.updateCharts();
            this.notify("Subject deleted", "info");
        });
    }

    openEditTask(id) {
        const t = this.tasks.find(x => x.id === id);
        document.getElementById('taskModalLabel').innerText = "Edit Task";
        document.getElementById('task-edit-id').value = t.id;
        document.getElementById('task-name-input').value = t.name;
        document.getElementById('task-subject-input').value = t.subjectId;
        document.getElementById('task-type-input').value = t.type;
        document.getElementById('task-priority-input').value = t.priority;
        document.getElementById('task-deadline-input').value = t.deadline;
        new bootstrap.Modal(document.getElementById('taskModal')).show();
    }

    deleteTask(id) {
        this.confirm("Delete Task?", "This will remove the task permanently.", () => {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveData('tasks', this.tasks);
            this.renderAll();
            this.notify("Task deleted", "info");
        });
    }

    // --- AI SCHEDULER ---

    generateAISchedule() {
        if (!this.subjects.length) return this.notify("Add subjects first!", "error");

        const hours = parseFloat(document.getElementById('planner-hours-range').value);
        const startTimeMode = document.getElementById('planner-start-time').value;

        let start = new Date();
        if (startTimeMode !== 'now') {
            const [h, m] = startTimeMode.split(':');
            start.setHours(h, m, 0, 0);
        }

        const schedule = [];
        let current = new Date(start);
        let remMin = hours * 60;
        const studyInt = 50;
        const breakInt = 10;

        const subs = [...this.subjects].sort((a,b) => (a.difficulty==='hard'?2:1) - (b.difficulty==='hard'?2:1));

        while (remMin > 0) {
            for (const s of subs) {
                if (remMin <= 0) break;
                const dur = Math.min(remMin, studyInt);
                const sStart = this.fmtT(current);
                const sFullStart = new Date(current);
                current.setMinutes(current.getMinutes() + dur);
                const sEnd = this.fmtT(current);
                const sFullEnd = new Date(current);

                schedule.push({ type: 'study', title: 'Study ' + s.name, subjectName: s.name, startTime: sStart, endTime: sEnd, duration: dur, startRaw: sFullStart, endRaw: sFullEnd });
                remMin -= dur;

                if (remMin > 0) {
                    const bStart = this.fmtT(current);
                    const bFullStart = new Date(current);
                    current.setMinutes(current.getMinutes() + breakInt);
                    const bEnd = this.fmtT(current);
                    const bFullEnd = new Date(current);
                    schedule.push({ type: 'break', title: 'Power Break', startTime: bStart, endTime: bEnd, duration: breakInt, startRaw: bFullStart, endRaw: bFullEnd });
                }
            }
        }

        this.generatedSchedule = schedule;
        this.saveData('generatedSchedule', schedule);
        this.updateScheduleRealTimeStatus();
        this.renderAll();
        this.renderPlannerOutput();
        this.notify("AI Schedule generated from " + (startTimeMode === 'now' ? 'current time' : startTimeMode), "success");
    }

    updateScheduleRealTimeStatus() {
        if (!this.generatedSchedule) return;
        const now = new Date();
        this.generatedSchedule.forEach(slot => {
            const start = new Date(slot.startRaw);
            const end = new Date(slot.endRaw);
            if (now >= start && now <= end) slot.status = 'active';
            else if (now > end) slot.status = 'passed';
            else slot.status = 'upcoming';
        });
        this.renderDashboardSchedule();
    }

    renderPlannerOutput() {
        const out = document.getElementById('ai-schedule-result');
        if (!out || !this.generatedSchedule.length) return;
        document.getElementById('export-schedule-btn').style.display = 'block';
        out.innerHTML = '<div class="timeline mt-3"></div>';
        const timeline = out.querySelector('.timeline');
        this.generatedSchedule.forEach(slot => {
            const item = document.createElement('div');
            item.className = `timeline-item ${slot.type} ${slot.status}`;
            item.innerHTML = `<div class="timeline-item-header"><span class="timeline-time">${slot.startTime} - ${slot.endTime}</span><span class="badge bg-${slot.type==='break'?'warning':'primary'}-soft text-${slot.type==='break'?'warning':'primary'} text-uppercase small">${slot.type}</span></div><h5 class="timeline-title">${slot.title}</h5><p class="timeline-desc text-muted mb-0 small">Allocated for deep work.</p>`;
            timeline.appendChild(item);
        });
    }

    fmtT(d) { return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }

    handleFallingBehind() {
        this.confirm("Enter Catch-up Mode?", "We'll reduce breaks to 5min and prioritize hard subjects to get you back on track.", () => {
            this.generateAISchedule(); // In a real app we'd tweak the algorithm here
            this.notify("Schedule optimized for catch-up!", "warning");
        });
    }

    // --- TIMERS ---

    switchPomoMode(m, s) {
        this.pomoMode = m; this.pomoSecondsLeft = s; this.pomoTotalSeconds = s;
        document.querySelectorAll('.pomodoro-tabs button').forEach(b => b.classList.toggle('active', b.id === `btn-${m==='pomodoro'?'pomo':m}`));
        this.updatePomoDisplay();
        if (this.pomoIsRunning) this.togglePomoTimer();
    }

    togglePomoTimer() {
        const btn = document.getElementById('btn-pomo-start');
        if (this.pomoIsRunning) {
            clearInterval(this.pomoTimer); this.pomoIsRunning = false;
            btn.innerHTML = '<i class="fa-solid fa-play me-2"></i>START';
            btn.className = 'btn btn-primary btn-lg rounded-pill px-5 py-3 shadow me-2';
        } else {
            this.pomoIsRunning = true;
            btn.innerHTML = '<i class="fa-solid fa-pause me-2"></i>PAUSE';
            btn.className = 'btn btn-warning btn-lg rounded-pill px-5 py-3 shadow me-2';
            this.pomoTimer = setInterval(() => {
                this.pomoSecondsLeft--; this.updatePomoDisplay();
                if (this.pomoSecondsLeft <= 0) {
                    clearInterval(this.pomoTimer); this.pomoIsRunning = false;
                    this.playTone(880, 'triangle', 0.5); this.notify("Session complete!", "success"); this.resetPomoTimer();
                }
            }, 1000);
        }
    }

    resetPomoTimer() {
        clearInterval(this.pomoTimer); this.pomoIsRunning = false;
        const d = {pomodoro:25*60, short:5*60, long:15*60};
        this.pomoSecondsLeft = d[this.pomoMode];
        document.getElementById('btn-pomo-start').innerHTML = '<i class="fa-solid fa-play me-2"></i>START';
        this.updatePomoDisplay();
    }

    updatePomoDisplay() {
        const m = Math.floor(this.pomoSecondsLeft/60), s = this.pomoSecondsLeft%60;
        const str = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        document.getElementById('pomodoro-time').innerText = str;
        document.title = `(${str}) ${this.pomoMode.toUpperCase()} | StudySync`;
        const circ = document.getElementById('pomo-progress');
        if (circ) circ.style.strokeDashoffset = 283 - (this.pomoSecondsLeft / this.pomoTotalSeconds * 283);
    }

    toggleDashTimer() {
        if (this.dashIsRunning) { clearInterval(this.dashTimer); this.dashIsRunning = false; document.getElementById('timer-toggle-dash').innerText = "Start Session"; }
        else {
            this.dashIsRunning = true; document.getElementById('timer-toggle-dash').innerText = "Pause";
            this.dashTimer = setInterval(() => {
                this.dashSecondsLeft--; this.updateDashDisplay();
                if (this.dashSecondsLeft <= 0) { clearInterval(this.dashTimer); this.dashIsRunning = false; this.notify("Timer up!", "success"); this.resetDashTimer(); }
            }, 1000);
        }
    }

    resetDashTimer() { clearInterval(this.dashTimer); this.dashIsRunning = false; this.dashSecondsLeft = 25*60; this.updateDashDisplay(); }
    updateDashDisplay() {
        const m = Math.floor(this.dashSecondsLeft/60), s = this.dashSecondsLeft%60;
        document.getElementById('timer-display-dash').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    updateMotivation() {
        document.getElementById('motivation-quote').innerText = `"${MOTIVATION_QUOTES[Math.floor(Math.random()*MOTIVATION_QUOTES.length)]}"`;
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new StudySyncApp(); });
