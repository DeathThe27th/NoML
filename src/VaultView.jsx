import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || "0x9c878f43db4c79ffb76e43335564eafa1c3f6e46dcbfaef4e4008353a6509058";

function decrypt(encoded, key) {
  try {
    const bytes  = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const kb     = new TextEncoder().encode(key);
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) result[i] = bytes[i] ^ kb[i % kb.length];
    return new TextDecoder().decode(result);
  } catch { return null; }
}

const css = `
  .vault-view { padding: 48px 24px; max-width: 800px; margin: 0 auto; }
  @media (min-width: 768px) { .vault-view { padding: 64px 40px; } }
  .vault-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--border); }
  .vault-avatar-lg { width: 52px; height: 52px; flex-shrink: 0; border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: var(--gold); background: var(--bg); }
  .vault-stats { display: flex; gap: 24px; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .vs-val   { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: var(--bone); line-height: 1; }
  .vs-label { font-size: 8px; color: var(--ash); letter-spacing: 0.1em; margin-top: 3px; }
  .entries-list { display: flex; flex-direction: column; gap: 1px; background: var(--border); border: 1px solid var(--border); }
  .entry { background: var(--surface); padding: 20px; transition: background 0.18s; animation: fadeUp 0.4s ease both; }
  .entry-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
  .entry-title { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; font-size: 15px; color: var(--bone); line-height: 1.4; flex: 1; }
  .entry-badge { font-size: 7px; letter-spacing: 0.12em; padding: 3px 8px; flex-shrink: 0; font-weight: 700; }
  .badge-free { background: var(--border2); color: var(--ash); }
  .badge-paid { background: var(--gold); color: var(--ink); }
  .badge-sold { background: var(--muted); color: var(--ash); }
  .entry-preview { font-size: 9px; color: var(--ash); line-height: 1.8; }
  .entry-meta { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
  .entry-price { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: var(--gold); letter-spacing: 0.04em; }
  .entry-supply { font-size: 8px; color: var(--ash); }
  .entry-supply span { color: var(--gold); }
  .entry-action { font-size: 9px; letter-spacing: 0.1em; margin-left: auto; cursor: pointer; transition: color 0.15s; }
  .entry-action:hover { color: var(--gold); }
  .entry-action.gold { color: var(--gold); }
  .content-box { margin-top: 16px; padding: 16px; border: 1px solid var(--border2); background: var(--bg); font-size: 10px; color: var(--sand); line-height: 1.9; white-space: pre-wrap; font-family: 'Syne Mono', monospace; }
  .mint-btn { background: var(--gold); border: none; color: var(--ink); font-family: 'Syne Mono', monospace; font-size: 9px; letter-spacing: 0.1em; padding: 9px 18px; cursor: pointer; font-weight: 700; transition: background 0.15s; margin-left: auto; }
  .mint-btn:hover { background: #DCA840; }
  .mint-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .loading-row { padding: 32px; text-align: center; font-size: 9px; color: var(--ash); letter-spacing: 0.1em; }
`;

