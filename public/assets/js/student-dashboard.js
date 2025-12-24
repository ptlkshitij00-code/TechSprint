(function () {
    'use strict';

    // CONFIG
    const COLLEGE_LAT = 21.2500;
    const COLLEGE_LNG = 81.6300;
    const ALLOWED_RADIUS = 15; // 15 Meters

    // FULL WEEKLY SCHEDULE
    const fullTimetable = {
        "Monday": ["OS (09-10)", "M3 (10-11)", "DELD (11-12)", "Break (12-01)", "PPL (01-02)", "SS (02-03)"],
        "Tuesday": ["SS (09-10)", "TT (10-11)", "Break", "DSA/DELD Lab (01-03)", "OS (03-04)"],
        "Wednesday": ["DSA (09-10)", "OS/SCI Lab (10-11)", "DELD (11-12)", "Break", "TT (01-02)", "M3 (02-03)", "Seminar (03-04)"],
        "Thursday": ["TT (09-10)", "DSA (10-11)", "Break", "PPL (01-02)", "OS/SCI Lab (02-03)", "DELD (03-04)"],
        "Friday": ["M3 (09-10)", "DSA/DELD Lab (10-12)", "Break", "DSA (01-02)", "SS (02-03)", "TT (03-04)"],
        "Saturday": ["PPL (09-10)", "OS (10-11)", "DELD (11-12)", "Break", "OS (01-02)"]
    };

    // SCHEDULE FOR DASHBOARD
    const weeklySchedule = {
        "Monday": [{ t: "09:00", s: "OS", r: "Hall A", st: "Pending" }, { t: "10:00", s: "M3", r: "Hall A", st: "Pending" }, { t: "11:00", s: "DELD", r: "TB 11", st: "Present" }],
        "Tuesday": [{ t: "09:00", s: "SS", r: "TB 11", st: "Pending" }, { t: "13:00", s: "Lab", r: "Lab 1", st: "Pending" }],
        "Wednesday": [{ t: "09:00", s: "DSA", r: "TB 11", st: "Pending" }, { t: "11:00", s: "DELD", r: "TB 11", st: "Pending" }],
        "Thursday": [{ t: "10:00", s: "DSA", r: "TB 11", st: "Pending" }, { t: "14:00", s: "OS Lab", r: "Lab 2", st: "Pending" }],
        "Friday": [{ t: "09:00", s: "M3", r: "Hall A", st: "Pending" }, { t: "10:00", s: "Lab", r: "Lab 2", st: "Pending" }],
        "Saturday": [{ t: "09:00", s: "PPL", r: "TB 11", st: "Pending" }]
    };

    // REPORT DATA (mock) - configure OS as low to trigger warnings
    const reportData = {
        weekly: { l: ["Mon", "Tue", "Wed", "Thu", "Fri"], d: [100, 80, 100, 60, 90], s: [{ n: "OS", t: 4, a: 2 }, { n: "M3", t: 4, a: 4 }] },
        monthly: { l: ["W1", "W2", "W3", "W4"], d: [72, 68, 70, 75], s: [{ n: "OS", t: 16, a: 10 }, { n: "M3", t: 16, a: 14 }] },
        overall: { l: ["Aug", "Sep", "Oct", "Nov"], d: [70, 72, 74, 76], s: [{ n: "OS", t: 40, a: 24 }, { n: "M3", t: 40, a: 38 }, { n: "DELD", t: 35, a: 30 }] }
    };

    // Activity / Notifications / History (mock storage)
    const activityLog = [
        { t: '10:05 AM', msg: 'Marked Present in OS' },
        { t: '09:20 AM', msg: 'Viewed Timetable' },
        { t: '08:55 AM', msg: 'Checked Notifications' }
    ];
    const notifications = [
        { t: 'Dec 22', msg: 'Holiday tomorrow' },
    ];
    const attendanceHistory = [
        { date: '2025-12-21', subject: 'OS', status: 'Absent' },
        { date: '2025-12-20', subject: 'M3', status: 'Present' }
    ];

    // STUDENT PROFILE MOCK DATA
    const studentProfile = {
        name: 'Kshitij Patel',
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        dob: '2005-06-12',
        gender: 'Male',
        blood: 'O+',
        father: 'Ramesh Patel',
        mother: 'Sonal Patel',
        admissionNo: '20230015',
        rollNo: '2025001',
        regId: 'UNI2023CSE0015',
        degree: 'B.E.',
        branch: 'CSE',
        semester: '3rd',
        batch: '2024-2028',
        collegeEmail: 'kshitij.patel@college.edu',
        personalEmail: 'kshitij.patel@gmail.com',
        phone: '+91-9876543210',
        addressCurrent: '123, Hostel Road, College City',
        addressPermanent: '45, Patel Street, Hometown'
    };

    let currentButton = null, videoStream = null, trendChart = null, subChart = null;
    let modalObj;

    window.onload = function () {
        modalObj = new bootstrap.Modal(document.getElementById('cameraModal'));
        document.getElementById('currentDateDisplay').innerText = new Date().toLocaleDateString();
        loadDashboardSchedule();
        renderTimetable();
        updateReport('weekly', document.querySelector('#reports .btn-primary'));
        updateActivityFeed();
        showNotifications();
        checkLowAttendance();
        populateAttendanceHistory();
        // restore settings
        const dm = localStorage.getItem('darkMode') === '1';
        if (document.getElementById('darkModeToggle')) {
            document.getElementById('darkModeToggle').checked = dm;
            if (dm) toggleDarkMode({ checked: true });
        }
        const en = localStorage.getItem('emailNotif') === '1';
        if (document.getElementById('emailNotifToggle')) document.getElementById('emailNotifToggle').checked = en;
    };

    // VIEW SWITCHER
    window.switchView = function (id, link) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(id);
        if (!target) return;
        target.classList.add('active');
        // manage nav active state only when a navbar link is provided
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active-view'));
        if (link && link.classList && link.classList.contains('nav-link')) link.classList.add('active-view');
        // if showing profile view, render it
        if (id === 'profile') renderProfile();
    };

    // RENDER DASHBOARD SCHEDULE
    function loadDashboardSchedule() {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let today = days[new Date().getDay()];
        if (today === "Sunday") today = "Monday"; // Demo
        document.getElementById('dayBadge').innerText = today;

        const list = weeklySchedule[today] || [];
        const tbody = document.getElementById('scheduleTableBody');
        tbody.innerHTML = '';

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        let activeIndex = -1, nextIndex = -1;

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5"><div class="no-data"><i class="bi bi-calendar-x icon"></i><div>No classes scheduled today</div></div></td></tr>`;
        }

        list.forEach((item, idx) => {
            const [hh, mm] = item.t.split(':').map(x => parseInt(x));
            const itemMinutes = (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm);
            if (itemMinutes <= nowMinutes && (nowMinutes - itemMinutes) < 60) activeIndex = idx;
            if (itemMinutes > nowMinutes && nextIndex === -1) nextIndex = idx;
        });

        list.forEach((item, idx) => {
            const isPending = item.st === "Pending";
            const isActive = idx === activeIndex;
            const isNext = idx === nextIndex;
            tbody.innerHTML += `
                <tr class="${isActive ? 'table-primary' : ''}">
                    <td class="fw-bold text-secondary">${item.t}${isActive ? '<small class="text-success"> (Ongoing)</small>' : ''}</td>
                    <td><div class="fw-bold">${item.s}${isNext ? ' <small class="text-muted">(Next)</small>' : ''}</div><small class="text-muted"><i class="bi bi-geo-alt"></i> ${item.r}</small></td>
                    <td><span class="badge ${isPending ? 'bg-secondary' : 'bg-success'} rounded-pill badge-status">${item.st}</span></td>
                    <td class="small text-muted loc-info">-</td>
                    <td class="text-end">
                        <button class="btn ${isPending ? 'btn-primary' : 'btn-success'} btn-sm rounded-pill px-3" ${!isPending ? 'disabled' : ''} onclick="initAtt('${item.s}',this)">
                            ${isPending ? 'Mark' : '<i class="bi bi-check2"></i> Marked'}
                        </button>
                    </td>
                </tr>`;
        });

        const nextEl = document.getElementById('nextUp');
        if (nextIndex !== -1 && list[nextIndex]) {
            nextEl.innerHTML = `<div class="fw-bold">${list[nextIndex].s}</div><div class="small text-muted">${list[nextIndex].t} • ${list[nextIndex].r}</div>`;
        } else nextEl.innerHTML = `<div class="text-muted small">No more classes today</div>`;
    }

    // RENDER FULL TIMETABLE
    function renderTimetable() {
        const container = document.getElementById('timetableGrid');
        const mobileContainer = document.getElementById('timetableMobileTabs');

        for (const [day, subjects] of Object.entries(fullTimetable)) {
            let html = `<div class="col-md-6 col-lg-4 mb-3"><div class="border rounded bg-white h-100 shadow-sm">
                <div class="timetable-day-header">${day}</div><div class="p-2">`;
            subjects.forEach(sub => html += `<div class="timetable-row small"><i class="bi bi-dot text-primary"></i> ${sub}</div>`);
            html += `</div></div></div>`;
            container.innerHTML += html;

            let mHtml = `<div class="tab-pane fade ${day === 'Monday' ? 'show active' : ''}" id="tab-${day.toLowerCase().slice(0, 3)}">
                <div class="bg-white p-3 rounded shadow-sm">`;
            subjects.forEach(sub => mHtml += `<div class="p-2 border-bottom"><span class="fw-bold text-dark">${sub.split('(')[0]}</span> <span class="float-end badge bg-light text-dark">${sub.split('(')[1] || ''}</span></div>`);
            mHtml += `</div></div>`;
            mobileContainer.innerHTML += mHtml;
        }
    }

    // ATTENDANCE & GEO
    window.initAtt = function (sub, btn) {
        currentButton = btn;
        document.getElementById('modalSubject').innerText = sub;
        document.getElementById('cameraContainer').style.display = 'none';
        document.getElementById('locationStep').style.display = 'block';
        document.getElementById('errorMsg').classList.add('d-none');
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('photo').style.display = 'none';
        document.getElementById('videoElement').style.display = 'block';
        modalObj.show();
        verifyLoc();
    };

    function verifyLoc() {
        const spin = document.getElementById('locSpinner');
        const txt = document.getElementById('locStatusText');
        if (!navigator.geolocation) { showError("GPS Missing"); return; }

        navigator.geolocation.getCurrentPosition(pos => {
            const dist = getDist(pos.coords.latitude, pos.coords.longitude, COLLEGE_LAT, COLLEGE_LNG);
            document.getElementById('distanceDisplay').innerText = `Dist: ${Math.round(dist)}m`;

            if (dist <= ALLOWED_RADIUS) {
                spin.className = "bi bi-check-circle-fill text-success fs-5";
                txt.className = "text-success fw-bold"; txt.innerText = "Location Verified!";
                setTimeout(startCam, 1000);
            } else {
                spin.className = "bi bi-x-circle-fill text-danger fs-5";
                txt.className = "text-danger fw-bold"; txt.innerText = "Outside Geofence";
                showError(`Too far (${Math.round(dist)}m). Move inside campus.`);
            }
        }, () => showError("GPS Denied"));
    }

    function getDist(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    async function startCam() {
        document.getElementById('locationStep').style.display = 'none';
        document.getElementById('cameraContainer').style.display = 'block';
        try {
            videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            document.getElementById('videoElement').srcObject = videoStream;
        }
        catch { showError("Cam Access Denied"); }
    }

    window.takeSnapshot = function () {
        const v = document.getElementById('videoElement');
        const c = document.getElementById('canvas');
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext('2d').drawImage(v, 0, 0);
        document.getElementById('photo').src = c.toDataURL('image/png');
        v.style.display = 'none';
        document.getElementById('photo').style.display = 'block';
        document.getElementById('submitBtn').disabled = false;
    };

    window.finalizeAttendance = function () {
        const r = currentButton.closest('tr');
        r.querySelector('.badge-status').className = "badge bg-success rounded-pill badge-status";
        r.querySelector('.badge-status').innerText = "Present";
        r.querySelector('.loc-info').innerHTML = `<i class="bi bi-geo-fill text-success"></i> Verified`;
        currentButton.className = "btn btn-success btn-sm rounded-pill px-3";
        currentButton.innerHTML = '<i class="bi bi-check2"></i> Marked';
        currentButton.disabled = true;

        const subj = document.getElementById('modalSubject').innerText || 'Subject';
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        activityLog.unshift({ t: timeStr, msg: `Marked Present in ${subj}` });
        if (activityLog.length > 10) activityLog.pop();
        attendanceHistory.unshift({ date: now.toISOString().slice(0, 10), subject: subj, status: 'Present' });
        if (attendanceHistory.length > 50) attendanceHistory.pop();
        updateActivityFeed();
        addNotification(`${subj} marked present at ${timeStr}`);

        // show animated success feedback, vibrate on supported devices
        showSuccessMessage('Marked Present', () => {
            populateAttendanceHistory();
            closeCamera();
        });
    };

    window.closeCamera = function () {
        if (videoStream) videoStream.getTracks().forEach(t => t.stop());
        modalObj.hide();
    };

    function showError(m) {
        const e = document.getElementById('errorMsg');
        e.innerText = m;
        e.classList.remove('d-none');
    }

    // Generic chart creator
    const createChart = (canvasId, type, data, options = {}) => new Chart(document.getElementById(canvasId), Object.assign({ type, data }, options));

    // UPDATED REPORTS FUNCTION
    window.updateReport = function (type, btn) {
        btn.parentElement.querySelectorAll('.btn').forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-outline-primary') });
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('btn-primary');
        const d = reportData[type];

        // 1. Charts (use generic helper)
        if (trendChart) trendChart.destroy();
        trendChart = createChart('trendChart', 'line', { labels: d.l, datasets: [{ label: 'Attendance %', data: d.d, borderColor: '#0d6efd', fill: true, backgroundColor: 'rgba(13,110,253,0.1)' }] });
        if (subChart) subChart.destroy();
        subChart = createChart('subjectChart', 'doughnut', { labels: d.s.map(x => x.n), datasets: [{ data: d.s.map(x => x.a), backgroundColor: ['#198754', '#ffc107', '#0dcaf0'] }] });

        // 2. Populate Detailed Table
        const tbody = document.getElementById('reportTableBody');
        tbody.innerHTML = '';

        d.s.forEach(sub => {
            const pct = Math.round((sub.a / sub.t) * 100);
            const statusBadge = pct >= 75
                ? '<span class="badge bg-success">Safe</span>'
                : '<span class="badge bg-danger">Low</span>';

            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${sub.n}</td>
                    <td>${sub.t}</td>
                    <td>${sub.a}</td>
                    <td>${sub.t - sub.a}</td>
                    <td class="fw-bold ${pct < 75 ? 'text-danger' : 'text-success'}">${pct}%</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });
    };

    // Activity & Notifications helpers
    function updateActivityFeed() {
        const ul = document.getElementById('activityFeed');
        ul.innerHTML = '';
        const items = activityLog.slice(0, 3);
        if (items.length === 0) { ul.innerHTML = '<li class="list-group-item">No recent activity</li>'; return; }
        items.forEach(it => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `<div class="d-flex justify-content-between"><div>${it.msg}</div><div class="text-muted small">${it.t}</div></div>`;
            ul.appendChild(li);
        });
    }

    function addNotification(msg) {
        notifications.unshift({ t: new Date().toLocaleDateString(), msg });
        if (notifications.length > 20) notifications.pop();
        showNotifications();
    }

    function showNotifications() {
        const list = document.getElementById('notifList');
        const badge = document.getElementById('notifBadge');
        list.innerHTML = '';
        if (notifications.length === 0) {
            list.innerHTML = '<div class="small text-muted p-2">No notifications</div>';
            badge.innerText = '0';
            return;
        }
        notifications.slice(0, 8).forEach(n => {
            const el = document.createElement('div');
            el.className = 'px-2 py-1';
            el.innerHTML = `<div class="small"><strong>${n.msg}</strong></div><div class="small text-muted">${n.t}</div><hr class="my-1">`;
            list.appendChild(el);
        });
        badge.innerText = notifications.length;
    }

    window.clearNotifications = function () {
        notifications.length = 0;
        showNotifications();
    };

    // Reports helpers: download CSV and show history
    window.exportCSV = function () {
        const rows = [['Date', 'Subject', 'Status']];
        attendanceHistory.forEach(r => rows.push([r.date, r.subject, r.status]));
        let csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_history.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    function populateAttendanceHistory() {
        let hist = document.getElementById('attendanceHistoryList');
        if (!hist) {
            const div = document.createElement('div');
            div.className = 'mt-3';
            div.innerHTML = '<div class="d-flex justify-content-between align-items-center"><h6 class="mb-0">Attendance History</h6><button class="btn btn-sm btn-outline-secondary" onclick="exportCSV()">Download CSV</button></div><ul id="attendanceHistoryList" class="list-group mt-2 small"></ul>';
            document.querySelector('#reports .glass-card')?.after(div);
            hist = document.getElementById('attendanceHistoryList');
        }
        hist.innerHTML = '';
        if (attendanceHistory.length === 0) {
            hist.innerHTML = '<li class="list-group-item"><div class="no-data"><i class="bi bi-clock-history icon"></i><div>No attendance history</div></div></li>';
            return;
        }
        attendanceHistory.slice(0, 10).forEach(h => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between';
            li.innerHTML = `<div>${h.subject}</div><div class="text-muted">${h.date} • ${h.status}</div>`;
            hist.appendChild(li);
        });
    }

    // Success overlay helper
    function showSuccessMessage(text, cb) {
        try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) { }
        const wrap = document.createElement('div');
        wrap.className = 'success-overlay';
        wrap.innerHTML = `<div class="check-pop show"><div class="check"><i class="bi bi-check2-circle"></i></div><div class="text"><strong>${text}</strong></div></div>`;
        document.body.appendChild(wrap);
        setTimeout(() => { wrap.classList.add('removing'); }, 1200);
        setTimeout(() => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); if (cb) cb(); }, 1500);
    }

    // Render profile
    function renderProfile() {
        try {
            const map = {
                profilePhoto: 'photo',
                pfName: 'name',
                pfDOB: 'dob',
                pfGender: 'gender',
                pfBlood: 'blood',
                pfFather: 'father',
                pfMother: 'mother',
                pfAdmission: 'admissionNo',
                pfRoll: 'rollNo',
                pfReg: 'regId',
                pfDegree: 'degree',
                pfBranch: 'branch',
                pfSemester: 'semester',
                pfBatch: 'batch',
                pfEmailCollege: 'collegeEmail',
                pfEmailPersonal: 'personalEmail',
                pfPhone: 'phone',
                pfAddressCurrent: 'addressCurrent',
                pfAddressPermanent: 'addressPermanent'
            };
            // photo & course handled specially
            document.getElementById('profilePhoto').src = studentProfile.photo;
            document.getElementById('pfCourse').innerText = `${studentProfile.degree} - ${studentProfile.branch} • ${studentProfile.semester}`;
            Object.entries(map).forEach(([id, key]) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.innerText = key === 'dob' ? new Date(studentProfile[key]).toLocaleDateString() : (studentProfile[key] || '-');
            });
        } catch (e) { console.warn('Profile render error', e) }
    }

    function checkLowAttendance() {
        const low = reportData.overall.s.filter(s => Math.round((s.a / s.t) * 100) < 75);
        const banner = document.getElementById('lowAttendanceBanner');
        const text = document.getElementById('lowAttendanceText');
        if (low.length > 0) {
            banner.classList.remove('d-none');
            text.innerText = `Low attendance in: ${low.map(x => x.n).join(', ')}. Please improve to avoid penalties.`;
            addNotification(`Low attendance in ${low.map(x => x.n).join(', ')}`);
        } else banner.classList.add('d-none');
    }

    window.toggleDarkMode = function (el) {
        const on = el.checked;
        if (on) document.body.classList.add('bg-dark', 'text-light');
        else document.body.classList.remove('bg-dark', 'text-light');
        localStorage.setItem('darkMode', on ? '1' : '0');
    };

    window.saveSettings = function () {
        const emailOn = document.getElementById('emailNotifToggle').checked;
        localStorage.setItem('emailNotif', emailOn ? '1' : '0');
        const md = document.getElementById('darkModeToggle').checked;
        localStorage.setItem('darkMode', md ? '1' : '0');
        const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
        modal.hide();
    };

})();
