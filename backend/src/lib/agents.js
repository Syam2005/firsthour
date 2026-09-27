const { completeJson } = require('./watsonx');

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
  return snapshot.files.some((f) => f.path.toLowerCase() === lower || f.path.toLowerCase().endsWith('/' + lower));
}

function makeContext(snapshot) {
  const docs = Object.entries(snapshot.documents || {})
    .map(([name, text]) => `--- ${name} ---\n${text.slice(0, 2500)}`)
    .join('\n')
    .slice(0, 12000);
  return [
    `Repository: ${snapshot.repo}`,
    `Description: ${snapshot.description || 'none'}`,
    `Language: ${snapshot.language || 'unknown'}`,
    `Files sampled: ${snapshot.files.length}${snapshot.truncated ? ' (truncated)' : ''}`,
    `Top folders: ${topFolders(snapshot.files).map(([n, c]) => `${n}(${c})`).join(', ') || 'none'}`,
    `Extensions: ${countExtensions(snapshot.files).map(([e, c]) => `${e}:${c}`).join(', ') || 'none'}`,
    docs
  ].join('\n');
}

// ─── Heuristic fallbacks ────────────────────────────────────────────────────

function heuristicDocument(snapshot) {
  const docs = snapshot.documents || {};
  const hasReadme = hasFile(snapshot, 'README.md') || hasFile(snapshot, 'README');
  const hasEnvExample = hasFile(snapshot, '.env.example');
  const hasEnvInSource = Object.values(docs).some((t) => /process\.env\.|os\.environ|getenv/i.test(t));
  const envVars = [];
  for (const text of Object.values(docs)) {
    const matches = text.match(/process\.env\.([A-Z_]+)/g) || [];
    for (const m of matches) envVars.push(m.replace('process.env.', ''));
  }
  const conflicts = [];
  if (!hasReadme) conflicts.push({ tag: 'conflict', note: 'No README found — cannot verify documented setup' });
  if (hasEnvInSource && !hasEnvExample) conflicts.push({ tag: 'conflict', note: 'Environment variables used in code but no .env.example present' });
  return {
    whatItDoes: snapshot.description || `${snapshot.repo} is a ${snapshot.language || 'software'} project.`,
    whatDocsClaim: hasReadme ? 'README present' : 'No README — cannot determine documented behavior',
    conflicts,
    envVarsFound: [...new Set(envVars)].slice(0, 20),
    suggestedEnvExample: hasEnvInSource && !hasEnvExample ? [...new Set(envVars)].map((v) => `${v}=`).join('\n') : null
  };
}

function heuristicArchitecture(snapshot) {
  const folders = topFolders(snapshot.files);
  const extensions = countExtensions(snapshot.files);
  return [
    { name: 'What it is', detail: snapshot.description || `${snapshot.repo}: ${snapshot.files.length} files` },
    { name: 'Shape', detail: folders.length ? `Code lives in: ${folders.map(([n]) => n).slice(0, 4).join(', ')}` : 'Flat repository' },
    { name: 'Languages', detail: extensions.map(([e, c]) => `${c} .${e}`).join(', ') || 'No source detected' }
  ];
}

function heuristicSetup(snapshot) {
  return [
    { label: 'README', ok: hasFile(snapshot, 'README.md') || hasFile(snapshot, 'README'), detail: hasFile(snapshot, 'README.md') ? 'README.md found' : 'No README found', tag: hasFile(snapshot, 'README.md') ? 'from code' : 'conflict' },
    { label: 'Install manifest', ok: hasFile(snapshot, 'package.json') || hasFile(snapshot, 'requirements.txt') || hasFile(snapshot, 'pyproject.toml') || hasFile(snapshot, 'go.mod'), detail: 'package.json / requirements.txt / go.mod', tag: 'from code' },
    { label: '.env.example', ok: hasFile(snapshot, '.env.example'), detail: hasFile(snapshot, '.env.example') ? '.env.example is present' : 'No .env.example — new devs will not know required variables', tag: hasFile(snapshot, '.env.example') ? 'from code' : 'conflict' }
  ];
}

