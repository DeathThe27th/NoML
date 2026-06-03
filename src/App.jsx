import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ─── WALLET CONTEXT ───────────────────────────────────────────────────────────
// Simulates @mysten/dapp-kit behaviour.
// On Vercel: replace this with dapp-kit's WalletProvider + useCurrentAccount hook.

const WalletContext = createContext(null);

function WalletProvider({ children }) {
  const [address, setAddress]   = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [modal, setModal]       = useState(false);

  const connect = useCallback(() => setModal(true), []);
  const disconnect = useCallback(() => { setAddress(null); setModal(false); }, []);

  // Simulates wallet selection + connection handshake
  const selectWallet = useCallback((name) => {
    setConnecting(true);
    setModal(false);
    setTimeout(() => {
      // Generates a plausible-looking Sui testnet address
      const hex = Array.from({length: 40}, () => "0123456789abcdef"[Math.floor(Math.random()*16)]).join("");
      setAddress(`0x${hex}`);
      setConnecting(false);
    }, 900);
  }, []);

  return (
    <WalletContext.Provider value={{ address, connecting, connect, disconnect, modal, setModal, selectWallet }}>
      {children}
      {modal && <WalletModal />}
    </WalletContext.Provider>
  );
}

function useWallet() { return useContext(WalletContext); }

const WALLETS = [
  { name: "Sui Wallet",   icon: "◈" },
  { name: "Suiet",        icon: "◉" },
  { name: "Martian",      icon: "◎" },
  { name: "Ethos Wallet", icon: "◇" },
];

function WalletModal() {
  const { setModal, selectWallet } = useWallet();
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(14,11,7,0.85)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px",
    }} onClick={() => setModal(false)}>
      <div style={{
        background:"#1A1510", border:"1px solid #3D3020",
        width:"100%", maxWidth:"360px",
        animation:"fadeUp 0.2s ease both",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding:"20px 24px", borderBottom:"1px solid #2C2318",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", letterSpacing:"0.06em", color:"#EDE5D0"}}>
            SELECT WALLET
          </div>
          <button onClick={() => setModal(false)} style={{
            background:"none", border:"none", color:"#7A6E58",
            fontSize:"18px", cursor:"pointer", lineHeight:1,
          }}>✕</button>
        </div>
        <div style={{padding:"12px"}}>
          {WALLETS.map(w => (
            <div key={w.name} onClick={() => selectWallet(w.name)} style={{
              display:"flex", alignItems:"center", gap:"14px",
              padding:"14px 12px", cursor:"pointer",
              border:"1px solid transparent",
              transition:"all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background="#201810"; e.currentTarget.style.borderColor="#3D3020"; }}
              onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.borderColor="transparent"; }}
            >
              <div style={{
                width:"36px", height:"36px", border:"1px solid #3D3020",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#C9963A", fontSize:"16px",
              }}>{w.icon}</div>
              <div style={{fontFamily:"'Syne Mono',monospace", fontSize:"11px", color:"#C4B48A", letterSpacing:"0.06em"}}>
                {w.name}
              </div>
              <div style={{marginLeft:"auto", fontSize:"9px", color:"#3D3020", letterSpacing:"0.1em"}}>
                CONNECT →
              </div>
            </div>
          ))}
        </div>
        <div style={{
          padding:"14px 24px", borderTop:"1px solid #2C2318",
          fontFamily:"'Syne Mono',monospace", fontSize:"8px",
          color:"#3D3528", letterSpacing:"0.08em", lineHeight:1.8,
        }}>
          TESTNET MODE · SUI TESTNET · POWERED BY TATUM RPC
        </div>
      </div>
    </div>
  );
}

