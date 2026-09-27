async function getAccessToken() {
  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) throw new Error('WATSONX_API_KEY not set');
  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(apiKey)}`,
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`IAM token fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data.access_token) throw new Error('IAM did not return an access token');
  return data.access_token;
}

async function complete(systemPrompt, userMessage) {
  const url = process.env.WATSONX_URL;
  const projectId = process.env.WATSONX_PROJECT_ID;
  // granite-4-h-small is available on this account via the chat endpoint
  const model = process.env.WATSONX_MODEL || 'ibm/granite-4-h-small';
  if (!url || !projectId || !process.env.WATSONX_API_KEY) {
    throw new Error('watsonx not configured: set WATSONX_URL, WATSONX_PROJECT_ID, WATSONX_API_KEY');
  }
  const token = await getAccessToken();

  const res = await fetch(`${url}/ml/v1/text/chat?version=2023-05-29`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model_id: model,
      project_id: projectId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      parameters: {
        max_new_tokens: 512,
        temperature: 0.2
      }
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`watsonx returned ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  // Chat endpoint returns choices[0].message.content
  return data.choices?.[0]?.message?.content?.trim() || '';
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model did not return JSON');
  return JSON.parse(raw.slice(start, end + 1));
}

async function completeJson(systemPrompt, userMessage) {
  const text = await complete(systemPrompt, userMessage);
  return extractJson(text);
}

async function chat(message, contextPack) {
  const system = [
    'You are an onboarding assistant. You have one source of truth: the project pack below.',
    'Answer only from what is in the pack. If the answer is not there, say "I do not know — that information is not in this project pack."',
    'Be concise. Do not invent file paths, commands, or credentials.',
    `Project pack:\n${contextPack.slice(0, 8000)}`
  ].join('\n');
  return complete(system, message);
}

module.exports = { complete, completeJson, chat };
