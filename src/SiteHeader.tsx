import type {RefObject} from 'react';

type Props={stickyHeaderRef:RefObject<HTMLDivElement|null>;step:number;canContinueToPlanner:boolean;setStep:(step:number)=>void};

export function SiteHeader({stickyHeaderRef,step,canContinueToPlanner,setStep}:Props){
  return <div ref={stickyHeaderRef} className={`app-header${step===4?' is-sticky':''}`}><header><div><p className="eyebrow">GENSHIN IMPACT · COMMUNITY PLANNING TOOL <a className="creator-credit" href="https://www.youtube.com/channel/UCO6TTgsXftMu8N-PySScVeQ" target="_blank" rel="noreferrer">Made by Watchful</a></p><h1>Imaginarium Theater Planner</h1><p>Build your roster, configure a rotation, and plan your acts.</p></div><div className="header-right"><div className="related-sites" role="navigation" aria-label="More Genshin tools"><a href="https://watchfuls.github.io/GenshinGraph/">Character Graph</a><span aria-hidden="true">·</span><a href="https://watchfuls.github.io/genshinpuzzle/">Dummy Guesser</a></div><span className="version">v0.1 · Local save</span></div></header>
<nav>{['Your Characters','Challenge Setup','Theater Planner','Act Details','Video Guide'].map((n,i)=><button key={n} className={step===i+1?'active':''} disabled={i===2&&!canContinueToPlanner} title={i===2&&!canContinueToPlanner?'Meet the eligibility minimum in Challenge Setup first.':undefined} onClick={()=>{if(i!==2||canContinueToPlanner)setStep(i+1);}}><span className="stepnum">{i+1}</span>{n}</button>)}</nav></div>;
}
