// ============================================
// STD TIME TRACKER — Charts Component (Canvas)
// ============================================

import { getCategoryColor } from '../core/utils.js';

export class DonutChart {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = options.data || [];
    this.size = options.size || 200;
    this.lineWidth = options.lineWidth || 24;
    this.centerText = options.centerText || '';
    this.centerSubText = options.centerSubText || '';
    this.animated = options.animated !== false;

    canvas.width = this.size * 2;
    canvas.height = this.size * 2;
    canvas.style.width = this.size + 'px';
    canvas.style.height = this.size + 'px';
    this.ctx.scale(2, 2);
  }

  draw() {
    const { ctx, size, lineWidth, data } = this;
    const center = size / 2;
    const radius = center - lineWidth / 2 - 4;
    const total = data.reduce((s, d) => s + d.value, 0);

    ctx.clearRect(0, 0, size, size);

    // Background ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if (total === 0) {
      this.drawCenterText(center);
      return;
    }

    // Data segments
    let startAngle = -Math.PI / 2;
    data.forEach((segment, idx) => {
      if (segment.value <= 0) return;
      const sweepAngle = (segment.value / total) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, startAngle + sweepAngle);
      ctx.strokeStyle = segment.color || getCategoryColor(segment.label);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      startAngle += sweepAngle;
    });

    this.drawCenterText(center);
  }

  drawCenterText(center) {
    const { ctx } = this;
    if (this.centerText) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = "700 22px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.centerText, center, center - 8);
    }
    if (this.centerSubText) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.fillText(this.centerSubText, center, center + 14);
    }
  }

  update(data, centerText, centerSubText) {
    this.data = data;
    if (centerText !== undefined) this.centerText = centerText;
    if (centerSubText !== undefined) this.centerSubText = centerSubText;
    this.draw();
  }
}

export class BarChart {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = options.data || [];
    this.width = options.width || 500;
    this.height = options.height || 250;
    this.barColor = options.barColor || '#7c3aed';
    this.showLabels = options.showLabels !== false;
    this.stacked = options.stacked || false;

    canvas.width = this.width * 2;
    canvas.height = this.height * 2;
    canvas.style.width = this.width + 'px';
    canvas.style.height = this.height + 'px';
    this.ctx.scale(2, 2);
  }

  draw() {
    const { ctx, width, height, data } = this;
    if (!data.length) return;

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => {
      if (this.stacked && d.segments) {
        return d.segments.reduce((s, seg) => s + seg.value, 0);
      }
      return d.value || 0;
    }), 1);

    const barWidth = (chartW / data.length) * 0.6;
    const gap = (chartW / data.length) * 0.4;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis label
      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillStyle = '#475569';
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.textAlign = 'right';
      ctx.fillText(val + 'm', padding.left - 8, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = padding.left + (i * (chartW / data.length)) + gap / 2;

      if (this.stacked && d.segments) {
        let yOffset = 0;
        d.segments.forEach(seg => {
          const barH = (seg.value / maxVal) * chartH;
          const y = padding.top + chartH - yOffset - barH;
          
          ctx.fillStyle = seg.color;
          this.roundRect(ctx, x, y, barWidth, barH, 3);
          ctx.fill();
          
          yOffset += barH;
        });
      } else {
        const barH = ((d.value || 0) / maxVal) * chartH;
        const y = padding.top + chartH - barH;
        
        ctx.fillStyle = d.color || this.barColor;
        this.roundRect(ctx, x, y, barWidth, barH, 4);
        ctx.fill();
      }

      // X-axis label
      if (this.showLabels && d.label) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = "500 10px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barWidth / 2, height - padding.bottom + 16);
      }
    });
  }

  roundRect(ctx, x, y, w, h, r) {
    if (h < 1) return;
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  update(data) {
    this.data = data;
    this.draw();
  }
}

export class LineChart {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = options.data || [];
    this.width = options.width || 500;
    this.height = options.height || 250;
    this.lineColor = options.lineColor || '#7c3aed';
    this.fillGradient = options.fillGradient !== false;

    canvas.width = this.width * 2;
    canvas.height = this.height * 2;
    canvas.style.width = this.width + 'px';
    canvas.style.height = this.height + 'px';
    this.ctx.scale(2, 2);
  }

  draw() {
    const { ctx, width, height, data } = this;
    if (!data.length) return;

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value || 0), 1);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Line path
    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1 || 1)) * chartW,
      y: padding.top + chartH - ((d.value || 0) / maxVal) * chartH,
    }));

    // Fill gradient
    if (this.fillGradient && points.length > 1) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, this.lineColor + '30');
      gradient.addColorStop(1, this.lineColor + '00');

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.lineTo(points[0].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Line
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = this.lineColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Dots
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = this.lineColor;
      ctx.fill();
      ctx.strokeStyle = '#0a0a0f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      if (data[i].label) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = "500 10px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(data[i].label, p.x, height - padding.bottom + 16);
      }
    });
  }

  update(data) {
    this.data = data;
    this.draw();
  }
}

export function createChartLegend(items) {
  return `
    <div class="chart-legend">
      ${items.map(item => `
        <div class="chart-legend-item">
          <div class="chart-legend-dot" style="background:${item.color}"></div>
          <span>${item.label}${item.value !== undefined ? ` — ${item.value}` : ''}</span>
        </div>
      `).join('')}
    </div>
  `;
}
