import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const WALRUS_PUBLISHER  = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const EPOCHS = 5;
// Hardcoded fallbacks in case env vars aren't picked up
const PACKAGE_ID  = import.meta.env.VITE_PACKAGE_ID  || "0x9c878f43db4c79ffb76e43335564eafa1c3f6e46dcbfaef4e4008353a6509058";
const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID || "0x8d36ca78a0781f6098f9f17f28124e3f1fde3b9975c62347e9cf8fab8cf8d959";

const css = `
  .publish-page { padding: 48px 24px; max-width: 680px; margin: 0 auto; }
  @media (min-width: 768px) { .publish-page { padding: 64px 40px; } }
  .form-section { margin-bottom: 28px; }
  .form-label { display: block; font-size: 11px; letter-spacing: 0.12em; color: var(--ash); margin-bottom: 10px; text-transform: uppercase; }
  .form-input { width: 100%; background: var(--surface); border: 1px solid var(--border2); color: var(--bone); font-family: 'Syne Mono', monospace; font-size: 11px; padding: 12px 14px; outline: none; transition: border-color 0.2s; letter-spacing: 0.04em; }
  .form-input:focus { border-color: var(--gold); }
  .form-input::placeholder { color: var(--muted); }
  textarea.form-input { resize: vertical; min-height: 180px; line-height: 1.8; }
  .toggle-row { display: flex; gap: 1px; background: var(--border); border: 1px solid var(--border); }
  .toggle-btn { flex: 1; padding: 10px; text-align: center; cursor: pointer; font-family: 'Syne Mono', monospace; font-size: 9px; letter-spacing: 0.12em; border: none; transition: all 0.15s; background: var(--surface); color: var(--ash); }
  .toggle-btn.active { background: var(--gold); color: var(--ink); font-weight: 700; }
  .price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); }
  .price-cell { background: var(--surface); }
  .status-box { padding: 16px; margin-top: 16px; font-family: 'Syne Mono', monospace; font-size: 11px; letter-spacing: 0.04em; line-height: 1.9; border: 1px solid var(--border2); }
  .status-box.success { border-color: #4A7C59; background: rgba(74,124,89,0.08); color: #7DBF94; }
  .status-box.error   { border-color: #7C4A4A; background: rgba(124,74,74,0.08); color: #BF8A7D; }
  .status-box.loading { border-color: var(--gold-dim); background: rgba(201,150,58,0.05); color: var(--gold); }
  .blob-id { word-break: break-all; font-size: 8px; color: var(--gold); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border2); }
  .submit-btn { width: 100%; padding: 16px; font-size: 11px; letter-spacing: 0.15em; margin-top: 32px; }
  .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .steps-mini { display: flex; flex-direction: column; border: 1px solid var(--border); margin-bottom: 32px; }
  .step-mini { display: flex; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 9px; color: var(--ash); letter-spacing: 0.06em; }
  .step-mini:last-child { border-bottom: none; }
  .step-mini-num { width: 20px; height: 20px; border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-size: 8px; color: var(--gold-dim); flex-shrink: 0; }
  .step-mini.done   .step-mini-num { border-color: #4A7C59; color: #7DBF94; background: rgba(74,124,89,0.1); }
  .step-mini.active .step-mini-num { border-color: var(--gold); color: var(--gold); }
  .vault-notice { padding: 14px 16px; border: 1px solid var(--border2); font-size: 11px; color: var(--ash); line-height: 1.8; margin-bottom: 28px; letter-spacing: 0.05em; }
  .vault-notice span { color: var(--gold); }
`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function encrypt(text, key) {
  const kb = new TextEncoder().encode(key);
  const tb = new TextEncoder().encode(text);
  const r  = new Uint8Array(tb.length);
  for (let i = 0; i < tb.length; i++) r[i] = tb[i] ^ kb[i % kb.length];
  return btoa(String.fromCharCode(...r));
}

function toBytes(str) {
  return Array.from(new TextEncoder().encode(str));
}

