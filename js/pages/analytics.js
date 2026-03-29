// ============================================
// STD TIME TRACKER — Analytics Page
// ============================================

import { state } from '../core/state.js';
import { today, formatDate, daysAgo, formatDuration, getDayName, getCategoryColor } from '../core/utils.js';
import { collector } from '../agents/collector.js';
import { analyzer } from '../agents/analyzer.js';
import { CATEGORIES } from '../data/categories.js';
import { BarChart, LineChart, DonutChart, createChartLegend } from '../components/charts.js';

export function AnalyticsPage() {
  let charts = {};

  function render() {
    const weekAnalysis = analyzer.analyzeWeek();
    const heatmapData = analyzer.getProductivityHeatmap(28);
    const sleepCorr = analyzer.correlateSleepProductivity(14);
    const todayAnalysis = analyzer.analyzeDay(today());

    return `
      <div class="page-container stagger-children">
        <div class="page-header flex justify-between items-center">
          <div>
            <h1>Analytics</h1>
            <p>Data-driven insights into your time patterns and behavioral trends.</p>
          </div>
          <div class="tabs" id="analytics-tabs">
            <button class="tab-item active" data-tab="week">This Week</button>
            <button class="tab-item" data-tab="month">Monthly</button>
          </div>
        </div>

        <!-- Week Summary Stats -->
        <div class="dashboard-hero mb-8">
          <div class="stat-card">
            <div class="stat-label">Avg. Productive / Day</div>
            <div class="stat-value text-success">${formatDuration(weekAnalysis.avgProductive)}</div>
            <div class="stat-change ${weekAnalysis.productivityTrend > 0 ? 'positive' : 'negative'}">
              ${weekAnalysis.productivityTrend > 0 ? '↑' : '↓'} ${Math.abs(Math.round(weekAnalysis.productivityTrend))}% vs last week
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg. Wasted / Day</div>
            <div class="stat-value text-danger">${formatDuration(weekAnalysis.avgWasted)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Best Day</div>
            <div class="stat-value">${weekAnalysis.bestDay ? formatDate(weekAnalysis.bestDay) : 'N/A'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Productive</div>
            <div class="stat-value">${formatDuration(weekAnalysis.totalProductive)}</div>
          </div>
        </div>

        <!-- Charts Row 1 -->
        <div class="dashboard-grid-full mb-8">
          <!-- Category Breakdown Bar Chart -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">📊 DAILY CATEGORY BREAKDOWN</h3>
            <div class="chart-container" style="height:260px;">
              <canvas id="chart-category-bar"></canvas>
            </div>
            ${createChartLegend(CATEGORIES.map(c => ({
              label: c.name,
              color: c.color,
            })))}
          </div>

          <!-- Productivity Trend Line Chart -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">📈 PRODUCTIVITY TREND (7 DAYS)</h3>
            <div class="chart-container" style="height:260px;">
              <canvas id="chart-productivity-line"></canvas>
            </div>
          </div>
        </div>

        <!-- Charts Row 2 -->  
        <div class="dashboard-grid-full mb-8">
          <!-- Productivity Heatmap -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🗓️ 28-DAY PRODUCTIVITY HEATMAP</h3>
            <div class="heatmap-grid" id="productivity-heatmap" style="max-width: 400px;">
              ${heatmapData.map(d => `
                <div class="heatmap-cell level-${d.level} tooltip" 
                     data-tooltip="${formatDate(d.date)}: ${formatDuration(d.productive)} productive"
                     style="min-width:16px;"></div>
              `).join('')}
            </div>
            <div class="flex items-center gap-2 mt-4">
              <span class="text-xs text-muted">Less</span>
              ${[0, 1, 2, 3, 4].map(l => `<div class="heatmap-cell level-${l}" style="width:16px; height:16px; display:inline-block;"></div>`).join('')}
              <span class="text-xs text-muted">More</span>
            </div>
          </div>

          <!-- Time Slot Analysis -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🕐 TIME SLOT ANALYSIS</h3>
            ${renderTimeSlotAnalysis(todayAnalysis)}
          </div>
        </div>

        <!-- Correlation Charts -->
        <div class="dashboard-grid-full mb-8">
          <!-- Sleep vs Productivity -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">😴 SLEEP vs PRODUCTIVITY</h3>
            ${sleepCorr.length > 2 ? `
              <div class="chart-container" style="height:250px;">
                <canvas id="chart-sleep-prod"></canvas>
              </div>
            ` : `
              <div class="text-center text-muted p-8">
                <p>Need 3+ days of data to show correlations.</p>
              </div>
            `}
          </div>

          <!-- Category Donut -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🍩 WEEKLY CATEGORY SPLIT</h3>
            <div class="flex items-center gap-6">
              <canvas id="chart-week-donut" style="max-width:160px;"></canvas>
              <div class="flex-col gap-2" style="flex:1;">
                ${CATEGORIES.filter(c => (weekAnalysis.weeklyTotals[c.name] || 0) > 0).map(c => `
                  <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2">
                      <div class="category-dot" style="background:${c.color}"></div>
                      <span>${c.icon} ${c.name}</span>
                    </div>
                    <span class="font-mono text-xs text-muted">${formatDuration(weekAnalysis.weeklyTotals[c.name])}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTimeSlotAnalysis(analysis) {
    const slots = analysis.patterns?.timeSlots;
    if (!slots) return '<p class="text-muted p-4">Log activities to see time slot analysis.</p>';

    return `
      <div class="flex-col gap-4">
        ${Object.entries(slots).map(([name, data]) => {
          const total = data.total || 1;
          const prodPercent = Math.round((data.productive / total) * 100) || 0;
          const wastePercent = Math.round((data.wasted / total) * 100) || 0;
          const isWeakest = name === analysis.patterns.weakestTimeSlot;

          return `
            <div class="p-4" style="background: var(--glass-bg); border-radius: var(--radius-md); ${isWeakest ? 'border: 1px solid rgba(239,68,68,0.3);' : 'border: 1px solid var(--glass-border);'}">
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-sm">${name} ${isWeakest ? '⚠️' : ''}</span>
                <span class="text-xs text-muted">${formatDuration(data.total)} total</span>
              </div>
              <div class="flex gap-1" style="height:8px; border-radius:4px; overflow:hidden;">
                <div style="width:${prodPercent}%; background:var(--color-success); border-radius:4px;"></div>
                <div style="width:${100 - prodPercent - wastePercent}%; background:var(--bg-elevated); border-radius:4px;"></div>
                <div style="width:${wastePercent}%; background:var(--color-danger); border-radius:4px;"></div>
              </div>
              <div class="flex justify-between mt-2 text-xs text-muted">
                <span class="text-success">${prodPercent}% productive</span>
                <span class="text-danger">${wastePercent}% wasted</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function mount() {
    const weekAnalysis = analyzer.analyzeWeek();
    
    // Category Bar Chart
    const barCanvas = document.getElementById('chart-category-bar');
    if (barCanvas) {
      const barData = weekAnalysis.dates.map(date => {
        const summary = collector.getDailySummary(date);
        return {
          label: getDayName(date),
          segments: CATEGORIES.map(c => ({
            value: summary.categories[c.name]?.minutes || 0,
            color: c.color,
          })),
        };
      });

      const rect = barCanvas.parentElement.getBoundingClientRect();
      charts.bar = new BarChart(barCanvas, {
        data: barData,
        width: Math.min(rect.width - 20, 500),
        height: 240,
        stacked: true,
      });
      charts.bar.draw();
    }

    // Productivity Line Chart
    const lineCanvas = document.getElementById('chart-productivity-line');
    if (lineCanvas) {
      const lineData = weekAnalysis.dates.map(date => {
        const summary = collector.getDailySummary(date);
        return {
          label: getDayName(date),
          value: summary.productiveMinutes,
        };
      });

      const rect = lineCanvas.parentElement.getBoundingClientRect();
      charts.line = new LineChart(lineCanvas, {
        data: lineData,
        width: Math.min(rect.width - 20, 500),
        height: 240,
        lineColor: '#10b981',
      });
      charts.line.draw();
    }

    // Weekly Donut
    const donutCanvas = document.getElementById('chart-week-donut');
    if (donutCanvas) {
      const donutData = CATEGORIES
        .filter(c => (weekAnalysis.weeklyTotals[c.name] || 0) > 0)
        .map(c => ({
          label: c.name,
          value: weekAnalysis.weeklyTotals[c.name],
          color: c.color,
        }));

      charts.donut = new DonutChart(donutCanvas, {
        data: donutData,
        size: 160,
        lineWidth: 18,
        centerText: formatDuration(weekAnalysis.totalProductive + weekAnalysis.totalWasted),
        centerSubText: 'This Week',
      });
      charts.donut.draw();
    }

    // Sleep-Productivity chart
    const sleepCanvas = document.getElementById('chart-sleep-prod');
    if (sleepCanvas) {
      const sleepCorr = analyzer.correlateSleepProductivity(14);
      const lineData = sleepCorr.reverse().map(d => ({
        label: getDayName(d.date),
        value: d.deepWork,
      }));

      const rect = sleepCanvas.parentElement.getBoundingClientRect();
      charts.sleep = new LineChart(sleepCanvas, {
        data: lineData,
        width: Math.min(rect.width - 20, 500),
        height: 230,
        lineColor: '#7c3aed',
      });
      charts.sleep.draw();
    }
  }

  function destroy() {
    charts = {};
  }

  return { render, mount, destroy };
}
