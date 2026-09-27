const fs = require('fs');
const path = require('path');

const SKIP = new Set(['node_modules', '.git', 'data', 'bob_sessions']);
const ROOT = path.join(__dirname, '..');

function walk(dir, prefix, files, depth) {
  if (depth > 4 || files.length >= 400) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, rel, files, depth + 1);
    else if (entry.isFile()) {
      const stat = fs.statSync(full);
      files.push({ path: rel.replace(/\\/g, '/'), size: stat.size, full });
    }
    if (files.length >= 400) return;
  }
}

function loadLocalRepo(onStep) {
  onStep('Reading the FirstHour workspace on this machine');
  const files = [];
  walk(ROOT, '', files, 0);
  const documents = {};
  const names = ['README.md', 'PROJECT.md', 'package.json', 'docs/RUNBOOK.md', 'docs/ARCHITECTURE.md', 'docs/STALE_README.md', 'AGENTS.md'];
  for (const name of names) {
    const full = path.join(ROOT, name);
    if (!fs.existsSync(full)) continue;
    documents[name] = fs.readFileSync(full, 'utf8').slice(0, 20000);
  }
  return {
    kind: 'local',
    repo: 'local/firsthour',
    description: 'The FirstHour workspace open on this computer',
    defaultBranch: 'local',
    stars: 0,
    language: 'JavaScript',
    url: '',
    files: files.map(({ path: filePath, size }) => ({ path: filePath, size })),
    truncated: files.length >= 400,
    documents
  };
}

module.exports = { loadLocalRepo };
