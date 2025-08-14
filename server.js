const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database file paths
const DB_PATH = path.join(__dirname, 'database');
const USERS_FILE = path.join(DB_PATH, 'users.json');
const ATTENDANCE_FILE = path.join(DB_PATH, 'attendance.json');
const TASKS_FILE = path.join(DB_PATH, 'tasks.json');
const DEVICES_FILE = path.join(DB_PATH, 'devices.json');
const LOGS_FILE = path.join(DB_PATH, 'logs.json');

// Initialize database
async function initDatabase() {
    await fs.ensureDir(DB_PATH);
    
    // Initialize users file with default data
    if (!await fs.pathExists(USERS_FILE)) {
        const defaultUsers = [
            { 
                id: 1, 
                username: 'admin', 
                email: 'admin@company.com', 
                password: await bcrypt.hash('admin123', 10), 
                role: 'admin', 
                mfaEnabled: true, 
                isActive: true,
                createdAt: new Date().toISOString()
            },
            { 
                id: 2, 
                username: 'supervisor1', 
                email: 'supervisor@company.com', 
                password: await bcrypt.hash('super123', 10), 
                role: 'supervisor', 
                mfaEnabled: false, 
                isActive: true,
                createdAt: new Date().toISOString()
            },
            { 
                id: 3, 
                username: 'employee1', 
                email: 'employee@company.com', 
                password: await bcrypt.hash('emp123', 10), 
                role: 'employee', 
                mfaEnabled: false, 
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];
        await fs.writeJson(USERS_FILE, defaultUsers);
    }
    
    // Initialize other files
    const files = [ATTENDANCE_FILE, TASKS_FILE, DEVICES_FILE, LOGS_FILE];
    for (const file of files) {
        if (!await fs.pathExists(file)) {
            await fs.writeJson(file, []);
        }
    }
}

// Database helper functions
async function readData(filename) {
    return await fs.readJson(filename);
}

async function writeData(filename, data) {
    await fs.writeJson(filename, data, { spaces: 2 });
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Routes

// Authentication
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await readData(USERS_FILE);
        const user = users.find(u => u.username === username && u.isActive);
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
        const { password: _, ...userWithoutPassword } = user;
        
        // Log activity
        await logActivity('login', `User ${username} logged in`, user.id);
        
        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role = 'employee' } = req.body;
        const users = await readData(USERS_FILE);
        
        if (users.find(u => u.username === username || u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Math.max(...users.map(u => u.id), 0) + 1,
            username,
            email,
            password: hashedPassword,
            role,
            mfaEnabled: false,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeData(USERS_FILE, users);
        
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Users
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await readData(USERS_FILE);
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Attendance
app.get('/api/attendance', authenticateToken, async (req, res) => {
    try {
        const attendance = await readData(ATTENDANCE_FILE);
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/attendance', authenticateToken, async (req, res) => {
    try {
        const { action } = req.body;
        const attendance = await readData(ATTENDANCE_FILE);
        
        const record = {
            id: Date.now(),
            userId: req.user.id,
            username: req.user.username,
            action,
            timestamp: new Date().toISOString(),
            location: 'Office' // Can be enhanced with GPS
        };

        attendance.push(record);
        await writeData(ATTENDANCE_FILE, attendance);
        
        // Log activity
        await logActivity('attendance', `${req.user.username} ${action}`, req.user.id);
        
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;
        const tasks = await readData(TASKS_FILE);
        
        const task = {
            id: Date.now(),
            title,
            description,
            assignedTo,
            assignedBy: req.user.id,
            priority,
            status: 'pending',
            dueDate,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);
        await writeData(TASKS_FILE, tasks);
        
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Devices
app.get('/api/devices', authenticateToken, async (req, res) => {
    try {
        const devices = await readData(DEVICES_FILE);
        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Activity Logs
app.get('/api/logs', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const logs = await readData(LOGS_FILE);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reports
app.get('/api/reports/:type', authenticateToken, async (req, res) => {
    try {
        const { type } = req.params;
        const attendance = await readData(ATTENDANCE_FILE);
        
        let filteredRecords = [];
        const now = new Date();
        
        switch (type) {
            case 'daily':
                const today = now.toDateString();
                filteredRecords = attendance.filter(r => 
                    new Date(r.timestamp).toDateString() === today
                );
                break;
            case 'weekly':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredRecords = attendance.filter(r => 
                    new Date(r.timestamp) >= weekAgo
                );
                break;
            case 'monthly':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredRecords = attendance.filter(r => 
                    new Date(r.timestamp) >= monthAgo
                );
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        const report = {
            type,
            period: type,
            totalRecords: filteredRecords.length,
            signIns: filteredRecords.filter(r => r.action === 'sign-in').length,
            signOuts: filteredRecords.filter(r => r.action === 'sign-out').length,
            records: filteredRecords
        };

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper function to log activities
async function logActivity(type, description, userId = null) {
    try {
        const logs = await readData(LOGS_FILE);
        logs.push({
            id: Date.now(),
            type,
            description,
            userId,
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1' // In production, get real IP
        });
        await writeData(LOGS_FILE, logs);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'INDEX.HTML'));
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Attendance Management Server running on http://localhost:${PORT}`);
        console.log(`📊 Database initialized in: ${DB_PATH}`);
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
});
