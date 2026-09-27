const themeSelect = document.querySelector('#theme');
const account = document.querySelector('#account');
const form = document.querySelector('#form');
const repoInput = document.querySelector('#repo');
const go = document.querySelector('#go');
const formError = document.querySelector('#form-error');
const llmNote = document.querySelector('#llm-note');
const live = document.querySelector('#live');
const liveStatus = document.querySelector('#live-status');
const timeline = document.querySelector('#timeline');
const results = document.querySelector('#results');
const historyEl = document.querySelector('#history');

function applyTheme(value) {
  const theme = ['light', 'dark', 'system'].includes(value) ? value : 'system';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('firsthour-theme', theme);
  themeSelect.value = theme;
}

themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
applyTheme(localStorage.getItem('firsthour-theme') || 'system');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function showError(message) {
  formError.hidden = !message;
  formError.textContent = message || '';
}

async function loadMe() {
  const me = await fetch('/api/me').then((response) => response.json());
  if (me.login) {
    account.innerHTML = `<span>${escapeHtml(me.login)}</span> <button type="button" id="logout">Sign out</button>`;
    document.querySelector('#logout').addEventListener('click', async () => {
      await fetch('/auth/logout', { method: 'POST' });
      location.reload();
    });
  } else if (me.githubOAuth) {
    account.innerHTML = '<a class="ghost primary" href="/auth/github">Sign in with GitHub</a>';
  } else {
    account.textContent = 'Public repos';
  }
  llmNote.textContent = me.llm === 'none'
    ? 'No model key yet. Agents use the file tree. Add a free Gemini or Groq key in .env to turn on the language-model pass.'
    : `Language-model pass: ${me.llm}.`;
}

function addTimeline(name, detail) {
  const item = document.createElement('li');
  item.innerHTML = `<span class="agent-name">${escapeHtml(name)}</span><span>${escapeHtml(detail)}</span>`;
  timeline.appendChild(item);
}

function renderResult(result) {
  results.hidden = false;
  document.querySelector('#result-source').textContent = result.source === 'rules' ? 'File-based agents' : `Model agents · ${result.source}`;
  document.querySelector('#result-title').textContent = result.repo;
  document.querySelector('#result-summary').textContent = result.summary || '';
  const link = document.querySelector('#result-link');
  if (result.url) {
    link.hidden = false;
    link.href = result.url;
  } else {
    link.hidden = true;
  }
  document.querySelector('#architecture').innerHTML = (result.architecture || []).map((item) =>
    `<div class="item"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.detail)}</span></div>`
  ).join('');
  document.querySelector('#setup').innerHTML = (result.setup || []).map((item) =>
    `<div class="item"><b class="${item.ok ? 'ok' : 'bad'}">${item.ok ? 'Pass' : 'Gap'}</b> ${escapeHtml(item.label)}<span>${escapeHtml(item.detail)}</span></div>`
  ).join('');
  document.querySelector('#tasks').innerHTML = (result.tasks || []).map((item) =>
    `<div class="item"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.file)}</span><span>${escapeHtml(item.why)}</span><span>Proof: ${escapeHtml(item.proof)}</span></div>`
  ).join('');
  document.querySelector('#risks').innerHTML = (result.risks || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

async function loadHistory() {
  const rows = await fetch('/api/analyses').then((response) => response.json());
  if (!rows.length) {
    historyEl.innerHTML = '<p class="muted">None yet.</p>';
    return;
  }
  historyEl.innerHTML = rows.map((row) =>
    `<div class="item"><button type="button" data-id="${escapeHtml(row.id)}">${escapeHtml(row.repo)}</button> <span class="muted">${escapeHtml(row.status)} · ${escapeHtml(row.source || '')}</span></div>`
  ).join('');
  historyEl.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', async () => {
      const row = await fetch(`/api/analyses/${button.dataset.id}`).then((response) => response.json());
      if (row.result) renderResult(row.result);
    });
  });
}

function watch(id) {
  live.hidden = false;
  timeline.innerHTML = '';
  results.hidden = true;
  const source = new EventSource(`/api/analyses/${id}/events`);
  const timer = setTimeout(() => {
    source.close();
    showError('This onboarding took too long. Check GitHub or the model key, then try again.');
    go.disabled = false;
  }, 90000);

  source.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === 'status') {
      liveStatus.textContent = payload.detail;
      addTimeline('status', payload.detail);
    }
    if (payload.type === 'agent') addTimeline(payload.agent, payload.detail);
    if (payload.type === 'error') {
      clearTimeout(timer);
      source.close();
      showError(payload.detail);
      liveStatus.textContent = 'Stopped';
      go.disabled = false;
      loadHistory();
    }
    if (payload.type === 'done') {
      clearTimeout(timer);
      source.close();
      liveStatus.textContent = 'Finished';
      renderResult(payload.result);
      go.disabled = false;
      loadHistory();
    }
  };
  source.onerror = () => {
    clearTimeout(timer);
    source.close();
    showError('The live update connection closed. Open Recent onboardings if the run finished.');
    go.disabled = false;
    loadHistory();
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError('');
  go.disabled = true;
  try {
    const response = await fetch('/api/analyses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: repoInput.value.trim() })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Could not start onboarding');
    watch(payload.id);
  } catch (err) {
    showError(err.message);
    go.disabled = false;
  }
});

document.querySelectorAll('[data-repo]').forEach((button) => {
  button.addEventListener('click', () => {
    repoInput.value = button.dataset.repo;
    form.requestSubmit();
  });
});

loadMe().catch(() => { llmNote.textContent = 'Could not read account status.'; });
loadHistory().catch(() => { historyEl.innerHTML = '<p class="form-error">Could not load history.</p>'; });
