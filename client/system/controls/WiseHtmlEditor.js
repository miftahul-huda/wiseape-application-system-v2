(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseHtmlEditor extends WiseControl {
    constructor(value = '', options = {}) {
      super(value, options);
      this.name = 'WiseHtmlEditor';
      this.onChange = typeof options.onChange === 'function' ? options.onChange : null;
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.onKeyPress = typeof options.onKeyPress === 'function' ? options.onKeyPress : null;
      this.style = options.style || {};
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        value: this.value,
        hasHandler: !!this.onChange,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        hasKeyPressHandler: !!this.onKeyPress,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      wrapper.className = 'wise-htmleditor-wrapper relative flex flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-900/10 transition focus-within:ring-2 focus-within:ring-[var(--accent)]';

      let isSourceView = false;
      let savedRange = null;

      const toolbar = document.createElement('div');
      toolbar.className = 'flex flex-wrap items-center gap-1 border-b border-slate-900/10 bg-slate-50 p-1.5 text-slate-700 select-none';

      const editable = document.createElement('div');
      editable.className = 'wise-htmleditor-editable min-h-[140px] max-h-[450px] overflow-y-auto px-4 py-3 text-sm text-slate-800 outline-none';
      editable.contentEditable = 'true';
      editable.innerHTML = data.value || '';
      WiseControl.applyCommon(editable, data, context);

      const sourceArea = document.createElement('textarea');
      sourceArea.className = 'wise-htmleditor-source min-h-[140px] max-h-[450px] w-full border-0 bg-slate-900 px-4 py-3 font-mono text-xs text-slate-100 outline-none focus:ring-0 resize-y';
      sourceArea.style.display = 'none';
      sourceArea.value = data.value || '';

      const saveSelection = () => {
        if (typeof window === 'undefined') return;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (editable.contains(range.commonAncestorContainer)) {
            savedRange = range.cloneRange();
          }
        }
      };

      const restoreSelection = () => {
        editable.focus();
        if (savedRange && typeof window !== 'undefined') {
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(savedRange);
        }
      };

      const insertHTMLAtCursor = (html) => {
        if (isSourceView) {
          sourceArea.value += html;
          editable.innerHTML = sourceArea.value;
          return;
        }
        editable.focus();
        restoreSelection();
        if (!document.execCommand('insertHTML', false, html)) {
          if (savedRange) {
            savedRange.deleteContents();
            const div = document.createElement('div');
            div.innerHTML = html;
            const frag = document.createDocumentFragment();
            let node, lastNode;
            while ((node = div.firstChild)) {
              lastNode = frag.appendChild(node);
            }
            savedRange.insertNode(frag);
            if (lastNode) {
              const range = document.createRange();
              range.setStartAfter(lastNode);
              range.collapse(true);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } else {
            editable.innerHTML += html;
          }
        }
        saveSelection();
      };

      editable.addEventListener('keyup', saveSelection);
      editable.addEventListener('mouseup', saveSelection);
      editable.addEventListener('focus', saveSelection);

      sourceArea.addEventListener('input', () => {
        editable.innerHTML = sourceArea.value;
      });

      const makeSeparator = () => {
        const sep = document.createElement('div');
        sep.className = 'h-4 w-[1px] bg-slate-200 mx-0.5 self-center';
        return sep;
      };

      const makeToolButton = (label, command, value = null, title = '') => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = label;
        btn.title = title || label;
        btn.className = 'wise-editor-btn flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 bg-transparent text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-xs cursor-pointer border-0';
        btn.addEventListener('mousedown', (event) => {
          event.preventDefault();
          if (isSourceView) return;
          restoreSelection();
          document.execCommand(command, false, value);
          saveSelection();
        });
        return btn;
      };

      const makeSelect = (optionsList, command, placeholder, title) => {
        const select = document.createElement('select');
        select.title = title || placeholder;
        select.className = 'wise-editor-select h-7 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 outline-none hover:border-slate-300 transition cursor-pointer';

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = placeholder;
        defaultOpt.selected = true;
        select.appendChild(defaultOpt);

        optionsList.forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          select.appendChild(o);
        });

        select.addEventListener('change', (e) => {
          const val = e.target.value;
          if (!val || isSourceView) return;
          restoreSelection();
          document.execCommand(command, false, val);
          saveSelection();
          select.value = '';
        });

        return select;
      };

      const makeColorPicker = (command, title, iconText) => {
        const wrap = document.createElement('label');
        wrap.title = title;
        wrap.className = 'wise-editor-btn relative flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 bg-transparent text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs cursor-pointer border-0';

        const span = document.createElement('span');
        span.innerHTML = iconText;

        const input = document.createElement('input');
        input.type = 'color';
        input.className = 'absolute inset-0 opacity-0 cursor-pointer w-full h-full';
        input.addEventListener('change', (e) => {
          if (isSourceView) return;
          restoreSelection();
          document.execCommand(command, false, e.target.value);
          saveSelection();
        });

        wrap.appendChild(span);
        wrap.appendChild(input);
        return wrap;
      };

      const showModal = (title, fields, onSubmit) => {
        saveSelection();

        const overlay = document.createElement('div');
        overlay.className = 'wise-editor-modal absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-20 p-4 transition-all duration-150';

        const box = document.createElement('div');
        box.className = 'bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-full max-w-xs flex flex-col gap-3 text-slate-800 text-xs animate-in fade-in zoom-in-95 duration-150';

        const header = document.createElement('div');
        header.className = 'font-semibold text-sm border-b border-slate-100 pb-2 flex justify-between items-center text-slate-900';
        header.innerHTML = `<span>${title}</span>`;

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'text-slate-400 hover:text-slate-600 text-base leading-none cursor-pointer border-0 bg-transparent px-1';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', () => overlay.remove());
        header.appendChild(closeBtn);

        box.appendChild(header);

        const inputsMap = {};
        fields.forEach((f) => {
          const group = document.createElement('div');
          group.className = 'flex flex-col gap-1';

          const label = document.createElement('label');
          label.className = 'font-medium text-slate-600 text-[11px]';
          label.textContent = f.label;

          let input;
          if (f.type === 'checkbox') {
            group.className = 'flex items-center gap-2 pt-1';
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = !!f.default;
            input.className = 'rounded border-slate-300 text-blue-600 focus:ring-blue-500';
            group.appendChild(input);
            group.appendChild(label);
          } else {
            input = document.createElement('input');
            input.type = f.type || 'text';
            input.value = f.default !== undefined ? f.default : '';
            input.placeholder = f.placeholder || '';
            input.className = 'rounded-md border border-slate-300 px-2.5 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800';
            group.appendChild(label);
            group.appendChild(input);
          }

          inputsMap[f.name] = input;
          box.appendChild(group);
        });

        const actions = document.createElement('div');
        actions.className = 'flex justify-end gap-2 pt-2 border-t border-slate-100';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer font-medium text-xs';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => overlay.remove());

        const submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'px-3.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium text-xs shadow-xs';
        submitBtn.textContent = 'Insert';
        submitBtn.addEventListener('click', () => {
          const resultValues = {};
          fields.forEach((f) => {
            const inp = inputsMap[f.name];
            resultValues[f.name] = f.type === 'checkbox' ? inp.checked : inp.value;
          });
          overlay.remove();
          restoreSelection();
          onSubmit(resultValues);
        });

        actions.appendChild(cancelBtn);
        actions.appendChild(submitBtn);
        box.appendChild(actions);

        overlay.appendChild(box);
        wrapper.appendChild(overlay);

        const firstInput = fields[0] ? inputsMap[fields[0].name] : null;
        if (firstInput) setTimeout(() => firstInput.focus(), 50);
      };

      // 1. View Source toggle button
      const btnSource = document.createElement('button');
      btnSource.type = 'button';
      btnSource.title = 'View Source Code';
      btnSource.className = 'wise-editor-btn wise-btn-source flex h-7 items-center justify-center rounded-md px-2 bg-transparent text-xs font-mono font-bold text-slate-700 hover:bg-white hover:shadow-xs cursor-pointer border-0 transition';
      btnSource.innerHTML = '&lt;/&gt; Source';
      btnSource.addEventListener('click', () => {
        isSourceView = !isSourceView;
        if (isSourceView) {
          sourceArea.value = editable.innerHTML;
          editable.style.display = 'none';
          sourceArea.style.display = 'block';
          btnSource.classList.add('bg-slate-200', 'text-slate-900');
          toolbar.querySelectorAll('.wise-editor-btn:not(.wise-btn-source), .wise-editor-select, label').forEach((el) => {
            el.style.opacity = '0.4';
            el.style.pointerEvents = 'none';
          });
        } else {
          editable.innerHTML = sourceArea.value;
          sourceArea.style.display = 'none';
          editable.style.display = 'block';
          btnSource.classList.remove('bg-slate-200', 'text-slate-900');
          toolbar.querySelectorAll('.wise-editor-btn, .wise-editor-select, label').forEach((el) => {
            el.style.opacity = '';
            el.style.pointerEvents = '';
          });
        }
      });
      toolbar.appendChild(btnSource);

      // Undo / Redo / Clear format
      toolbar.appendChild(makeToolButton('↩', 'undo', null, 'Undo'));
      toolbar.appendChild(makeToolButton('↪', 'redo', null, 'Redo'));
      toolbar.appendChild(makeToolButton('T<sub>x</sub>', 'removeFormat', null, 'Clear Formatting'));

      toolbar.appendChild(makeSeparator());

      // 2. Font Family select
      const fontFamilies = [
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Comic Sans', value: 'Comic Sans MS, cursive' },
        { label: 'Courier New', value: 'Courier New, monospace' },
        { label: 'Georgia', value: 'Georgia, serif' },
        { label: 'Impact', value: 'Impact, sans-serif' },
        { label: 'Times New Roman', value: 'Times New Roman, serif' },
        { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
        { label: 'Verdana', value: 'Verdana, sans-serif' },
      ];
      toolbar.appendChild(makeSelect(fontFamilies, 'fontName', 'Font Family', 'Select Font Family'));

      // 3. Font Size select
      const fontSizes = [
        { label: '1 - 10px', value: '1' },
        { label: '2 - 12px', value: '2' },
        { label: '3 - 14px', value: '3' },
        { label: '4 - 18px', value: '4' },
        { label: '5 - 24px', value: '5' },
        { label: '6 - 32px', value: '6' },
        { label: '7 - 48px', value: '7' },
      ];
      toolbar.appendChild(makeSelect(fontSizes, 'fontSize', 'Font Size', 'Select Font Size'));

      // 4. Heading / Format Block select
      const formatBlocks = [
        { label: 'Paragraph', value: '<p>' },
        { label: 'Heading 1', value: '<h1>' },
        { label: 'Heading 2', value: '<h2>' },
        { label: 'Heading 3', value: '<h3>' },
        { label: 'Heading 4', value: '<h4>' },
        { label: 'Blockquote', value: '<blockquote>' },
        { label: 'Code Block', value: '<pre>' },
      ];
      toolbar.appendChild(makeSelect(formatBlocks, 'formatBlock', 'Format', 'Select Block Format'));

      toolbar.appendChild(makeSeparator());

      // 5. Basic inline formatting
      toolbar.appendChild(makeToolButton('<b>B</b>', 'bold', null, 'Bold'));
      toolbar.appendChild(makeToolButton('<i>I</i>', 'italic', null, 'Italic'));
      toolbar.appendChild(makeToolButton('<u>U</u>', 'underline', null, 'Underline'));
      toolbar.appendChild(makeToolButton('<s>S</s>', 'strikeThrough', null, 'Strikethrough'));
      toolbar.appendChild(makeToolButton('X<sub>2</sub>', 'subscript', null, 'Subscript'));
      toolbar.appendChild(makeToolButton('X<sup>2</sup>', 'superscript', null, 'Superscript'));

      // Colors
      toolbar.appendChild(makeColorPicker('foreColor', 'Text Color', '<span style="border-bottom: 2px solid currentColor; font-weight: bold;">A</span>'));
      toolbar.appendChild(makeColorPicker('hiliteColor', 'Background Color', '<span style="background:#fef08a; padding:0 2px; border-radius:2px; font-weight: bold;">A</span>'));

      toolbar.appendChild(makeSeparator());

      // 6. Alignments
      toolbar.appendChild(makeToolButton('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>', 'justifyLeft', null, 'Align Left'));
      toolbar.appendChild(makeToolButton('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>', 'justifyCenter', null, 'Align Center'));
      toolbar.appendChild(makeToolButton('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>', 'justifyRight', null, 'Align Right'));
      toolbar.appendChild(makeToolButton('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>', 'justifyFull', null, 'Justify'));

      toolbar.appendChild(makeSeparator());

      // 7. Lists & Indent
      toolbar.appendChild(makeToolButton('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>', 'insertUnorderedList', null, 'Bullet List'));
      toolbar.appendChild(makeToolButton('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>', 'insertOrderedList', null, 'Numbered List'));
      toolbar.appendChild(makeToolButton('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 8 3 12 7 16"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/></svg>', 'outdent', null, 'Decrease Indent'));
      toolbar.appendChild(makeToolButton('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 12 3 16"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/></svg>', 'indent', null, 'Increase Indent'));

      toolbar.appendChild(makeSeparator());

      // 8. Add Link
      const btnLink = document.createElement('button');
      btnLink.type = 'button';
      btnLink.title = 'Add Link';
      btnLink.className = 'wise-editor-btn flex h-7 items-center justify-center rounded-md px-1.5 bg-transparent text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-xs cursor-pointer border-0';
      btnLink.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
      btnLink.addEventListener('click', () => {
        if (isSourceView) return;
        saveSelection();
        let selectedText = '';
        if (typeof window !== 'undefined' && window.getSelection) {
          selectedText = window.getSelection().toString();
        }
        showModal('Insert Link', [
          { name: 'url', label: 'Link URL', placeholder: 'https://example.com', default: 'https://' },
          { name: 'text', label: 'Link Text', placeholder: 'Display Text', default: selectedText }
        ], (res) => {
          if (!res.url) return;
          const linkText = res.text || res.url;
          const html = `<a href="${res.url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${linkText}</a>`;
          insertHTMLAtCursor(html);
        });
      });
      toolbar.appendChild(btnLink);

      // 9. Add Image
      const btnImage = document.createElement('button');
      btnImage.type = 'button';
      btnImage.title = 'Add Image';
      btnImage.className = 'wise-editor-btn flex h-7 items-center justify-center rounded-md px-1.5 bg-transparent text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-xs cursor-pointer border-0';
      btnImage.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
      btnImage.addEventListener('click', () => {
        if (isSourceView) return;
        showModal('Insert Image', [
          { name: 'url', label: 'Image URL', placeholder: 'https://example.com/image.jpg' },
          { name: 'alt', label: 'Alt Text (Optional)', placeholder: 'Image Description' },
          { name: 'width', label: 'Width (e.g. 100%, 300px)', placeholder: '100%', default: '100%' }
        ], (res) => {
          if (!res.url) return;
          const widthStyle = res.width ? `max-width: ${res.width};` : 'max-width: 100%;';
          const html = `<img src="${res.url}" alt="${res.alt || ''}" style="${widthStyle} height: auto; border-radius: 6px; margin: 6px 0; display: inline-block;" />`;
          insertHTMLAtCursor(html);
        });
      });
      toolbar.appendChild(btnImage);

      // 10. Add Table
      const btnTable = document.createElement('button');
      btnTable.type = 'button';
      btnTable.title = 'Add Table';
      btnTable.className = 'wise-editor-btn flex h-7 items-center justify-center rounded-md px-1.5 bg-transparent text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-xs cursor-pointer border-0';
      btnTable.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>';
      btnTable.addEventListener('click', () => {
        if (isSourceView) return;
        showModal('Insert Table', [
          { name: 'rows', label: 'Rows', type: 'number', default: '3' },
          { name: 'cols', label: 'Columns', type: 'number', default: '3' },
          { name: 'hasHeader', label: 'Include Header Row', type: 'checkbox', default: true }
        ], (res) => {
          const rowsCount = parseInt(res.rows, 10) || 3;
          const colsCount = parseInt(res.cols, 10) || 3;
          let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 8px 0; border: 1px solid #cbd5e1; font-size: 13px;">';
          let startRow = 0;
          if (res.hasHeader) {
            tableHtml += '<thead><tr style="background: #f8fafc;">';
            for (let c = 0; c < colsCount; c++) {
              tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: 600;">Header ${c + 1}</th>`;
            }
            tableHtml += '</tr></thead>';
            startRow = 1;
          }
          tableHtml += '<tbody>';
          for (let r = startRow; r < rowsCount; r++) {
            tableHtml += '<tr>';
            for (let c = 0; c < colsCount; c++) {
              tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell ${r + 1}-${c + 1}</td>`;
            }
            tableHtml += '</tr>';
          }
          tableHtml += '</tbody></table><p><br></p>';
          insertHTMLAtCursor(tableHtml);
        });
      });
      toolbar.appendChild(btnTable);

      // Horizontal Rule
      toolbar.appendChild(makeToolButton('― HR', 'insertHorizontalRule', null, 'Insert Horizontal Line'));

      // Event Listeners for Change & Keypress
      if (data.hasHandler) {
        editable.addEventListener('blur', () => context.desktop.sendControlEvent(context.appId, data.id, wrapper, 'change'));
        sourceArea.addEventListener('blur', () => {
          editable.innerHTML = sourceArea.value;
          context.desktop.sendControlEvent(context.appId, data.id, wrapper, 'change');
        });
      }
      if (data.hasKeyPressHandler) {
        const handleKey = (e) => context.desktop.sendControlEvent(context.appId, data.id, editable, 'keypress', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey });
        editable.addEventListener('keydown', handleKey);
        sourceArea.addEventListener('keydown', handleKey);
      }

      wrapper.appendChild(toolbar);
      wrapper.appendChild(editable);
      wrapper.appendChild(sourceArea);
      return wrapper;
    }

    static gatherValue(winEl, id) {
      const node = winEl.querySelector(`[data-control-id="${id}"]`);
      if (!node) return undefined;
      const wrapper = node.closest('.wise-htmleditor-wrapper');
      if (wrapper) {
        const sourceArea = wrapper.querySelector('textarea.wise-htmleditor-source');
        if (sourceArea && sourceArea.style.display !== 'none') {
          node.innerHTML = sourceArea.value;
          return sourceArea.value;
        }
      }
      return node.innerHTML;
    }

    static patchElement(winEl, data) {
      const node = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!node) return;
      const val = data.value ?? '';
      node.innerHTML = val;
      const wrapper = node.closest('.wise-htmleditor-wrapper');
      if (wrapper) {
        const sourceArea = wrapper.querySelector('textarea.wise-htmleditor-source');
        if (sourceArea) sourceArea.value = val;
      }
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseHtmlEditor = WiseHtmlEditor;
  } else {
    module.exports = WiseHtmlEditor;
  }
})();

