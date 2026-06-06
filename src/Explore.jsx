import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";

const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID || "0x8d36ca78a0781f6098f9f17f28124e3f1fde3b9975c62347e9cf8fab8cf8d959";
const PACKAGE_ID  = import.meta.env.VITE_PACKAGE_ID  || "0x9c878f43db4c79ffb76e43335564eafa1c3f6e46dcbfaef4e4008353a6509058";

const css = `
  .explore-page { padding: 48px 24px; max-width: 760px; margin: 0 auto; }
  @media (min-width: 768px) { .explore-page { padding: 64px 40px; } }

  .vault-list { display: flex; flex-direction: column; gap: 0; }

  .vault-row {
    display: flex; align-items: center; gap: 20px;
    padding: 20px 0; border-bottom: 1px solid var(--border);
    cursor: pointer; transition: all 0.15s;
    animation: fadeUp 0.4s ease both;
  }
  .vault-row:first-child { border-top: 1px solid var(--border); }
  .vault-row:hover .vr-name { color: var(--gold); }
  .vault-row:hover .vr-arrow { color: var(--gold); transform: translate(3px, -3px); }

  .vr-avatar {
    width: 44px; height: 44px; flex-shrink: 0;
    border: 1px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; font-size: 16px;
    color: var(--gold); background: var(--surface);
  }

  .vr-body { flex: 1; min-width: 0; }
  .vr-name { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--bone); transition: color 0.15s; line-height: 1; margin-bottom: 4px; }
  .vr-bio  { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px; color: var(--sand); line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .vr-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .vr-stat { text-align: right; }
  .vr-stat-val   { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: var(--bone); line-height: 1; }
  .vr-stat-label { font-size: 9px; color: var(--ash); letter-spacing: 0.1em; }
  .vr-arrow { font-size: 16px; color: var(--muted); transition: all 0.2s; }

  .loading-row { padding: 48px; text-align: center; font-size: 12px; color: var(--ash); letter-spacing: 0.1em; }
  .empty-state { padding: 64px 24px; text-align: center; }
  .empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: var(--ash); margin-bottom: 12px; }
  .empty-sub { font-size: 12px; color: var(--muted); letter-spacing: 0.06em; line-height: 1.8; }
`;

export default function Explore({ navigate }) {
  const suiClient = useSuiClient();
  const [vaults,  setVaults]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadVaults(); }, []);

  async function loadVaults() {
    setLoading(true);
    try {
      const events = await suiClient.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::vault::VaultCreated` },
        limit: 50,
      });

      const vaultIds = events.data.map(e => ({
        vaultId: e.parsedJson?.vault_id,
        owner:   e.parsedJson?.owner,
        name:    e.parsedJson?.name,
      })).filter(v => v.vaultId);

      const detailed = await Promise.all(
        vaultIds.map(async (v) => {
          try {
            const obj = await suiClient.getObject({ id: v.vaultId, options: { showContent: true } });
            const fields = obj?.data?.content?.fields;
            const pieces = fields?.pieces?.fields?.contents || [];
            const freePieces = pieces.filter(p => !p.fields?.value?.fields?.is_paid).length;
            return {
              ...v,
              bio: fields?.bio || "Independent analyst.",
              pieceCount: fields?.piece_count || pieces.length,
              freeCount: freePieces,
            };
          } catch { return v; }
        })
      );

      setVaults(detailed);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  return (
    <>
      <style>{css}</style>
      <div className="explore-page page">
        <button className="page-back" onClick={() => navigate("home")}>← BACK</button>
        <div className="page-title">RESEARCH VAULTS</div>
        <div className="page-sub" style={{marginBottom:"32px"}}>
          {loading
            ? "Loading vaults from chain..."
            : `${vaults.length} analyst${vaults.length !== 1 ? "s" : ""} · Access is free · Some content requires a mint`}
        </div>

        {loading && <div className="loading-row">⟳ FETCHING VAULTS FROM SUI...</div>}

        {!loading && vaults.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">NO VAULTS YET</div>
            <div className="empty-sub">Be the first to publish research.<br/>Connect your wallet and hit Publish.</div>
          </div>
        )}

        {!loading && vaults.length > 0 && (
          <div className="vault-list">
            {vaults.map((v, i) => {
              const displayName = v.name || `${v.owner?.slice(0,8)}...`;
              const initials = displayName.slice(0,2).toUpperCase();
              return (
                <div
                  className="vault-row"
                  key={v.vaultId}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => navigate("vault", { vaultId: v.vaultId, vaultData: v })}
                >
                  <div className="vr-avatar">{initials}</div>
                  <div className="vr-body">
                    <div className="vr-name">{displayName}</div>
                    <div className="vr-bio">{v.bio}</div>
                  </div>
                  <div className="vr-meta">
                    <div className="vr-stat">
                      <div className="vr-stat-val">{v.pieceCount || 0}</div>
                      <div className="vr-stat-label">PIECES</div>
                    </div>
                  </div>
                  <div className="vr-arrow">↗</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
