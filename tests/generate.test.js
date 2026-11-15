import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../public/generate.js';
import { defaults, example, normalise } from '../public/model.js';
test('empty brief explicitly identifies missing acceptance criteria and asks to establish them', () => {
  const text = generate(defaults());
  assert.match(text, /Untitled coding task/);
  assert.match(text, /Not defined\. Establish observable acceptance criteria before implementation\./);
  assert.doesNotMatch(text, /undefined|null/);
});
test('all user fields reach the generated prompt without losing multiline scope or criteria numbering', () => {
  const data = example();
  for (const key of ['title', 'goal', 'current', 'expected', 'references', 'decisions', 'reuse', 'preserve', 'boundaries', 'other', 'ui', 'commands', 'docs']) data[key] = `value-for-${key}`;
  data.include = 'first inclusion\nsecond inclusion'; data.exclude = 'excluded work'; data.criteria = ['', 'criterion A', '  ', 'criterion B'];
  const output = generate(data);
  for (const key of ['title', 'goal', 'current', 'expected', 'references', 'decisions', 'reuse', 'preserve', 'boundaries', 'other', 'ui', 'commands', 'docs']) assert.ok(output.includes(`value-for-${key}`), key);
  assert.match(output, /- first inclusion\n- second inclusion/);
  assert.match(output, /1\. criterion A\n2\. criterion B/);
});
test('review mode cannot accidentally include implementation mode instructions', () => {
  const text = generate({ ...defaults(), mode: 'review' });
  assert.match(text, /Do not edit files/);
  assert.doesNotMatch(text, /then implement and verify/);
  assert.doesNotMatch(text, /Add or update tests|Make the smallest coherent change/);
});
test('plain-text output retains requirements and removes markdown headings', () => {
  const data = example(); data.format = 'compact';
  const text = generate(data);
  assert.doesNotMatch(text, /## /);
  assert.match(text, /ACCEPTANCE CRITERIA:/);
  assert.ok(text.includes(data.criteria[3]));
});
test('malformed saved data falls back safely to known defaults', () => {
  const restored = normalise({ mode: 'invented', dependencies: null, criteria: [4, null], checks: ['arbitrary'], goal: { dangerous: true } });
  assert.equal(restored.mode, 'plan'); assert.equal(restored.goal, ''); assert.deepEqual(restored.criteria, ['']); assert.deepEqual(restored.checks, []);
  assert.doesNotThrow(() => generate(restored));
});
test('working rules can be omitted without dropping the handoff', () => {
  const text = generate({ ...defaults(), rules: false });
  assert.doesNotMatch(text, /## WORKING RULES/); assert.match(text, /## FINAL HANDOFF/);
});
test('documentation none suppresses stale details without losing them in the draft', () => {
  const data = { ...example(), documentation: 'None expected', docs: 'Stale documentation request' };
  assert.doesNotMatch(generate(data), /Stale documentation request/);
  assert.match(generate(data), /None expected/);
});
