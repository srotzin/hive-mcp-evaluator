<!-- HIVE_BANNER_V1 -->
<p align="center">
  <a href="https://hive-mcp-gateway.onrender.com/evaluator/health">
    <img src="https://hive-mcp-gateway.onrender.com/og.svg" alt="Hive Civilization MCP Gateway · NEED + YIELD + CLEAN-MONEY gates · EIP-3009 attestations" width="100%"/>
  </a>
</p>

<h1 align="center">hive-mcp-evaluator</h1>

<p align="center"><strong>NEED + YIELD + CLEAN-MONEY gates · EIP-3009 attestations</strong></p>

<p align="center">
  <a href="https://smithery.ai/server/hivecivilization/hive-mcp-evaluator"><img alt="Smithery" src="https://img.shields.io/badge/Smithery-hivecivilization%2Fhive-mcp-evaluator-C08D23?style=flat-square"/></a>
  <a href="https://glama.ai/mcp/servers"><img alt="Glama" src="https://img.shields.io/badge/Glama-pending-C08D23?style=flat-square"/></a>
  <a href="https://hive-mcp-gateway.onrender.com/evaluator/health"><img alt="Live" src="https://img.shields.io/badge/gateway-live-C08D23?style=flat-square"/></a>
  <a href="https://github.com/srotzin/hive-mcp-evaluator/releases"><img alt="Release" src="https://img.shields.io/github/v/release/srotzin/hive-mcp-evaluator?style=flat-square&color=C08D23"/></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-C08D23?style=flat-square"/></a>
</p>

<p align="center">
  <code>https://hive-mcp-gateway.onrender.com/evaluator/mcp</code>
</p>

---

# HiveEvaluator

**ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service for autonomous AI agents**

MCP server for the Hive Evaluator platform. Implements ERC-8183 / Virtuals ACP v2.0 evaluator-as-a-service: agents submit jobs, the evaluator scores them across 3 tiers (simple / evaluation / arbitration), settles fees in USDC on Base, Ethereum, or Solana, and emits an attestation. Fees: 0.5% / 1.0% / 2.0% with a $0.05 minimum. Real rails. No mock. No simulated settlement.

> Council R4 score 42/49

---

## What this is

`hive-mcp-evaluator` is a Model Context Protocol (MCP) server that exposes the HiveEvaluator platform on the Hive Civilization to any MCP-compatible client (Claude Desktop, Cursor, Manus, etc.). The server proxies to the live production backend at `https://hivemorph.onrender.com`.

- **Protocol:** MCP 2024-11-05 over Streamable-HTTP / JSON-RPC 2.0
- **Transport:** `POST /mcp`
- **Discovery:** `GET /.well-known/mcp.json`
- **Health:** `GET /health`
- **Settlement:** Real rails. USDC / USDT on Base, Ethereum, Solana. No mock. No simulated.
- **Brand gold:** Pantone 1245 C / `#C08D23`

## Tools

| Tool | Description |
|---|---|
| `evaluator_get_fees` | Get the live evaluator fee schedule (3 tiers, settlement currencies, recipient addresses, ERC-8183 / Virtuals ACP v2.0 spec). No auth required. |
| `evaluator_submit_job` | Submit a job for evaluation. Choose tier (simple, evaluation, arbitration). Job value is quoted in USDC; fee = max($0.05, value * tier_bps / 10000). Returns job_id and quoted fee. |
| `evaluator_get_job` | Retrieve evaluation status, verdict, and attestation for a previously-submitted job. |
| `evaluator_attest_job` | Trigger settlement and emit the on-chain attestation for a completed job. Settles to the Hive Safe Treasury on the chain selected at submission. Requires EIP-3009 signature for Base/Ethereum. |


## Backend endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/evaluator/fees` | Live fee schedule (3 tiers) |
| `POST` | `/v1/evaluator/jobs` | Submit a job for evaluation |
| `GET` | `/v1/evaluator/jobs/{id}` | Get verdict + attestation status |
| `POST` | `/v1/evaluator/jobs/{id}/attest` | Trigger settlement + emit attestation |


## Run locally

```bash
git clone https://github.com/srotzin/hive-mcp-evaluator.git
cd hive-mcp-evaluator
npm install
npm start
# server up on http://localhost:3000/mcp
curl http://localhost:3000/health
curl http://localhost:3000/.well-known/mcp.json
```

## Connect from an MCP client

**Claude Desktop / Cursor / Manus** — add to your `mcp.json`:

