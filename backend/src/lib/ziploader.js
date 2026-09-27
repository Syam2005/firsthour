const unzipper = require('unzipper');
const { guardTree, MAX_ZIP_SIZE } = require('./guard');

async function loadZip(buffer, filename, onStep) {
  if (buffer.length > MAX_ZIP_SIZE) {
    const error = new Error('Archive exceeds 15 MB limit');
    error.status = 400;
    throw error;
  }
  onStep(`Extracting ${filename}`);
  const directory = await unzipper.Open.buffer(buffer);
  const rawFiles = [];

  for (const entry of directory.files) {
    if (entry.type === 'Directory') continue;
    // Normalize path: strip leading component if all files share one root dir
    let filePath = entry.path.replace(/\\/g, '/');
    // Block path traversal
    if (filePath.includes('..')) continue;
    rawFiles.push({ path: filePath, size: entry.uncompressedSize || 0 });
  }

  if (rawFiles.length === 0) {
    const error = new Error('No source files found in the zip');
    error.status = 400;
    throw error;
  }

  // Strip common prefix (e.g., project-main/)
  const firstParts = rawFiles.map((f) => f.path.split('/')[0]);
  const allSame = firstParts.every((p) => p === firstParts[0]);
  const prefix = allSame && firstParts[0] ? firstParts[0] + '/' : '';

  let files = rawFiles.map((f) => ({
    path: prefix ? f.path.slice(prefix.length) : f.path,
    size: f.size,
    _zipPath: f.path
  })).filter((f) => f.path);

  files = guardTree(files).slice(0, 800);

  if (files.length === 0) {
    const error = new Error('No readable source files after filtering');
    error.status = 400;
    throw error;
  }

  // Read document content for key files
  const KEY_FILES = ['README.md', 'README', 'package.json', 'pyproject.toml', 'requirements.txt',
    'go.mod', 'Dockerfile', 'docker-compose.yml', '.env.example', 'AGENTS.md', 'CONTRIBUTING.md'];
  const documents = {};
  const wanted = new Set(KEY_FILES.map((f) => f.toLowerCase()));

  for (const file of files) {
    const base = file.path.split('/').pop().toLowerCase();
    if (!wanted.has(file.path.toLowerCase()) && !wanted.has(base)) continue;
    if (file.size > 80000) continue;
    try {
      const entry = directory.files.find((e) => e.path.replace(/\\/g, '/') === file._zipPath);
      if (!entry) continue;
      const content = await entry.buffer();
      documents[file.path] = content.toString('utf8').slice(0, 20000);
    } catch { /* skip unreadable files */ }
  }

  return {
    kind: 'upload',
    repo: filename.replace(/\.zip$/i, ''),
    description: '',
    language: detectLanguage(files),
    url: null,
    files: files.map(({ path, size }) => ({ path, size })),
    truncated: files.length >= 800,
    documents
  };
}

function detectLanguage(files) {
  const extCounts = {};
  for (const f of files) {
    const ext = (f.path.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
    if (ext) extCounts[ext] = (extCounts[ext] || 0) + 1;
  }
  const langMap = { js: 'JavaScript', ts: 'TypeScript', py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java', cs: 'C#', cpp: 'C++', php: 'PHP' };
  const top = Object.entries(extCounts).sort((a, b) => b[1] - a[1])[0];
  return top ? (langMap[top[0]] || top[0]) : 'Unknown';
}

module.exports = { loadZip };
