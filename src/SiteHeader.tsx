import type {RefObject} from 'react';
import {ThemeToggle} from './ThemeToggle';
import emblem from './assets/theater/emblem.png';
import cast from './assets/theater/cast.png';
import setup from './assets/theater/setup.png';
import planner from './assets/theater/planner.png';
import details from './assets/theater/details.png';
const sectionArt=[cast,setup,planner,details];

type Props={stickyHeaderRef:RefObject<HTMLDivElement|null>;step:number;canContinueToPlanner:boolean;setStep:(step:number)=>void};

export function SiteHeader({stickyHeaderRef,step,canContinueToPlanner,setStep}:Props){
  return <><div className="app-header"><header><div className="theater-heading"><img className="theater-emblem" src={emblem} alt="" aria-hidden="true"/><div className="theater-heading-copy"><p className="eyebrow">GENSHIN IMPACT · COMMUNITY PLANNING TOOL <a className="creator-credit" href="https://www.youtube.com/channel/UCO6TTgsXftMu8N-PySScVeQ" target="_blank" rel="noreferrer">Made by Watchful</a></p><h1>Imaginarium Theater Planner</h1><p>Build your roster, configure a rotation, and plan your acts.</p></div></div><div className="header-right"><div className="related-sites" role="navigation" aria-label="More Genshin tools"><a href="https://watchfuls.github.io/GenshinGraph/">Character Graph</a><span aria-hidden="true">·</span><a href="https://watchfuls.github.io/genshinpuzzle/">Dummy Guesser</a></div><ThemeToggle/><span className="version">v0.1 · Local save</span></div></header>
 </div><div ref={stickyHeaderRef} className="app-navigation is-sticky"><nav aria-label="Planner sections">{['Your Characters','Challenge Setup','Theater Planner','Act Details','Video Guide'].map((n,i)=><button key={n} className={step===i+1?'active':''} aria-label={`${i+1} ${n}`} aria-current={step===i+1?'page':undefined} disabled={i===2&&!canContinueToPlanner} title={i===2&&!canContinueToPlanner?'Meet the eligibility minimum in Challenge Setup first.':n} onClick={()=>{if(i!==2||canContinueToPlanner)setStep(i+1);}}>{sectionArt[i]?<img className="nav-theater-icon" src={sectionArt[i]} alt="" aria-hidden="true"/>:<svg className="nav-theater-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="4" y="6" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="m13 11 8 5-8 5V11Z" fill="currentColor"/></svg>}<span className="stepnum">{i+1}</span><span className="nav-full-label">{n}</span><span className="nav-short-label" aria-hidden="true">{['Characters','Setup','Planner','Details','Guide'][i]}</span></button>)}</nav></div></>;
}
