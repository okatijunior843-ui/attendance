// Super Functional Database with Advanced Features
class SuperDatabase {
    constructor(server) {
        this.server = server;
        this.initializeAdvancedFeatures();
    }

    initializeAdvancedFeatures() {
        this.setupDataValidation();
        this.setupAdvancedSearch();
        this.setupDataBackup();
        this.setupDataAnalytics();
        this.setupSecurityFeatures();
    }

    // Advanced Data Validation
    setupDataValidation() {
        this.validationRules = {
            users: {
                username: { required: true, minLength: 3, maxLength: 50, pattern: /^[a-zA-Z0-9_]+$/ },
                email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
                password: { required: true, minLength: 6 },
                role: { required: true, enum: ['admin', 'supervisor', 'employee'] }
            },
            attendance: {
                userId: { required: true, type: 'number' },
                username: { required: true, minLength: 1 },
                action: { required: true, enum: ['sign-in', 'sign-out'] },
                timestamp: { required: true, type: 'date' },
                location: { required: false, maxLength: 100 }
            },
            tasks: {
                title: { required: true, minLength: 3, maxLength: 200 },
                description: { required: false, maxLength: 1000 },
                assignedTo: { required: true, type: 'number' },
                priority: { required: true, enum: ['low', 'medium', 'high', 'urgent'] },
                status: { required: true, enum: ['pending', 'in-progress', 'completed', 'cancelled'] },
                dueDate: { required: false, type: 'date' }
            }
        };
    }

    validateData(type, data) {
        const rules = this.validationRules[type];
        if (!rules) return { valid: true };

        const errors = [];

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];

