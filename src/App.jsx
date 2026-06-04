import { useState } from "react";
import { useCurrentAccount, useDisconnectWallet, useWallets, useConnectWallet } from "@mysten/dapp-kit";
import Publish  from "./Publish.jsx";
import Explore  from "./Explore.jsx";
import VaultView from "./VaultView.jsx";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@1,300;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:       #13100A;
    --surface:  #1A1510;
    --border:   #2C2318;
    --border2:  #3D3020;
    --gold:     #C9963A;
    --gold-dim: #8A6520;
    --bone:     #EDE5D0;
    --sand:     #C4B48A;
    --ash:      #7A6E58;
    --muted:    #3D3528;
    --ink:      #0E0B07;
  }
  html, body { height: 100%; }
  body { background: var(--bg); color: var(--bone); font-family: 'Syne Mono', monospace; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold); }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  .page { animation: fadeIn 0.3s ease both; }

  nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(19,16,10,0.96); border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px); height: 52px; padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
  .logo-mark { width: 30px; height: 30px; }
  .logo-wordmark { font-family: 'Bebas Neue', sans-serif; font-size: 11px; letter-spacing: 0.22em; color: var(--ash); }
  @media (max-width: 400px) { .logo-wordmark { display: none; } }
  .nav-right { display: flex; gap: 8px; align-items: center; }

  .btn { font-family: 'Syne Mono', monospace; font-size: 9px; letter-spacing: 0.1em; cursor: pointer; border: none; padding: 7px 14px; transition: all 0.18s; }
  .btn-outline { background: none; border: 1px solid var(--border2); color: var(--ash); }
  .btn-outline:hover { border-color: var(--gold); color: var(--gold); }
  .btn-filled { background: var(--gold); color: var(--ink); font-weight: 700; }
  .btn-filled:hover { background: #DCA840; }
  .wallet-address { font-family: 'Syne Mono', monospace; font-size: 9px; color: var(--gold); border: 1px solid var(--border2); padding: 7px 12px; letter-spacing: 0.06em; display: flex; align-items: center; gap: 6px; }
  .wallet-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }

  .modal-overlay { position: fixed; inset: 0; z-index: 999; background: rgba(14,11,7,0.88); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .modal-box { background: var(--surface); border: 1px solid var(--border2); width: 100%; max-width: 360px; animation: fadeUp 0.2s ease both; }
  .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.06em; color: var(--bone); }
  .modal-close { background: none; border: none; color: var(--ash); font-size: 18px; cursor: pointer; }
  .modal-body  { padding: 12px; }
  .modal-footer { padding: 14px 24px; border-top: 1px solid var(--border); font-size: 8px; color: var(--muted); letter-spacing: 0.08em; line-height: 1.8; }
  .wallet-option { display: flex; align-items: center; gap: 14px; padding: 14px 12px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
  .wallet-option:hover { background: #201810; border-color: var(--border2); }
  .wallet-icon { width: 36px; height: 36px; border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; overflow: hidden; background: var(--bg); }
  .wallet-icon img { width: 22px; height: 22px; object-fit: contain; }
  .wallet-name { font-size: 11px; color: var(--sand); letter-spacing: 0.06em; }
  .wallet-cta  { margin-left: auto; font-size: 9px; color: var(--muted); letter-spacing: 0.1em; }

  .landing { min-height: calc(100vh - 52px); display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 48px 24px; position: relative; overflow: hidden; }
  .landing-bg { position: absolute; inset: 0; z-index: 0; background: radial-gradient(ellipse 70% 40% at 50% 90%, rgba(201,150,58,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 30% at 20% 20%, rgba(201,150,58,0.03) 0%, transparent 60%); }
  .landing-grid { position: absolute; inset: 0; z-index: 0; background-image: linear-gradient(rgba(201,150,58,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,150,58,0.03) 1px, transparent 1px); background-size: 48px 48px; }
  .landing-content { position: relative; z-index: 1; max-width: 600px; width: 100%; }
  .landing-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(52px,14vw,96px); line-height: 0.93; letter-spacing: 0.03em; margin-bottom: 28px; animation: fadeUp 0.5s ease 0.15s both; display: flex; flex-wrap: wrap; column-gap: 10px; align-items: baseline; }
  .landing-title .solid   { color: var(--bone); }
  .landing-title .outline { color: transparent; -webkit-text-stroke: 1.5px var(--gold-dim); }
  .landing-title .dot     { color: var(--gold); font-size: 0.5em; align-self: center; padding-bottom: 4px; }
  .landing-sub { font-family: 'Syne Mono', monospace; font-size: clamp(10px,2.5vw,12px); color: var(--ash); line-height: 2; margin-bottom: 52px; animation: fadeUp 0.5s ease 0.25s both; max-width: 460px; letter-spacing: 0.06em; }
  .landing-paths { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; animation: fadeUp 0.5s ease 0.35s both; width: 100%; }
  @media (max-width: 400px) { .landing-paths { grid-template-columns: 1fr; } }
  .path-card { border: 1px solid var(--border2); background: var(--surface); padding: 28px 20px; cursor: pointer; transition: all 0.22s; text-align: left; position: relative; overflow: hidden; }
  .path-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--gold); transform:scaleX(0); transform-origin:left; transition:transform 0.22s; }
  .path-card:hover { border-color: var(--gold); background: #1F1912; transform: translateY(-3px); }
  .path-card:hover::before { transform: scaleX(1); }
  .path-icon  { font-size: 20px; margin-bottom: 14px; display: block; }
  .path-label { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.06em; color: var(--bone); margin-bottom: 8px; }
  .path-desc  { font-size: 9px; color: var(--ash); line-height: 1.8; letter-spacing: 0.04em; }
  .path-arrow { position: absolute; bottom: 20px; right: 20px; font-size: 18px; color: var(--gold-dim); transition: all 0.2s; }
  .path-card:hover .path-arrow { color: var(--gold); transform: translate(3px,-3px); }

  .page-back { display: inline-flex; align-items: center; gap: 8px; font-size: 9px; letter-spacing: 0.12em; color: var(--ash); cursor: pointer; background: none; border: none; margin-bottom: 24px; transition: color 0.15s; font-family: 'Syne Mono', monospace; }
  .page-back:hover { color: var(--gold); }
  .page-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(36px,8vw,56px); letter-spacing: 0.04em; color: var(--bone); line-height: 1; margin-bottom: 10px; }
  .page-sub   { font-size: 9px; color: var(--ash); letter-spacing: 0.08em; line-height: 1.8; }
