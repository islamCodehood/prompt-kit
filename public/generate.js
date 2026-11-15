import { normalise, fields, modes } from './model.js';
export const workingRules = [
  'Read applicable repository instructions and inspect existing patterns.',
  'Ask only about ambiguity that materially changes behaviour, compatibility, or scope. State reasonable assumptions for minor implementation choices.',
  'Make the smallest coherent change that satisfies all acceptance criteria.',
  'Preserve unrelated local changes and avoid unrelated refactoring.',
  'If completion requires expanding scope or breaking a constraint, explain the conflict and ask before proceeding with that expansion.',
  'If a check fails, distinguish a regression from an existing failure where evidence allows. Do not weaken checks to obtain a pass.'
];
export const handoff = ['What changed and why.', 'Acceptance criteria: Met / Unmet / Unverified, with evidence.', 'Checks actually run, exact commands, and results.', 'Documentation changes.', 'Assumptions, remaining limitations, and required follow-up.'];
const lines = text => text.split(/\n/).map(x => x.trim()).filter(Boolean);
const list = (text, fallback = 'Not defined.') => { const xs = lines(text); return xs.length ? xs.map(x => '- ' + x).join('\n') : '- ' + fallback; };
export function generate(input) {
  const d = normalise(input);
  const value = key => d[key].trim() || fields[key]?.fallback || 'Not defined.';
  const criteria = d.criteria.map(x => x.trim()).filter(Boolean);
  const ac = criteria.length ? criteria.map((x, i) => `${i + 1}. ${x}`).join('\n') : 'Not defined. Establish observable acceptance criteria before implementation.';
  const docs = d.documentation === 'Specific updates' ? value('docs') : d.documentation + (d.documentation === 'Update affected documentation' && d.docs.trim() ? '\n' + d.docs.trim() : '');
  const verification = [d.checks.length ? 'Checks: ' + d.checks.join(', ') + '.' : 'Checks: Not defined; determine appropriate verification.', 'Commands / manual checks:\n' + list(d.commands, fields.commands.fallback), 'UI: ' + value('ui'), d.mode === 'review' ? 'Assess whether tests meaningfully protect the changed behaviour. Report missing cases without editing files.' : 'Add or update tests where they meaningfully protect the changed behaviour. For bug fixes, reproduce the failure before the fix where feasible.', 'Keep assertions meaningful. Explain any change to existing expectations.', 'Report passed, failed, skipped, and blocked checks separately.'].join('\n');
  const rules = d.mode === 'review' ? workingRules.map((rule, i) => i === 2 ? 'Assess whether the change satisfies all acceptance criteria. Report gaps without modifying files.' : i === 4 ? 'Report scope violations or constraint conflicts with evidence.' : rule) : workingRules;
  const sections = [
    ['TASK', value('title')], ['GOAL', value('goal')],
    ['CONTEXT', `Current behaviour: ${value('current')}\nExpected behaviour: ${value('expected')}\nReferences:\n${list(d.references)}\nExisting decisions: ${value('decisions')}`],
    ['SCOPE', `Include:\n${list(d.include)}\nExclude:\n${list(d.exclude)}`],
    ['CONSTRAINTS', `Reuse: ${value('reuse')}\nPreserve: ${value('preserve')}\nDependencies: ${d.dependencies}\nBoundaries: ${value('boundaries')}\nOther: ${value('other')}`],
    ['ACCEPTANCE CRITERIA', ac], ['VERIFICATION', verification], ['DOCUMENTATION', docs], ['WORKING MODE', modes[d.mode].prompt],
    ...(d.rules ? [['WORKING RULES', rules.map(x => '- ' + x).join('\n')]] : []),
    ['FINAL HANDOFF', handoff.map((x, i) => `${i + 1}. ${x}`).join('\n')]
  ];
  if (d.format === 'compact') return sections.map(([title, body]) => title + ':\n' + body).join('\n\n');
  return sections.map(([title, body]) => `## ${title}\n${body}`).join('\n\n');
}
