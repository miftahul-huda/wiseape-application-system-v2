(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseTableLayout extends WiseControl {
    constructor(options = {}) {
      super('', options);
      this.name = 'WiseTableLayout';
      this.rows = options.rows || 1;
      this.columns = options.columns || 1;
      this.cells = [];
      this.style = options.style || {};
    }

    setCell(row, col, control, cellOptions = {}) {
      this.cells.push({
        row,
        col,
        colSpan: cellOptions.colSpan || 1,
        rowSpan: cellOptions.rowSpan || 1,
        control,
      });
      return this;
    }

    // Lets WiseWindow.addControl register every cell's control as
    // this[control.id], and getValues() walk into them, without either
    // needing to know this is a table.
    getChildControls() {
      return this.cells.map((cell) => cell.control);
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        rows: this.rows,
        columns: this.columns,
        cells: this.cells.map((cell) => ({
          row: cell.row,
          col: cell.col,
          colSpan: cell.colSpan,
          rowSpan: cell.rowSpan,
          control: cell.control.render(),
        })),
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data, context) {
      const table = document.createElement('table');
      table.className = 'w-full border-collapse';
      WiseControl.applyCommon(table, data);

      const cellByPosition = new Map();
      (data.cells || []).forEach((cell) => cellByPosition.set(`${cell.row}:${cell.col}`, cell));

      const occupied = new Set();

      for (let row = 0; row < (data.rows || 0); row += 1) {
        const tr = document.createElement('tr');

        for (let col = 0; col < (data.columns || 0); col += 1) {
          const key = `${row}:${col}`;
          if (occupied.has(key)) continue;

          const cell = cellByPosition.get(key);
          const td = document.createElement('td');
          td.className = 'align-top p-1.5';

          if (cell) {
            if (cell.colSpan > 1) td.colSpan = cell.colSpan;
            if (cell.rowSpan > 1) td.rowSpan = cell.rowSpan;

            for (let dr = 0; dr < cell.rowSpan; dr += 1) {
              for (let dc = 0; dc < cell.colSpan; dc += 1) {
                if (dr === 0 && dc === 0) continue;
                occupied.add(`${row + dr}:${col + dc}`);
              }
            }

            td.appendChild(context.desktop.renderControl(cell.control, context.appId));
          }

          tr.appendChild(td);
        }

        table.appendChild(tr);
      }

      return table;
    }

    // Delegates to each cell control's own patchElement -- required for any
    // container control (see docs/DEVELOPMENT_GUIDE.md §3) since the base
    // WiseControl.patchElement has no idea these nested controls exist.
    static patchElement(winEl, data, context) {
      const registry = window.WiseControlRegistry;
      (data.cells || []).forEach((cell) => {
        const ControlClass = registry[cell.control.type] || registry.WiseControl;
        if (typeof ControlClass.patchElement === 'function') {
          ControlClass.patchElement(winEl, cell.control, context);
        }
      });
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseTableLayout = WiseTableLayout;
  } else {
    module.exports = WiseTableLayout;
  }
})();