`;

function NMLMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 30 30" fill="none">
      <rect x="1" y="1" width="28" height="28" stroke="#C9963A" strokeWidth="1.2"/>
      <text x="15" y="20" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="12" fill="#C9963A" letterSpacing="1.5">NML</text>
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
                {slush.icon ? <img src={slush.icon} alt="Slush"/> : <span style={{color:"#C9963A",fontSize:"16px"}}>◈</span>}
              </div>
              <div className="wallet-name">{slush.name}</div>
              <div className="wallet-cta">{isPending ? "CONNECTING..." : "CONNECT →"}</div>
            </div>
          ) : (
            <div style={{padding:"24px",textAlign:"center"}}>
              <div style={{fontFamily:"'Syne Mono',monospace",fontSize:"10px",color:"var(--ash)",lineHeight:1.8,marginBottom:"16px"}}>
                Slush Wallet not detected.<br/>Install it to continue.
              </div>
              <a href="https://slush.app" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",background:"var(--gold)",color:"var(--ink)",fontFamily:"'Syne Mono',monospace",fontSize:"9px",letterSpacing:"0.1em",fontWeight:700,padding:"10px 20px",textDecoration:"none"}}>
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
          <span className="dot">✦</span>
          <span className="solid">MAN'S</span>
          <span className="dot">✦</span>
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
          <NMLMark/>
          <span className="logo-wordmark">NO MAN'S LAND</span>
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
