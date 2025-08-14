// Advanced Reporting System with Charts and Export
class AdvancedReporting {
    constructor(attendanceSystem) {
        this.system = attendanceSystem;
        this.initializeReporting();
    }

    initializeReporting() {
        this.setupReportingUI();
        this.initializeCharts();
    }

    // Enhanced Report Generation with Multiple Formats
    async generateAdvancedReport(options = {}) {
        const {
            type = 'daily',
            format = 'html',
            dateRange = null,
            users = null,
            departments = null,
            includeCharts = true
        } = options;

        const data = await this.gatherReportData(type, dateRange, users, departments);
        
        switch (format) {
            case 'pdf':
                return this.exportToPDF(data, includeCharts);
            case 'excel':
                return this.exportToExcel(data);
            case 'csv':
                return this.exportToCSV(data);
            case 'json':
                return this.exportToJSON(data);
            default:
                return this.generateHTMLReport(data, includeCharts);
        }
    }

    async gatherReportData(type, dateRange, users, departments) {
        let records = [];
        
        if (this.system.useAPI) {
            records = await this.system.api.getAttendance();
        } else {
            records = this.system.attendanceRecords;
        }

        // Apply filters
        if (dateRange) {
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            records = records.filter(r => {
                const recordDate = new Date(r.timestamp);
                return recordDate >= startDate && recordDate <= endDate;
            });
        }

        if (users && users.length > 0) {
            records = records.filter(r => users.includes(r.username));
        }

        // Calculate analytics
        const analytics = this.calculateAnalytics(records);
        
        return {
            type,
            dateRange,
            records,
            analytics,
            generatedAt: new Date().toISOString(),
            totalRecords: records.length
        };
    }

