import React, {useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CHARACTERS,ELEMENTS,Element} from './characters';
import './style.css';
type Ownership = Record<string,{owned:boolean;level70:boolean}>;
type Setup = {difficulty:string;elements:Element[];opening:string[];guests:string[]};
type Plan = {roster:string[];acts:Record<number,string[]>};
function stored<T>(key:string,fallback:T):T {try {const v=localStorage.getItem(key);return v?JSON.parse(v) as T:fallback;}catch{return fallback;}}
const difficulties:Record<string,{acts:number;minimum:number}> = {'Easy':{acts:3,minimum:10},'Normal':{acts:6,minimum:14},'Hard':{acts:8,minimum:18},'Visionary':{acts:10,minimum:22},'Lunar':{acts:10,minimum:28}};
// Difficulty counts are configurable estimates: verify against the live game's rules.
const CHARACTER_ICON_FILES: Record<string,string> = {
  'Ga Ming':'Gaming_Icon.webp',
  'Ayato':'Kamisato_Ayato_Icon.webp',
  'Ayaka':'Kamisato_Ayaka_Icon.webp',
  'Kokomi':'Sangonomiya_Kokomi_Icon.webp',
  'Kazuha':'Kaedehara_Kazuha_Icon.webp',
  'Heizou':'Shikanoin_Heizou_Icon.webp',
  'Sara':'Kujou_Sara_Icon.webp',
  'Raiden Shogun':'Raiden_Shogun_Icon.webp',
  'Itto':'Arataki_Itto_Icon.webp',
  'Yun Jin':'Yun_Jin_Icon.webp',
  'Mizuki':'Yumemizuki_Mizuki_Icon.webp',
  'Anemo Traveler':'AnemoTraveler_Icon.png',
  'Cryo Traveler':'CryoTraveler_Icon.png',
  'Dendro Traveler':'DendroTraveler_Icon.png',
  'Electro Traveler':'ElectroTraveler_Icon.png',
  'Geo Traveler':'GeoTraveler_Icon.png',
  'Hydro Traveler':'HydroTraveler_Icon.png',
  'Pyro Traveler':'PyroTraveler_Icon.png'
};
function CharacterIcon({name}:{name:string}){
  const [failed,setFailed]=useState(false);
  const file=CHARACTER_ICON_FILES[name]??`${name.replace(/\s+/g,'_')}_Icon.webp`;
  return <span className="character-icon">{failed?<span className="icon-fallback">{name.charAt(0)}</span>:<img loading="lazy" alt={name} src={`${import.meta.env.BASE_URL}icons/characters/${file}`} onError={()=>setFailed(true)}/>}</span>;
}
function App(){
const [step,setStep]=useState(1);
const [ownership,setOwnership]=useState<Ownership>(()=>stored('itp-ownership-v1',{}));
const [setup,setSetup]=useState<Setup>(()=>stored('itp-setup-v1',{difficulty:'Hard',elements:['Pyro','Hydro','Anemo'],opening:[],guests:[]}));
const [plan,setPlan]=useState<Plan>(()=>stored('itp-plan-v1',{roster:[],acts:{}}));
const [search,setSearch]=useState('');const [filter,setFilter]=useState('All');const [ownedOnly,setOwnedOnly]=useState(false);
useEffect(()=>localStorage.setItem('itp-ownership-v1',JSON.stringify(ownership)),[ownership]);
useEffect(()=>localStorage.setItem('itp-setup-v1',JSON.stringify(setup)),[setup]);
useEffect(()=>localStorage.setItem('itp-plan-v1',JSON.stringify(plan)),[plan]);
const eligible=useMemo(()=>CHARACTERS.filter(c=>ownership[c.name]?.owned && ownership[c.name]?.level70!==false && (setup.elements.includes(c.element)||setup.guests.includes(c.name))),[ownership,setup]);
const available=useMemo(()=>CHARACTERS.filter(c=>setup.elements.includes(c.element)||setup.guests.includes(c.name)||setup.opening.includes(c.name)),[setup]);
const requirement=difficulties[setup.difficulty];
const toggleOwn=(name:string)=>setOwnership(o=>({...o,[name]:{owned:!o[name]?.owned,level70:o[name]?.level70??true}}));
const toggleLevel=(name:string)=>setOwnership(o=>({...o,[name]:{owned:o[name]?.owned??false,level70:!(o[name]?.level70??true)}}));
const toggleArray=(values:string[],name:string,limit:number)=>values.includes(name)?values.filter(v=>v!==name):values.length<limit?[...values,name]:values;
const filtered=CHARACTERS.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())&&(filter==='All'||c.element===filter)&&(!ownedOnly||ownership[c.name]?.owned));
const chosen=plan.roster.filter(n=>available.some(c=>c.name===n));
const count=CHARACTERS.filter(c=>ownership[c.name]?.owned).length;
return <main><header><div><p className="eyebrow">GENSHIN IMPACT · COMMUNITY PLANNING TOOL</p><h1>Imaginarium Theater Planner</h1><p>Build your roster, configure a rotation, and plan your acts.</p></div><span className="version">v0.1 · Local save</span></header>
<nav>{['Your Characters','Challenge Setup','Theater Planner'].map((n,i)=><button key={n} className={step===i+1?'active':''} onClick={()=>setStep(i+1)}><span className="stepnum">{i+1}</span>{n}</button>)}</nav>
{step===1&&<section><div className="sectionhead"><div><h2>Your Characters</h2><p>{count} owned · {CHARACTERS.length} in starter database</p></div><div className="actions"><button onClick={()=>setOwnership(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:true,level70:ownership[c.name]?.level70??true}])))}>Own All</button><button onClick={()=>setOwnership(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:false,level70:ownership[c.name]?.level70??true}])))}>Clear All</button></div></div><div className="toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search characters…"/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{ELEMENTS.map(e=><option key={e}>{e}</option>)}</select><label><input type="checkbox" checked={ownedOnly} onChange={e=>setOwnedOnly(e.target.checked)}/> Owned only</label></div><div className="characters">{filtered.map(c=><div className={'character '+(ownership[c.name]?.owned?'owned':'')} key={c.name}><div className="character-top"><CharacterIcon name={c.name}/><span className={'element '+c.element}>{c.element}</span><strong>{c.name}</strong></div><label><input type="checkbox" checked={!!ownership[c.name]?.owned} onChange={()=>toggleOwn(c.name)}/> Owned</label><label><input type="checkbox" checked={ownership[c.name]?.level70??true} onChange={()=>toggleLevel(c.name)}/> Level 70+</label></div>)}</div><div className="bottom"><button className="primary" onClick={()=>setStep(2)}>Continue to Challenge Setup →</button></div></section>}
{step===2&&<section><h2>Challenge Setup</h2><p>Configure the current rotation. You can edit these settings at any time.</p><div className="settings"><div><h3>Difficulty</h3><select value={setup.difficulty} onChange={e=>setSetup(s=>({...s,difficulty:e.target.value}))}>{Object.keys(difficulties).map(d=><option key={d}>{d}</option>)}</select><p>{requirement.acts} acts · {requirement.minimum} characters (provisional)</p><h3>Three featured elements</h3><div className="chips">{ELEMENTS.map(e=><button className={setup.elements.includes(e)?'selected':''} key={e} onClick={()=>setSetup(s=>({...s,elements:toggleArray(s.elements,e,3) as Element[]}))}>{e}</button>)}</div><p>{setup.elements.length}/3 selected</p></div><div className="eligibility"><h3>Eligibility estimate</h3><div className="big">{eligible.length} / {requirement.minimum}</div><p>{eligible.length>=requirement.minimum?'Enough eligible owned characters by this estimate.':'You need more eligible characters by this estimate.'}</p><small>Game-specific exceptions, opening-character borrowing, and exact difficulty rules still need verification.</small></div></div><div className="pickers"><div><h3>Opening Characters ({setup.opening.length}/6)</h3><div className="picker">{CHARACTERS.map(c=><label key={c.name}><input type="checkbox" checked={setup.opening.includes(c.name)} onChange={()=>setSetup(s=>({...s,opening:toggleArray(s.opening,c.name,6)}))}/>{c.name}</label>)}</div></div><div><h3>Special Guest Stars ({setup.guests.length}/4)</h3><div className="picker">{CHARACTERS.map(c=><label key={c.name}><input type="checkbox" checked={setup.guests.includes(c.name)} onChange={()=>setSetup(s=>({...s,guests:toggleArray(s.guests,c.name,4)}))}/>{c.name}</label>)}</div></div></div><div className="bottom"><button onClick={()=>setStep(1)}>← Characters</button><button className="primary" onClick={()=>setStep(3)}>Continue to Planner →</button></div></section>}
{step===3&&<section><h2>Theater Planner</h2><p>Select your roster, then assign up to four characters to each act. Changes are saved locally.</p><div className="planner"><div><h3>Available Roster ({chosen.length})</h3><div className="picker roster">{available.map(c=><label key={c.name}><input type="checkbox" checked={chosen.includes(c.name)} onChange={()=>setPlan(p=>({...p,roster:toggleArray(p.roster,c.name,99)}))}/><span>{c.name}</span><small>{c.element}{ownership[c.name]?.owned?' · Owned':' · Not owned'}</small></label>)}</div></div><div><h3>Act Assignments</h3><div className="acts">{Array.from({length:requirement.acts},(_,i)=>i+1).map(act=><div className="act" key={act}><strong>Act {act}</strong><div className="slots">{Array.from({length:4},(_,slot)=>{const current=plan.acts[act]?.[slot]??'';return <select key={slot} value={chosen.includes(current)?current:''} onChange={e=>setPlan(p=>{const arr=[...(p.acts[act]??[])];arr[slot]=e.target.value;return {...p,acts:{...p.acts,[act]:arr}}})}><option value="">+ Slot {slot+1}</option>{chosen.map(n=><option key={n} value={n}>{n}</option>)}</select>})}</div></div>)}</div><p className="note">Vigor and team-rule validation will be added once we confirm the intended mechanics.</p></div></div><div className="bottom"><button onClick={()=>setStep(2)}>← Challenge Setup</button><button onClick={()=>setPlan({roster:[],acts:{}})}>Reset Plan</button></div></section>}
<footer>Unofficial fan-made planning tool. All settings are saved in this browser.</footer></main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
