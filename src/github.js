const KEY_FILES = [
  'README.md', 'README', 'CONTRIBUTING.md', 'AGENTS.md', 'package.json',
  'pyproject.toml', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml',
  'Dockerfile', 'docker-compose.yml', 'Makefile', 'composer.json'
];

async function githubFetch(path, token) {
  const headers = {
    'User-Agent': 'FirstHour-Onboarding',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`https://api.github.com${path}`, {
      headers,
      signal: AbortSignal.timeout(12000)
    });
  } catch (err) {
    const error = new Error(err.name === 'TimeoutError' ? 'GitHub did not respond in time' : 'Could not reach GitHub');
    error.status = 504;
    throw error;
  }

  if (response.status === 404) {
    const error = new Error('Repository not found. It may be private, renamed, or mistyped.');
    error.status = 404;
    throw error;
  }
  if (response.status === 403 || response.status === 429) {
    const error = new Error('GitHub rate limit reached. Sign in with GitHub, or wait a few minutes.');
    error.status = 429;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(`GitHub returned ${response.status}`);
    error.status = 502;
    throw error;
  }
  return response.json();
}

function decodeContent(file) {
  if (!file || file.encoding !== 'base64' || !file.content) return '';
  return Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8').slice(0, 20000);
}

async function loadGitHubRepo(owner, name, token, onStep) {
  onStep(`Reading ${owner}/${name} from GitHub`);
  const repo = await githubFetch(`/repos/${owner}/${name}`, token);
  const tree = await githubFetch(`/repos/${owner}/${name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`, token);
  const files = (tree.tree || [])
    .filter((item) => item.type === 'blob')
    .slice(0, 800)
    .map((item) => ({ path: item.path, size: item.size || 0 }));

  const documents = {};
  const wanted = new Set(KEY_FILES.map((file) => file.toLowerCase()));
  const selected = files.filter((file) => wanted.has(file.path.toLowerCase()) || wanted.has(file.path.split('/').pop().toLowerCase())).slice(0, 8);

  for (const file of selected) {
    if (file.size > 80000) continue;
    try {
      const payload = await githubFetch(`/repos/${owner}/${name}/contents/${file.path.split('/').map(encodeURIComponent).join('/')}`, token);
      const text = decodeContent(payload);
      if (text) documents[file.path] = text;
    } catch {
      // A missing or binary file should not stop onboarding.
    }
  }

  if (!documents['README.md']) {
    try {
      const readme = await githubFetch(`/repos/${owner}/${name}/readme`, token);
      const text = decodeContent(readme);
      if (text) documents[readme.path || 'README.md'] = text;
    } catch {
      // No README is a finding, not a failure.
    }
  }

  return {
    kind: 'github',
    repo: `${owner}/${name}`,
    description: repo.description || '',
    defaultBranch: repo.default_branch,
    stars: repo.stargazers_count,
    language: repo.language,
    url: repo.html_url,
    files,
    truncated: Boolean(tree.truncated) || (tree.tree || []).length > 800,
    documents
  };
}

module.exports = { loadGitHubRepo };