const ANALYSTS = [
  { id:1, handle:"0x_warchest",     name:"Warchest",         bio:"On-chain forensics. Follow the wallets.",            subscribers:312, pieces:18, free:4, verified:true,  tags:["FORENSICS","ON-CHAIN"] },
  { id:2, handle:"cipher_delta",    name:"Cipher Delta",     bio:"Macro cycles. BTC dominance. No hedging.",           subscribers:891, pieces:34, free:8, verified:true,  tags:["MACRO","BTC"] },
  { id:3, handle:"rawdata_nine",    name:"Rawdata Nine",     bio:"DeFi risk signals. Pattern recognition.",            subscribers:204, pieces:12, free:3, verified:false, tags:["DEFI","RISK"] },
  { id:4, handle:"greyzone_analyst",name:"Greyzone",         bio:"Perp DEX structure. Volume migration.",              subscribers:567, pieces:27, free:6, verified:true,  tags:["PERPS","DATA"] },
  { id:5, handle:"dustroad_research",name:"Dustroad Research",bio:"Alt season rotations. Liquidity maps.",            subscribers:139, pieces:9,  free:2, verified:false, tags:["ALTS","LIQUIDITY"] },
  { id:6, handle:"sentinel_vc",     name:"Sentinel",         bio:"VC unlock schedules. Token emission analysis.",      subscribers:423, pieces:21, free:5, verified:true,  tags:["TOKENOMICS","VC"] },
];