function heuristicTasks(snapshot) {
  const folders = topFolders(snapshot.files);
  const tasks = [];
  if (!hasFile(snapshot, 'README.md')) {
    tasks.push({ id: 'task_readme', title: 'Write a README with setup steps', file: 'README.md', why: 'No README — first hire cannot start without one', difficulty: 'easy', minutes: 20, proof: 'A teammate follows the README and reaches the running app', verified: false });
  }
  if (!hasFile(snapshot, '.env.example')) {
    tasks.push({ id: 'task_env', title: 'Add .env.example', file: '.env.example', why: 'Environment variables are used but no example exists', difficulty: 'easy', minutes: 10, proof: 'Copy .env.example to .env and the app starts', verified: false });
  }
  if (!snapshot.files.some((f) => /(test|spec)\./i.test(f.path))) {
    tasks.push({ id: 'task_test', title: 'Add a test for the main entry path', file: 'test/', why: 'No safety net for the first change', difficulty: 'medium', minutes: 30, proof: 'npm test passes', verified: false });
  }
  tasks.push({
    id: 'task_trace',
    title: 'Trace one request from entry to data store',
    file: snapshot.files[0]?.path || 'README.md',
    why: 'Fastest way to learn the architecture',
    difficulty: 'easy',
    minutes: 15,
    proof: 'You can name the entry file, the route, and where data is saved',
    verified: snapshot.files.length > 0
  });
  tasks.push({
    id: 'task_commands',
    title: 'List day-one commands in the README',
    file: folders[0]?.[0] || 'README.md',
    why: 'Install, run, and test should be copy-paste commands',
    difficulty: 'easy',
    minutes: 10,
    proof: 'Each command runs without undocumented extra steps',
    verified: hasFile(snapshot, 'README.md')
  });
  return tasks.slice(0, 5).map((t) => ({ ...t, status: 'todo' }));
}

function heuristicSummary(doc, arch, setup, tasks, snapshot) {
  return {
    what: snapshot.description || `${snapshot.repo} is a ${snapshot.language || 'software'} project.`,
    howBuilt: arch.map((a) => `${a.name}: ${a.detail}`).join(' | '),
    howToRun: setup.find((s) => s.label === 'README')?.detail || 'See README for instructions',
    conflicts: doc.conflicts,
    firstTask: tasks[0] || null
  };
}

// ─── Model agents ────────────────────────────────────────────────────────────

async function runDocumentAgent(snapshot, emit) {
  const ctx = makeContext(snapshot);
  const system = `You are the Document agent. Analyze the repository.
Return JSON: { "whatItDoes": string, "whatDocsClaim": string, "conflicts": [{tag: "from code"|"from docs"|"conflict", note: string}], "envVarsFound": string[], "suggestedEnvExample": string|null }
Tag each claim. If .env is missing, list env vars found in source and suggest a .env.example with blank values. Do not invent secrets.`;
  try {
    const result = await completeJson(system, ctx);
    emit({ type: 'agent', agent: 'document', state: 'done', detail: 'Document analysis complete' });
    return result;
  } catch (err) {
    emit({ type: 'agent', agent: 'document', state: 'done', detail: `Fallback (${err.message})` });
    return heuristicDocument(snapshot);
  }
}

async function runArchitectureAgent(snapshot, emit) {
  const ctx = makeContext(snapshot);
  const system = `You are the Architecture agent. Explain the system using real file paths from the tree.
Return JSON: { "architecture": [{name: string, detail: string}] }
At most 4 items. Use only facts from the repository. Under 40 words per detail.`;
  try {
    const result = await completeJson(system, ctx);
    emit({ type: 'agent', agent: 'architecture', state: 'done', detail: 'Architecture mapped' });
    return Array.isArray(result.architecture) ? result.architecture : heuristicArchitecture(snapshot);
  } catch (err) {
    emit({ type: 'agent', agent: 'architecture', state: 'done', detail: `Fallback (${err.message})` });
    return heuristicArchitecture(snapshot);
  }
}

async function runSetupAgent(snapshot, emit) {
  const ctx = makeContext(snapshot);
  const system = `You are the Setup agent. Check install, env, start command, and environment.
Return JSON: { "setup": [{label: string, ok: boolean, detail: string, tag: "from code"|"from docs"|"conflict"}] }
At most 5 checks. Tag each one.`;
  try {
    const result = await completeJson(system, ctx);
    emit({ type: 'agent', agent: 'setup', state: 'done', detail: 'Setup checks complete' });
    return Array.isArray(result.setup) ? result.setup : heuristicSetup(snapshot);
  } catch (err) {
    emit({ type: 'agent', agent: 'setup', state: 'done', detail: `Fallback (${err.message})` });
    return heuristicSetup(snapshot);
  }
}

