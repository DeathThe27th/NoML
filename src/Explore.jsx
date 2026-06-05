import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";

const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID || "0x8d36ca78a0781f6098f9f17f28124e3f1fde3b9975c62347e9cf8fab8cf8d959";
const PACKAGE_ID  = import.meta.env.VITE_PACKAGE_ID  || "0x9c878f43db4c79ffb76e43335564eafa1c3f6e46dcbfaef4e4008353a6509058";

const css = `
  .explore-page { padding: 48px 24px; max-width: 960px; margin: 0 auto; }
  @media (min-width: 768px) { .explore-page { padding: 64px 40px; } }
  .analysts-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); }
  @media (min-width: 560px) { .analysts-grid { grid-template-columns: repeat(2,1fr); } }
  @media (min-width: 860px) { .analysts-grid { grid-template-columns: repeat(3,1fr); } }
  .analyst-card { background: var(--surface); padding: 24px 20px; cursor: pointer; transition: background 0.2s; display: flex; flex-direction: column; animation: fadeUp 0.4s ease both; }
  .analyst-card:hover { background: #201810; }
  .analyst-card:hover .ac-enter { color: var(--gold); }
  .ac-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .ac-avatar { width: 38px; height: 38px; border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 14px; color: var(--gold); background: var(--bg); flex-shrink: 0; }
  .ac-name   { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.05em; color: var(--bone); margin-bottom: 2px; }
  .ac-handle { font-size: 8px; color: var(--ash); letter-spacing: 0.08em; margin-bottom: 12px; }
  .ac-bio    { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300; font-size: 13px; color: var(--sand); line-height: 1.6; margin-bottom: 16px; flex: 1; }
  .ac-footer { border-top: 1px solid var(--border); padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }
  .ac-stat-val   { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: var(--bone); line-height: 1; }
  .ac-stat-label { font-size: 7px; color: var(--ash); letter-spacing: 0.1em; margin-top: 2px; }
  .ac-enter  { font-size: 8px; letter-spacing: 0.12em; color: var(--ash); transition: color 0.2s; }
  .loading-row { padding: 48px; text-align: center; font-size: 9px; color: var(--ash); letter-spacing: 0.12em; }
  .empty-state { padding: 64px 24px; text-align: center; }
  .empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: var(--ash); margin-bottom: 12px; }
  .empty-sub { font-size: 9px; color: var(--muted); letter-spacing: 0.08em; line-height: 1.8; }
`;

export default function Explore({ navigate }) {
  const suiClient = useSuiClient();
  const [vaults,  setVaults]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadVaults(); }, []);

  async function loadVaults() {
    setLoading(true);
    try {
      // Query all VaultCreated events to discover vaults
      const events = await suiClient.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::vault::VaultCreated` },
        limit: 50,
      });

      const vaultIds = events.data.map(e => ({
        vaultId:  e.parsedJson?.vault_id,
        owner:    e.parsedJson?.owner,
        name:     e.parsedJson?.name,
      })).filter(v => v.vaultId);

      // Fetch each vault object for piece counts
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
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <>
      <style>{css}</style>
      <div className="explore-page page">
        <button className="page-back" onClick={() => navigate("home")}>← BACK</button>
        <div className="page-title">RESEARCH VAULTS</div>
        <div className="page-sub" style={{marginBottom:"32px"}}>
          {loading ? "Loading vaults from chain..." : `${vaults.length} analyst${vaults.length !== 1 ? "s" : ""} · Access is free · Some content requires a mint`}
        </div>

        {loading && <div className="loading-row">⟳ FETCHING VAULTS FROM SUI...</div>}

        {!loading && vaults.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">NO VAULTS YET</div>
            <div className="empty-sub">Be the first to publish research.<br/>Connect your wallet and hit Publish.</div>
          </div>
        )}

        {!loading && vaults.length > 0 && (
          <div className="analysts-grid">
            {vaults.map((v, i) => {
              const initials = (v.name || v.owner || "??").slice(0,2).toUpperCase();
              return (
                <div
                  className="analyst-card"
                  key={v.vaultId}
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => navigate("vault", { vaultId: v.vaultId, vaultData: v })}
                >
                  <div className="ac-top">
                    <div className="ac-avatar">{initials}</div>
                  </div>
                  <div className="ac-name">{v.name || `${v.owner?.slice(0,8)}...`}</div>
                  <div className="ac-handle">{v.owner?.slice(0,8)}...{v.owner?.slice(-4)}</div>
                  <div className="ac-bio">{v.bio}</div>
                  <div className="ac-footer">
                    <div style={{display:"flex",gap:"20px"}}>
                      {[["PIECES", v.pieceCount||0],["FREE", v.freeCount||0]].map(([l,val])=>(
                        <div key={l}>
                          <div className="ac-stat-val">{val}</div>
                          <div className="ac-stat-label">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="ac-enter">ENTER ↗</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
