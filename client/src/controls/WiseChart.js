// WiseChart: renders a bar/line/pie/... chart (Chart.js) or a plain table from
// {type, labels, datasets}. Unlike the classic-script controls in
// system/controls/, this one is an ES module (Chart.js is bundled by Vite) and
// registers itself on window.WiseControlRegistry when imported -- see
// src/runtime/wise.js, which every browser-run application already imports.
import Chart from 'chart.js/auto';

const WiseControl = window.WiseControlRegistry.WiseControl;

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#ec4899', '#84cc16', '#f97316', '#64748b', '#14b8a6', '#a855f7',
];
const SLICE_TYPES = new Set(['pie', 'doughnut', 'polarArea']);

const t = (key) => (window.WiseI18n ? window.WiseI18n.t(key) : key);

class WiseChart extends WiseControl {
  // options: { id, chartType, labels, datasets, title, height, style }
  //   chartType: bar | horizontalBar | line | area | pie | doughnut | radar | polarArea | table
  //   datasets:  [{ label, data: [numbers] }]
  constructor(options = {}) {
    super('', options);
    this.name = 'WiseChart';
    this.chartType = options.chartType || 'bar';
    this.labels = options.labels || [];
    this.datasets = options.datasets || [];
    this.title = options.title || '';
    this.loading = false;
    this.height = options.height || 320;
    this.style = options.style || {};
  }

  // Accepts the `chart` object returned by the Report Designer API.
  setData(chart = {}) {
    this.chartType = chart.type || this.chartType;
    this.labels = chart.labels || [];
    this.datasets = chart.datasets || [];
    if (chart.title !== undefined) this.title = chart.title;
    return this;
  }

  // Shows a spinner instead of the chart while data is being fetched. Needs
  // `await window.refresh()` afterwards to appear before slow async work.
  setLoading(loading) {
    this.loading = !!loading;
    return this;
  }

  clear() {
    this.labels = [];
    this.datasets = [];
    return this;
  }

  render() {
    return {
      type: this.name,
      id: this.id,
      label: this.label,
      labelStyle: this.labelStyle,
      chartType: this.chartType,
      labels: this.labels,
      datasets: this.datasets,
      title: this.title,
      loading: this.loading,
      height: this.height,
      style: this.style,
      visible: this.visible,
      disabled: this.disabled,
    };
  }

  static buildConfig(data) {
    const chartType = data.chartType || 'bar';
    const isSlice = SLICE_TYPES.has(chartType);
    const type = chartType === 'horizontalBar' ? 'bar' : chartType === 'area' ? 'line' : chartType;

    const datasets = (data.datasets || []).map((ds, index) => {
      const color = PALETTE[index % PALETTE.length];
      const base = { label: ds.label, data: ds.data };
      if (isSlice) {
        return { ...base, backgroundColor: (data.labels || []).map((_, i) => PALETTE[i % PALETTE.length]) };
      }
      if (type === 'line') {
        return { ...base, borderColor: color, backgroundColor: `${color}${chartType === 'area' ? '33' : ''}`, fill: chartType === 'area', tension: 0.25 };
      }
      if (type === 'radar') {
        return { ...base, borderColor: color, backgroundColor: `${color}33` };
      }
      return { ...base, backgroundColor: color };
    });

    return {
      type,
      data: { labels: data.labels || [], datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
        plugins: {
          title: { display: !!data.title, text: data.title || '' },
          legend: { display: isSlice || datasets.length > 1 },
        },
      },
    };
  }

  static drawTable(wrapper, data) {
    const table = document.createElement('table');
    table.className = 'w-full border-collapse text-sm';
    const head = document.createElement('tr');
    ['', ...(data.datasets || []).map((ds) => ds.label)].forEach((text, index) => {
      const th = document.createElement('th');
      th.className = 'border-b border-slate-300 px-3 py-2 text-left font-bold';
      th.textContent = index === 0 ? '' : text;
      head.appendChild(th);
    });
    table.appendChild(head);
    (data.labels || []).forEach((label, rowIndex) => {
      const tr = document.createElement('tr');
      const first = document.createElement('td');
      first.className = 'border-b border-slate-200 px-3 py-2 whitespace-nowrap';
      first.textContent = label;
      tr.appendChild(first);
      (data.datasets || []).forEach((ds) => {
        const td = document.createElement('td');
        td.className = 'border-b border-slate-200 px-3 py-2 whitespace-nowrap';
        td.textContent = ds.data[rowIndex] ?? '';
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    const scroll = document.createElement('div');
    scroll.className = 'overflow-auto';
    scroll.style.maxHeight = '100%';
    scroll.appendChild(table);
    wrapper.appendChild(scroll);
  }

  // (Re)builds the chart inside `wrapper`; also used by patchElement.
  static draw(wrapper, data) {
    if (wrapper._wiseChart) {
      wrapper._wiseChart.destroy();
      wrapper._wiseChart = null;
    }
    wrapper.innerHTML = '';

    if (data.loading) {
      const box = document.createElement('div');
      box.className = 'wise-chart-loading';
      box.innerHTML = '<span class="wise-spinner" aria-hidden="true"></span>';
      const text = document.createElement('span');
      text.textContent = t('RD_MSG_LOADING');
      box.appendChild(text);
      wrapper.appendChild(box);
      return;
    }

    if (!data.labels || data.labels.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'flex h-full items-center justify-center text-sm text-slate-400';
      empty.textContent = t('TIDAK_ADA_DATA');
      wrapper.appendChild(empty);
      return;
    }
    if (data.chartType === 'table') {
      WiseChart.drawTable(wrapper, data);
      return;
    }

    const canvas = document.createElement('canvas');
    wrapper.appendChild(canvas);
    wrapper._wiseChart = new Chart(canvas, WiseChart.buildConfig(data));
  }

  static renderElement(data, context) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wise-chart relative w-full';
    wrapper.style.height = typeof data.height === 'number' ? `${data.height}px` : (data.height || '320px');
    WiseControl.applyCommon(wrapper, data, context);
    WiseChart.draw(wrapper, data);
    return wrapper;
  }

  static patchElement(winEl, data) {
    const wrapper = winEl.querySelector(`[data-control-id="${data.id}"]`);
    if (!wrapper) return;
    wrapper.style.height = typeof data.height === 'number' ? `${data.height}px` : (data.height || '320px');
    WiseChart.draw(wrapper, data);
  }

  static gatherValue() {
    return undefined;
  }
}

window.WiseControlRegistry.WiseChart = WiseChart;

export default WiseChart;