async function runPitfallAgent(snapshot, emit) {
  const ctx = makeContext(snapshot);
  const system = `You are the Pitfall agent. List first-day mistakes for a new developer, including a wrong README and missing env file.
Return JSON: { "pitfalls": [{issue: string, fix: string}] }
At most 5 pitfalls. Be specific to this repo.`;
  try {
    const result = await completeJson(system, ctx);
    emit({ type: 'agent', agent: 'pitfall', state: 'done', detail: 'Pitfalls identified' });
    return Array.isArray(result.pitfalls) ? result.pitfalls : [];
  } catch (err) {
    emit({ type: 'agent', agent: 'pitfall', state: 'done', detail: `Fallback (${err.message})` });
    return [];
  }
}

async function runStarterTaskAgent(snapshot, emit) {
  const ctx = makeContext(snapshot);
  const filePaths = new Set(snapshot.files.map((f) => f.path));
  const system = `You are the Starter Task agent. Propose 5 safe first tasks.
Return JSON: { "tasks": [{id: string, title: string, file: string, why: string, difficulty: "easy"|"medium"|"hard", minutes: number, proof: string}] }
Each task must have an existing file path from the tree. If you cannot verify the path is in the tree, set verified: false.
Available paths sample: ${[...filePaths].slice(0, 30).join(', ')}`;
  try {
    const result = await completeJson(system, ctx);
    if (!Array.isArray(result.tasks)) return heuristicTasks(snapshot);
    const tasks = result.tasks.map((t, i) => ({
      id: t.id || `task_${i}`,
      title: t.title,
      file: t.file,
      why: t.why,
      difficulty: t.difficulty || 'medium',
      minutes: t.minutes || 15,
      proof: t.proof,
      verified: filePaths.has(t.file),
      status: 'todo'
    }));
    emit({ type: 'agent', agent: 'tasks', state: 'done', detail: 'Starter tasks chosen' });
    return tasks.slice(0, 5);
  } catch (err) {
    emit({ type: 'agent', agent: 'tasks', state: 'done', detail: `Fallback (${err.message})` });
    return heuristicTasks(snapshot);
  }
}

async function runSummaryAgent(doc, architecture, setup, pitfalls, tasks, snapshot, emit) {
  const ctx = JSON.stringify({ doc, architecture, setup, pitfalls, tasks, repo: snapshot.repo, language: snapshot.language });
  const system = `You are the Summary agent. Write one onboarding brief with sections: what this is, how it is built, how to run it, conflicts, and the first task.
Return JSON: { "what": string, "howBuilt": string, "howToRun": string, "conflicts": [{tag: string, note: string}], "firstTask": string }`;
  try {
    const result = await completeJson(system, ctx.slice(0, 6000));
    emit({ type: 'agent', agent: 'summary', state: 'done', detail: 'Brief written' });
    return result;
  } catch (err) {
    emit({ type: 'agent', agent: 'summary', state: 'done', detail: `Fallback (${err.message})` });
    return heuristicSummary(doc, architecture, setup, tasks, snapshot);
  }
}

async function runAgents(snapshot, emit) {
  // Agents 1-5 in parallel
  emit({ type: 'agent', agent: 'document', state: 'running', detail: 'Reading docs and code' });
  emit({ type: 'agent', agent: 'architecture', state: 'running', detail: 'Mapping structure' });
  emit({ type: 'agent', agent: 'setup', state: 'running', detail: 'Checking setup' });
  emit({ type: 'agent', agent: 'pitfall', state: 'running', detail: 'Scanning for pitfalls' });
  emit({ type: 'agent', agent: 'tasks', state: 'running', detail: 'Choosing starter tasks' });

  const [doc, architecture, setup, pitfalls, tasks] = await Promise.all([
    runDocumentAgent(snapshot, emit),
    runArchitectureAgent(snapshot, emit),
    runSetupAgent(snapshot, emit),
    runPitfallAgent(snapshot, emit),
    runStarterTaskAgent(snapshot, emit)
  ]);

  emit({ type: 'agent', agent: 'summary', state: 'running', detail: 'Writing brief' });
  const summary = await runSummaryAgent(doc, architecture, setup, pitfalls, tasks, snapshot, emit);

  return {
    summary: summary.what || doc.whatItDoes,
    summaryBrief: summary,
    document: doc,
    architecture,
    setup,
    pitfalls,
    tasks,
    conflicts: doc.conflicts || [],
    fileCount: snapshot.files.length,
    truncated: snapshot.truncated,
    language: snapshot.language,
    repo: snapshot.repo,
    url: snapshot.url
  };
}

module.exports = { runAgents, heuristicTasks, countExtensions };
