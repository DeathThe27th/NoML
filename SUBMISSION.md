# No Man's Land — Tatum x Walrus Hackathon Submission

## Project Overview

**No Man's Land (NoML)** is a decentralized research marketplace where independent crypto analysts publish unfiltered intelligence to permanent, on-chain vaults. Content lives on Walrus forever. Readers pay per piece. AI agents consume the same content autonomously via x402.

**Live Demo:** https://no-ml.vercel.app  
**GitHub:** https://github.com/DeathThe27th/NoML  
**Network:** Sui Testnet  
**Track:** Alpha & Data Track

---

## The Problem

Independent crypto analysts doing Messari-quality work have no good publishing infrastructure:

- Substack/Patreon require credit cards, KYC, and are platform-dependent
- Messari and The Block filter analysis through compliance — directional calls get sanitized
- There is no native path for AI agents to autonomously discover and pay for crypto intelligence
- Content stored on centralized servers disappears when platforms shut down or ban accounts

---

## What We Built

### Core Architecture

```
Analyst → Publishes research → Walrus blob storage (permanent)
                             → Sui smart contract (on-chain registry)

Reader  → Browses vaults     → Fetches from Walrus
        → Pays per piece     → Mints access NFT on Sui

Agent   → Hits x402 endpoint → Receives 402 + payment details
        → Pays autonomously  → Gets content returned inline
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Sui Testnet |
| Storage | Walrus Testnet |
| RPC | Tatum Sui RPC |
| Smart Contract | Move (deployed on Sui Testnet) |
| Frontend | React + Vite (Vercel) |
| Wallet | Slush Wallet via @mysten/dapp-kit |
| Agent Endpoint | Express.js (x402 protocol) |

---

## Smart Contract

**Package ID:** `0x9c878f43db4c79ffb76e43335564eafa1c3f6e46dcbfaef4e4008353a6509058`  
**Registry ID:** `0x8d36ca78a0781f6098f9f17f28124e3f1fde3b9975c62347e9cf8fab8cf8d959`  
**Network:** Sui Testnet

### Contract Objects

**`Vault`** — Shared object. Created per analyst. Stores all piece metadata and blob IDs.

**`Piece`** — Stored inside Vault. Contains:
- Title, Walrus blob ID
- Free or paid flag
- Price in MIST
- Optional supply cap (limited edition drops)
- Mint count

**`AccessNFT`** — Minted to reader on payment. Contains blob ID reference. Proves ownership of a specific piece.

**`Registry`** — Global shared object tracking all vaults on-chain.

---

## Walrus Integration

Every piece of content published on NoML is stored as a blob on Walrus testnet:

1. Analyst writes research in the publish form
2. Content is serialized to JSON
3. Uploaded via `PUT /v1/blobs?epochs=N` to Walrus publisher endpoint
4. Walrus returns a `blob_id`
5. `blob_id` is stored in the Sui Vault object via `publish_piece` transaction
6. Readers fetch content via `GET /v1/blobs/:blobId` from Walrus aggregator

**Publisher chooses storage duration** — from 1 to 200 epochs (1 epoch ≈ 1 day on testnet).

NFT metadata is also stored on Walrus — the AccessNFT object on Sui references a Walrus blob containing piece title, analyst address, blob ID, and mint number.

---

## x402 Agent Endpoint

Every vault on NoML automatically exposes an x402-compatible HTTP endpoint. AI agents doing autonomous crypto research can:

1. **Discover** — `GET /vault/:vaultId/pieces` — browse all pieces in a vault (free)
2. **Request** — `GET /vault/:vaultId/piece/:pieceId` — attempt to fetch a piece
3. **Receive 402** — server returns payment details if piece is paid:
```json
{
  "x402": true,
  "payment": {
    "amount_sui": "1.20",
    "recipient": "0x922ae...",
    "network": "sui:testnet",
    "vault_id": "0x...",
    "piece_id": "0"
  }
}
```
4. **Pay** — agent signs and submits Sui transaction autonomously
5. **Retry** — with `x-payment-tx: <digest>` header
6. **Receive content** — full research piece returned inline

No API key. No subscription. No human needed.

---

## Tatum Integration

All Sui RPC calls are routed through Tatum's infrastructure:

```javascript
const suiClient = new SuiClient({
  url: `https://sui-testnet.tatum.io`,
  fetchOptions: {
    headers: { 'x-api-key': process.env.VITE_TATUM_API_KEY }
  },
});
```

Used for:
- Wallet connection and transaction signing
- Querying vault objects and piece data
- Verifying NFT ownership
- Publishing vault creation and piece registration transactions

---

## Features Delivered

| Feature | Status |
|---------|--------|
| Sui wallet connection (Slush) | ✅ |
| Analyst vault creation on-chain | ✅ |
| Publish research to Walrus | ✅ |
| Custom alias / display name | ✅ |
| Configurable storage epochs | ✅ |
| Free piece reading | ✅ |
| Explore page (real on-chain vaults) | ✅ |
| Paid piece access NFT (contract) | ✅ |
| x402 agent endpoint | ✅ |
| NFT mint frontend flow | ⚠️ Known bug — contract ownership model fix pending |

---

## Known Issues

**Paid NFT minting:** The vault object needs to be redeployed as a fully shared object for the mint flow to work from non-owner wallets. The contract logic is correct — `mint_access` properly splits payment and transfers to vault owner — but the deployment needs one redeploy. This is a one-command fix pending redeployment.

---

## What This Enables

- **Analysts** publish without a name, email, or bank account. Their Sui address is their identity.
- **Readers** pay per piece in SUI. No subscription. No platform cut. Content is theirs permanently via NFT.
- **AI agents** can autonomously consume crypto research mid-task — the first research marketplace natively readable by machines.
- **Limited supply drops** — analysts can cap access to 10, 20, or 50 mints — creating scarcity and a secondary market.

---

## Team

Solo builder — [@DeathThe27th](https://github.com/DeathThe27th)

---

## Running Locally

```bash
# Frontend
npm install
npm run dev

# x402 server
cd x402-server
npm install
node index.js
```

Set environment variables:
```
VITE_PACKAGE_ID=0x9c878f43db4c79ffb76e43335564eafa1c3f6e46dcbfaef4e4008353a6509058
VITE_REGISTRY_ID=0x8d36ca78a0781f6098f9f17f28124e3f1fde3b9975c62347e9cf8fab8cf8d959
VITE_NETWORK=testnet
VITE_TATUM_API_KEY=your_tatum_key
```