    calculateAnalytics(records) {
        const analytics = {
            totalSignIns: records.filter(r => r.action === 'sign-in').length,
            totalSignOuts: records.filter(r => r.action === 'sign-out').length,
            uniqueUsers: [...new Set(records.map(r => r.username))].length,
            dailyBreakdown: {},
            hourlyBreakdown: {},
            userBreakdown: {},
            averageSessionTime: 0,
            peakHours: [],
            anomalies: []
        };

        // Daily breakdown
        records.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            if (!analytics.dailyBreakdown[date]) {
                analytics.dailyBreakdown[date] = { signIns: 0, signOuts: 0 };
            }
            analytics.dailyBreakdown[date][record.action === 'sign-in' ? 'signIns' : 'signOuts']++;
        });

        // Hourly breakdown
        records.forEach(record => {
            const hour = new Date(record.timestamp).getHours();
            analytics.hourlyBreakdown[hour] = (analytics.hourlyBreakdown[hour] || 0) + 1;
        });

        // User breakdown
        records.forEach(record => {
            if (!analytics.userBreakdown[record.username]) {
                analytics.userBreakdown[record.username] = { signIns: 0, signOuts: 0, totalHours: 0 };
            }
            analytics.userBreakdown[record.username][record.action === 'sign-in' ? 'signIns' : 'signOuts']++;
        });

        // Calculate peak hours
        const sortedHours = Object.entries(analytics.hourlyBreakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        analytics.peakHours = sortedHours.map(([hour, count]) => ({ hour: parseInt(hour), count }));

        return analytics;
    }

    // PDF Export with Charts
    async exportToPDF(data, includeCharts = true) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(24);
        doc.setTextColor(44, 62, 80);
        doc.text('📊 Attendance Analytics Report', 20, yPos);
        yPos += 20;

        // Report Info
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 20, yPos);
        yPos += 10;
        doc.text(`Report Type: ${data.type.toUpperCase()}`, 20, yPos);
        yPos += 10;
        doc.text(`Total Records: ${data.totalRecords}`, 20, yPos);
        yPos += 20;

        // Key Metrics
        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text('📈 Key Metrics', 20, yPos);
        yPos += 15;

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Sign-ins: ${data.analytics.totalSignIns}`, 30, yPos);
        yPos += 8;
        doc.text(`Total Sign-outs: ${data.analytics.totalSignOuts}`, 30, yPos);
        yPos += 8;
        doc.text(`Unique Users: ${data.analytics.uniqueUsers}`, 30, yPos);
        yPos += 8;
        doc.text(`Peak Hours: ${data.analytics.peakHours.map(p => `${p.hour}:00 (${p.count})`).join(', ')}`, 30, yPos);
        yPos += 20;

        // Recent Records Table
        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text('📋 Recent Records', 20, yPos);
        yPos += 15;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const recentRecords = data.records.slice(-15);
        recentRecords.forEach((record, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            const text = `${record.username} - ${record.action} - ${new Date(record.timestamp).toLocaleString()}`;
            doc.text(text, 30, yPos);
            yPos += 6;
        });

        // Save PDF
        doc.save(`attendance-report-${data.type}-${new Date().toISOString().split('T')[0]}.pdf`);
        return 'PDF exported successfully!';
    }

    // Excel Export
    async exportToExcel(data) {
        const wb = XLSX.utils.book_new();
        
        // Main data sheet
        const ws1 = XLSX.utils.json_to_sheet(data.records);
        XLSX.utils.book_append_sheet(wb, ws1, 'Attendance Records');
        
        // Analytics sheet
        const analyticsData = [
            ['Metric', 'Value'],
            ['Total Sign-ins', data.analytics.totalSignIns],
            ['Total Sign-outs', data.analytics.totalSignOuts],
            ['Unique Users', data.analytics.uniqueUsers],
            ['Report Generated', new Date(data.generatedAt).toLocaleString()],
            [],
            ['Daily Breakdown', ''],
            ...Object.entries(data.analytics.dailyBreakdown).map(([date, counts]) => 
                [date, `Sign-ins: ${counts.signIns}, Sign-outs: ${counts.signOuts}`]
            )
        ];
        
        const ws2 = XLSX.utils.aoa_to_sheet(analyticsData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Analytics');
        
        // User breakdown sheet
        const userBreakdownData = [
            ['Username', 'Sign-ins', 'Sign-outs', 'Total Actions'],
            ...Object.entries(data.analytics.userBreakdown).map(([user, counts]) => 
                [user, counts.signIns, counts.signOuts, counts.signIns + counts.signOuts]
            )
        ];
        
        const ws3 = XLSX.utils.aoa_to_sheet(userBreakdownData);
        XLSX.utils.book_append_sheet(wb, ws3, 'User Breakdown');
        
        XLSX.writeFile(wb, `attendance-report-${data.type}-${new Date().toISOString().split('T')[0]}.xlsx`);
        return 'Excel file exported successfully!';
    }

    // CSV Export
    exportToCSV(data) {
        const csvContent = [
            ['Username', 'Action', 'Timestamp', 'Date', 'Time'],
            ...data.records.map(record => [
                record.username,
                record.action,
                record.timestamp,
                new Date(record.timestamp).toDateString(),
                new Date(record.timestamp).toLocaleTimeString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-report-${data.type}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        return 'CSV file exported successfully!';
    }

    // Setup Advanced Reporting UI
    setupReportingUI() {
        const reportingHTML = `
            <div id="advanced-reporting" class="reporting-panel" style="display: none;">
                <h3>📊 Advanced Reporting</h3>
                
                <div class="report-filters">
                    <div class="filter-group">
                        <label>Report Type:</label>
                        <select id="report-type">
                            <option value="daily">Daily Report</option>
                            <option value="weekly">Weekly Report</option>
                            <option value="monthly">Monthly Report</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Export Format:</label>
                        <select id="export-format">
                            <option value="html">HTML Preview</option>
                            <option value="pdf">PDF Document</option>
                            <option value="excel">Excel Spreadsheet</option>
                            <option value="csv">CSV File</option>
                        </select>
                    </div>
                    
                    <div class="filter-group" id="date-range-group" style="display: none;">
                        <label>Date Range:</label>
                        <input type="date" id="start-date">
                        <input type="date" id="end-date">
                    </div>
                    
                    <div class="filter-group">
                        <label>Include Charts:</label>
                        <input type="checkbox" id="include-charts" checked>
                    </div>
                    
                    <button id="generate-report" class="btn btn-primary">Generate Report</button>
                </div>
                
                <div id="report-preview" class="report-preview"></div>
            </div>
        `;

        // Add to dashboard
        const dashboard = document.getElementById('user-dashboard');
        if (dashboard) {
            dashboard.insertAdjacentHTML('beforeend', reportingHTML);
            this.setupReportingEvents();
        }
    }

    setupReportingEvents() {
        // Show/hide date range based on report type
        document.getElementById('report-type')?.addEventListener('change', (e) => {
            const dateRangeGroup = document.getElementById('date-range-group');
            if (e.target.value === 'custom') {
                dateRangeGroup.style.display = 'block';
            } else {
                dateRangeGroup.style.display = 'none';
            }
        });

        // Generate report button
        document.getElementById('generate-report')?.addEventListener('click', async () => {
            const type = document.getElementById('report-type').value;
            const format = document.getElementById('export-format').value;
            const includeCharts = document.getElementById('include-charts').checked;
            
            let dateRange = null;
            if (type === 'custom') {
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;
                if (startDate && endDate) {
                    dateRange = { start: startDate, end: endDate };
                }
            }

            try {
                const result = await this.generateAdvancedReport({
                    type,
                    format,
                    dateRange,
                    includeCharts
                });
                
                if (format === 'html') {
                    document.getElementById('report-preview').innerHTML = result;
                } else {
                    this.system.showMessage(result, 'success');
                }
            } catch (error) {
                this.system.showMessage('Report generation failed: ' + error.message, 'error');
            }
        });
    }

    generateHTMLReport(data, includeCharts) {
        return `
            <div class="html-report">
                <div class="report-header">
                    <h2>📊 Attendance Report - ${data.type.toUpperCase()}</h2>
                    <p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
                    <p>Total Records: ${data.totalRecords}</p>
                </div>
                
                <div class="report-metrics">
                    <div class="metric-card">
                        <h4>Total Sign-ins</h4>
                        <span class="metric-value">${data.analytics.totalSignIns}</span>
                    </div>
                    <div class="metric-card">
                        <h4>Total Sign-outs</h4>
                        <span class="metric-value">${data.analytics.totalSignOuts}</span>
                    </div>
                    <div class="metric-card">
                        <h4>Unique Users</h4>
                        <span class="metric-value">${data.analytics.uniqueUsers}</span>
                    </div>
                </div>
                
                ${includeCharts ? this.generateChartHTML(data.analytics) : ''}
                
                <div class="report-table">
                    <h3>Recent Records</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Action</th>
                                <th>Date</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.records.slice(-20).map(record => `
                                <tr>
                                    <td>${record.username}</td>
                                    <td class="action ${record.action}">${record.action}</td>
                                    <td>${new Date(record.timestamp).toDateString()}</td>
                                    <td>${new Date(record.timestamp).toLocaleTimeString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateChartHTML(analytics) {
        return `
            <div class="report-charts">
                <div class="chart-container">
                    <canvas id="hourly-chart" width="400" height="200"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="user-chart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
    }

    initializeCharts() {
        // Chart.js will be loaded via CDN
        // This method will be called after Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.setupCharts();
        }
    }

    setupCharts() {
        // Implementation for Chart.js charts will be added
        console.log('Charts initialized');
    }
}

// Export for use
window.AdvancedReporting = AdvancedReporting;
