/**
 * No Man's Land — x402 Agent Endpoint
 * 
 * AI agents can autonomously discover, pay for, and consume
 * research content from any vault without human intervention.
 * 
 * Protocol: x402 (HTTP Payment Required)
 * Chain: Sui Testnet
 * Storage: Walrus
 */

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app  = express();
const PORT = process.env.PORT || 3001;

const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const PACKAGE_ID        = process.env.PACKAGE_ID  || "0x9c878f43db4c79ffb76e43335564eafa1c3f6e46dcbfaef4e4008353a6509058";
const SUI_RPC           = process.env.SUI_RPC      || "https://fullnode.testnet.sui.io:443";
const PRICE_MIST        = 1_000_000_000; // 1 SUI default price

app.use(cors());
app.use(express.json());

/**
 * GET /vault/:vaultId/pieces
 * List all pieces in a vault — free for agents to browse
 */
app.get("/vault/:vaultId/pieces", async (req, res) => {
  try {
    const { vaultId } = req.params;
    const obj = await suiGetObject(vaultId);
    const fields = obj?.data?.content?.fields;
    if (!fields) return res.status(404).json({ error: "Vault not found" });

    const pieces = (fields.pieces?.fields?.contents || []).map(e => ({
      id:       e.fields?.key,
      title:    e.fields?.value?.fields?.title,
      is_paid:  e.fields?.value?.fields?.is_paid,
      price_sui: e.fields?.value?.fields?.is_paid
        ? (Number(e.fields?.value?.fields?.price_mist) / 1e9).toFixed(2)
        : "0",
      supply:   e.fields?.value?.fields?.supply,
      minted:   e.fields?.value?.fields?.minted,
      blob_id:  e.fields?.value?.fields?.blob_id,
    }));

    res.json({ vault: vaultId, pieces });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /vault/:vaultId/piece/:pieceId
 * 
 * x402 flow:
 * 1. Agent requests piece
 * 2. If paid → server returns 402 with payment details
 * 3. Agent pays on Sui
 * 4. Agent retries with tx digest in header
 * 5. Server verifies payment → returns content
 */
app.get("/vault/:vaultId/piece/:pieceId", async (req, res) => {
  try {
    const { vaultId, pieceId } = req.params;
    const txDigest = req.headers["x-payment-tx"];

    // Fetch vault from Sui
    const obj = await suiGetObject(vaultId);
    const fields = obj?.data?.content?.fields;
    if (!fields) return res.status(404).json({ error: "Vault not found" });

    const contents = fields.pieces?.fields?.contents || [];
    const entry = contents.find(e => String(e.fields?.key) === String(pieceId));
    if (!entry) return res.status(404).json({ error: "Piece not found" });

    const piece = entry.fields?.value?.fields;
    const blobId = piece?.blob_id;
    const isPaid = piece?.is_paid;
    const priceMist = piece?.price_mist;
    const vaultOwner = fields.owner;

    // Free piece — return immediately
    if (!isPaid) {
      const content = await fetchBlob(blobId);
      return res.json({ piece_id: pieceId, content, free: true });
    }

    // Paid piece — check for payment tx in header
    if (!txDigest) {
      return res.status(402).json({
        x402: true,
        message: "Payment required to access this piece",
        payment: {
          amount_mist: priceMist,
          amount_sui:  (Number(priceMist) / 1e9).toFixed(2),
          recipient:   vaultOwner,
          network:     "sui:testnet",
          vault_id:    vaultId,
          piece_id:    pieceId,
        },
        instructions: [
          "1. Send SUI to recipient address on Sui testnet",
          "2. Retry this request with header: x-payment-tx: <your_tx_digest>",
        ],
      });
    }

    // Verify payment transaction
    const verified = await verifyPayment(txDigest, vaultOwner, priceMist);
    if (!verified) {
      return res.status(402).json({
        x402: true,
        error: "Payment verification failed",
        provided_tx: txDigest,
      });
    }

    // Payment verified — return content
    const content = await fetchBlob(blobId);
    res.json({
      piece_id:    pieceId,
      content,
      paid:        true,
      verified_tx: txDigest,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /health
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "NoML x402 Agent Endpoint", network: "sui:testnet" });
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function suiGetObject(id) {
  const res = await fetch(SUI_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "sui_getObject",
      params: [id, { showContent: true }],
    }),
  });
  const data = await res.json();
  return data.result;
}

async function fetchBlob(blobId) {
  const res = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`);
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { return raw; }
}

async function verifyPayment(txDigest, recipient, expectedMist) {
  try {
    const res = await fetch(SUI_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "sui_getTransactionBlock",
        params: [txDigest, { showEffects: true, showInput: true }],
      }),
    });
    const data = await res.json();
    const tx   = data.result;
    if (!tx) return false;
    if (tx.effects?.status?.status !== "success") return false;
    // Basic check — tx exists and succeeded
    // Production: verify exact recipient + amount from balance changes
    return true;
  } catch { return false; }
}

app.listen(PORT, () => {
  console.log(`NoML x402 server running on port ${PORT}`);
  console.log(`Agent endpoint: GET /vault/:vaultId/piece/:pieceId`);
});
