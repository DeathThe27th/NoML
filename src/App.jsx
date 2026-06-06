import { useState } from "react";
import { useCurrentAccount, useDisconnectWallet, useWallets, useConnectWallet } from "@mysten/dapp-kit";
import Publish   from "./Publish.jsx";
import Explore   from "./Explore.jsx";
import VaultView from "./VaultView.jsx";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@1,300;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:       #0F0A0A;
    --surface:  #1A1010;
    --border:   #2C1818;
    --border2:  #3D2020;
    --gold:     #C0392B;
    --gold-dim: #7B241C;
    --bone:     #F0E8D8;
    --sand:     #D4C4A0;
    --ash:      #9A8878;
    --muted:    #4D3D3D;
    --ink:      #0A0505;
  }
  html, body { height: 100%; }
  body { background: var(--bg); color: var(--bone); font-family: 'Syne Mono', monospace; -webkit-font-smoothing: antialiased; overflow-x: hidden; font-size: 14px; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold); }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  .page { animation: fadeIn 0.3s ease both; }

  nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(15,10,10,0.97); border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px); height: 56px; padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
  .logo-mark { width: 32px; height: 32px; }
  .nav-right { display: flex; gap: 8px; align-items: center; }

  .btn { font-family: 'Syne Mono', monospace; font-size: 11px; letter-spacing: 0.08em; cursor: pointer; border: none; padding: 8px 16px; transition: all 0.18s; }
  .btn-outline { background: none; border: 1px solid var(--border2); color: var(--ash); }
  .btn-outline:hover { border-color: var(--gold); color: var(--gold); }
  .btn-filled { background: var(--gold); color: #fff; font-weight: 700; }
  .btn-filled:hover { background: #E74C3C; }
  .wallet-address { font-family: 'Syne Mono', monospace; font-size: 11px; color: var(--gold); border: 1px solid var(--border2); padding: 8px 14px; letter-spacing: 0.04em; display: flex; align-items: center; gap: 8px; }
  .wallet-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); }

  .modal-overlay { position: fixed; inset: 0; z-index: 999; background: rgba(10,5,5,0.9); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .modal-box { background: var(--surface); border: 1px solid var(--border2); width: 100%; max-width: 360px; animation: fadeUp 0.2s ease both; }
  .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.06em; color: var(--bone); }
  .modal-close { background: none; border: none; color: var(--ash); font-size: 20px; cursor: pointer; }
  .modal-body  { padding: 12px; }
  .modal-footer { padding: 14px 24px; border-top: 1px solid var(--border); font-size: 10px; color: var(--muted); letter-spacing: 0.06em; line-height: 1.8; }
  .wallet-option { display: flex; align-items: center; gap: 14px; padding: 16px 12px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
  .wallet-option:hover { background: #1A100F; border-color: var(--border2); }
  .wallet-icon { width: 38px; height: 38px; border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; overflow: hidden; background: var(--bg); }
  .wallet-icon img { width: 24px; height: 24px; object-fit: contain; }
  .wallet-name { font-size: 13px; color: var(--sand); letter-spacing: 0.04em; }
  .wallet-cta  { margin-left: auto; font-size: 10px; color: var(--muted); letter-spacing: 0.08em; }

  /* LANDING */
  .landing { min-height: calc(100vh - 56px); display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 48px 24px; position: relative; overflow: hidden; }
  .landing-bg { position: absolute; inset: 0; z-index: 0; background: radial-gradient(ellipse 70% 40% at 50% 90%, rgba(192,57,43,0.08) 0%, transparent 70%); }
  .landing-grid { position: absolute; inset: 0; z-index: 0; background-image: linear-gradient(rgba(192,57,43,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(192,57,43,0.04) 1px, transparent 1px); background-size: 48px 48px; }
  .landing-content { position: relative; z-index: 1; max-width: 600px; width: 100%; }

  .landing-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(64px,16vw,120px); line-height: 0.9; letter-spacing: 0.02em; margin-bottom: 32px; animation: fadeUp 0.5s ease 0.1s both; }
  .landing-title .solid   { display: block; color: var(--bone); }
  .landing-title .outline { display: block; color: transparent; -webkit-text-stroke: 2px var(--gold-dim); }

  .landing-sub { font-family: 'Syne Mono', monospace; font-size: clamp(11px,2.8vw,13px); color: var(--ash); line-height: 2.1; margin-bottom: 52px; animation: fadeUp 0.5s ease 0.2s both; max-width: 480px; letter-spacing: 0.05em; }
  .landing-paths { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; animation: fadeUp 0.5s ease 0.3s both; width: 100%; }
  @media (max-width: 400px) { .landing-paths { grid-template-columns: 1fr; } }
  .path-card { border: 1px solid var(--border2); background: var(--surface); padding: 32px 24px; cursor: pointer; transition: all 0.22s; text-align: left; position: relative; overflow: hidden; }
  .path-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--gold); transform:scaleX(0); transform-origin:left; transition:transform 0.22s; }
  .path-card:hover { border-color: var(--gold); background: #1A100F; transform: translateY(-3px); }
  .path-card:hover::before { transform: scaleX(1); }
  .path-icon  { font-size: 22px; margin-bottom: 16px; display: block; }
  .path-label { font-family: 'Bebas Neue', sans-serif; font-size: 30px; letter-spacing: 0.06em; color: var(--bone); margin-bottom: 10px; }
  .path-desc  { font-size: 11px; color: var(--ash); line-height: 1.8; }
  .path-arrow { position: absolute; bottom: 20px; right: 20px; font-size: 20px; color: var(--gold-dim); transition: all 0.2s; }
  .path-card:hover .path-arrow { color: var(--gold); transform: translate(3px,-3px); }

  .page-back { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 0.1em; color: var(--ash); cursor: pointer; background: none; border: none; margin-bottom: 28px; transition: color 0.15s; font-family: 'Syne Mono', monospace; }
  .page-back:hover { color: var(--gold); }
  .page-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(40px,9vw,62px); letter-spacing: 0.04em; color: var(--bone); line-height: 1; margin-bottom: 12px; }
  .page-sub   { font-size: 11px; color: var(--ash); letter-spacing: 0.06em; line-height: 1.8; }
