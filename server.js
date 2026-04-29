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
import { HIVE_EARN_TOOLS, executeHiveEarnTool, isHiveEarnTool } from './hive-earn-tools.js';
import { buildAgentCard, buildOacJsonLd, renderRootHtml } from './hive-agent-card.js';
import { renderLanding, renderRobots, renderSitemap, renderSecurity, renderOgImage, seoJson, BRAND_GOLD } from './meta.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HIVE_BASE = process.env.HIVE_BASE || 'https://hivemorph.onrender.com';

// ─── Tool definitions ────────────────────────────────────────────────────────

// ─── Agent-native config (A2A AgentCard + OAC JSON-LD + earn rails) ───────
const HIVE_AGENT_CFG = {
  name: 'HiveEvaluator MCP',
  description: "ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service MCP server. Real Base USDC settlement, NEED + YIELD + CLEAN-MONEY gates, EIP-3009 attestations.",
  url: 'https://hive-mcp-gateway.onrender.com/evaluator',
  version: '1.0.3',
  repoUrl: 'https://github.com/srotzin/hive-mcp-evaluator',
  did: 'did:hive:evaluator',
  gatewayUrl: 'https://hive-mcp-gateway.onrender.com',
  // Tools attached at runtime (after merging earn tools in)
  tools: [],
};

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


const SERVICE_CFG = {
  service: "hive-mcp-evaluator",
  shortName: "HiveEvaluator",
  title: "HiveEvaluator \u00b7 ERC-8183 Evaluator-as-a-Service MCP",
  tagline: "ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service for autonomous AI agents.",
  description: "MCP server for HiveEvaluator \u2014 ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service. Three-tier scoring (simple / evaluation / arbitration), USDC settlement on Base, Ethereum, or Solana, EIP-3009 attestations. Fees 0.5% / 1.0% / 2.0%, $0.05 minimum. Real rails.",
  keywords: ["mcp", "model-context-protocol", "x402", "agentic", "ai-agent", "ai-agents", "llm", "hive", "hive-civilization", "evaluator", "erc-8183", "virtuals-acp", "attestation", "eip-3009", "usdc", "base", "base-l2", "a2a"],
  externalUrl: "https://hive-mcp-evaluator.onrender.com",
  gatewayMount: "/evaluator",
  version: "1.0.2",
  pricing: [
    { name: "evaluator_simple", priceUsd: 0.05, label: "Simple tier \u2014 0.5% / $0.05 min" },
    { name: "evaluator_evaluation", priceUsd: 0.05, label: "Evaluation tier \u2014 1.0% / $0.05 min" },
    { name: "evaluator_arbitration", priceUsd: 0.05, label: "Arbitration tier \u2014 2.0% / $0.05 min" }
  ],
};
SERVICE_CFG.tools = (typeof TOOLS !== 'undefined' ? TOOLS : (typeof MCP_TOOLS !== 'undefined' ? MCP_TOOLS : [])).map(t => ({ name: t.name, description: t.description }));

// HIVE_AGENT_NATIVE_v1 — earn tools + AgentCard wiring
for (const t of HIVE_EARN_TOOLS) {
  if (!TOOLS.find(x => x.name === t.name)) TOOLS.push(t);
}
HIVE_AGENT_CFG.tools = TOOLS;
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
  // HIVE_AGENT_DISPATCH_v1 — earn tools first, then native dispatch
  if (isHiveEarnTool(name)) {
    const out = await executeHiveEarnTool(name, args);
    if (out) return out;
  }
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


