
// Attendance Management System - Core JavaScript
class AttendanceSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.attendanceRecords = this.loadAttendanceRecords();
        this.tasks = this.loadTasks();
        this.devices = this.loadDevices();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.startRealTimeUpdates();
    }

    // Data Management
    loadUsers() {
        const defaultUsers = [
            { id: 1, username: 'admin', email: 'admin@company.com', password: 'admin123', role: 'admin', mfaEnabled: true, isActive: true },
            { id: 2, username: 'supervisor1', email: 'supervisor@company.com', password: 'super123', role: 'supervisor', mfaEnabled: false, isActive: true },
            { id: 3, username: 'employee1', email: 'employee@company.com', password: 'emp123', role: 'employee', mfaEnabled: false, isActive: true }
        ];
        return JSON.parse(localStorage.getItem('users')) || defaultUsers;
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    loadAttendanceRecords() {
        return JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    }

    saveAttendanceRecords() {
        localStorage.setItem('attendanceRecords', JSON.stringify(this.attendanceRecords));
    }

    loadTasks() {
        return JSON.parse(localStorage.getItem('tasks')) || [];
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadDevices() {
        return JSON.parse(localStorage.getItem('devices')) || [];
    }

    saveDevices() {
        localStorage.setItem('devices', JSON.stringify(this.devices));
    }

    // Authentication
    setupEventListeners() {
        // Form switching
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Form submissions
        document.getElementById('login')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // MFA form
        document.getElementById('mfa-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMFAVerification();
        });

        // Dashboard navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showSection(e.target.dataset.section);
            });
        });

        // Attendance actions
        document.getElementById('sign-in-btn')?.addEventListener('click', () => {
            this.signIn();
        });

        document.getElementById('sign-out-btn')?.addEventListener('click', () => {
            this.signOut();
        });

        // Emergency button
        document.getElementById('emergency-btn')?.addEventListener('click', () => {
            this.handleEmergency();
        });
    }

    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('mfa-form').style.display = 'none';
    }

    showRegisterForm() {
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('mfa-form').style.display = 'none';
    }

    handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const user = this.users.find(u => u.username === username && u.password === password && u.isActive);
        
        if (user) {
            if (user.mfaEnabled) {
                this.showMFAForm(user);
            } else {
                this.loginUser(user);
            }
        } else {
            this.showMessage('Invalid credentials', 'error');
        }
    }

    showMFAForm(user) {
        this.tempUser = user;
        document.getElementById('auth-forms').style.display = 'none';
        document.getElementById('mfa-form').style.display = 'block';
        this.showMessage('Please enter your MFA code', 'info');
    }

    handleMFAVerification() {
        const mfaCode = document.getElementById('mfa-code').value;
        // Simulate MFA verification (in real app, this would verify with backend)
        if (mfaCode === '123456' || mfaCode.length === 6) {
            this.loginUser(this.tempUser);
        } else {
            this.showMessage('Invalid MFA code', 'error');
        }
    }

    loginUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.logActivity('login', `User ${user.username} logged in`);
        this.showDashboard();
    }

    handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (this.users.find(u => u.username === username)) {
            this.showMessage('Username already exists', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            role: 'employee',
            mfaEnabled: false,
            isActive: true
        };

        this.users.push(newUser);
        this.saveUsers();
        this.showMessage('Registration successful! Please login.', 'success');
        this.showLoginForm();
    }

    handleLogout() {
        if (this.currentUser) {
            this.logActivity('logout', `User ${this.currentUser.username} logged out`);
        }
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('auth-forms').style.display = 'block';
        document.getElementById('user-dashboard').style.display = 'none';
        this.showLoginForm();
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        }
    }

    // Dashboard Management
    showDashboard() {
        document.getElementById('auth-forms').style.display = 'none';
        document.getElementById('mfa-form').style.display = 'none';
        document.getElementById('user-dashboard').style.display = 'block';
        
        document.getElementById('username-display').textContent = this.currentUser.username;
        document.getElementById('user-role').textContent = this.currentUser.role.toUpperCase();
        
        this.updateDashboardStats();
        this.updateAttendanceList();
        this.showSection('overview');
        this.setupRoleBasedAccess();
    }

    setupRoleBasedAccess() {
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        const supervisorElements = document.querySelectorAll('.supervisor-admin');
        
        if (this.currentUser.role !== 'admin') {
            adminOnlyElements.forEach(el => el.style.display = 'none');
        }
        
        if (this.currentUser.role === 'employee') {
            supervisorElements.forEach(el => el.style.display = 'none');
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(`${sectionName}-section`).style.display = 'block';
        
        // Update active navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    }

    // Attendance Management
    signIn() {
        const record = {
            id: Date.now(),
            userId: this.currentUser.id,
            username: this.currentUser.username,
            action: 'sign-in',
            timestamp: new Date().toISOString(),
            method: 'manual'
        };
        
        this.attendanceRecords.push(record);
        this.saveAttendanceRecords();
        this.logActivity('sign-in', `User ${this.currentUser.username} signed in`);
        this.updateDashboardStats();
        this.updateAttendanceList();
        this.showMessage('Successfully signed in!', 'success');
    }

    signOut() {
        const record = {
            id: Date.now(),
            userId: this.currentUser.id,
            username: this.currentUser.username,
            action: 'sign-out',
            timestamp: new Date().toISOString(),
            method: 'manual'
        };
        
        this.attendanceRecords.push(record);
        this.saveAttendanceRecords();
        this.logActivity('sign-out', `User ${this.currentUser.username} signed out`);
        this.updateDashboardStats();
        this.updateAttendanceList();
        this.showMessage('Successfully signed out!', 'success');
    }

    updateDashboardStats() {
        const today = new Date().toDateString();
        const todayRecords = this.attendanceRecords.filter(r => 
            new Date(r.timestamp).toDateString() === today
        );
        
        const signedInUsers = new Set();
        todayRecords.forEach(record => {
            if (record.action === 'sign-in') {
                signedInUsers.add(record.userId);
            } else if (record.action === 'sign-out') {
                signedInUsers.delete(record.userId);
            }
        });
        
        document.getElementById('present-count').textContent = signedInUsers.size;
        document.getElementById('total-employees').textContent = this.users.filter(u => u.isActive).length;
        document.getElementById('tasks-progress').textContent = this.tasks.filter(t => t.status === 'in-progress').length;
    }

    updateAttendanceList() {
        const list = document.getElementById('attendance-list');
        const recent = this.attendanceRecords.slice(-10).reverse();
        
        list.innerHTML = recent.map(record => `
            <div class="attendance-item">
                <span class="username">${record.username}</span>
                <span class="action ${record.action}">${record.action}</span>
                <span class="timestamp">${new Date(record.timestamp).toLocaleString()}</span>
            </div>
        `).join('');
    }

    // Emergency Response
    handleEmergency() {
        const emergencyRecord = {
            id: Date.now(),
            userId: this.currentUser.id,
            username: this.currentUser.username,
            type: 'emergency_alert',
            timestamp: new Date().toISOString(),
            status: 'active'
        };
        
        this.logActivity('emergency', `Emergency alert triggered by ${this.currentUser.username}`);
        alert('🚨 EMERGENCY ALERT TRIGGERED! 🚨\nSecurity has been notified.');
        this.showMessage('Emergency alert sent to security team!', 'error');
    }

    // Activity Logging
    logActivity(type, description) {
        const logs = JSON.parse(localStorage.getItem('activityLogs')) || [];
        logs.push({
            id: Date.now(),
            type,
            description,
            userId: this.currentUser?.id,
            username: this.currentUser?.username,
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1' // Simulated
        });
        localStorage.setItem('activityLogs', JSON.stringify(logs));
    }

    // Real-time Updates
    startRealTimeUpdates() {
        setInterval(() => {
            if (this.currentUser && document.getElementById('user-dashboard').style.display !== 'none') {
                this.updateDashboardStats();
                this.updateAttendanceList();
            }
        }, 30000); // Update every 30 seconds
    }

    // Utility Functions
    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    // Report Generation
    generateReport(type, dateRange) {
        const reports = {
            daily: this.generateDailyReport(),
            weekly: this.generateWeeklyReport(),
            monthly: this.generateMonthlyReport()
        };
        
        return reports[type] || reports.daily;
    }

    generateDailyReport() {
        const today = new Date().toDateString();
        const todayRecords = this.attendanceRecords.filter(r => 
            new Date(r.timestamp).toDateString() === today
        );
        
        return {
            date: today,
            totalSignIns: todayRecords.filter(r => r.action === 'sign-in').length,
            totalSignOuts: todayRecords.filter(r => r.action === 'sign-out').length,
            records: todayRecords
        };
    }

    generateWeeklyReport() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weekRecords = this.attendanceRecords.filter(r => 
            new Date(r.timestamp) >= weekAgo
        );
        
        return {
            period: 'Last 7 days',
            totalRecords: weekRecords.length,
            records: weekRecords
        };
    }

    generateMonthlyReport() {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        const monthRecords = this.attendanceRecords.filter(r => 
            new Date(r.timestamp) >= monthAgo
        );
        
        return {
            period: 'Last 30 days',
            totalRecords: monthRecords.length,
            records: monthRecords
        };
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.attendanceSystem = new AttendanceSystem();
});