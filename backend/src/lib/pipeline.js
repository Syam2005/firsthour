const { dbQuery } = require('../db');
const { loadGitHubRepo } = require('./github');
const { loadZip } = require('./ziploader');
const { runAgents } = require('./agents');

const jobs = new Map();

function getJob(runId) {
  return jobs.get(runId) || null;
}

function emit(job, event) {
  job.events.push(event);
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of job.listeners) {
    try { res.write(line); } catch { /* ignore closed connections */ }
  }
}

async function startAnalysis(runId, input) {
  const job = {
    id: runId,
    status: 'running',
    events: [],
    listeners: new Set()
  };
  jobs.set(runId, job);

  setImmediate(async () => {
    try {
      emit(job, { type: 'status', state: 'reading', detail: 'Reading the project…' });

      let snapshot;
      if (input.kind === 'github') {
        snapshot = await loadGitHubRepo(input.owner, input.name, (detail) =>
          emit(job, { type: 'status', state: 'reading', detail })
        );
      } else {
        snapshot = await loadZip(input.buffer, input.filename, (detail) =>
          emit(job, { type: 'status', state: 'reading', detail })
        );
      }

      emit(job, { type: 'status', state: 'agents', detail: 'Agents reading in parallel…' });
      const result = await runAgents(snapshot, (event) => emit(job, event));

      await dbQuery((client) =>
        client.from('runs').update({
          status: 'done',
          summary: result.summary,
          result_json: JSON.stringify(result)
        }).eq('id', runId)
      );

      job.status = 'done';
      emit(job, { type: 'done', result });

    } catch (err) {
      const detail = err.message || 'Analysis failed';
      try {
        await dbQuery((client) =>
          client.from('runs').update({ status: 'error', summary: detail }).eq('id', runId)
        );
      } catch { /* best effort */ }
      job.status = 'error';
      emit(job, { type: 'error', detail });
    } finally {
      // Keep job in memory for 10 minutes for SSE replay
      setTimeout(() => jobs.delete(runId), 10 * 60 * 1000);
      // Close all SSE listeners
      for (const res of job.listeners) {
        try { res.end(); } catch {}
      }
      job.listeners.clear();
    }
  });
}

module.exports = { startAnalysis, getJob };