function Entry({ piece, vaultId, vaultOwner, account, signAndExecute }) {
  const [open,     setOpen]     = useState(false);
  const [content,  setContent]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [minting,  setMinting]  = useState(false);
  const [hasNFT,   setHasNFT]   = useState(false);
  const [mintError,setMintError]= useState("");
  const suiClient = useSuiClient();

  const soldOut   = !piece.is_paid && piece.supply > 0 && piece.minted >= piece.supply;
  const priceSui  = piece.price_mist ? (Number(piece.price_mist) / 1_000_000_000).toFixed(2) : null;
  const isOwner   = account?.address === vaultOwner;

  async function checkNFT() {
    if (!account) return false;
    try {
      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: { StructType: `${PACKAGE_ID}::vault::AccessNFT` },
        options: { showContent: true },
      });
      const found = objects.data?.some(o => {
        const fields = o.data?.content?.fields;
        return fields?.vault_owner === vaultOwner && String(fields?.piece_id) === String(piece.id);
      });
      setHasNFT(!!found);
      return !!found;
    } catch { return false; }
  }

  async function handleRead() {
    if (!open) {
      setOpen(true);
      setLoading(true);
      try {
        // Owner can always read their own content
        // Others need NFT for paid pieces
        if (piece.is_paid && !isOwner) {
          const owns = await checkNFT();
          if (!owns) { setLoading(false); return; }
        }
        // Fetch blob from Walrus
        const res = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${piece.blob_id}`);
        if (!res.ok) throw new Error("Failed to fetch from Walrus");
        const raw = await res.text();
        // Parse content from Walrus blob
        try {
          const parsed = JSON.parse(raw);
          setContent(parsed?.content || raw);
        } catch {
          setContent(raw);
        }
      } catch (err) { setContent(`Error: ${err.message}`); }
      setLoading(false);
    } else {
      setOpen(false);
    }
  }

  async function handleMint() {
    if (!account || !vaultId) return;
    setMinting(true);
    setMintError("");
    try {
      const tx = new Transaction();
      const priceMist = BigInt(piece.price_mist);

      // Use coins array indexing instead of destructuring
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

      tx.moveCall({
        target: `${PACKAGE_ID}::vault::mint_access`,
        arguments: [
          tx.object(vaultId),
          tx.pure.u64(BigInt(piece.id)),
          coin,
        ],
      });

      tx.setGasBudget(10000000);

      const result = await signAndExecute({ transaction: tx });
      if (!result?.digest) throw new Error("Transaction failed — no digest returned");

      // Wait for tx to be indexed on chain
      await new Promise(r => setTimeout(r, 3000));

      const confirmed = await checkNFT();
      if (confirmed) {
        setHasNFT(true);
        await handleRead();
      } else {
        setMintError("NFT indexing — click CHECK WALLET in a few seconds.");
      }
    } catch (err) {
      console.error("Mint error:", err);
      setMintError(err.message || "Mint failed. Try again.");
    }
    setMinting(false);
  }

  return (
    <div className="entry">
      <div className="entry-top">
        <div className="entry-title">{piece.title}</div>
        <div className={`entry-badge ${!piece.is_paid ? "badge-free" : soldOut ? "badge-sold" : "badge-paid"}`}>
          {!piece.is_paid ? "FREE" : soldOut ? "SOLD OUT" : "PAID"}
        </div>
      </div>

      <div className="entry-meta">
        {piece.is_paid && (
          <>
            <div className="entry-price">{priceSui} SUI</div>
            {piece.supply > 0 && (
              <div className="entry-supply"><span>{piece.minted}</span>/{piece.supply} minted</div>
            )}
          </>
        )}

        {/* Free piece or vault owner — read directly */}
        {(!piece.is_paid || isOwner) && (
          <div className="entry-action gold" onClick={handleRead}>
            {open ? "CLOSE ↑" : isOwner && piece.is_paid ? "READ (OWNER) →" : "READ FREE →"}
          </div>
        )}

        {/* Paid, not owner, has NFT */}
        {piece.is_paid && !isOwner && hasNFT && (
          <div className="entry-action gold" onClick={handleRead}>
            {open ? "CLOSE ↑" : "READ · NFT OWNED →"}
          </div>
        )}

        {/* Paid, not owner, no NFT, not sold out */}
        {piece.is_paid && !isOwner && !hasNFT && !soldOut && (
          <>
            <button className="mint-btn" onClick={handleMint} disabled={minting || !account}>
              {minting ? "MINTING..." : `MINT ACCESS · ${priceSui} SUI`}
            </button>
            <div className="entry-action" style={{marginLeft:0}} onClick={checkNFT}>
              CHECK WALLET
            </div>
          </>
        )}

        {mintError && (
          <div style={{fontSize:"8px",color:"#BF8A7D",width:"100%",marginTop:"4px"}}>{mintError}</div>
        )}
      </div>

      {open && loading && <div className="loading-row">⟳ FETCHING FROM WALRUS...</div>}
      {open && !loading && piece.is_paid && !hasNFT && (
        <div className="content-box" style={{color:"var(--ash)"}}>
          Connect wallet and mint access NFT to read this piece.
        </div>
      )}
      {open && !loading && content && (
        <div className="content-box">{content}</div>
      )}
    </div>
  );
}

export default function VaultView({ vaultId, vaultData, navigate }) {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vaultId) return;
    loadPieces();
  }, [vaultId]);

  async function loadPieces() {
    setLoading(true);
    try {
      const obj = await suiClient.getObject({
        id: vaultId,
        options: { showContent: true },
      });
      const fields = obj?.data?.content?.fields;
      if (fields?.pieces) {
        // VecMap entries
        const entries = fields.pieces?.fields?.contents || [];
        const parsed = entries.map(e => ({
          id: e.fields?.key,
          ...e.fields?.value?.fields,
        }));
        setPieces(parsed);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const name = vaultData?.name || `Vault ${vaultId?.slice(0,6)}`;
  const owner = vaultData?.owner || "";

  return (
    <>
      <style>{css}</style>
      <div className="vault-view page">
        <button className="page-back" onClick={() => navigate("explore")}>← ALL VAULTS</button>

        <div className="vault-header">
          <div className="vault-avatar-lg">{name.slice(0,2).toUpperCase()}</div>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"28px",color:"var(--bone)",lineHeight:1,marginBottom:"4px"}}>{name}</div>
            <div style={{fontSize:"9px",color:"var(--ash)",marginBottom:"8px"}}>{owner.slice(0,8)}...{owner.slice(-4)}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:"13px",color:"var(--sand)"}}>{vaultData?.bio || "Independent analyst."}</div>
          </div>
        </div>

        <div className="vault-stats">
          <div><div className="vs-val">{pieces.length}</div><div className="vs-label">TOTAL PIECES</div></div>
          <div><div className="vs-val">{pieces.filter(p=>!p.is_paid).length}</div><div className="vs-label">FREE TO READ</div></div>
          <div><div className="vs-val" style={{color:"var(--gold)"}}>x402</div><div className="vs-label">AGENT READABLE</div></div>
        </div>

        {loading ? (
          <div className="loading-row">⟳ LOADING PIECES FROM CHAIN...</div>
        ) : pieces.length === 0 ? (
          <div className="loading-row">NO PIECES YET.</div>
        ) : (
          <div className="entries-list">
            {pieces.map((p, i) => (
              <Entry
                key={p.id}
                piece={p}
                vaultId={vaultId}
                vaultOwner={owner}
                account={account}
                signAndExecute={signAndExecute}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
