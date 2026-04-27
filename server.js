#!/usr/bin/env node
/**
 * HiveEvaluator MCP Server
 * ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service for autonomous AI agents
 *
 * Backend: https://hivemorph.onrender.com
 * Spec   : MCP 2024-11-05 / Streamable-HTTP / JSON-RPC 2.0
 * Brand  : Hive Civilization gold #C08D23 (Pantone 1245 C)
 */

import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HIVE_BASE = process.env.HIVE_BASE || 'https://hivemorph.onrender.com';

// ─── Tool definitions ────────────────────────────────────────────────────────
const TOOLS = [
{
  name: 'evaluator_get_fees',
  description: 'Get the live evaluator fee schedule (3 tiers, settlement currencies, recipient addresses, ERC-8183 / Virtuals ACP v2.0 spec). No auth required.',
  inputSchema: {
    type: 'object',
    properties: {

    },
  },
},    {
      name: 'evaluator_submit_job',
      description: 'Submit a job for evaluation. Choose tier (simple, evaluation, arbitration). Job value is quoted in USDC; fee = max($0.05, value * tier_bps / 10000). Returns job_id and quoted fee.',
      inputSchema: {
type: 'object',
required: ["tier", "job_value_usdc", "subject_did", "submitter_did"],
properties: {
  tier: { type: 'string', description: '\'simple\' (0.5%), \'evaluation\' (1.0%), or \'arbitration\' (2.0%)' },
  job_value_usdc: { type: 'number', description: 'Notional job value in USDC' },
  subject_did: { type: 'string', description: 'DID of the agent or output being evaluated' },
  submitter_did: { type: 'string', description: 'DID of the submitting agent' },
  context: { type: 'string', description: 'Free-form context for the evaluator (max 4 KB)' }
},
      },
    },    {
      name: 'evaluator_get_job',
      description: 'Retrieve evaluation status, verdict, and attestation for a previously-submitted job.',
      inputSchema: {
type: 'object',
required: ["job_id"],
properties: {
  job_id: { type: 'string', description: 'Job ID returned from evaluator_submit_job' }
},
      },
    },    {
      name: 'evaluator_attest_job',
      description: 'Trigger settlement and emit the on-chain attestation for a completed job. Settles to the Hive Safe Treasury on the chain selected at submission. Requires EIP-3009 signature for Base/Ethereum.',
      inputSchema: {
type: 'object',
required: ["job_id"],
properties: {
  job_id: { type: 'string', description: 'Job ID returned from evaluator_submit_job' },
  signature: { type: 'string', description: 'EIP-3009 signature (required for EVM chains)' }
},
      },
    }
];

// ─── HTTP helpers ────────────────────────────────────────────────────────────
async function hiveGet(path, params = {}) {
  const url = new URL(`${HIVE_BASE}${path.startsWith('/') ? path : '/' + path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  return res.json();
}
async function hivePost(path, body) {
  const res = await fetch(`${HIVE_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  let data; try { data = await res.json(); } catch { data = { raw: await res.text() }; }
  return { data, status: res.status };
}

// ─── Tool execution ──────────────────────────────────────────────────────────
async function executeTool(name, args) {
  switch (name) {
      case 'evaluator_get_fees': {
const data = await hiveGet('/v1/evaluator/fees');
return { type: 'text', text: JSON.stringify(data, null, 2) };
      }
      case 'evaluator_submit_job': {
const { data, status } = await hivePost('/v1/evaluator/jobs', {
  tier: args.tier,
  job_value_usdc: args.job_value_usdc,
  subject_did: args.subject_did,
  submitter_did: args.submitter_did,
  context: args.context
});
return { type: 'text', text: JSON.stringify({ status, ...data }, null, 2) };
      }
      case 'evaluator_get_job': {
const data = await hiveGet(`/v1/evaluator/jobs/${args.job_id}`);
return { type: 'text', text: JSON.stringify(data, null, 2) };
      }
      case 'evaluator_attest_job': {
const { data, status } = await hivePost(`/v1/evaluator/jobs/${args.job_id}/attest`, {
  signature: args.signature
});
return { type: 'text', text: JSON.stringify({ status, ...data }, null, 2) };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── MCP JSON-RPC handler ────────────────────────────────────────────────────
app.post('/mcp', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body || {};
  if (jsonrpc !== '2.0') return res.json({ jsonrpc:'2.0', id, error: { code:-32600, message:'Invalid JSON-RPC' } });
  try {
    switch (method) {
      case 'initialize':
        return res.json({ jsonrpc:'2.0', id, result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'hive-mcp-evaluator', version: '1.0.0', description: 'ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service for autonomous AI agents' },
        } });
      case 'tools/list':
        return res.json({ jsonrpc:'2.0', id, result: { tools: TOOLS } });
      case 'tools/call': {
        const { name, arguments: args } = params || {};
        const out = await executeTool(name, args || {});
        return res.json({ jsonrpc:'2.0', id, result: { content: [out] } });
      }
      case 'ping':
        return res.json({ jsonrpc:'2.0', id, result: {} });
      default:
        return res.json({ jsonrpc:'2.0', id, error: { code:-32601, message:`Method not found: ${method}` } });
    }
  } catch (err) {
    return res.json({ jsonrpc:'2.0', id, error: { code:-32000, message: err.message } });
  }
});

// ─── Discovery + health ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status:'ok', service:'hive-mcp-evaluator', version:'1.0.0', backend: HIVE_BASE }));
app.get('/.well-known/mcp.json', (req, res) => res.json({
  name: 'hive-mcp-evaluator',
  endpoint: '/mcp',
  transport: 'streamable-http',
  protocol: '2024-11-05',
  tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
}));

app.listen(PORT, () => {
  console.log(`HiveEvaluator MCP Server running on :${PORT}`);
  console.log(`  Backend : ${HIVE_BASE}`);
  console.log(`  Tools   : ${TOOLS.length}`);
});