// HIVE_META_BLOCK_v1 — comprehensive meta tags + JSON-LD + crawler discovery
app.get('/', (req, res) => {
  // HIVE_AGENT_INJECT_LD_v1 — inject OAC JSON-LD into the meta-tags landing
  const __landing = renderLanding(SERVICE_CFG);
  const __oacLd = JSON.stringify(buildOacJsonLd(HIVE_AGENT_CFG)).replace(/</g, '\\u003c');
  const __ldTag = '\n<script type="application/ld+json">' + __oacLd + '</script>\n';
  const __out = __landing.replace('</head>', __ldTag + '</head>');
  res.type('text/html; charset=utf-8').send(__out);
});
app.get('/og.svg', (req, res) => {
  res.type('image/svg+xml').send(renderOgImage(SERVICE_CFG));
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(renderRobots(SERVICE_CFG));
});
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(renderSitemap(SERVICE_CFG));
});
app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain').send(renderSecurity());
});
app.get('/seo.json', (req, res) => res.json(seoJson(SERVICE_CFG)));
// HIVE_AGENT_ROUTES_v1 — A2A AgentCard + OAC JSON-LD
app.get('/.well-known/agent.json', (req, res) => {
  res.json(buildAgentCard(HIVE_AGENT_CFG));
});
app.get('/agent.json', (req, res) => {
  res.json(buildAgentCard(HIVE_AGENT_CFG));
});
app.get('/.well-known/oac.json', (req, res) => {
  res.json(buildOacJsonLd(HIVE_AGENT_CFG));
});
app.get('/agent.html', (req, res) => {
  res.type('text/html; charset=utf-8').send(renderRootHtml(HIVE_AGENT_CFG));
});


// ─── Schema discoverability ────────────────────────────────────────────────
const AGENT_CARD = {
  name: SERVICE,
  description: `MCP server for the Hive Evaluator platform. Implements ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service: agents submit jobs, the evaluator scores them across 3 tiers (simple / evaluation / arbitrat. New agents: first call free. Loyalty: every 6th paid call is free. Pay in USDC on Base L2.`,
  url: `https://${SERVICE}.onrender.com`,
  provider: {
    organization: 'Hive Civilization',
    url: 'https://www.thehiveryiq.com',
    contact: 'steve@thehiveryiq.com',
  },
  version: VERSION,
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  authentication: {
    schemes: ['x402'],
    credentials: {
      type: 'x402',
      asset: 'USDC',
      network: 'base',
      asset_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      recipient: '0x15184bf50b3d3f52b60434f8942b7d52f2eb436e',
    },
  },
  defaultInputModes: ['application/json'],
  defaultOutputModes: ['application/json'],
  skills: TOOLS.map(t => ({ name: t.name, description: t.description })),
  extensions: {
    hive_pricing: {
      currency: 'USDC',
      network: 'base',
      model: 'per_call',
      first_call_free: true,
      loyalty_threshold: 6,
      loyalty_message: 'Every 6th paid call is free',
    },
  },
};

const AP2 = {
  ap2_version: '1',
  agent: {
    name: SERVICE,
    did: `did:web:${SERVICE}.onrender.com`,
    description: `MCP server for the Hive Evaluator platform. Implements ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service: agents submit jobs, the evaluator scores them across 3 tiers (simple / evaluation / arbitrat. New agents: first call free. Loyalty: every 6th paid call is free. Pay in USDC on Base L2.`,
  },
  endpoints: {
    mcp: `https://${SERVICE}.onrender.com/mcp`,
    agent_card: `https://${SERVICE}.onrender.com/.well-known/agent-card.json`,
  },
  payments: {
    schemes: ['x402'],
    primary: {
      scheme: 'x402',
      network: 'base',
      asset: 'USDC',
      asset_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      recipient: '0x15184bf50b3d3f52b60434f8942b7d52f2eb436e',
    },
  },
  brand: { color: '#C08D23', name: 'Hive Civilization' },
};

app.get('/.well-known/agent-card.json', (req, res) => res.json(AGENT_CARD));
app.get('/.well-known/ap2.json', (req, res) => res.json(AP2));


app.listen(PORT, () => {
  console.log(`HiveEvaluator MCP Server running on :${PORT}`);
  console.log(`  Backend : ${HIVE_BASE}`);
  console.log(`  Tools   : ${TOOLS.length}`);
});
