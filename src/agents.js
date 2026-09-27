const { complete, provider } = require('./llm');

function countExtensions(files) {
  const counts = {};
  for (const file of files) {
    const ext = (file.path.match(/\.([a-z0-9]+)$/i) || [, 'other'])[1].toLowerCase();
    counts[ext] = (counts[ext] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function topFolders(files) {
  const counts = {};
  for (const file of files) {
    const folder = file.path.includes('/') ? file.path.split('/')[0] : '(root)';
    counts[folder] = (counts[folder] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function hasFile(snapshot, name) {
  const lower = name.toLowerCase();
  return snapshot.files.some((file) => file.path.toLowerCase() === lower || file.path.toLowerCase().endsWith('/' + lower));
}

function brief(snapshot) {
  const docs = Object.entries(snapshot.documents)
    .map(([name, text]) => `--- ${name} ---\n${text.slice(0, 2500)}`)
    .join('\n')
    .slice(0, 12000);
  return [
    `Repository: ${snapshot.repo}`,
    `Description: ${snapshot.description || 'none'}`,
    `Language: ${snapshot.language || 'unknown'}`,
    `Files sampled: ${snapshot.files.length}${snapshot.truncated ? ' (truncated)' : ''}`,
    `Top folders: ${topFolders(snapshot.files).map(([name, count]) => `${name} (${count})`).join(', ') || 'none'}`,
    `Extensions: ${countExtensions(snapshot.files).map(([ext, count]) => `${ext}:${count}`).join(', ') || 'none'}`,
    docs
  ].join('\n');
}

function heuristic(snapshot) {
  const folders = topFolders(snapshot.files);
  const extensions = countExtensions(snapshot.files);
  const architecture = [
    { name: 'What it is', detail: snapshot.description || `${snapshot.repo} is a ${snapshot.language || 'software'} project with ${snapshot.files.length} files in this scan.` },
    { name: 'Shape', detail: folders.length ? `Most of the code sits in ${folders.map(([name]) => name).slice(0, 4).join(', ')}.` : 'The repository is flat. Start at the root files.' },
    { name: 'Languages', detail: extensions.length ? extensions.map(([ext, count]) => `${count} .${ext}`).join(', ') : 'No source files were detected.' }
  ];

  const setup = [
    { label: 'README', ok: hasFile(snapshot, 'README.md') || hasFile(snapshot, 'README'), detail: hasFile(snapshot, 'README.md') ? 'README exists' : 'No README. Write one before asking a new hire to clone this.' },
    { label: 'Install manifest', ok: hasFile(snapshot, 'package.json') || hasFile(snapshot, 'requirements.txt') || hasFile(snapshot, 'pyproject.toml') || hasFile(snapshot, 'go.mod'), detail: 'Look for package.json, requirements.txt, pyproject.toml, or go.mod.' },
    { label: 'Environment example', ok: hasFile(snapshot, '.env.example'), detail: hasFile(snapshot, '.env.example') ? '.env.example is present' : 'No .env.example. New developers will not know which variables to set.' },
    { label: 'Container or make target', ok: hasFile(snapshot, 'Dockerfile') || hasFile(snapshot, 'Makefile'), detail: hasFile(snapshot, 'Dockerfile') ? 'Dockerfile found' : 'No Dockerfile. Setup is local-only.' },
    { label: 'Agent instructions', ok: hasFile(snapshot, 'AGENTS.md'), detail: hasFile(snapshot, 'AGENTS.md') ? 'AGENTS.md gives Bob persistent context' : 'No AGENTS.md yet.' }
  ];

  const tasks = [];
  if (!hasFile(snapshot, 'README.md')) {
    tasks.push({ title: 'Write a README with setup steps', file: 'README.md', why: 'A new developer cannot run the project from memory.', proof: 'A teammate follows the README and reaches the first screen.' });
  }
  if (!hasFile(snapshot, '.env.example') && hasFile(snapshot, 'package.json')) {
    tasks.push({ title: 'Add .env.example for required settings', file: '.env.example', why: 'Missing environment variables are the usual first-day failure.', proof: 'Copy .env.example to .env and the app starts.' });
  }
  if (!snapshot.files.some((file) => /(test|spec)\./i.test(file.path))) {
    tasks.push({ title: 'Add one test around the main entry path', file: 'test/', why: 'There is no safety net for the first change.', proof: 'npm test or the project test command passes.' });
  }
  tasks.push({ title: 'Trace one request from the entry file to the data store', file: folders[0]?.[0] || 'README.md', why: 'This is the fastest way to learn the architecture.', proof: 'You can name the entry file, the route, and where data is saved.' });
  tasks.push({ title: 'List the commands a new hire needs on day one', file: 'README.md', why: 'Install, run, and test should be copy-paste commands.', proof: 'Each command in the README runs without an extra undocumented step.' });

  return {
    summary: `${snapshot.repo} is ready for a guided first hour. ${snapshot.language ? 'Primary language: ' + snapshot.language + '. ' : ''}${snapshot.files.length} files scanned.`,
    architecture,
    setup,
    tasks: tasks.slice(0, 5),
    risks: snapshot.truncated ? ['The file list was truncated. Ask Bob to inspect folders that were not included.'] : ['Confirm license and secrets before you commit onboarding notes.']
  };
}

async function askModel(role, snapshot) {
  const system = [
    `You are the ${role} agent in FirstHour, an onboarding assistant for a developer who has never seen this repository.`,
    'Return only JSON with keys summary, architecture, setup, tasks, risks.',
    'architecture is an array of {name, detail}. setup is an array of {label, ok, detail}. tasks is an array of {title, file, why, proof}. risks is an array of strings.',
    'Use only facts from the repository brief. Do not invent services, credentials, or personal data.',
    'Keep every detail under 40 words. Give at most 4 architecture items, 5 setup checks, and 5 tasks.'
  ].join(' ');
  return complete(system, brief(snapshot));
}

async function runAgents(snapshot, emit) {
  const fallback = heuristic(snapshot);
  const which = provider();
  if (which === 'none') {
    emit({ type: 'agent', agent: 'cartographer', state: 'done', detail: 'Rule-based map. Add GEMINI_API_KEY or GROQ_API_KEY for the language-model pass.' });
    emit({ type: 'agent', agent: 'setup', state: 'done', detail: 'Setup checks came from the file tree.' });
    emit({ type: 'agent', agent: 'tasks', state: 'done', detail: 'Starter tasks came from missing docs and tests.' });
    return { ...fallback, source: 'rules' };
  }

  emit({ type: 'agent', agent: 'cartographer', state: 'running', detail: `Reading structure with ${which}` });
  emit({ type: 'agent', agent: 'setup', state: 'running', detail: 'Checking how a new hire would run this' });
  emit({ type: 'agent', agent: 'tasks', state: 'running', detail: 'Choosing a safe first change' });

  const roles = [
    ['cartographer', 'architecture'],
    ['setup', 'setup doctor'],
    ['tasks', 'starter-task author']
  ];

  const settled = await Promise.all(roles.map(async ([agent, role]) => {
    try {
      const result = await askModel(role, snapshot);
      emit({ type: 'agent', agent, state: 'done', detail: 'Model pass finished' });
      return result;
    } catch (err) {
      emit({ type: 'agent', agent, state: 'done', detail: `Model skipped (${err.message}). Using the file-based result.` });
      return null;
    }
  }));

  const model = settled.find(Boolean);
  if (!model) return { ...fallback, source: 'rules' };

  return {
    summary: model.summary || fallback.summary,
    architecture: Array.isArray(model.architecture) && model.architecture.length ? model.architecture : fallback.architecture,
    setup: Array.isArray(model.setup) && model.setup.length ? model.setup : fallback.setup,
    tasks: Array.isArray(model.tasks) && model.tasks.length ? model.tasks : fallback.tasks,
    risks: Array.isArray(model.risks) && model.risks.length ? model.risks : fallback.risks,
    source: which
  };
}

module.exports = { runAgents, heuristic, countExtensions };
