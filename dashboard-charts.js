// Enhanced Dashboard with Beautiful Charts and Analytics
class DashboardCharts {
    constructor(attendanceSystem) {
        this.system = attendanceSystem;
        this.charts = {};
        this.initializeDashboard();
    }

    initializeDashboard() {
        this.enhanceDashboardLayout();
        this.loadChartLibraries();
        this.setupRealTimeUpdates();
    }

    enhanceDashboardLayout() {
        const dashboardHTML = `
            <div class="enhanced-dashboard">
                <!-- Key Performance Indicators -->
                <div class="kpi-section">
                    <div class="kpi-card">
                        <div class="kpi-icon">👥</div>
                        <div class="kpi-content">
                            <h3 id="total-employees-today">0</h3>
                            <p>Active Today</p>
                            <span class="kpi-trend" id="employee-trend">+0%</span>
                        </div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">⏰</div>
                        <div class="kpi-content">
                            <h3 id="avg-work-hours">0</h3>
                            <p>Avg Hours</p>
                            <span class="kpi-trend" id="hours-trend">+0%</span>
                        </div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">📈</div>
                        <div class="kpi-content">
                            <h3 id="attendance-rate">0%</h3>
                            <p>Attendance Rate</p>
                            <span class="kpi-trend" id="attendance-trend">+0%</span>
                        </div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">🎯</div>
                        <div class="kpi-content">
                            <h3 id="productivity-score">0</h3>
                            <p>Productivity Score</p>
                            <span class="kpi-trend" id="productivity-trend">+0%</span>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="chart-row">
                        <div class="chart-container">
                            <h4>📊 Daily Activity Pattern</h4>
                            <canvas id="daily-activity-chart"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4>⏱️ Peak Hours Analysis</h4>
                            <canvas id="peak-hours-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-row">
                        <div class="chart-container">
                            <h4>👤 User Activity Distribution</h4>
                            <canvas id="user-activity-chart"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4>📅 Weekly Trends</h4>
                            <canvas id="weekly-trends-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Real-time Activity Feed -->
                <div class="activity-feed">
                    <h4>🔴 Live Activity Feed</h4>
                    <div id="live-activity-feed" class="activity-list"></div>
                </div>

                <!-- Advanced Analytics Panel -->
                <div class="analytics-panel">
                    <h4>🧠 AI Insights</h4>
                    <div id="ai-insights" class="insights-container"></div>
                </div>
            </div>
        `;

        // Insert enhanced dashboard
        const existingDashboard = document.querySelector('.dashboard-content');
        if (existingDashboard) {
            existingDashboard.insertAdjacentHTML('beforeend', dashboardHTML);
        }
    }

