// Enhanced Features for Attendance Management System

// 1. PDF Export Functionality
class ReportExporter {
    static async exportToPDF(reportData, filename = 'attendance-report.pdf') {
        // Using jsPDF library (add to HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text('Attendance Report', 20, 20);
        
        // Report details
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40);
        doc.text(`Period: ${reportData.period}`, 20, 50);
        doc.text(`Total Records: ${reportData.totalRecords}`, 20, 60);
        
        // Records table
        let yPos = 80;
        doc.text('Recent Attendance Records:', 20, yPos);
        yPos += 10;
        
        reportData.records.slice(0, 20).forEach((record, index) => {
            const text = `${record.username} - ${record.action} - ${new Date(record.timestamp).toLocaleString()}`;
            doc.text(text, 20, yPos + (index * 10));
        });
        
        // Save the PDF
        doc.save(filename);
    }
    
    static async exportToExcel(reportData, filename = 'attendance-report.xlsx') {
        // Using SheetJS library (add to HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>)
        const ws = XLSX.utils.json_to_sheet(reportData.records);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, filename);
    }
}

// 2. Enhanced MFA with PIN
class EnhancedMFA {
    static generatePIN() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    static async sendPINEmail(email, pin) {
        // Using EmailJS or similar service
        console.log(`Sending PIN ${pin} to ${email}`);
        // Implementation would use email service API
    }
    
    static verifyPIN(userPin, storedPin) {
        return userPin === storedPin;
    }
}

// 3. AI Anomaly Detection
class AttendanceAnalytics {
    static detectAnomalies(attendanceRecords, userId) {
        const userRecords = attendanceRecords.filter(r => r.userId === userId);
        const anomalies = [];
        
        // Check for unusual sign-in times
        const signInTimes = userRecords
            .filter(r => r.action === 'sign-in')
            .map(r => new Date(r.timestamp).getHours());
        
        const avgSignInTime = signInTimes.reduce((a, b) => a + b, 0) / signInTimes.length;
        
        userRecords.forEach(record => {
            if (record.action === 'sign-in') {
                const hour = new Date(record.timestamp).getHours();
                if (Math.abs(hour - avgSignInTime) > 2) {
                    anomalies.push({
                        type: 'unusual_time',
                        record,
                        message: `Unusual sign-in time: ${hour}:00 (avg: ${Math.round(avgSignInTime)}:00)`
                    });
                }
            }
        });
        
        // Check for missing days
        const lastWeekRecords = userRecords.filter(r => {
            const recordDate = new Date(r.timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return recordDate >= weekAgo;
        });
        
        if (lastWeekRecords.length < 5) {
            anomalies.push({
                type: 'low_attendance',
                message: `Only ${lastWeekRecords.length} attendance records in the last week`
            });
        }
        
        return anomalies;
    }
    
    static generateInsights(attendanceRecords) {
        const insights = [];
        
        // Most active hours
        const hourCounts = {};
        attendanceRecords.forEach(record => {
            const hour = new Date(record.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const peakHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        
        insights.push({
            type: 'peak_activity',
            message: `Peak activity hour: ${peakHour}:00 with ${hourCounts[peakHour]} records`
        });
        
        return insights;
    }
}

// 4. Real-time Notifications
class NotificationSystem {
    static showAlert(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'error' ? '⚠️' : '📢'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    static checkForAnomalies(attendanceSystem) {
        setInterval(() => {
            const anomalies = AttendanceAnalytics.detectAnomalies(
                attendanceSystem.attendanceRecords,
                attendanceSystem.currentUser?.id
            );
            
            anomalies.forEach(anomaly => {
                this.showAlert(anomaly.message, 'warning');
            });
        }, 300000); // Check every 5 minutes
    }
}

// 5. Enhanced Dashboard Stats
class DashboardEnhancements {
    static updateAdvancedStats(attendanceRecords) {
        const today = new Date().toDateString();
        const thisWeek = this.getWeekRecords(attendanceRecords);
        const thisMonth = this.getMonthRecords(attendanceRecords);
        
        // Update DOM elements
        document.getElementById('weekly-average').textContent = 
            Math.round(thisWeek.length / 7);
        document.getElementById('monthly-total').textContent = thisMonth.length;
        document.getElementById('top-performer').textContent = 
            this.getTopPerformer(thisMonth);
    }
    
    static getWeekRecords(records) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return records.filter(r => new Date(r.timestamp) >= weekAgo);
    }
    
    static getMonthRecords(records) {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return records.filter(r => new Date(r.timestamp) >= monthAgo);
    }
    
    static getTopPerformer(records) {
        const userCounts = {};
        records.forEach(r => {
            userCounts[r.username] = (userCounts[r.username] || 0) + 1;
        });
        
        return Object.keys(userCounts).reduce((a, b) => 
            userCounts[a] > userCounts[b] ? a : b
        ) || 'N/A';
    }
}

// Export for use
window.ReportExporter = ReportExporter;
window.EnhancedMFA = EnhancedMFA;
window.AttendanceAnalytics = AttendanceAnalytics;
window.NotificationSystem = NotificationSystem;
window.DashboardEnhancements = DashboardEnhancements;
