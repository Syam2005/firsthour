function parseRepo(input) {
  let raw = String(input || '').trim();
  if (!raw) {
    const error = new Error('Enter a GitHub repository URL');
    error.status = 400;
    throw error;
  }
  raw = raw.replace(/\.git$/i, '');
  raw = raw.replace(/\/(tree|blob|issues|pull)\/.*$/i, '');
  raw = raw.replace(/\/$/, '');

  const url = raw.match(/^https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/i);
  const pair = raw.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  const match = url || pair;
  if (!match) {
    const error = new Error('Use owner/name or a https://github.com/owner/name URL');
    error.status = 400;
    throw error;
  }
  return { owner: match[1], name: match[2], full: `${match[1]}/${match[2]}` };
}

module.exports = { parseRepo };
