/* ═══════════════════════════════════════════════════════════════
   charts.js - Gráficos con Canvas API
   ═══════════════════════════════════════════════════════════════ */

const Charts = {
  _getColors(isDark) {
    return {
      primary: '#6366f1',
      primaryLight: '#a5b4fc',
      success: '#22c55e',
      successLight: '#86efac',
      danger: '#ef4444',
      dangerLight: '#fca5a5',
      warning: '#f59e0b',
      info: '#3b82f6',
      text: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? '#1e293b' : '#e2e8f0',
      cardBg: isDark ? '#0f172a' : '#ffffff',
    };
  },

  _setupCanvas(canvas, width, height) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  },

  // ─── Bar Chart ───
  drawBarChart(canvas, data, { labelKey, valueKey, colors, title } = {}) {
    if (!canvas || !data || data.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');
    const c = this._getColors(isDark);
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const width = rect.width || 400;
    const height = parent.clientHeight || rect.height || 300;
    const ctx = this._setupCanvas(canvas, width, height);

    const pad = { top: 40, bottom: 50, left: 60, right: 20 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Title
    if (title) {
      ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
      ctx.font = '600 15px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, pad.left, 22);
    }

    const values = data.map(d => d[valueKey] || 0);
    const maxVal = Math.max(...values, 1);
    const barWidth = Math.min(chartW / data.length * 0.6, 50);
    const gap = chartW / data.length;

    // Grid lines
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();

      const val = maxVal - (maxVal / 4) * i;
      ctx.fillStyle = c.text;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(this._formatCurrency(val), pad.left - 8, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = pad.left + gap * i + (gap - barWidth) / 2;
      const val = d[valueKey] || 0;
      const barH = (val / maxVal) * chartH;
      const y = pad.top + chartH - barH;

      const color = colors && colors[i] ? colors[i] : c.primary;
      const gradient = ctx.createLinearGradient(x, y, x, pad.top + chartH);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '60');
      ctx.fillStyle = gradient;

      // Rounded top
      const radius = Math.min(6, barWidth / 2);
      this._roundRect(ctx, x, y, barWidth, barH, radius);
      ctx.fill();

      // Label
      ctx.fillStyle = c.text;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = d[labelKey] || '';
      ctx.fillText(label.length > 8 ? label.substring(0, 6) + '..' : label, x + barWidth / 2, pad.top + chartH + 18);

      // Value on top
      if (val > maxVal * 0.05) {
        ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillText(this._formatCurrencyShort(val), x + barWidth / 2, y - 6);
      }
    });
  },

  // ─── Pie / Donut Chart ───
  drawDonutChart(canvas, data, { labelKey, valueKey, colors: pieColors, title, showLegend } = {}) {
    if (!canvas || !data || data.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');
    const c = this._getColors(isDark);
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const width = rect.width || 400;
    const height = parent.clientHeight || rect.height || 300;
    const ctx = this._setupCanvas(canvas, width, height);

    ctx.clearRect(0, 0, width, height);

    if (title) {
      ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
      ctx.font = '600 15px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 20, 22);
    }

    const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);
    if (total === 0) {
      ctx.fillStyle = c.text;
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sin datos', width / 2, height / 2);
      return;
    }

    // Si no hay leyenda, centramos más el donut
    const legendOffset = showLegend ? 60 : 0;
    const cx = width / 2 - legendOffset;
    const cy = height / 2 + 10;
    const outerR = Math.min(cx - 20, cy - 30, 90);
    const innerR = outerR * 0.55;

    const defaultColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

    let startAngle = -Math.PI / 2;
    data.forEach((d, i) => {
      const val = d[valueKey] || 0;
      const sliceAngle = (val / total) * Math.PI * 2;
      const color = (pieColors && pieColors[i]) || defaultColors[i % defaultColors.length];

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(startAngle) * innerR,
        cy + Math.sin(startAngle) * innerR
      );
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
      ctx.lineTo(
        cx + Math.cos(startAngle + sliceAngle) * innerR,
        cy + Math.sin(startAngle + sliceAngle) * innerR
      );
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      // Label line and text for larger slices
      if (val / total > 0.05) {
        const midAngle = startAngle + sliceAngle / 2;
        const labelR = outerR + 20;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(midAngle) * outerR,
          cy + Math.sin(midAngle) * outerR
        );
        ctx.lineTo(lx, ly);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = lx > cx ? 'left' : 'right';
        ctx.fillText(d[labelKey] || '', lx + (lx > cx ? 4 : -4), ly - 4);
        ctx.fillStyle = c.text;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(Math.round((val / total) * 100) + '%', lx + (lx > cx ? 4 : -4), ly + 12);
      }

      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
    ctx.font = '700 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 8);
    ctx.fillStyle = c.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Total', cx, cy + 14);
    ctx.textBaseline = 'alphabetic';

    // Legend (right side) - solo si se solicita
    if (showLegend) {
      const legendX = width - 120;
      const legendY = 50;
      data.slice(0, 6).forEach((d, i) => {
        const y = legendY + i * 28;
        const color = (pieColors && pieColors[i]) || defaultColors[i % defaultColors.length];

        ctx.fillStyle = color;
        ctx.fillRect(legendX, y, 12, 12);
        ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(d[labelKey] || '', legendX + 20, y + 10);
      });
    }
  },

  // ─── Helper: Round Rect ───
  _roundRect(ctx, x, y, w, h, r) {
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
  },

  // ─── Format helpers ───
  _formatCurrency(val) {
    const prefix = val < 0 ? '-' : '';
    val = Math.abs(val);
    if (val >= 1000000) return prefix + (val / 1000000).toFixed(1) + 'M €';
    if (val >= 1000) return prefix + (val / 1000).toFixed(1) + 'K €';
    return prefix + val.toFixed(0) + ' €';
  },

  _formatCurrencyShort(val) {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    if (val >= 100) return val.toFixed(0);
    return val.toFixed(0);
  },

  // ─── Resize observer for charts ───
  _observers: new Map(),

  observe(canvas, drawFn) {
    const observer = new ResizeObserver(() => {
      if (canvas.isConnected) drawFn();
    });
    observer.observe(canvas.parentElement);
    this._observers.set(canvas, observer);
  },

  disconnect(canvas) {
    const observer = this._observers.get(canvas);
    if (observer) {
      observer.disconnect();
      this._observers.delete(canvas);
    }
  },
};