const ENTRIES = {
  1:[
    { id:1, title:"Three Wallets, One Exit: How $4.2M Left Before Anyone Noticed", free:false, price:"1.2 SUI", minted:17, supply:20, preview:"Full forensic breakdown of the coordinated exit pattern." },
    { id:2, title:"Reading the Mempool: A Beginner's Guide to On-Chain Tracking",  free:true,  price:null,      minted:null,supply:null, preview:"Public intro piece. No wallet needed." },
    { id:3, title:"The Wash Trade Playbook: 5 Signatures to Spot It Early",        free:false, price:"0.8 SUI", minted:8,  supply:15, preview:"Pattern library built from 30+ confirmed wash trade cases." },
    { id:4, title:"Address Clustering 101",                                         free:true,  price:null,      minted:null,supply:null, preview:"How to group related wallets. Free methodology overview." },
  ],
  2:[
    { id:1, title:"BTC Dominance Cycle Analysis: What The Charts Won't Show You",  free:false, price:"1.5 SUI", minted:20, supply:20, preview:"SOLD OUT. Check secondary market." },
    { id:2, title:"Why Macro Cycles Still Matter in a DeFi World",                  free:true,  price:null,      minted:null,supply:null, preview:"Free overview of the macro-crypto relationship." },
    { id:3, title:"The Fed Pivot Playbook: Historical BTC Reactions Mapped",        free:false, price:"1.0 SUI", minted:12, supply:25, preview:"Data from 6 macro pivots. Directional conviction included." },
  ],
  3:[
    { id:1, title:"DeFi Protocol Death Signals: 7 Indicators Before The Collapse", free:false, price:"0.6 SUI", minted:9,  supply:20, preview:"Pattern-matched across 11 collapsed protocols." },
    { id:2, title:"How to Read a Protocol's Treasury",                              free:true,  price:null,      minted:null,supply:null, preview:"Free primer on treasury analysis." },
  ],
  4:[
    { id:1, title:"Perp DEX Volume Shift: Who's Actually Winning The CEX Migration",free:false, price:"1.0 SUI", minted:14, supply:30, preview:"Exchange-by-exchange breakdown. Raw volume data." },
    { id:2, title:"Open Interest as a Leading Indicator",                            free:true,  price:null,      minted:null,supply:null, preview:"Free introductory piece on OI analysis." },
    { id:3, title:"The Hyperliquid Anomaly: Data Deep Dive",                        free:false, price:"0.9 SUI", minted:6,  supply:10, preview:"Why Hyperliquid's numbers don't add up the way the narrative says." },
  ],
  5:[
    { id:1, title:"Alt Season Rotation Maps: Q3 2025 Edition",                     free:false, price:"0.7 SUI", minted:5,  supply:12, preview:"Sector-by-sector rotation data with timing signals." },
    { id:2, title:"What Is Liquidity Mapping?",                                     free:true,  price:null,      minted:null,supply:null, preview:"Free explainer on liquidity analysis." },
  ],
  6:[
    { id:1, title:"The Unlock Calendar Nobody Is Watching",                         free:false, price:"1.1 SUI", minted:11, supply:20, preview:"Full schedule of major token unlocks with price impact modelling." },
    { id:2, title:"VC Unlock Basics",                                               free:true,  price:null,      minted:null,supply:null, preview:"How token unlock schedules work. Free primer." },
    { id:3, title:"Emission Shock: 3 Tokens About To Get Hit Hard",                free:false, price:"1.3 SUI", minted:3,  supply:5,  preview:"High conviction. Very limited supply." },
  ],
};

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

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }

  .page { animation: fadeIn 0.3s ease both; }

  /* NAV */
  nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(19,16,10,0.96);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px);
    height: 52px; padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
  .logo-mark { width: 30px; height: 30px; }
  .logo-wordmark { font-family: 'Bebas Neue', sans-serif; font-size: 11px; letter-spacing: 0.22em; color: var(--ash); }
  @media (max-width: 400px) { .logo-wordmark { display: none; } }
  .nav-right { display: flex; gap: 8px; }

  .btn { font-family: 'Syne Mono', monospace; font-size: 9px; letter-spacing: 0.1em; cursor: pointer; border: none; padding: 7px 14px; transition: all 0.18s; }
  .btn-outline { background: none; border: 1px solid var(--border2); color: var(--ash); }
  .btn-outline:hover { border-color: var(--gold); color: var(--gold); }
  .btn-filled { background: var(--gold); color: var(--ink); font-weight: 700; }
  .btn-filled:hover { background: #DCA840; }

  /* LANDING */
  .landing {
    min-height: calc(100vh - 52px);
    display: flex; flex-direction: column;
    justify-content: center; align-items: flex-start;
    padding: 48px 24px;
    position: relative; overflow: hidden;
  }
  .landing-bg {
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(ellipse 70% 40% at 50% 90%, rgba(201,150,58,0.07) 0%, transparent 70%),
      radial-gradient(ellipse 50% 30% at 20% 20%, rgba(201,150,58,0.03) 0%, transparent 60%);
  }
  .landing-grid {
    position: absolute; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(201,150,58,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,150,58,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .landing-content { position: relative; z-index: 1; max-width: 600px; width: 100%; }

  .landing-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(52px, 14vw, 96px);
    line-height: 0.93; letter-spacing: 0.03em;
    margin-bottom: 28px;
    animation: fadeUp 0.5s ease 0.15s both;
    display: flex; flex-wrap: wrap; column-gap: 10px; row-gap: 0;
    align-items: baseline;
  }
  .landing-title .solid  { color: var(--bone); }
  .landing-title .outline { color: transparent; -webkit-text-stroke: 1.5px var(--gold-dim); }
  .landing-title .dot { color: var(--gold); font-size: 0.5em; align-self: center; padding-bottom: 4px; }
  .landing-title .slash { color: var(--gold-dim); font-weight: 100; }

  .landing-sub {
    font-family: 'Syne Mono', monospace;
    font-size: clamp(10px, 2.5vw, 12px);
    color: var(--ash); line-height: 2;
    margin-bottom: 52px;
    animation: fadeUp 0.5s ease 0.25s both;
    max-width: 460px;
    letter-spacing: 0.06em;
  }

  .landing-paths {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    animation: fadeUp 0.5s ease 0.35s both;
    width: 100%;
  }
  @media (max-width: 400px) { .landing-paths { grid-template-columns: 1fr; } }

  .path-card {
    border: 1px solid var(--border2); background: var(--surface);
    padding: 28px 20px; cursor: pointer;
    transition: all 0.22s; text-align: left;
    position: relative; overflow: hidden;
  }
  .path-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--gold); transform: scaleX(0); transform-origin: left; transition: transform 0.22s;
  }
  .path-card:hover { border-color: var(--gold); background: #1F1912; transform: translateY(-3px); }
  .path-card:hover::before { transform: scaleX(1); }
  .path-icon { font-size: 20px; margin-bottom: 14px; display: block; }
  .path-label { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.06em; color: var(--bone); margin-bottom: 8px; }
  .path-desc  { font-size: 9px; color: var(--ash); line-height: 1.8; letter-spacing: 0.04em; }
  .path-arrow { position: absolute; bottom: 20px; right: 20px; font-size: 18px; color: var(--gold-dim); transition: all 0.2s; }
  .path-card:hover .path-arrow { color: var(--gold); transform: translate(3px, -3px); }

  /* EXPLORE */
  .explore-page { padding: 48px 24px; max-width: 960px; margin: 0 auto; }
  @media (min-width: 768px) { .explore-page { padding: 64px 40px; } }
  .page-back {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 9px; letter-spacing: 0.12em; color: var(--ash);
    cursor: pointer; background: none; border: none; margin-bottom: 24px;
    transition: color 0.15s; font-family: 'Syne Mono', monospace;
  }
  .page-back:hover { color: var(--gold); }
  .page-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(36px, 8vw, 56px); letter-spacing: 0.04em; color: var(--bone); line-height: 1; margin-bottom: 10px; }
  .page-sub   { font-size: 9px; color: var(--ash); letter-spacing: 0.08em; line-height: 1.8; margin-bottom: 40px; }

  .analysts-grid {
    display: grid; grid-template-columns: 1fr;
    gap: 1px; background: var(--border); border: 1px solid var(--border);
  }
  @media (min-width: 560px) { .analysts-grid { grid-template-columns: repeat(2,1fr); } }
  @media (min-width: 860px) { .analysts-grid { grid-template-columns: repeat(3,1fr); } }

  .analyst-card {
    background: var(--surface); padding: 24px 20px; cursor: pointer;
    transition: background 0.2s; position: relative;
    animation: fadeUp 0.4s ease both;
    display: flex; flex-direction: column;
  }
  .analyst-card:hover { background: #201810; }
  .analyst-card:hover .ac-enter { color: var(--gold); }

  .ac-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .ac-avatar {
    width: 38px; height: 38px; border: 1px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; font-size: 14px; color: var(--gold);
    background: var(--bg); flex-shrink: 0; letter-spacing: 0.05em;
  }
  .ac-verified { font-size: 7px; letter-spacing: 0.15em; color: var(--gold); border: 1px solid var(--gold-dim); padding: 2px 6px; height: fit-content; }
  .ac-name    { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.05em; color: var(--bone); margin-bottom: 2px; }
  .ac-handle  { font-size: 8px; color: var(--ash); letter-spacing: 0.08em; margin-bottom: 12px; }
  .ac-bio     { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300; font-size: 13px; color: var(--sand); line-height: 1.6; margin-bottom: 16px; flex: 1; }
  .ac-tags    { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 18px; }
  .ac-tag     { font-size: 7px; letter-spacing: 0.1em; border: 1px solid var(--border2); padding: 2px 7px; color: var(--ash); }
  .ac-footer  { border-top: 1px solid var(--border); padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }
  .ac-stat-val   { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: var(--bone); line-height: 1; }
  .ac-stat-label { font-size: 7px; color: var(--ash); letter-spacing: 0.1em; margin-top: 2px; }
  .ac-enter   { font-size: 8px; letter-spacing: 0.12em; color: var(--ash); transition: color 0.2s; }

  /* VAULT */
  .vault-page { padding: 48px 24px; max-width: 800px; margin: 0 auto; }
  @media (min-width: 768px) { .vault-page { padding: 64px 40px; } }

  .vault-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--border); }
  .vault-avatar-lg {
    width: 52px; height: 52px; flex-shrink: 0; border: 1px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: var(--gold); background: var(--bg); letter-spacing: 0.05em;
  }
  .vault-analyst-name   { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 0.05em; color: var(--bone); line-height: 1; margin-bottom: 4px; }
  .vault-analyst-handle { font-size: 9px; color: var(--ash); letter-spacing: 0.08em; margin-bottom: 8px; }
  .vault-analyst-bio    { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300; font-size: 14px; color: var(--sand); line-height: 1.6; }

  .vault-stats { display: flex; gap: 24px; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .vs-val   { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: var(--bone); line-height: 1; }
  .vs-label { font-size: 8px; color: var(--ash); letter-spacing: 0.1em; margin-top: 3px; }

  .entries-list { display: flex; flex-direction: column; gap: 1px; background: var(--border); border: 1px solid var(--border); }
  .entry { background: var(--surface); padding: 20px; cursor: pointer; transition: background 0.18s; animation: fadeUp 0.4s ease both; }
  .entry:hover { background: #201810; }
  .entry-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
  .entry-title { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; font-size: 15px; color: var(--bone); line-height: 1.4; flex: 1; }
  .entry-badge { font-size: 7px; letter-spacing: 0.12em; padding: 3px 8px; flex-shrink: 0; font-weight: 700; }
  .badge-free { background: var(--border2); color: var(--ash); }
  .badge-paid { background: var(--gold); color: var(--ink); }
  .badge-sold { background: var(--muted); color: var(--ash); }
  .entry-preview { font-size: 9px; color: var(--ash); line-height: 1.8; }
  .entry-meta { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
  .entry-price   { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: var(--gold); letter-spacing: 0.04em; }
  .entry-supply  { font-size: 8px; color: var(--ash); letter-spacing: 0.08em; }
  .entry-supply span { color: var(--gold); }
  .entry-action  { font-size: 9px; color: var(--ash); letter-spacing: 0.1em; margin-left: auto; }

  /* PUBLISH */
  .publish-step { background: var(--surface); padding: 20px; }
  .publish-step-num   { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: var(--gold-dim); line-height: 1; flex-shrink: 0; }
  .publish-step-title { font-size: 10px; color: var(--bone); letter-spacing: 0.06em; margin-bottom: 5px; }
  .publish-step-desc  { font-size: 9px; color: var(--ash); line-height: 1.8; }
`;

function NMLMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 30 30" fill="none">
      <rect x="1" y="1" width="28" height="28" stroke="#C9963A" strokeWidth="1.2"/>
      <text x="15" y="20" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="12" fill="#C9963A" letterSpacing="1.5">NML</text>
    </svg>
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

function Explore({ navigate }) {
  return (
    <div className="explore-page page">
      <button className="page-back" onClick={() => navigate("home")}>← BACK</button>
      <div className="page-title">RESEARCH VAULTS</div>
      <div className="page-sub">{ANALYSTS.length} independent analysts · Access is free · Some content requires a mint</div>
      <div className="analysts-grid">
        {ANALYSTS.map((a, i) => (
          <div className="analyst-card" key={a.id} style={{ animationDelay: `${i * 0.06}s` }} onClick={() => navigate("vault", a.id)}>
            <div className="ac-top">
              <div className="ac-avatar">{a.name.slice(0,2).toUpperCase()}</div>
              {a.verified && <div className="ac-verified">VERIFIED</div>}
            </div>
            <div className="ac-name">{a.name}</div>
            <div className="ac-handle">{a.handle}</div>
            <div className="ac-bio">{a.bio}</div>
            <div className="ac-tags">{a.tags.map(t => <span className="ac-tag" key={t}>{t}</span>)}</div>
            <div className="ac-footer">
              <div style={{display:"flex",gap:"20px"}}>
                {[["PIECES",a.pieces],["FREE",a.free],["READERS",a.subscribers]].map(([l,v])=>(
                  <div key={l}>
                    <div className="ac-stat-val">{v}</div>
                    <div className="ac-stat-label">{l}</div>
                  </div>
                ))}
              </div>
              <div className="ac-enter">ENTER ↗</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Vault({ analystId, navigate }) {
  const analyst = ANALYSTS.find(a => a.id === analystId);
  const entries = ENTRIES[analystId] || [];
  return (
    <div className="vault-page page">
      <button className="page-back" onClick={() => navigate("explore")}>← ALL VAULTS</button>
      <div className="vault-header">
        <div className="vault-avatar-lg">{analyst.name.slice(0,2).toUpperCase()}</div>
        <div>
          <div className="vault-analyst-name">{analyst.name} {analyst.verified && <span style={{color:"var(--gold)",fontSize:"14px"}}>✓</span>}</div>
          <div className="vault-analyst-handle">{analyst.handle}</div>
          <div className="vault-analyst-bio">{analyst.bio}</div>
        </div>
      </div>
      <div className="vault-stats">
        {[["TOTAL PIECES",entries.length],["FREE TO READ",entries.filter(e=>e.free).length],["READERS",analyst.subscribers]].map(([l,v])=>(
          <div key={l}><div className="vs-val">{v}</div><div className="vs-label">{l}</div></div>
        ))}
        <div><div className="vs-val" style={{color:"var(--gold)"}}>x402</div><div className="vs-label">AGENT READABLE</div></div>
      </div>
      <div className="entries-list">
        {entries.map((e, i) => {
          const soldOut = !e.free && e.minted >= e.supply;
          return (
            <div className="entry" key={e.id} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="entry-top">
                <div className="entry-title">{e.title}</div>
                <div className={`entry-badge ${e.free ? "badge-free" : soldOut ? "badge-sold" : "badge-paid"}`}>
                  {e.free ? "FREE" : soldOut ? "SOLD OUT" : "PAID"}
                </div>
              </div>
              <div className="entry-preview">{e.preview}</div>
              <div className="entry-meta">
                {!e.free && <><div className="entry-price">{soldOut ? "—" : e.price}</div><div className="entry-supply"><span>{e.minted}</span>/{e.supply} minted</div></>}
                {e.free     && <div className="entry-action" style={{color:"var(--gold)",marginLeft:0}}>READ FREE →</div>}
                {!e.free && !soldOut && <div className="entry-action">MINT ACCESS NFT →</div>}
                {soldOut    && <div className="entry-action">VIEW SECONDARY →</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Publish({ navigate }) {
  const steps = [
    ["01","Connect Wallet","Your Sui address is your identity. No name, email, or KYC."],
    ["02","Create Your Vault","Name it. Write a bio. Your vault is live immediately."],
    ["03","Upload a Piece","Encrypted and stored permanently on Walrus. You choose free or paid."],
    ["04","Set Price & Supply","Paid pieces: set SUI price and optional mint cap. Limited = scarce."],
    ["05","Earn","Readers mint NFTs for access. Agents pay via x402. You keep everything."],
  ];
  return (
    <div className="explore-page page" style={{maxWidth:"560px"}}>
      <button className="page-back" onClick={() => navigate("home")}>← BACK</button>
      <div className="page-title">OPEN YOUR VAULT</div>
      <p className="page-sub">Connect your Sui wallet to create a vault. Set pieces as free or paid. Limit supply. Keep 100% of mint revenue.</p>
      <div style={{display:"flex",flexDirection:"column",gap:"1px",background:"var(--border)",border:"1px solid var(--border)",marginBottom:"32px"}}>
        {steps.map(([n,title,desc])=>(
          <div className="publish-step" key={n}>
            <div style={{display:"flex",gap:"14px",alignItems:"flex-start"}}>
              <div className="publish-step-num">{n}</div>
              <div>
                <div className="publish-step-title">{title}</div>
                <div className="publish-step-desc">{desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-filled" style={{width:"100%",padding:"14px",fontSize:"11px",letterSpacing:"0.12em"}}>
        CONNECT WALLET TO BEGIN
      </button>
    </div>
  );
}

function AppInner() {
  const [page, setPage]       = useState("home");
  const [vaultId, setVaultId] = useState(null);
  const { address, connecting, connect, disconnect } = useWallet();

  function navigate(target, id) {
    setPage(target);
    if (id) setVaultId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <style>{css}</style>
      <nav>
        <div className="logo" onClick={() => navigate("home")}>
          <NMLMark/>
          <span className="logo-wordmark">NO MAN'S LAND</span>
        </div>
        <div className="nav-right">
          {address ? (
            <>
              <div style={{
                fontFamily:"'Syne Mono',monospace", fontSize:"9px",
                color:"var(--gold)", border:"1px solid var(--border2)",
                padding:"7px 12px", letterSpacing:"0.06em",
                display:"flex", alignItems:"center", gap:"6px",
              }}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--gold)"}}/>
                {address.slice(0,6)}...{address.slice(-4)}
              </div>
              <button className="btn btn-outline" onClick={disconnect}>DISCONNECT</button>
            </>
          ) : (
            <button className="btn btn-outline" onClick={connect} disabled={connecting}>
              {connecting ? "CONNECTING..." : "CONNECT"}
            </button>
          )}
          <button className="btn btn-filled" onClick={() => navigate("publish")}>PUBLISH</button>
        </div>
      </nav>
      {page === "home"    && <Landing navigate={navigate}/>}
      {page === "explore" && <Explore navigate={navigate}/>}
      {page === "vault"   && <Vault   analystId={vaultId} navigate={navigate}/>}
      {page === "publish" && <Publish navigate={navigate}/>}
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppInner/>
    </WalletProvider>
  );
}
