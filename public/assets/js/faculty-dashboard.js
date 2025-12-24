(function () {
    'use strict';

    // --- 1. CONFIG & DATA ---

    // PROF. PRASAD'S SPECIFIC TIMETABLE
    const weeklySchedule = {
        "Monday": [
            { time: "09:00 - 10:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "10:00 - 11:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "11:00 - 12:00", subject: "OS", type: "Lab (B1)", room: "Comp Lab 1" },
            { time: "01:00 - 02:00", subject: "OS", type: "Tutorial", room: "Room 101" },
            { time: "02:00 - 03:00", subject: "OS", type: "Lecture", room: "Hall A" }
        ],
        "Tuesday": [
            { time: "09:00 - 10:00", subject: "OS", type: "Lab (B2)", room: "Comp Lab 2" },
            { time: "10:00 - 11:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "11:00 - 12:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "01:00 - 02:00", subject: "OS", type: "Tutorial", room: "Room 101" }
        ],
        "Wednesday": [
            { time: "09:00 - 10:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "10:00 - 11:00", subject: "OS", type: "Lab (B1)", room: "Comp Lab 1" },
            { time: "11:00 - 12:00", subject: "OS", type: "Tutorial", room: "Room 101" },
            { time: "01:00 - 02:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "02:00 - 03:00", subject: "OS", type: "Lab (B2)", room: "Comp Lab 2" }
        ],
        "Thursday": [
            { time: "09:00 - 10:00", subject: "OS", type: "Tutorial", room: "Room 101" },
            { time: "10:00 - 11:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "11:00 - 12:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "01:00 - 02:00", subject: "OS", type: "Lab (B1)", room: "Comp Lab 1" }
        ],
        "Friday": [
            { time: "09:00 - 10:00", subject: "OS", type: "Lab (B2)", room: "Comp Lab 2" },
            { time: "10:00 - 11:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "11:00 - 12:00", subject: "OS", type: "Tutorial", room: "Room 101" },
            { time: "01:00 - 02:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "02:00 - 03:00", subject: "OS", type: "Lab (B1)", room: "Comp Lab 1" }
        ],
        "Saturday": [
            { time: "09:00 - 10:00", subject: "OS", type: "Lecture", room: "Hall A" },
            { time: "10:00 - 11:00", subject: "OS", type: "Tutorial", room: "Room 101" },
            { time: "11:00 - 12:00", subject: "OS", type: "Lab (B2)", room: "Comp Lab 2" },
            { time: "01:00 - 02:00", subject: "OS", type: "Lecture", room: "Hall A" }
        ]
    };

    // Mock Students
    const students = Array.from({ length: 60 }, (_, i) => ({
        id: 301 + i,
        name: `Student Name ${i + 1}`,
        status: false // Default Absent
    }));

    let currentClassTitle = '';
    let modalObj;

    // --- 2. INITIALIZATION ---

    window.onload = function () {
        modalObj = new bootstrap.Modal(document.getElementById('attendanceModal'));
        loadSchedule();
        document.getElementById('currentDateDisplay').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    function getBadgeClass(type) {
        if (type.includes('Lab')) return 'type-lab';
        if (type.includes('Tutorial')) return 'type-tutorial';
        return 'type-lecture';
    }

    function loadSchedule() {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayIndex = new Date().getDay();
        let todayName = days[todayIndex];

        // If Sunday, default to Monday for demo purposes
        if (todayName === "Sunday") todayName = "Monday";

        document.getElementById('dayBadge').innerText = todayName;
        const classes = weeklySchedule[todayName] || [];
        document.getElementById('totalClassesToday').innerText = classes.length;

        const container = document.getElementById('scheduleContainer');
        container.innerHTML = '';

        if (classes.length === 0) {
            container.innerHTML = '<div class="text-center p-4 text-muted">No classes scheduled for today (Free).</div>';
            return;
        }

        classes.forEach((cls, index) => {
            const isActive = index === 0; // Mock: First class is 'active' for demo
            const html = `
                <div class="class-item rounded ${isActive ? 'bg-light border-start border-primary border-4' : ''}">
                    <div class="d-flex align-items-center gap-3">
                        <div class="bg-white border p-2 rounded text-center" style="min-width: 80px;">
                            <span class="d-block fw-bold small text-primary">${cls.time.split('-')[0]}</span>
                            <span class="d-block small text-muted">to ${cls.time.split('-')[1]}</span>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-1">
                                ${cls.subject}: Operating Systems 
                                <span class="type-badge ${getBadgeClass(cls.type)} ms-2">${cls.type}</span>
                            </h6>
                            <small class="text-muted"><i class="bi bi-geo-alt"></i> ${cls.room} | Prof. K Prasad</small>
                        </div>
                    </div>
                    <button class="btn ${isActive ? 'btn-primary' : 'btn-outline-primary'} btn-sm rounded-pill px-3" 
                        onclick="openAttendanceModal('${cls.subject} ${cls.type}')">
                        ${isActive ? 'Take Attendance' : 'View'}
                    </button>
                </div>
            `;
            container.innerHTML += html;
        });
    }

    // --- 3. UI LOGIC ---

    window.toggleSidebar = function () {
        document.getElementById('sidebar').classList.toggle('active');
    };

    window.showSection = function (id, element) {
        document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
        document.getElementById(id).style.display = 'block';

        if (element) {
            document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
            element.classList.add('active');
        }

        if (id === 'reports') loadChart();
    };

    // --- 4. ATTENDANCE LOGIC ---

    window.openAttendanceModal = function (className) {
        currentClassTitle = className;
        document.getElementById('modalClassTitle').innerText = className;

        // Reset UI for "Anchor Device" simulation
        const gpsDot = document.getElementById('gpsIndicator');
        const gpsText = document.getElementById('gpsText');
        gpsDot.classList.remove('gps-active');
        gpsDot.style.backgroundColor = 'orange';
        gpsText.innerText = "Searching for Anchor Device...";

        // Reset Students
        students.forEach(s => s.status = false);

        modalObj.show();

        // Simulate Anchor Device Connection
        setTimeout(() => {
            gpsDot.style.backgroundColor = '#198754';
            gpsDot.classList.add('gps-active');
            gpsText.innerText = "Anchor Device Active • GPS Locked (21.25°N, 81.63°E)";

            renderStudentList();
            updateStats();
        }, 1500); // 1.5s delay
    };

    function renderStudentList() {
        const tbody = document.getElementById('studentListBody');
        tbody.innerHTML = '';

        students.forEach((s, idx) => {
            const tr = document.createElement('tr');
            tr.className = `student-row ${s.status ? 'present' : 'absent'}`;
            tr.innerHTML = `
                <td><span class="fw-bold text-secondary">${s.id}</span></td>
                <td>${s.name}</td>
                <td class="text-end">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input" type="checkbox" 
                            onchange="toggleStudent(${idx}, this)" ${s.status ? 'checked' : ''}>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('totalStudentCount').innerText = students.length;
    }

    window.toggleStudent = function (index, checkbox) {
        students[index].status = checkbox.checked;
        renderStudentList();
        updateStats();
    };

    window.markAll = function (isPresent) {
        students.forEach(s => s.status = isPresent);
        renderStudentList();
        updateStats();
    };

    function updateStats() {
        const present = students.filter(s => s.status).length;
        const total = students.length;
        const pct = Math.round((present / total) * 100);

        document.getElementById('presentCount').innerText = present;
        document.getElementById('absentCount').innerText = total - present;

        const bar = document.getElementById('progressBar');
        bar.style.width = pct + '%';
        bar.className = `progress-bar ${pct < 50 ? 'bg-danger' : (pct < 75 ? 'bg-warning' : 'bg-success')}`;
    }

    window.submitAttendance = function () {
        const btn = document.querySelector('.modal-footer .btn-success');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';
        btn.disabled = true;

        setTimeout(() => {
            alert(`Attendance for ${currentClassTitle} Saved to Database!`);
            btn.innerHTML = originalText;
            btn.disabled = false;
            modalObj.hide();
        }, 1000);
    };

    window.downloadCSV = function () {
        let csv = "RollNo,Name,Status,Date\n";
        const date = new Date().toLocaleDateString();
        students.forEach(s => {
            csv += `${s.id},${s.name},${s.status ? 'Present' : 'Absent'},${date}\n`;
        });

        const link = document.createElement("a");
        link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
        link.download = `Attendance_${currentClassTitle}.csv`;
        link.click();
    };

    function loadChart() {
        const ctx = document.getElementById('attendanceChart');
        if (window.myChart) window.myChart.destroy();

        window.myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                    label: 'OS Class Attendance %',
                    data: [85, 82, 78, 90, 85, 70],
                    borderColor: '#0d6efd',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(13, 110, 253, 0.1)'
                }]
            },
            options: { responsive: true, scales: { y: { min: 0, max: 100 } } }
        });
    }

})();