            // Required field check
            if (rule.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            // Skip further validation if field is not required and empty
            if (!rule.required && (value === undefined || value === null || value === '')) {
                continue;
            }

            // Type validation
            if (rule.type === 'number' && typeof value !== 'number') {
                errors.push(`${field} must be a number`);
            }

            if (rule.type === 'date' && isNaN(new Date(value).getTime())) {
                errors.push(`${field} must be a valid date`);
            }

            // String validations
            if (typeof value === 'string') {
                if (rule.minLength && value.length < rule.minLength) {
                    errors.push(`${field} must be at least ${rule.minLength} characters`);
                }

                if (rule.maxLength && value.length > rule.maxLength) {
                    errors.push(`${field} must not exceed ${rule.maxLength} characters`);
                }

                if (rule.pattern && !rule.pattern.test(value)) {
                    errors.push(`${field} format is invalid`);
                }
            }

            // Enum validation
            if (rule.enum && !rule.enum.includes(value)) {
                errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Advanced Search and Filtering
    setupAdvancedSearch() {
        this.searchOperators = {
            eq: (field, value) => item => item[field] === value,
            ne: (field, value) => item => item[field] !== value,
            gt: (field, value) => item => item[field] > value,
            gte: (field, value) => item => item[field] >= value,
            lt: (field, value) => item => item[field] < value,
            lte: (field, value) => item => item[field] <= value,
            contains: (field, value) => item => String(item[field]).toLowerCase().includes(String(value).toLowerCase()),
            startsWith: (field, value) => item => String(item[field]).toLowerCase().startsWith(String(value).toLowerCase()),
            endsWith: (field, value) => item => String(item[field]).toLowerCase().endsWith(String(value).toLowerCase()),
            in: (field, values) => item => values.includes(item[field]),
            between: (field, range) => item => item[field] >= range[0] && item[field] <= range[1],
            dateRange: (field, range) => item => {
                const itemDate = new Date(item[field]);
                const startDate = new Date(range.start);
                const endDate = new Date(range.end);
                return itemDate >= startDate && itemDate <= endDate;
            }
        };
    }

    advancedSearch(data, searchCriteria) {
        let results = [...data];

        for (const criteria of searchCriteria) {
            const { field, operator, value } = criteria;
            const searchFn = this.searchOperators[operator];
            
            if (searchFn) {
                results = results.filter(searchFn(field, value));
            }
        }

        return results;
    }

    // Fuzzy search for text fields
    fuzzySearch(data, searchTerm, fields) {
        const searchTermLower = searchTerm.toLowerCase();
        
        return data.filter(item => {
            return fields.some(field => {
                const fieldValue = String(item[field] || '').toLowerCase();
                return fieldValue.includes(searchTermLower) || 
                       this.calculateSimilarity(fieldValue, searchTermLower) > 0.6;
            });
        });
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Data Backup and Recovery
    setupDataBackup() {
        this.backupConfig = {
            enabled: true,
            interval: 3600000, // 1 hour
            maxBackups: 24,
            compressionEnabled: true
        };
        
        if (this.backupConfig.enabled) {
            this.startAutomaticBackup();
        }
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupData = {
            timestamp,
            version: '1.0.0',
            data: {
                users: await this.readData('users'),
                attendance: await this.readData('attendance'),
                tasks: await this.readData('tasks'),
                devices: await this.readData('devices'),
                logs: await this.readData('logs')
            },
            metadata: {
                totalRecords: 0,
                dataSize: 0,
                checksum: ''
            }
        };

        // Calculate metadata
        backupData.metadata.totalRecords = Object.values(backupData.data)
            .reduce((total, records) => total + (Array.isArray(records) ? records.length : 0), 0);
        
        const dataString = JSON.stringify(backupData.data);
        backupData.metadata.dataSize = dataString.length;
        backupData.metadata.checksum = this.calculateChecksum(dataString);

        // Save backup
        const fs = require('fs-extra');
        const path = require('path');
        const backupDir = path.join(__dirname, 'backups');
        await fs.ensureDir(backupDir);
        
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
        await fs.writeJson(backupFile, backupData, { spaces: 2 });
        
        // Clean old backups
        await this.cleanOldBackups(backupDir);
        
        return {
            success: true,
            filename: `backup-${timestamp}.json`,
            size: backupData.metadata.dataSize,
            records: backupData.metadata.totalRecords
        };
    }

    async restoreBackup(backupFilename) {
        const fs = require('fs-extra');
        const path = require('path');
        const backupFile = path.join(__dirname, 'backups', backupFilename);
        
        if (!await fs.pathExists(backupFile)) {
            throw new Error('Backup file not found');
        }
        
        const backupData = await fs.readJson(backupFile);
        
        // Verify checksum
        const dataString = JSON.stringify(backupData.data);
        const currentChecksum = this.calculateChecksum(dataString);
        
        if (currentChecksum !== backupData.metadata.checksum) {
            throw new Error('Backup file is corrupted');
        }
        
        // Restore data
        for (const [type, records] of Object.entries(backupData.data)) {
            await this.writeData(type, records);
        }
        
        return {
            success: true,
            timestamp: backupData.timestamp,
            recordsRestored: backupData.metadata.totalRecords
        };
    }

    startAutomaticBackup() {
        setInterval(async () => {
            try {
                await this.createBackup();
                console.log('✅ Automatic backup completed');
            } catch (error) {
                console.error('❌ Automatic backup failed:', error);
            }
        }, this.backupConfig.interval);
    }

    async cleanOldBackups(backupDir) {
        const fs = require('fs-extra');
        const files = await fs.readdir(backupDir);
        const backupFiles = files
            .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
            .sort()
            .reverse();
        
        if (backupFiles.length > this.backupConfig.maxBackups) {
            const filesToDelete = backupFiles.slice(this.backupConfig.maxBackups);
            for (const file of filesToDelete) {
                await fs.remove(path.join(backupDir, file));
            }
        }
    }

    // Data Analytics and Insights
    setupDataAnalytics() {
        this.analyticsCache = new Map();
        this.cacheExpiry = 300000; // 5 minutes
    }

    async getDataAnalytics(type, options = {}) {
        const cacheKey = `${type}-${JSON.stringify(options)}`;
        const cached = this.analyticsCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        
        let analytics;
        
        switch (type) {
            case 'attendance':
                analytics = await this.getAttendanceAnalytics(options);
                break;
            case 'users':
                analytics = await this.getUserAnalytics(options);
                break;
            case 'productivity':
                analytics = await this.getProductivityAnalytics(options);
                break;
            case 'trends':
                analytics = await this.getTrendAnalytics(options);
                break;
            default:
                throw new Error(`Unknown analytics type: ${type}`);
        }
        
        this.analyticsCache.set(cacheKey, {
            data: analytics,
            timestamp: Date.now()
        });
        
        return analytics;
    }

    async getAttendanceAnalytics(options) {
        const records = await this.readData('attendance');
        const filteredRecords = this.filterRecordsByDateRange(records, options.dateRange);
        
        return {
            totalRecords: filteredRecords.length,
            uniqueUsers: [...new Set(filteredRecords.map(r => r.username))].length,
            signInCount: filteredRecords.filter(r => r.action === 'sign-in').length,
            signOutCount: filteredRecords.filter(r => r.action === 'sign-out').length,
            dailyAverage: this.calculateDailyAverage(filteredRecords),
            peakHours: this.calculatePeakHours(filteredRecords),
            userActivity: this.calculateUserActivity(filteredRecords),
            anomalies: this.detectAnomalies(filteredRecords)
        };
    }

    // Security Features
    setupSecurityFeatures() {
        this.securityConfig = {
            maxLoginAttempts: 5,
            lockoutDuration: 900000, // 15 minutes
            sessionTimeout: 3600000, // 1 hour
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: false
            }
        };
        
        this.loginAttempts = new Map();
        this.activeSessions = new Map();
    }

    validatePassword(password) {
        const policy = this.securityConfig.passwordPolicy;
        const errors = [];
        
        if (password.length < policy.minLength) {
            errors.push(`Password must be at least ${policy.minLength} characters long`);
        }
        
        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (policy.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (policy.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        // Length bonus
        score += Math.min(password.length * 2, 20);
        
        // Character variety bonus
        if (/[a-z]/.test(password)) score += 5;
        if (/[A-Z]/.test(password)) score += 5;
        if (/\d/.test(password)) score += 5;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
        
        // Pattern penalties
        if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
        if (/123|abc|qwe/i.test(password)) score -= 10; // Common patterns
        
        if (score < 30) return 'weak';
        if (score < 60) return 'medium';
        if (score < 90) return 'strong';
        return 'very-strong';
    }

    // Rate limiting
    checkRateLimit(identifier, action) {
        const key = `${identifier}-${action}`;
        const attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
        
        const now = Date.now();
        
        // Reset counter if lockout period has passed
        if (now - attempts.lastAttempt > this.securityConfig.lockoutDuration) {
            attempts.count = 0;
        }
        
        if (attempts.count >= this.securityConfig.maxLoginAttempts) {
            const timeLeft = this.securityConfig.lockoutDuration - (now - attempts.lastAttempt);
            if (timeLeft > 0) {
                return {
                    allowed: false,
                    timeLeft: Math.ceil(timeLeft / 1000 / 60), // minutes
                    message: `Too many attempts. Try again in ${Math.ceil(timeLeft / 1000 / 60)} minutes.`
                };
            }
        }
        
        return { allowed: true };
    }

    recordLoginAttempt(identifier, action, success) {
        const key = `${identifier}-${action}`;
        const attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
        
        if (success) {
            // Reset on successful login
            this.loginAttempts.delete(key);
        } else {
            // Increment failed attempts
            attempts.count++;
            attempts.lastAttempt = Date.now();
            this.loginAttempts.set(key, attempts);
        }
    }

    // Utility methods
    calculateChecksum(data) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    filterRecordsByDateRange(records, dateRange) {
        if (!dateRange) return records;
        
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        
        return records.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= start && recordDate <= end;
        });
    }

    calculateDailyAverage(records) {
        const dailyCounts = {};
        
        records.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        
        const days = Object.keys(dailyCounts).length;
        const totalRecords = records.length;
        
        return days > 0 ? Math.round(totalRecords / days) : 0;
    }

    calculatePeakHours(records) {
        const hourCounts = {};
        
        records.forEach(record => {
            const hour = new Date(record.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        return Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }));
    }

    calculateUserActivity(records) {
        const userCounts = {};
        
        records.forEach(record => {
            if (!userCounts[record.username]) {
                userCounts[record.username] = { signIns: 0, signOuts: 0 };
            }
            userCounts[record.username][record.action === 'sign-in' ? 'signIns' : 'signOuts']++;
        });
        
        return userCounts;
    }

    detectAnomalies(records) {
        const anomalies = [];
        
        // Detect unusual sign-in times
        const signInHours = records
            .filter(r => r.action === 'sign-in')
            .map(r => new Date(r.timestamp).getHours());
        
        const avgSignInHour = signInHours.reduce((a, b) => a + b, 0) / signInHours.length;
        
        records.forEach(record => {
            if (record.action === 'sign-in') {
                const hour = new Date(record.timestamp).getHours();
                if (Math.abs(hour - avgSignInHour) > 3) {
                    anomalies.push({
                        type: 'unusual_time',
                        record,
                        message: `Unusual sign-in time: ${hour}:00 (average: ${Math.round(avgSignInHour)}:00)`
                    });
                }
            }
        });
        
        return anomalies;
    }

    // Database operations with validation
    async readData(type) {
        const fs = require('fs-extra');
        const path = require('path');
        const filePath = path.join(__dirname, 'database', `${type}.json`);
        
        if (await fs.pathExists(filePath)) {
            return await fs.readJson(filePath);
        }
        return [];
    }

    async writeData(type, data) {
        // Validate data before writing
        if (Array.isArray(data)) {
            for (const item of data) {
                const validation = this.validateData(type, item);
                if (!validation.valid) {
                    throw new Error(`Validation failed for ${type}: ${validation.errors.join(', ')}`);
                }
            }
        }
        
        const fs = require('fs-extra');
        const path = require('path');
        const filePath = path.join(__dirname, 'database', `${type}.json`);
        await fs.writeJson(filePath, data, { spaces: 2 });
        
        // Log the operation
        await this.logOperation('write', type, data.length || 1);
    }

    async logOperation(operation, type, recordCount) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            type,
            recordCount,
            checksum: this.calculateChecksum(`${operation}-${type}-${recordCount}`)
        };
        
        const logs = await this.readData('operation_logs') || [];
        logs.push(logEntry);
        
        // Keep only last 1000 log entries
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        const fs = require('fs-extra');
        const path = require('path');
        const logFile = path.join(__dirname, 'database', 'operation_logs.json');
        await fs.writeJson(logFile, logs, { spaces: 2 });
    }
}

// Export for use
module.exports = SuperDatabase;