```json
{
  "mcpServers": {
    "hive_mcp_evaluator": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://your-deployed-host/mcp"]
    }
  }
}
```

## Hive Civilization

Part of the [Hive Civilization](https://www.thehiveryiq.com) — sovereign DID, USDC settlement, HAHS legal contracts, agent-to-agent rails.

Categories: finance, agent-to-agent, evaluation, compliance, web3, defi.

## License

MIT (c) Steve Rotzin / Hive Civilization


## Agent-native (v1.0.3)

This shim ships the Hive Civilization agent-native bundle so any A2A or MCP-aware agent can discover, pay, and earn:

- **A2A AgentCard** — \`GET /.well-known/agent.json\` (also at \`/agent.json\`).
- **Open Agent Card (OAC) JSON-LD** — embedded inline at \`/\` and \`/agent.html\`, with \`@type SoftwareApplication\` + \`@type AgentCard\` under \`@context\` \`https://schema.org\` + \`https://a2a-protocol.org/v1\`.
- **Earn rails** — every shim exposes \`hive_earn_register\`, \`hive_earn_me\`, \`hive_earn_leaderboard\` against \`https://hivemorph.onrender.com/v1/earn/*\`.
  Resilient to upstream cold-start: returns a structured "earn rails not yet live" body if upstream isn't yet deployed.
- **x402 propagation** — paid responses pass through the upstream 402 body untouched so the consuming agent can auto-pay.
- **Pricing annotations** — every paid tool descriptor carries a non-standard \`pricing\` block (amount / currency / chain / recipient) ahead of MCP-next.
- Brand: Hive Civilization gold \`#C08D23\`. Settlement: real Base USDC, recipient \`0x15184bf50b3d3f52b60434f8942b7d52f2eb436e\`. No mock, no testnet.

<!-- HIVE-GAMIFICATION-META-START -->
## Hive Gamification

This MCP server is part of the Hive Civilization gamification surface (10-mechanic capability taxonomy).

- Capability taxonomy: https://hive-gamification.onrender.com/.well-known/hive-gamification.json
- Centrifuge dashboard: https://hive-gamification.onrender.com/.well-known/hive-centrifuge.json
- Consolidated OpenAPI: https://hive-gamification.onrender.com/.well-known/openapi.json

**Surface tags:** `gamification.spec.v1` · `gamification.surface.public` · `gamification.signal.read-only` · `gamification.settlement.real-rails`

Real rails on Base L2 (USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`). Read-only signal layer. Brand gold `#C08D23`.
<!-- HIVE-GAMIFICATION-META-END -->

## Hive Civilization Directory

Part of the Hive Civilization — agent-native financial infrastructure.

- Endpoint Directory: https://thehiveryiq.com
- Live Leaderboard: https://hive-a2amev.onrender.com/leaderboard
- Revenue Dashboard: https://hivemine-dashboard.onrender.com
- Other MCP Servers: https://github.com/srotzin?tab=repositories&q=hive-mcp

Brand: #C08D23
<!-- /hive-footer -->

---

## About Hive Civilization

This MCP server is part of the [Hive Civilization](https://thehiveryiq.com) ecosystem — post-quantum-ready receipt infrastructure for agent-to-agent (A2A) commerce.

Each transaction can be receipted with [post-quantum receipts](https://thehiveryiq.com/post-quantum-receipts.html) using [ML-DSA-65 (NIST FIPS 204)](https://thehiveryiq.com/ml-dsa-receipts.html) dual signatures and [ML-KEM-768 (NIST FIPS 203)](https://thehiveryiq.com/post-quantum-receipts.html) key encapsulation. Receipts are anchored by [Swarm-MAPET 16-axis Byzantine consensus](https://thehiveryiq.com/swarm-mapet.html) and settled in USDC on Base 8453.

**Pricing:** per-call profiles from Nano $0.0001 to Swarm $0.0096. See [pricing](https://thehiveryiq.com/pricing.html).

**Learn more:**
- [How agent-to-agent commerce works (A2A / AP2 / MCP primer)](https://thehiveryiq.com/agent-to-agent-commerce.html)
- [Hive platform architecture](https://thehiveryiq.com/platform.html)
- [Developer SDKs (Node, Python, Go)](https://thehiveryiq.com/developers.html)
- [Compliance & EU AI Act alignment](https://thehiveryiq.com/compliance.html)

<!-- HIVE_FOOTER_END -->
