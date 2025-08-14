// API Integration Layer for Attendance Management System
class AttendanceAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
    }

    // Helper method to make authenticated requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        const response = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('authToken', this.token);
        }
        
        return response;
    }

    async register(userData) {
        return await this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Users
    async getUsers() {
        return await this.request('/users');
    }

    // Attendance
    async getAttendance() {
        return await this.request('/attendance');
    }

    async recordAttendance(action) {
        return await this.request('/attendance', {
            method: 'POST',
            body: JSON.stringify({ action })
        });
    }

    // Tasks
    async getTasks() {
        return await this.request('/tasks');
    }

    async createTask(taskData) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    // Devices
    async getDevices() {
        return await this.request('/devices');
    }

    // Activity Logs
    async getLogs() {
        return await this.request('/logs');
    }

    // Reports
    async getReport(type) {
        return await this.request(`/reports/${type}`);
    }

    // Check if we're connected to the backend
    async checkConnection() {
        try {
            await fetch(`${this.baseURL.replace('/api', '')}/`);
            return true;
        } catch {
            return false;
        }
    }
}

// Enhanced AttendanceSystem with API integration
class AttendanceSystemWithAPI extends AttendanceSystem {
    constructor() {
        super();
        this.api = new AttendanceAPI();
        this.useAPI = false; // Start with localStorage, switch to API when available
        this.checkAPIConnection();
    }

    async checkAPIConnection() {
        const connected = await this.api.checkConnection();
        if (connected) {
            this.useAPI = true;
            console.log('✅ Connected to database backend');
            this.showMessage('Connected to database backend', 'success');
        } else {
            console.log('📱 Using local storage (backend not available)');
            this.showMessage('Using local storage mode', 'info');
        }
    }

    // Override login to use API when available
    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            if (this.useAPI) {
                const response = await this.api.login(username, password);
                this.currentUser = response.user;
                this.loginUser(this.currentUser);
                this.showMessage('Login successful!', 'success');
            } else {
                // Fallback to original localStorage method
                super.handleLogin();
            }
        } catch (error) {
            this.showMessage(error.message || 'Login failed', 'error');
        }
    }

    // Override register to use API when available
    async handleRegister() {
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (!username || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        try {
            if (this.useAPI) {
                await this.api.register({ username, email, password });
                this.showMessage('Registration successful! Please login.', 'success');
                this.showLoginForm();
            } else {
                // Fallback to original localStorage method
                super.handleRegister();
            }
        } catch (error) {
            this.showMessage(error.message || 'Registration failed', 'error');
        }
    }

    // Override sign in/out to use API when available
    async signIn() {
        try {
            if (this.useAPI) {
                const record = await this.api.recordAttendance('sign-in');
                this.showMessage('Signed in successfully!', 'success');
                this.updateDashboardStats();
                this.updateAttendanceList();
            } else {
                super.signIn();
            }
        } catch (error) {
            this.showMessage(error.message || 'Sign in failed', 'error');
        }
    }

    async signOut() {
        try {
            if (this.useAPI) {
                const record = await this.api.recordAttendance('sign-out');
                this.showMessage('Signed out successfully!', 'success');
                this.updateDashboardStats();
                this.updateAttendanceList();
            } else {
                super.signOut();
            }
        } catch (error) {
            this.showMessage(error.message || 'Sign out failed', 'error');
        }
    }

    // Override logout to use API
    handleLogout() {
        if (this.useAPI) {
            this.api.logout();
        }
        super.handleLogout();
    }

    // Enhanced dashboard stats with API data
    async updateDashboardStats() {
        try {
            if (this.useAPI) {
                const attendance = await this.api.getAttendance();
                const today = new Date().toDateString();
                const todayRecords = attendance.filter(r => 
                    new Date(r.timestamp).toDateString() === today
                );

                const signIns = todayRecords.filter(r => r.action === 'sign-in').length;
                const signOuts = todayRecords.filter(r => r.action === 'sign-out').length;

                document.getElementById('total-employees').textContent = 
                    new Set(todayRecords.map(r => r.userId)).size;
                document.getElementById('present-today').textContent = signIns;
                document.getElementById('total-hours').textContent = 
                    Math.round((signOuts / Math.max(signIns, 1)) * 8);
            } else {
                super.updateDashboardStats();
            }
        } catch (error) {
            console.error('Failed to update dashboard stats:', error);
            super.updateDashboardStats(); // Fallback to localStorage
        }
    }

    // Enhanced attendance list with API data
    async updateAttendanceList() {
        try {
            if (this.useAPI) {
                const attendance = await this.api.getAttendance();
                const recent = attendance.slice(-10).reverse();
                
                const list = document.getElementById('recent-attendance');
                if (!list) return;

                list.innerHTML = recent.map(record => `
                    <div class="attendance-item">
                        <span class="username">${record.username}</span>
                        <span class="action ${record.action}">${record.action}</span>
                        <span class="timestamp">${new Date(record.timestamp).toLocaleString()}</span>
                    </div>
                `).join('');
            } else {
                super.updateAttendanceList();
            }
        } catch (error) {
            console.error('Failed to update attendance list:', error);
            super.updateAttendanceList(); // Fallback to localStorage
        }
    }

    // Enhanced report generation with API data
    async generateReport(type, dateRange) {
        try {
            if (this.useAPI) {
                return await this.api.getReport(type);
            } else {
                return super.generateReport(type, dateRange);
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
            return super.generateReport(type, dateRange); // Fallback to localStorage
        }
    }
}

// Export for use
window.AttendanceAPI = AttendanceAPI;
window.AttendanceSystemWithAPI = AttendanceSystemWithAPI;
