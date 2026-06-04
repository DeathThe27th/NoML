import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

// Walrus testnet endpoints
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const EPOCHS = 5; // store for 5 epochs

const css = `
  .publish-page { padding: 48px 24px; max-width: 680px; margin: 0 auto; }
  @media (min-width: 768px) { .publish-page { padding: 64px 40px; } }

  .form-section { margin-bottom: 32px; }
  .form-label {
    display: block; font-size: 8px; letter-spacing: 0.18em;
    color: var(--ash); margin-bottom: 10px; text-transform: uppercase;
  }
  .form-input {
    width: 100%; background: var(--surface); border: 1px solid var(--border2);
    color: var(--bone); font-family: 'Syne Mono', monospace; font-size: 11px;
    padding: 12px 14px; outline: none; transition: border-color 0.2s;
    letter-spacing: 0.04em;
  }
  .form-input:focus { border-color: var(--gold); }
  .form-input::placeholder { color: var(--muted); }
  textarea.form-input { resize: vertical; min-height: 180px; line-height: 1.8; }

  .toggle-row {
    display: flex; gap: 1px; background: var(--border);
    border: 1px solid var(--border); margin-bottom: 0;
  }
  .toggle-btn {
    flex: 1; padding: 10px; text-align: center; cursor: pointer;
    font-family: 'Syne Mono', monospace; font-size: 9px;
    letter-spacing: 0.12em; border: none; transition: all 0.15s;
    background: var(--surface); color: var(--ash);
  }
  .toggle-btn.active { background: var(--gold); color: var(--ink); font-weight: 700; }

  .price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); }
  .price-cell { background: var(--surface); padding: 0; }

  .status-box {
    padding: 16px; margin-top: 16px;
    font-family: 'Syne Mono', monospace; font-size: 9px;
    letter-spacing: 0.06em; line-height: 1.9;
    border: 1px solid var(--border2);
  }
  .status-box.success { border-color: #4A7C59; background: rgba(74,124,89,0.08); color: #7DBF94; }
  .status-box.error   { border-color: #7C4A4A; background: rgba(124,74,74,0.08); color: #BF8A7D; }
  .status-box.loading { border-color: var(--gold-dim); background: rgba(201,150,58,0.05); color: var(--gold); }

  .blob-id {
    word-break: break-all; font-size: 8px;
    color: var(--gold); margin-top: 8px; padding-top: 8px;
    border-top: 1px solid var(--border2);
  }

  .submit-btn {
    width: 100%; padding: 16px; font-size: 11px;
    letter-spacing: 0.15em; margin-top: 32px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .divider { height: 1px; background: var(--border); margin: 32px 0; }

  .steps-mini {
    display: flex; gap: 0; flex-direction: column;
    border: 1px solid var(--border); margin-bottom: 32px;
  }
  .step-mini {
    display: flex; gap: 12px; align-items: center;
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    font-size: 9px; color: var(--ash); letter-spacing: 0.06em;
  }
  .step-mini:last-child { border-bottom: none; }
  .step-mini-num {
    width: 20px; height: 20px; border: 1px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; color: var(--gold-dim); flex-shrink: 0;
  }
  .step-mini.done .step-mini-num { border-color: #4A7C59; color: #7DBF94; background: rgba(74,124,89,0.1); }
  .step-mini.active .step-mini-num { border-color: var(--gold); color: var(--gold); }
`;

