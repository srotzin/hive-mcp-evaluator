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
