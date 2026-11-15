import { defaults, normalise, example, modes, fields, checks, dependencyOptions, docsOptions } from './model.js';
import { generate } from './generate.js';
const $ = s => document.querySelector(s);
const storageKey = 'promptkit-draft-v1';
let data = defaults(), storageAvailable = true;
try { const saved = localStorage.getItem(storageKey); if (saved) data = normalise(JSON.parse(saved)); } catch { storageAvailable = false; }
const sections = [
  { id: 'brief', label: 'The brief', title: 'Start with the outcome', description: 'Give your agent a clear picture of the task.', fields: ['title', 'goal', 'current', 'expected', 'references', 'decisions'] },
  { id: 'scope', label: 'Scope & rules', title: 'Set the boundaries', description: 'Make room for the right change. Keep everything else steady.', fields: ['include', 'exclude', 'reuse', 'preserve', 'boundaries', 'other'] },
  { id: 'acceptance', label: 'Acceptance', title: 'Make success observable', description: 'Describe behaviours someone can actually check.', fields: [] },
  { id: 'delivery', label: 'Checks & delivery', title: 'Define how done is proven', description: 'Choose relevant checks and a useful handoff.', fields: ['commands', 'ui'] }
];
let current = Math.max(0, sections.findIndex(x => '#' + x.id === location.hash));
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('visible'), 2600); }
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(data)); storageAvailable = true; } catch { storageAvailable = false; }
  saveStatus();
}
function saveStatus() { const status = $('#save-state'); status.replaceChildren(el('span', 'local-dot'), document.createTextNode(storageAvailable ? ' Saved locally' : ' Session only · saving unavailable')); }
function change(key, value) { data[key] = value; persist(); updatePreview(); }
function field(key) {
  const config = fields[key]; const wrap = el('div', 'field');
  const label = el('label', '', config.label); label.htmlFor = key;
  const fallback = el('span', 'field-default', 'Default: ' + (config.fallback || 'Not defined')); label.append(fallback); wrap.append(label);
  const input = el(config.type === 'input' ? 'input' : 'textarea'); input.id = key; input.name = key; input.value = data[key]; input.placeholder = config.placeholder; input.maxLength = 20000;
  if (input.tagName === 'TEXTAREA') input.rows = ['goal', 'include', 'exclude'].includes(key) ? 3 : 2; else input.type = 'text';
  input.addEventListener('input', () => change(key, input.value)); wrap.append(input);
  if (config.helper) { const help = el('p', 'helper', config.helper); help.id = key + '-help'; input.setAttribute('aria-describedby', help.id); wrap.append(help); }
  return wrap;
}
function selectField(key, labelText, options, helper) {
  const wrap = el('div', 'field'); const label = el('label', '', labelText); label.htmlFor = key;
  const select = el('select'); select.id = key; select.name = key;
  options.forEach(x => { const option = el('option', '', x); option.value = x; select.append(option); }); select.value = data[key];
  select.addEventListener('change', () => { change(key, select.value); if (key === 'documentation') renderDocs(); });
  wrap.append(label, select); if (helper) wrap.append(el('p', 'helper', helper)); return wrap;
}
function modePicker() {
  const set = el('fieldset', 'mode-fieldset'); set.append(el('legend', '', 'How should the agent work?'));
  const grid = el('div', 'mode-grid');
  Object.entries(modes).forEach(([key, mode]) => {
    const label = el('label', 'mode-card'); const radio = el('input'); radio.type = 'radio'; radio.name = 'mode'; radio.value = key; radio.checked = data.mode === key;
    radio.addEventListener('change', () => change('mode', key));
    const text = el('span'); text.append(el('strong', '', mode.label), el('small', '', mode.description)); label.append(radio, text); grid.append(label);
  }); set.append(grid); return set;
}
function renderCriteria(container, focusLast = false) {
  container.replaceChildren();
  data.criteria.forEach((value, index) => {
    const row = el('div', 'criterion-row'); const number = el('span', 'criterion-number', String(index + 1).padStart(2, '0')); number.setAttribute('aria-hidden', 'true');
    const input = el('textarea'); input.rows = 2; input.value = value; input.maxLength = 5000; input.placeholder = index === 0 ? 'Given [context], when [action], then [observable outcome].' : 'Another observable outcome…'; input.setAttribute('aria-label', 'Acceptance criterion ' + (index + 1));
    input.addEventListener('input', () => { data.criteria[index] = input.value; persist(); updatePreview(); });
    const remove = el('button', 'remove-button', '×'); remove.type = 'button'; remove.setAttribute('aria-label', 'Remove criterion ' + (index + 1));
    remove.addEventListener('click', () => { data.criteria.splice(index, 1); if (!data.criteria.length) data.criteria = ['']; persist(); renderCriteria(container); updatePreview(); container.querySelector('textarea').focus(); });
    row.append(number, input, remove); container.append(row);
  });
  if (focusLast) container.lastElementChild.querySelector('textarea').focus();
}
function renderDocs() {
  const target = $('#documentation-details'); if (!target) return;
  target.replaceChildren(); if (data.documentation === 'Specific updates' || data.documentation === 'Update affected documentation' && data.docs.trim()) target.append(field('docs'));
}
function render() {
  const section = sections[current];
  $('#navigation').replaceChildren(); $('#mobile-tabs').replaceChildren();
  sections.forEach((item, index) => {
    for (const selector of ['#navigation', '#mobile-tabs']) {
      const link = el('a', index === current ? 'nav-item selected' : 'nav-item'); link.href = '#' + item.id;
      link.append(el('span', 'nav-number', String(index + 1).padStart(2, '0')), el('span', '', item.label)); if (index === current) link.setAttribute('aria-current', 'step'); $(selector).append(link);
    }
  });
  $('#step-label').textContent = `STEP ${String(current + 1).padStart(2, '0')} / 04`;
  $('#section-title').textContent = section.title; $('#section-description').textContent = section.description; $('#section-icon').textContent = String(current + 1).padStart(2, '0');
  const container = $('#form-fields'); container.replaceChildren();
  if (current === 0) container.append(modePicker());
  section.fields.forEach(key => container.append(field(key)));
  if (current === 1) container.insertBefore(selectField('dependencies', 'Dependencies', dependencyOptions), container.children[4]);
  if (current === 2) {
    const hint = el('div', 'example-hint'); hint.append(el('strong', '', 'A useful criterion sounds like this:'), el('p', '', '“Given a saved Dark preference, when the user reloads, the page renders in Dark.”')); container.append(hint);
    const criteria = el('div', 'criteria-list'); renderCriteria(criteria); container.append(criteria);
    const add = el('button', 'add-button', '+ Add criterion'); add.type = 'button'; add.addEventListener('click', () => { if (data.criteria.length >= 50) return toast('Limit: 50 criteria per prompt.'); data.criteria.push(''); persist(); renderCriteria(criteria, true); updatePreview(); }); container.append(add);
    container.append(el('p', 'helper', 'Cover the normal path, relevant edge cases, and behaviour to preserve. Empty criteria are omitted; if all are empty, the prompt says “Not defined”.'));
  }
  if (current === 3) {
    const set = el('fieldset', 'checks-fieldset'); set.append(el('legend', '', 'Verification checks'));
    const grid = el('div', 'check-grid'); checks.forEach(check => { const label = el('label', 'check-option'); const input = el('input'); input.type = 'checkbox'; input.checked = data.checks.includes(check); input.addEventListener('change', () => change('checks', checks.filter(x => x === check ? input.checked : data.checks.includes(x)))); label.append(input, document.createTextNode(check)); grid.append(label); }); set.append(grid); container.prepend(set);
    container.append(selectField('documentation', 'Documentation', docsOptions)); container.append(el('div', '', undefined)); container.lastElementChild.id = 'documentation-details'; renderDocs();
    const label = el('label', 'rules-option'); const toggle = el('input'); toggle.type = 'checkbox'; toggle.checked = data.rules; toggle.addEventListener('change', () => change('rules', toggle.checked)); const text = el('span'); text.append(el('strong', '', 'Include standard working rules'), el('small', '', 'Preserve unrelated changes, clarify important ambiguity, and stay within scope.')); label.append(toggle, text); container.append(label);
    const output = el('div', 'handoff-note'); output.append(el('strong', '', 'Final handoff included'), el('p', '', 'Changes, acceptance evidence, actual check results, documentation, and limitations.')); container.append(output);
  }
  const next = $('#next'); next.replaceChildren(document.createTextNode(current === 3 ? 'Copy prompt ' : sections[current + 1].label + ' '), el('span', '', current === 3 ? '↗' : '→'));
  updatePreview(); saveStatus();
}
function updatePreview() {
  const prompt = generate(data); const output = $('#prompt-output'); const scroll = output.parentElement.scrollTop; output.replaceChildren();
  for (const line of prompt.split('\n')) { const node = el('span', line.startsWith('## ') || /^[A-Z][A-Z ]+:$/.test(line) ? 'prompt-heading' : line.includes('Not defined') || line.includes('Untitled coding task') ? 'prompt-default' : '', line + '\n'); output.append(node); }
  output.parentElement.scrollTop = scroll;
  $('#word-count').textContent = prompt.split(/\s+/).filter(Boolean).length + ' words'; $('#mode-indicator').textContent = modes[data.mode].label;
  $('.badge').textContent = data.format === 'compact' ? 'PLAIN TEXT' : 'MARKDOWN';
  $('#download').setAttribute('aria-label', data.format === 'compact' ? 'Download prompt as plain text' : 'Download prompt as Markdown');
  document.querySelectorAll('[data-format]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.format === data.format)));
}
async function copy() {
  const text = generate(data);
  try { await navigator.clipboard.writeText(text); toast('Prompt copied. Ready for your agent.'); }
  catch { const range = document.createRange(); range.selectNodeContents($('#prompt-output')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('#prompt-output').focus(); toast('Select and copy the preview manually. Clipboard access is unavailable.'); }
}
function confirmReplacement(title, description, action) {
  $('#dialog-title').textContent = title; $('#dialog-description').textContent = description;
  const dialog = $('#confirm-dialog'); dialog.returnValue = ''; dialog.onclose = () => { if (dialog.returnValue === 'confirm') action(); }; dialog.showModal();
}
$('#builder-form').addEventListener('submit', e => e.preventDefault());
$('#copy').addEventListener('click', copy);
$('#next').addEventListener('click', () => { if (current === 3) copy(); else location.hash = sections[current + 1].id; });
$('#example').addEventListener('click', () => confirmReplacement('Load the example?', 'This replaces your current draft with a sample theme-settings task.', () => { data = example(); persist(); current = 0; history.replaceState(null, '', '#brief'); render(); toast('Example loaded. Make it your own.'); }));
$('#reset').addEventListener('click', () => confirmReplacement('Reset your draft?', 'Your inputs will be cleared and the default settings restored.', () => { data = defaults(); persist(); current = 0; history.replaceState(null, '', '#brief'); render(); toast('Fresh draft. Defaults restored.'); }));
$('#download').addEventListener('click', () => { const blob = new Blob([generate(data) + '\n'], { type: 'text/markdown;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = el('a'); link.href = url; const title = data.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'coding-prompt'; link.download = title + (data.format === 'compact' ? '.txt' : '.md'); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Prompt downloaded.'); });
document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => change('format', button.dataset.format)));
window.addEventListener('hashchange', () => { current = Math.max(0, sections.findIndex(x => '#' + x.id === location.hash)); render(); });
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !$('#confirm-dialog').open) { e.preventDefault(); copy(); } });
render();