export default function Publish({ navigate }) {
  const account = useCurrentAccount();

  const [title,     setTitle]     = useState("");
  const [content,   setContent]   = useState("");
  const [isPaid,    setIsPaid]    = useState(false);
  const [price,     setPrice]     = useState("");
  const [supply,    setSupply]    = useState("");
  const [status,    setStatus]    = useState(null); // null | "encrypting" | "uploading" | "success" | "error"
  const [blobId,    setBlobId]    = useState(null);
  const [errorMsg,  setErrorMsg]  = useState("");

  const canSubmit = account && title.trim() && content.trim() && (!isPaid || price);

  async function handlePublish() {
    if (!canSubmit) return;

    try {
      // Step 1 — encrypt (XOR with wallet address as key, simple demo encryption)
      setStatus("encrypting");
      await sleep(400);

      const payload = JSON.stringify({
        title,
        content,
        author: account.address,
        timestamp: Date.now(),
        isPaid,
        price: isPaid ? price : null,
        supply: isPaid && supply ? parseInt(supply) : null,
      });

      const encrypted = simpleEncrypt(payload, account.address);

      // Step 2 — upload to Walrus
      setStatus("uploading");

      const blob = new Blob([encrypted], { type: "text/plain" });

      const res = await fetch(
        `${WALRUS_PUBLISHER}/v1/blobs?epochs=${EPOCHS}`,
        { method: "PUT", body: blob }
      );

      if (!res.ok) throw new Error(`Walrus upload failed: ${res.status}`);

      const data = await res.json();

      // Walrus returns either newlyCreated or alreadyCertified
      const id =
        data?.newlyCreated?.blobObject?.blobId ||
        data?.alreadyCertified?.blobId ||
        data?.blobId;

      if (!id) throw new Error("No blob ID returned from Walrus");

      setBlobId(id);
      setStatus("success");

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  const currentStep = status === null ? 0 : status === "encrypting" ? 1 : status === "uploading" ? 2 : 3;

  return (
    <>
      <style>{css}</style>
      <div className="publish-page page">
        <button className="page-back" onClick={() => navigate("home")}>← BACK</button>
        <div className="page-title">PUBLISH A PIECE</div>
        <div className="page-sub" style={{marginBottom:"32px"}}>
          {account
            ? `Publishing as ${account.address.slice(0,8)}...${account.address.slice(-4)}`
            : "Connect your wallet first."}
        </div>

        {/* Progress steps */}
        {status && (
          <div className="steps-mini">
            {[
              ["1","Encrypt content"],
              ["2","Upload to Walrus"],
              ["3","Done — blob stored"],
            ].map(([n, label], i) => (
              <div key={n} className={`step-mini ${currentStep > i+1 || status==="success" && i===2 ? "done" : currentStep === i+1 ? "active" : ""}`}>
                <div className="step-mini-num">
                  {currentStep > i+1 || (status==="success" && i===2) ? "✓" : n}
                </div>
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="form-section">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            placeholder="Give your piece a title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={status === "uploading" || status === "encrypting"}
          />
        </div>

        {/* Content */}
        <div className="form-section">
          <label className="form-label">Content</label>
          <textarea
            className="form-input"
            placeholder="Write your research, analysis, or alpha here..."
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={status === "uploading" || status === "encrypting"}
          />
        </div>

        {/* Free / Paid toggle */}
        <div className="form-section">
          <label className="form-label">Access Type</label>
          <div className="toggle-row">
            <button className={`toggle-btn ${!isPaid ? "active" : ""}`} onClick={() => setIsPaid(false)}>FREE</button>
            <button className={`toggle-btn ${isPaid  ? "active" : ""}`} onClick={() => setIsPaid(true)}>PAID</button>
          </div>
        </div>

        {/* Price + Supply (paid only) */}
        {isPaid && (
          <div className="form-section">
            <label className="form-label">Price & Supply</label>
            <div className="price-row">
              <div className="price-cell">
                <input
                  className="form-input"
                  style={{borderRight:"none"}}
                  placeholder="Price in SUI e.g. 1.2"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  type="number" min="0" step="0.1"
                />
              </div>
              <div className="price-cell">
                <input
                  className="form-input"
                  placeholder="Max mints (optional)"
                  value={supply}
                  onChange={e => setSupply(e.target.value)}
                  type="number" min="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        {status === "encrypting" && (
          <div className="status-box loading">⟳ ENCRYPTING CONTENT...</div>
        )}
        {status === "uploading" && (
          <div className="status-box loading">⟳ UPLOADING TO WALRUS TESTNET...</div>
        )}
        {status === "success" && (
          <div className="status-box success">
            ✓ PIECE STORED ON WALRUS TESTNET<br/>
            ✓ {isPaid ? `PRICE: ${price} SUI · SUPPLY: ${supply || "UNLIMITED"}` : "FREE ACCESS"}<br/>
            <div className="blob-id">BLOB ID: {blobId}</div>
          </div>
        )}
        {status === "error" && (
          <div className="status-box error">✗ ERROR: {errorMsg}</div>
        )}

        <button
          className="btn btn-filled submit-btn"
          onClick={handlePublish}
          disabled={!canSubmit || status === "uploading" || status === "encrypting"}
        >
          {status === "success" ? "PUBLISHED ✓" : "PUBLISH TO WALRUS →"}
        </button>

        {status === "success" && (
          <button
            className="btn btn-outline"
            style={{width:"100%",padding:"14px",marginTop:"12px",fontSize:"10px",letterSpacing:"0.1em"}}
            onClick={() => { setStatus(null); setTitle(""); setContent(""); setPrice(""); setSupply(""); setBlobId(null); }}
          >
            PUBLISH ANOTHER PIECE
          </button>
        )}
      </div>
    </>
  );
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Simple XOR encryption — good enough for demo, replace with AES in prod
function simpleEncrypt(text, key) {
  const keyBytes = new TextEncoder().encode(key);
  const textBytes = new TextEncoder().encode(text);
  const result = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...result));
}
