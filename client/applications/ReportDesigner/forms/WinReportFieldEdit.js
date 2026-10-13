import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseComboBox,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

// Tiny dialog to add/edit one dimension or measure of a report.
//   options.kind      : 'dimension' | 'measure'
//   options.columns   : [{name,...}] columns available from the source
//   options.data      : existing field ({column, aggregate?, alias}) when editing
//   options.onSaved   : (field) => void, called with the validated field
const AGGREGATES = ['sum', 'avg', 'count', 'min', 'max', 'count_distinct'];
const AGGREGATE_KEYS = {
  sum: 'RD_AGG_SUM', avg: 'RD_AGG_AVG', count: 'RD_AGG_COUNT',
  min: 'RD_AGG_MIN', max: 'RD_AGG_MAX', count_distinct: 'RD_AGG_COUNT_DISTINCT'
};

class WinReportFieldEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.kind = options.kind === 'measure' ? 'measure' : 'dimension';
    this.availableColumns = options.columns || [];
    this.record = options.data || null;
    this.onSavedCallback = options.onSaved || null;
    this.title = this.kind === 'measure' ? WiseI18n.t('RD_FIELD_MEASURE_TITLE') : WiseI18n.t('RD_FIELD_DIMENSION_TITLE');
    this.width = options.width || 460;
    this.height = options.height || 'auto';
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];
    const isMeasure = this.kind === 'measure';

    const form = new WiseTableLayout({ rows: 3, columns: 1, id: 'tblFieldForm', style: { width: '100%', marginBottom: '16px' } });

    const colItems = this.availableColumns.map((c) => ({ value: c.name, label: c.name }));
    // Keep a stored column selectable even if it is no longer in the loaded list.
    if (this.record && this.record.column && !colItems.some((i) => i.value === this.record.column)) {
      colItems.unshift({ value: this.record.column, label: this.record.column });
    }
    const cmbColumn = new WiseComboBox(
      [{ value: '', label: WiseI18n.t('RD_SELECT_PLACEHOLDER') }, ...colItems],
      { id: 'cmbFieldColumn', label: WiseI18n.t('RD_LBL_COLUMN'), datafield: 'column', value: (this.record && this.record.column) || '', style: { width: '100%' } }
    );
    form.setCell(0, 0, cmbColumn);

    let row = 1;
    if (isMeasure) {
      const cmbAgg = new WiseComboBox(
        AGGREGATES.map((a) => ({ value: a, label: WiseI18n.t(AGGREGATE_KEYS[a]) })),
        { id: 'cmbFieldAggregate', label: WiseI18n.t('RD_LBL_AGGREGATE'), datafield: 'aggregate', value: (this.record && this.record.aggregate) || 'sum', style: { width: '100%' } }
      );
      form.setCell(row++, 0, cmbAgg);
    }
    form.setCell(row, 0, new WiseTextBox('', {
      id: 'txtFieldAlias', label: WiseI18n.t('RD_LBL_ALIAS'), datafield: 'alias',
      value: (this.record && this.record.alias) || '', style: { width: '100%' }
    }));
    this.addControl(form);

    const actions = new WiseFrame('', {
      id: 'frameFieldActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }
    });
    actions.addControl(new WiseButton(WiseI18n.t('SIMPAN'), { id: 'btnFieldSave', onClick: this.onSaveClick.bind(this) }));
    actions.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnFieldCancel', onClick: () => this.close(),
      style: { background: '#e2e8f0', color: '#334155' }
    }));
    this.addControl(actions);
    return this;
  }

  async onSaveClick() {
    const v = this.getValues();
    const column = (v.column || '').trim();
    if (!column) {
      return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('RD_MSG_COLUMN_REQUIRED'), 'warning');
    }
    const field = { column, alias: (v.alias || '').trim() };
    if (this.kind === 'measure') field.aggregate = v.aggregate || 'sum';
    if (this.onSavedCallback) await this.onSavedCallback(field);
    this.close();
  }
}

export { AGGREGATE_KEYS };
export default WinReportFieldEdit;
