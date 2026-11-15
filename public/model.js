export const modes = {
  plan: { label: 'Plan first', description: 'Inspect, propose, then wait for your approval.', prompt: 'Inspect the repository. Propose the approach, affected files, risks, and verification. Wait for my approval before editing.' },
  implement: { label: 'Implement', description: 'Inspect, make the change, and verify the result.', prompt: 'Inspect the repository, briefly state the approach, then implement and verify within this scope.' },
  review: { label: 'Review only', description: 'Find actionable issues without changing files.', prompt: 'Review the implementation against these requirements. Report actionable findings with file and line references. Do not edit files.' }
};
export const dependencyOptions = ['No new dependencies', 'Reuse first; ask before adding', 'Add dependencies when justified', 'Not defined'];
export const docsOptions = ['Update affected documentation', 'None expected', 'Specific updates', 'Not defined'];
export const fields = {
  title: { label: 'Task title', type: 'input', placeholder: 'e.g. Move the theme control into Settings', helper: 'A short name for the change.', fallback: 'Untitled coding task' },
  goal: { label: 'Goal', placeholder: 'Who needs this change, what should happen, and why?', helper: 'Describe the outcome from the user’s perspective.' },
  current: { label: 'Current behaviour', placeholder: 'What happens today?' },
  expected: { label: 'Expected behaviour', placeholder: 'What should happen after this change?' },
  references: { label: 'References', placeholder: 'File paths, issue links, screenshots, or error output. One per line.', helper: 'Attach referenced screenshots or files separately in your agent.' },
  decisions: { label: 'Existing decisions', placeholder: 'Required technical decisions and their reasons.' },
  include: { label: 'In scope', placeholder: 'Behaviours, pages, or components to change. One per line.' },
  exclude: { label: 'Out of scope', placeholder: 'Related work to leave for later. One per line.' },
  reuse: { label: 'Reuse', placeholder: 'Existing components, APIs, patterns, and design tokens.' },
  preserve: { label: 'Preserve', placeholder: 'Public contracts or behaviour that must stay compatible.' },
  boundaries: { label: 'Change boundaries', placeholder: 'Files, systems, or data that must not change.' },
  other: { label: 'Other constraints', placeholder: 'Accessibility, browser support, performance, or privacy requirements.' },
  ui: { label: 'UI checks', placeholder: 'e.g. Mobile and desktop, keyboard navigation, light and dark.', fallback: 'Not specified; assess relevance to the change.' },
  commands: { label: 'Commands or manual checks', placeholder: 'e.g. pnpm test, pnpm typecheck, sign-in smoke check. One per line.', helper: 'If omitted, the agent is asked to discover the repository’s commands.', fallback: 'Inspect repository scripts and documentation for appropriate commands.' },
  docs: { label: 'Documentation details', placeholder: 'Specific docs, examples, or decision records to update.' }
};
export const checks = ['Relevant tests', 'Typecheck', 'Lint', 'Build', 'Keyboard accessibility', 'Responsive layout'];
export function defaults() { return { ...Object.fromEntries(Object.keys(fields).map(k => [k, ''])), mode: 'plan', dependencies: dependencyOptions[0], documentation: docsOptions[0], criteria: [''], checks: ['Relevant tests', 'Typecheck'], format: 'full', rules: true }; }
export function normalise(value) {
  const base = defaults();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  for (const key of Object.keys(fields)) if (typeof value[key] === 'string') base[key] = value[key].slice(0, 20000);
  if (Object.hasOwn(modes, value.mode)) base.mode = value.mode;
  if (dependencyOptions.includes(value.dependencies)) base.dependencies = value.dependencies;
  if (docsOptions.includes(value.documentation)) base.documentation = value.documentation;
  if (Array.isArray(value.criteria)) base.criteria = value.criteria.filter(x => typeof x === 'string').slice(0, 50).map(x => x.slice(0, 5000));
  if (!base.criteria.length) base.criteria = [''];
  if (Array.isArray(value.checks)) base.checks = checks.filter(x => value.checks.includes(x));
  if (['full', 'compact'].includes(value.format)) base.format = value.format;
  if (typeof value.rules === 'boolean') base.rules = value.rules;
  return base;
}
export const example = () => normalise({
  title: 'Move the theme control into Settings', goal: 'Let users manage appearance preferences from one predictable place.',
  current: 'The theme control appears in the signed-in application header.', expected: 'Users can change their theme from Settings. The signed-in header no longer shows the control.',
  references: 'Inspect the existing theme component, Settings page, and persistence mechanism.', decisions: 'Keep the existing theme system and persistence approach.',
  include: 'Relocate the existing theme control\nUpdate affected UI tests', exclude: 'A theme-system rewrite\nOther Settings features',
  reuse: 'Existing components, design tokens, and preference persistence.', preserve: 'System, Light, and Dark options. Existing authentication behaviour.',
  boundaries: 'Do not change authentication logic or add dependencies.', other: 'Keep visible labels and keyboard access.',
  criteria: ['Signed-in users can select System, Light, or Dark in Settings.', 'The selected preference survives a page reload.', 'The signed-in header no longer displays this control.', 'The control is labelled and usable with the keyboard.'],
  checks: ['Relevant tests', 'Typecheck', 'Keyboard accessibility', 'Responsive layout'], ui: 'Narrow and wide layouts. Navigate and select options using only the keyboard.',
  docs: 'Update appearance instructions if they describe the old location.', mode: 'plan'
});
