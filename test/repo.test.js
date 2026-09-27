const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRepo } = require('../src/repo');
const { heuristic } = require('../src/agents');

test('parseRepo accepts owner/name and a GitHub URL', () => {
  assert.deepEqual(parseRepo('expressjs/express').full, 'expressjs/express');
  assert.equal(parseRepo('https://github.com/expressjs/express').full, 'expressjs/express');
  assert.equal(parseRepo('https://github.com/expressjs/express.git').full, 'expressjs/express');
  assert.equal(parseRepo('https://github.com/expressjs/express/tree/master/lib').full, 'expressjs/express');
});

test('parseRepo rejects empty and unsafe input', () => {
  assert.throws(() => parseRepo(''), /Enter a GitHub repository/);
  assert.throws(() => parseRepo('https://gitlab.com/a/b'), /owner\/name/);
  assert.throws(() => parseRepo('../secret'), /owner\/name/);
});

test('heuristic builds setup gaps and starter tasks from a file list', () => {
  const result = heuristic({
    repo: 'acme/widgets',
    description: 'Widget service',
    language: 'JavaScript',
    files: [{ path: 'package.json', size: 10 }, { path: 'src/server.js', size: 20 }],
    documents: {},
    truncated: false
  });
  assert.equal(result.setup.find((item) => item.label === 'README').ok, false);
  assert.ok(result.tasks.length >= 3);
  assert.match(result.summary, /acme\/widgets/);
});