`;

function NoMLMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 32 32" fill="none">
      <rect x="1" y="1" width="30" height="30" stroke="#C0392B" strokeWidth="1.2"/>
      <text x="16" y="21" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="11" fill="#C0392B" letterSpacing="0.5">NoML</text>
    </svg>
  );
}

function WalletModal({ onClose }) {
  const wallets = useWallets();
  const { mutate: connectWallet, isPending } = useConnectWallet();
  const slush = wallets.find(w => w.name.toLowerCase().includes("slush") || w.name.toLowerCase().includes("sui wallet"));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">CONNECT WALLET</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {slush ? (
            <div className="wallet-option" onClick={() => connectWallet({ wallet: slush }, { onSuccess: onClose })}>
              <div className="wallet-icon">
                {slush.icon ? <img src={slush.icon} alt="Slush"/> : <span style={{color:"#C0392B",fontSize:"18px"}}>◈</span>}
              </div>
              <div className="wallet-name">{slush.name}</div>
              <div className="wallet-cta">{isPending ? "CONNECTING..." : "CONNECT →"}</div>
            </div>
          ) : (
            <div style={{padding:"28px",textAlign:"center"}}>
              <div style={{fontFamily:"'Syne Mono',monospace",fontSize:"12px",color:"var(--ash)",lineHeight:1.8,marginBottom:"20px"}}>
                Slush Wallet not detected.<br/>Install it to continue.
              </div>
              <a href="https://slush.app" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-block",background:"var(--gold)",color:"#fff",fontFamily:"'Syne Mono',monospace",fontSize:"11px",letterSpacing:"0.08em",fontWeight:700,padding:"12px 24px",textDecoration:"none"}}>
                GET SLUSH WALLET →
              </a>
            </div>
          )}
        </div>
        <div className="modal-footer">TESTNET MODE · SUI TESTNET · POWERED BY TATUM RPC</div>
      </div>
    </div>
  );
}

function Landing({ navigate }) {
  return (
    <div className="landing page">
      <div className="landing-bg"/>
      <div className="landing-grid"/>
      <div className="landing-content">
        <div className="landing-title">
          <span className="solid">NO</span>
          <span className="solid">MAN'S</span>
          <span className="outline">LAND</span>
        </div>
        <p className="landing-sub">
          UNFILTERED CRYPTO RESEARCH. PSEUDONYMOUS ANALYSTS.<br/>
          PERMANENT ON WALRUS. READABLE BY HUMANS AND AI AGENTS ALIKE.
        </p>
        <div className="landing-paths">
          <div className="path-card" onClick={() => navigate("explore")}>
            <span className="path-icon">◈</span>
            <div className="path-label">Explore</div>
            <p className="path-desc">Browse independent research vaults. Free previews, paid alpha.</p>
            <span className="path-arrow">↗</span>
          </div>
          <div className="path-card" onClick={() => navigate("publish")}>
            <span className="path-icon">◉</span>
            <div className="path-label">Publish</div>
            <p className="path-desc">Launch your vault. Set your price. Keep everything you earn.</p>
            <span className="path-arrow">↗</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page,        setPage]        = useState("home");
  const [vaultPayload,setVaultPayload]= useState(null);
  const [myVaultId,   setMyVaultId]   = useState(null);
  const [walletModal, setWalletModal] = useState(false);

  const account = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  function navigate(target, payload) {
    setPage(target);
    if (payload) setVaultPayload(payload);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <style>{css}</style>
      {walletModal && <WalletModal onClose={() => setWalletModal(false)}/>}

      <nav>
        <div className="logo" onClick={() => navigate("home")}>
          <NoMLMark/>
        </div>
        <div className="nav-right">
          {account ? (
            <>
              <div className="wallet-address">
                <div className="wallet-dot"/>
                {account.address.slice(0,6)}...{account.address.slice(-4)}
              </div>
              <button className="btn btn-outline" onClick={() => disconnectWallet()}>DISCONNECT</button>
            </>
          ) : (
            <button className="btn btn-outline" onClick={() => setWalletModal(true)}>CONNECT</button>
          )}
          <button className="btn btn-filled" onClick={() => navigate("publish")}>PUBLISH</button>
        </div>
      </nav>

      {page === "home"    && <Landing navigate={navigate}/>}
      {page === "explore" && <Explore navigate={navigate}/>}
      {page === "vault"   && (
        <VaultView
          vaultId={vaultPayload?.vaultId}
          vaultData={vaultPayload?.vaultData}
          navigate={navigate}
        />
      )}
      {page === "publish" && (
        <Publish
          navigate={navigate}
          vaultId={myVaultId}
          onVaultCreated={(id) => setMyVaultId(id)}
        />
      )}
    </>
  );
}