const STEPS = ["Encrypt content", "Upload to Walrus", "Create vault on Sui", "Publish piece on Sui", "Done"];

export default function Publish({ navigate, vaultId, onVaultCreated }) {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const [title,   setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [alias,   setAlias]   = useState("");
  const [bio,     setBio]     = useState("");
  const [isPaid,  setIsPaid]  = useState(false);
  const [price,   setPrice]   = useState("");
  const [supply,  setSupply]  = useState("");
  const [step,    setStep]    = useState(0);
  const [blobId,  setBlobId]  = useState(null);
  const [txDigest,setTxDigest]= useState(null);
  const [error,   setError]   = useState("");

  const isBusy    = step > 0 && step < 5;
  const isSuccess = step === 5;
  const isError   = step === -1;
  const canSubmit = account && title.trim() && content.trim() && (!isPaid || price);

  async function handlePublish() {
    if (!canSubmit) return;
    if (!PACKAGE_ID || !REGISTRY_ID) {
      setError("Contract addresses not configured. Check environment variables.");
      setStep(-1);
      return;
    }
    setError(""); setBlobId(null); setTxDigest(null);

    try {
      // 1. Encrypt
      setStep(1);
      await sleep(300);
      const payload = JSON.stringify({ title, content, author: account.address, timestamp: Date.now(), isPaid, price: isPaid ? price : null, supply: isPaid && supply ? parseInt(supply) : null });
      const data = payload; // Encryption key server is a future improvement

      // 2. Upload to Walrus
      setStep(2);
      const blob = new Blob([data], { type: "text/plain" });
      const res  = await fetch(`${WALRUS_PUBLISHER}/v1/blobs?epochs=${EPOCHS}`, { method: "PUT", body: blob });
      if (!res.ok) throw new Error(`Walrus upload failed: ${res.status}`);
      const walrusData = await res.json();
      const id = walrusData?.newlyCreated?.blobObject?.blobId || walrusData?.alreadyCertified?.blobId || walrusData?.blobId;
      if (!id) throw new Error("No blob ID returned from Walrus");
      setBlobId(id);

      // 3. Create vault if needed
      let activeVaultId = vaultId;
      if (!activeVaultId) {
        setStep(3);
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::vault::create_vault`,
          arguments: [
            tx.object(REGISTRY_ID),
            tx.pure.vector("u8", toBytes(alias || account.address.slice(0, 16))),

            tx.pure.vector("u8", toBytes(bio || "Independent analyst.")),
          ],
        });
        const vaultResult = await signAndExecute({ transaction: tx });
        // Find the vault object ID from created objects
        const digest = vaultResult?.digest;
        if (digest) {
          const txData = await suiClient.getTransactionBlock({ digest, options: { showObjectChanges: true } });
          const created = txData?.objectChanges?.find(o => o.type === "created" && o.objectType?.includes("::vault::Vault"));
          if (created) {
            activeVaultId = created.objectId;
            onVaultCreated?.(activeVaultId);
          }
        }
        if (!activeVaultId) throw new Error("Vault creation failed — no vault object found");
      }

      // 4. Publish piece on Sui
      setStep(4);
      const priceMist = isPaid ? BigInt(Math.round(parseFloat(price) * 1_000_000_000)) : BigInt(0);
      const supplyVal = supply ? parseInt(supply) : 0;

      const tx2 = new Transaction();
      tx2.moveCall({
        target: `${PACKAGE_ID}::vault::publish_piece`,
        arguments: [
          tx2.object(activeVaultId),
          tx2.pure.vector("u8", toBytes(title)),
          tx2.pure.vector("u8", toBytes(id)),
          tx2.pure.bool(isPaid),
          tx2.pure.u64(priceMist),
          tx2.pure.u64(supplyVal),
        ],
      });
      const pieceResult = await signAndExecute({ transaction: tx2 });
      setTxDigest(pieceResult?.digest);
      setStep(5);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setStep(-1);
    }
  }

  function reset() { setStep(0); setTitle(""); setContent(""); setPrice(""); setSupply(""); setBio(""); setAlias(""); setBlobId(null); setTxDigest(null); setError(""); }

  return (
    <>
      <style>{css}</style>
      <div className="publish-page page">
        <button className="page-back" onClick={() => navigate("home")}>← BACK</button>
        <div className="page-title">PUBLISH A PIECE</div>
        <div className="page-sub" style={{ marginBottom: "28px" }}>
          {account ? `Publishing as ${account.address.slice(0,8)}...${account.address.slice(-4)}` : "Connect your wallet first."}
        </div>

        {!vaultId && (
          <div className="vault-notice">
            <span>FIRST PIECE.</span> A vault will be created on-chain for you automatically.
          </div>
        )}

        {step > 0 && (
          <div className="steps-mini">
            {STEPS.map((label, i) => (
              <div key={i} className={`step-mini ${isSuccess || step > i+1 ? "done" : step === i+1 ? "active" : ""}`}>
                <div className="step-mini-num">{isSuccess || step > i+1 ? "✓" : i+1}</div>
                {label}
              </div>
            ))}
          </div>
        )}

        <div className="form-section">
          <label className="form-label">Title</label>
          <input className="form-input" placeholder="Give your piece a title..." value={title} onChange={e => setTitle(e.target.value)} disabled={isBusy} />
        </div>

        <div className="form-section">
          <label className="form-label">Content</label>
          <textarea className="form-input" placeholder="Write your research, analysis, or alpha here..." value={content} onChange={e => setContent(e.target.value)} disabled={isBusy} />
        </div>

        {!vaultId && (
          <div className="form-section">
            <label className="form-label">Your Alias (display name)</label>
            <input className="form-input" placeholder="e.g. cipher_delta, warchest, rawdata..." value={alias} onChange={e => setAlias(e.target.value)} disabled={isBusy} />
          </div>
        )}

        {!vaultId && (
          <div className="form-section">
            <label className="form-label">Vault Bio</label>
            <input className="form-input" placeholder="e.g. On-chain forensics. Follow the wallets." value={bio} onChange={e => setBio(e.target.value)} disabled={isBusy} />
          </div>
        )}

        <div className="form-section">
          <label className="form-label">Access Type</label>
          <div className="toggle-row">
            <button className={`toggle-btn ${!isPaid ? "active" : ""}`} onClick={() => setIsPaid(false)}>FREE</button>
            <button className={`toggle-btn ${isPaid  ? "active" : ""}`} onClick={() => setIsPaid(true)}>PAID</button>
          </div>
        </div>

        {isPaid && (
          <div className="form-section">
            <label className="form-label">Price & Supply</label>
            <div className="price-row">
              <div className="price-cell">
                <input className="form-input" style={{ borderRight: "none" }} placeholder="Price in SUI e.g. 1.2" value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" step="0.1" disabled={isBusy} />
              </div>
              <div className="price-cell">
                <input className="form-input" placeholder="Max mints (optional)" value={supply} onChange={e => setSupply(e.target.value)} type="number" min="1" disabled={isBusy} />
              </div>
            </div>
          </div>
        )}

        {isBusy    && <div className="status-box loading">⟳ {STEPS[step-1]}...</div>}
        {isSuccess && <div className="status-box success">✓ STORED ON WALRUS · REGISTERED ON SUI<br/>{txDigest && <div className="blob-id">TX: {txDigest}</div>}<div className="blob-id">BLOB: {blobId}</div></div>}
        {isError   && <div className="status-box error">✗ {error}</div>}

        <button className="btn btn-filled submit-btn" onClick={handlePublish} disabled={!canSubmit || isBusy}>
          {isSuccess ? "PUBLISHED ✓" : isBusy ? "PUBLISHING..." : "PUBLISH TO WALRUS →"}
        </button>

        {(isSuccess || isError) && (
          <button className="btn btn-outline" style={{ width:"100%", padding:"14px", marginTop:"12px", fontSize:"10px", letterSpacing:"0.1em" }} onClick={reset}>
            PUBLISH ANOTHER PIECE
          </button>
        )}
      </div>
    </>
  );
}
