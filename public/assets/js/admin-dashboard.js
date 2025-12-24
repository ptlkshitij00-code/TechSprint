(function () {
    'use strict';

    // --- ADMIN DASHBOARD WITH API INTEGRATION ---

    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
        window.location.href = 'admin-login';
    }

    // API Configuration
    const API_BASE = '/api';

    let parsedTimetable = null;

    async function apiRequest(endpoint, options = {}) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }
        return response.json();
    }

    // --- INITIALIZATION ---

    document.addEventListener('DOMContentLoaded', function () {
        setupSectionNavigation();
        loadFacultyList();
        loadSubjects();
        loadDashboardStats();

        // Setup event listeners
        setupEventListeners();
    });

    // --- UI LOGIC ---

    // Mobile Sidebar Toggle
    window.toggleSidebar = function () {
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            document.getElementById('sidebar').classList.toggle('active');
        }
    };

    // Ensure only one section visible at a time
    function setupSectionNavigation() {
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        const sections = document.querySelectorAll('.section-container');

        function hideAll() {
            sections.forEach(s => s.style.display = 'none');
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (ev) => {
                ev.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // derive target from href (e.g. #user-mgmt)
                const href = link.getAttribute('href') || link.dataset.target;
                const id = href && href.startsWith('#') ? href.substring(1) : href;

                hideAll();
                if (id) {
                    const target = document.getElementById(id);
                    if (target) target.style.display = 'block';
                }

                // close sidebar on mobile
                if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');
            });
        });

        // Show first section by default
        hideAll();
        const first = document.querySelector('.section-container');
        if (first) first.style.display = 'block';
    }

    // Toggle Student Specific Fields
    window.toggleStudentFields = function () {
        const role = document.getElementById('regRole')?.value || document.getElementById('userRole')?.value;
        const studentFields = document.getElementById('studentFields');
        const studentRoll = document.getElementById('studentRoll');

        if (role === 'Student' || role === 'student') {
            if (studentFields) studentFields.style.display = 'block';
            if (document.getElementById('regRoll')) document.getElementById('regRoll').required = true;
            if (studentRoll) studentRoll.style.display = 'block';
        } else {
            if (studentFields) studentFields.style.display = 'none';
            if (document.getElementById('regRoll')) document.getElementById('regRoll').required = false;
            if (studentRoll) studentRoll.style.display = 'none';
        }
    };

    // --- EVENT LISTENERS SETUP ---

    function setupEventListeners() {
        // Handle Add User Form
        const addUserForm = document.getElementById('addUserForm') || document.getElementById('registerForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const userData = {
                    name: formData.get('name') || document.getElementById('userName')?.value || document.getElementById('regName')?.value,
                    email: formData.get('email') || document.getElementById('userEmail')?.value || document.getElementById('regEmail')?.value,
                    password: formData.get('password') || document.getElementById('userPassword')?.value || document.getElementById('regPassword')?.value,
                    role: formData.get('role') || document.getElementById('userRole')?.value || document.getElementById('regRole')?.value,
                    department: formData.get('department') || document.getElementById('userDept')?.value
                };

                // Add student-specific fields
                if (userData.role === 'student' || userData.role === 'Student') {
                    userData.rollNumber = document.getElementById('studentRoll')?.value || document.getElementById('regRoll')?.value;
                    userData.batch = document.getElementById('studentBatch')?.value;
                    userData.semester = document.getElementById('regSem')?.value;
                    userData.branch = document.getElementById('regBranch')?.value;
                }

                try {
                    await apiRequest('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify(userData)
                    });
                    alert('User created successfully!');
                    e.target.reset();
                    toggleStudentFields();
                    loadFacultyList();
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });
        }

        // Handle Timetable Form
        const rescheduleForm = document.getElementById('rescheduleForm');
        if (rescheduleForm) {
            rescheduleForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const timetableData = {
                    date: document.getElementById('ttDate').value,
                    startTime: document.getElementById('ttTime').value,
                    classSection: document.getElementById('ttClass').value,
                    faculty: document.getElementById('ttTeacher').value,
                    subject: document.getElementById('ttSubject').value,
                    day: new Date(document.getElementById('ttDate').value).toLocaleDateString('en-US', { weekday: 'long' })
                };

                try {
                    await apiRequest('/timetable', {
                        method: 'POST',
                        body: JSON.stringify(timetableData)
                    });
                    alert('Timetable entry created successfully!');
                    e.target.reset();
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });
        }

        // Handle Notice Form
        const noticeForm = document.getElementById('noticeForm');
        if (noticeForm) {
            noticeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const noticeData = {
                    title: document.getElementById('noticeTitle').value,
                    content: document.getElementById('noticeMsg').value,
                    priority: document.getElementById('noticePriority').value,
                    targetAudience: document.getElementById('noticeTarget').value
                };

                try {
                    await apiRequest('/notices', {
                        method: 'POST',
                        body: JSON.stringify(noticeData)
                    });
                    alert('Notice posted successfully!');
                    e.target.reset();
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });
        }

        // Handle Subject Allocation
        const subjectForm = document.getElementById('subjectForm');
        if (subjectForm) {
            subjectForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const subjectData = {
                    name: document.getElementById('subName').value,
                    code: document.getElementById('subCode')?.value || '',
                    faculty: document.getElementById('subFaculty').value,
                    department: document.getElementById('subDept')?.value || 'CSE'
                };

                try {
                    await apiRequest('/subjects', {
                        method: 'POST',
                        body: JSON.stringify(subjectData)
                    });
                    alert('Subject created successfully!');
                    e.target.reset();
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });
        }

        // Timetable Upload Handlers
        document.addEventListener('click', handleTimetableButtons);
    }

    // --- TIMETABLE UPLOAD & PROCESSING ---

    function handleTimetableButtons(ev) {
        // Parse Button
        if (ev.target && ev.target.id === 'parseTtBtn') {
            ev.preventDefault();
            const fileInput = document.getElementById('ttFileInput');
            const file = fileInput.files[0];
            const preview = document.getElementById('ttPreview');
            preview.innerHTML = '';
            parsedTimetable = null;

            if (!file) {
                alert('Please select a file first');
                return;
            }

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '100%';
                    img.style.borderRadius = '8px';
                    preview.appendChild(img);
                    parsedTimetable = { imageDataUrl: e.target.result };
                };
                reader.readAsDataURL(file);
                return;
            }

            // Assume spreadsheet / csv
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target.result;
                let workbook;
                try {
                    const arr = new Uint8Array(data);
                    workbook = XLSX.read(arr, { type: 'array' });
                } catch (err) {
                    workbook = XLSX.read(data, { type: 'binary' });
                }

                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                parsedTimetable = json;

                // render preview table
                if (json.length === 0) {
                    preview.innerHTML = '<div class="text-white-50">No rows found in sheet.</div>';
                    return;
                }

                const table = document.createElement('table');
                table.className = 'table table-sm table-striped table-dark';
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                Object.keys(json[0]).forEach(h => {
                    const th = document.createElement('th');
                    th.innerText = h;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                json.slice(0, 20).forEach(row => { // preview first 20 rows
                    const tr = document.createElement('tr');
                    Object.keys(row).forEach(k => {
                        const td = document.createElement('td');
                        td.innerText = row[k];
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                preview.appendChild(table);
            };

            // Read as array buffer for XLSX
            reader.readAsArrayBuffer(file);
        }

        // Save Button
        if (ev.target && ev.target.id === 'saveTtBtn') {
            ev.preventDefault();
            if (!parsedTimetable) {
                alert('No parsed timetable to save. Please parse a file first.');
                return;
            }

            // Save to backend via API
            apiRequest('/timetable/upload', {
                method: 'POST',
                body: JSON.stringify({ data: parsedTimetable })
            }).then(() => {
                alert('Timetable saved successfully');
                document.getElementById('ttPreview').innerHTML = '';
                document.getElementById('ttFileInput').value = '';
                parsedTimetable = null;
            }).catch(err => alert('Save Error: ' + err.message));
        }
    }

    // --- DASHBOARD DATA LOADING ---

    // Load Dashboard Stats
    async function loadDashboardStats() {
        try {
            const stats = await apiRequest('/admin/stats');
            if (document.getElementById('totalStudents')) {
                document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
            }
            if (document.getElementById('totalFaculty')) {
                document.getElementById('totalFaculty').textContent = stats.totalFaculty || 0;
            }
            if (document.getElementById('totalSubjects')) {
                document.getElementById('totalSubjects').textContent = stats.totalSubjects || 0;
            }
            if (document.getElementById('activeSessions')) {
                document.getElementById('activeSessions').textContent = stats.activeSessions || 0;
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    // User Management
    async function loadUsers(role = '') {
        try {
            const endpoint = role ? `/users?role=${role}` : '/users';
            const response = await apiRequest(endpoint);
            return response.users || [];
        } catch (error) {
            console.error('Failed to load users:', error);
            return [];
        }
    }

    // Load Faculty List
    async function loadFacultyList() {
        const subFaculty = document.getElementById('subFaculty');
        const ttTeacher = document.getElementById('ttTeacher');
        const ttOriginal = document.getElementById('ttOriginalTeacher');

        if (subFaculty) subFaculty.innerHTML = '<option disabled selected>Loading...</option>';
        if (ttTeacher) ttTeacher.innerHTML = '<option disabled selected>Loading...</option>';
        if (ttOriginal) ttOriginal.innerHTML = '<option disabled selected>Loading...</option>';

        try {
            const response = await apiRequest('/users?role=faculty');
            const faculty = response.users || [];

            if (subFaculty) subFaculty.innerHTML = '<option disabled selected>Select...</option>';
            if (ttTeacher) ttTeacher.innerHTML = '<option disabled selected>Select Faculty...</option>';
            if (ttOriginal) ttOriginal.innerHTML = '<option disabled selected>Select Faculty...</option>';

            faculty.forEach(f => {
                const opt1 = document.createElement('option');
                opt1.value = f._id;
                opt1.textContent = f.name;

                if (subFaculty) subFaculty.appendChild(opt1.cloneNode(true));
                if (ttTeacher) ttTeacher.appendChild(opt1.cloneNode(true));
                if (ttOriginal) ttOriginal.appendChild(opt1.cloneNode(true));
            });
        } catch (error) {
            console.warn('Could not load faculty list:', error.message);
        }
    }

    // Load Subjects
    async function loadSubjects() {
        const ttSubject = document.getElementById('ttSubject');
        if (!ttSubject) return;

        ttSubject.innerHTML = '<option disabled selected>Loading...</option>';

        try {
            const response = await apiRequest('/subjects');
            const subjects = response.subjects || [];

            ttSubject.innerHTML = '<option disabled selected>Select Subject...</option>';
            subjects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s._id;
                opt.textContent = s.name;
                ttSubject.appendChild(opt);
            });
        } catch (error) {
            console.warn('Could not load subjects:', error.message);
        }
    }

    // Logout function
    window.logout = function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'admin-login';
    };

})();