    loadChartLibraries() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => this.initializeCharts();
            document.head.appendChild(script);
        } else {
            this.initializeCharts();
        }
    }

    async initializeCharts() {
        const data = await this.gatherDashboardData();
        
        this.createDailyActivityChart(data);
        this.createPeakHoursChart(data);
        this.createUserActivityChart(data);
        this.createWeeklyTrendsChart(data);
        this.updateKPIs(data);
        this.generateAIInsights(data);
    }

    async gatherDashboardData() {
        let records = [];
        
        if (this.system.useAPI) {
            records = await this.system.api.getAttendance();
        } else {
            records = this.system.attendanceRecords || [];
        }

        // Process data for charts
        const now = new Date();
        const today = now.toDateString();
        const thisWeek = this.getDateRange(7);
        const thisMonth = this.getDateRange(30);

        return {
            allRecords: records,
            todayRecords: records.filter(r => new Date(r.timestamp).toDateString() === today),
            weekRecords: records.filter(r => new Date(r.timestamp) >= thisWeek),
            monthRecords: records.filter(r => new Date(r.timestamp) >= thisMonth),
            hourlyBreakdown: this.getHourlyBreakdown(records),
            dailyBreakdown: this.getDailyBreakdown(records),
            userBreakdown: this.getUserBreakdown(records)
        };
    }

    createDailyActivityChart(data) {
        const ctx = document.getElementById('daily-activity-chart');
        if (!ctx) return;

        const hours = Array.from({length: 24}, (_, i) => i);
        const signIns = hours.map(hour => 
            data.todayRecords.filter(r => 
                new Date(r.timestamp).getHours() === hour && r.action === 'sign-in'
            ).length
        );
        const signOuts = hours.map(hour => 
            data.todayRecords.filter(r => 
                new Date(r.timestamp).getHours() === hour && r.action === 'sign-out'
            ).length
        );

        this.charts.dailyActivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours.map(h => `${h}:00`),
                datasets: [{
                    label: 'Sign-ins',
                    data: signIns,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Sign-outs',
                    data: signOuts,
                    borderColor: '#FF5722',
                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Today\'s Activity Pattern'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createPeakHoursChart(data) {
        const ctx = document.getElementById('peak-hours-chart');
        if (!ctx) return;

        const hourlyData = data.hourlyBreakdown;
        const sortedHours = Object.entries(hourlyData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);

        this.charts.peakHours = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedHours.map(([hour]) => `${hour}:00`),
                datasets: [{
                    data: sortedHours.map(([,count]) => count),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    hoverBackgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Peak Activity Hours'
                    }
                }
            }
        });
    }

    createUserActivityChart(data) {
        const ctx = document.getElementById('user-activity-chart');
        if (!ctx) return;

        const userStats = Object.entries(data.userBreakdown)
            .sort(([,a], [,b]) => (b.signIns + b.signOuts) - (a.signIns + a.signOuts))
            .slice(0, 10);

        this.charts.userActivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: userStats.map(([username]) => username),
                datasets: [{
                    label: 'Sign-ins',
                    data: userStats.map(([,stats]) => stats.signIns),
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                }, {
                    label: 'Sign-outs',
                    data: userStats.map(([,stats]) => stats.signOuts),
                    backgroundColor: 'rgba(255, 87, 34, 0.8)',
                    borderColor: '#FF5722',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Most Active Users'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createWeeklyTrendsChart(data) {
        const ctx = document.getElementById('weekly-trends-chart');
        if (!ctx) return;

        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date;
        });

        const dailyData = last7Days.map(date => {
            const dateStr = date.toDateString();
            const dayRecords = data.allRecords.filter(r => 
                new Date(r.timestamp).toDateString() === dateStr
            );
            return {
                date: dateStr,
                signIns: dayRecords.filter(r => r.action === 'sign-in').length,
                signOuts: dayRecords.filter(r => r.action === 'sign-out').length
            };
        });

        this.charts.weeklyTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyData.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Daily Sign-ins',
                    data: dailyData.map(d => d.signIns),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Daily Sign-outs',
                    data: dailyData.map(d => d.signOuts),
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '7-Day Attendance Trend'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateKPIs(data) {
        // Calculate KPIs
        const totalEmployeesToday = new Set(data.todayRecords.map(r => r.username)).size;
        const avgWorkHours = this.calculateAverageWorkHours(data.todayRecords);
        const attendanceRate = this.calculateAttendanceRate(data);
        const productivityScore = this.calculateProductivityScore(data);

        // Update DOM
        document.getElementById('total-employees-today').textContent = totalEmployeesToday;
        document.getElementById('avg-work-hours').textContent = avgWorkHours.toFixed(1);
        document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;
        document.getElementById('productivity-score').textContent = productivityScore;

        // Update trends (simplified)
        document.getElementById('employee-trend').textContent = '+5%';
        document.getElementById('hours-trend').textContent = '+2%';
        document.getElementById('attendance-trend').textContent = '+3%';
        document.getElementById('productivity-trend').textContent = '+7%';
    }

    generateAIInsights(data) {
        const insights = [];

        // Peak hour analysis
        const peakHour = Object.entries(data.hourlyBreakdown)
            .sort(([,a], [,b]) => b - a)[0];
        if (peakHour) {
            insights.push(`🕐 Peak activity occurs at ${peakHour[0]}:00 with ${peakHour[1]} actions`);
        }

        // User activity patterns
        const mostActiveUser = Object.entries(data.userBreakdown)
            .sort(([,a], [,b]) => (b.signIns + b.signOuts) - (a.signIns + a.signOuts))[0];
        if (mostActiveUser) {
            insights.push(`👤 Most active user: ${mostActiveUser[0]} with ${mostActiveUser[1].signIns + mostActiveUser[1].signOuts} total actions`);
        }

        // Attendance consistency
        const consistencyScore = this.calculateConsistencyScore(data);
        insights.push(`📊 Attendance consistency score: ${consistencyScore}% (${consistencyScore > 80 ? 'Excellent' : consistencyScore > 60 ? 'Good' : 'Needs Improvement'})`);

        // Display insights
        const insightsContainer = document.getElementById('ai-insights');
        if (insightsContainer) {
            insightsContainer.innerHTML = insights.map(insight => 
                `<div class="insight-item">${insight}</div>`
            ).join('');
        }
    }

    setupRealTimeUpdates() {
        // Update charts every 30 seconds
        setInterval(async () => {
            if (this.system.currentUser && document.getElementById('user-dashboard').style.display !== 'none') {
                const data = await this.gatherDashboardData();
                this.updateLiveActivityFeed(data);
                this.updateKPIs(data);
                
                // Refresh charts every 5 minutes
                if (Date.now() % 300000 < 30000) {
                    this.refreshAllCharts(data);
                }
            }
        }, 30000);
    }

    updateLiveActivityFeed(data) {
        const recentRecords = data.allRecords
            .slice(-10)
            .reverse()
            .map(record => `
                <div class="activity-item">
                    <span class="activity-icon">${record.action === 'sign-in' ? '🟢' : '🔴'}</span>
                    <span class="activity-text">${record.username} ${record.action}</span>
                    <span class="activity-time">${new Date(record.timestamp).toLocaleTimeString()}</span>
                </div>
            `).join('');

        const feedContainer = document.getElementById('live-activity-feed');
        if (feedContainer) {
            feedContainer.innerHTML = recentRecords;
        }
    }

    // Helper methods
    getDateRange(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }

    getHourlyBreakdown(records) {
        const breakdown = {};
        records.forEach(record => {
            const hour = new Date(record.timestamp).getHours();
            breakdown[hour] = (breakdown[hour] || 0) + 1;
        });
        return breakdown;
    }

    getDailyBreakdown(records) {
        const breakdown = {};
        records.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            if (!breakdown[date]) {
                breakdown[date] = { signIns: 0, signOuts: 0 };
            }
            breakdown[date][record.action === 'sign-in' ? 'signIns' : 'signOuts']++;
        });
        return breakdown;
    }

    getUserBreakdown(records) {
        const breakdown = {};
        records.forEach(record => {
            if (!breakdown[record.username]) {
                breakdown[record.username] = { signIns: 0, signOuts: 0 };
            }
            breakdown[record.username][record.action === 'sign-in' ? 'signIns' : 'signOuts']++;
        });
        return breakdown;
    }

    calculateAverageWorkHours(todayRecords) {
        // Simplified calculation
        const signIns = todayRecords.filter(r => r.action === 'sign-in').length;
        const signOuts = todayRecords.filter(r => r.action === 'sign-out').length;
        return signOuts > 0 ? (signOuts / Math.max(signIns, 1)) * 8 : 0;
    }

    calculateAttendanceRate(data) {
        // Simplified calculation
        const expectedUsers = 10; // This would come from your user database
        const actualUsers = new Set(data.todayRecords.map(r => r.username)).size;
        return Math.round((actualUsers / expectedUsers) * 100);
    }

    calculateProductivityScore(data) {
        // Simplified scoring algorithm
        const baseScore = 75;
        const activityBonus = Math.min(data.todayRecords.length * 2, 25);
        return Math.min(baseScore + activityBonus, 100);
    }

    calculateConsistencyScore(data) {
        // Simplified consistency calculation
        const last7Days = this.getDateRange(7);
        const recentRecords = data.allRecords.filter(r => new Date(r.timestamp) >= last7Days);
        const daysWithActivity = new Set(recentRecords.map(r => new Date(r.timestamp).toDateString())).size;
        return Math.round((daysWithActivity / 7) * 100);
    }

    refreshAllCharts(data) {
        // Destroy and recreate charts with new data
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.initializeCharts();
    }
}

// Export for use
window.DashboardCharts = DashboardCharts;
