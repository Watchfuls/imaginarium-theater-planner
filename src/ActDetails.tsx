import React, {useEffect, useState} from 'react';
import published from './data/theater-act-details.json';
import {seasonStatus} from './seasonTiming';
import {mergeActDetailsDraft,type ActDetailsData as Data,type ActDetailsRecord as Act,type EncounterDetails as Encounter} from './actDetailsData';
import enemyCatalog from './data/theater-enemies.json';
import physicalIcon from './assets/elements/Physical_Icon.png';
import {encounterEnemyIds,enemyResistanceDetails,groupedResistances,playerActRequirements,playerDetailText,playerEnemyNotes,resistanceExceptions,siteActDetails,splitChallengeRequirements} from './actDetailsPresentation';

const enemyIcons=import.meta.glob('./assets/enemies/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const enemiesById=enemyCatalog as Record<string,{name:string;icon:string;wikiUrl:string;baseResistances:Record<string,number>}>;

function ResistanceLabels({value}:{value:string}){
  const tooltipId=React.useId();
  const elements=new Set(['Physical','Pyro','Hydro','Electro','Cryo','Dendro','Anemo','Geo']);
  return <span className="resistance-hint" tabIndex={0} aria-describedby={tooltipId}><span className="act-enemy-resistances">{value.split(/\b(Physical|Pyro|Hydro|Electro|Cryo|Dendro|Anemo|Geo)\b/g).map((part,index)=>elements.has(part)
    ? <img key={index} className="resistance-element-icon" src={part==='Physical'?physicalIcon:`${import.meta.env.BASE_URL}icons/elements/${part}_Icon.png`} alt={part} width="16" height="16"/>
    : <React.Fragment key={index}>{part}</React.Fragment>)}</span><span className="resistance-tooltip" role="tooltip" id={tooltipId}>Resistances</span></span>;
}

type Enemy = {name:string;iconUrl:string|null};

function EnemyWaveText({value}:{value:string}){
  const enemies=Object.values(enemiesById).sort((a,b)=>b.name.length-a.name.length);
  const parts:React.ReactNode[]=[];
  let remaining=value;
  while(remaining){
    const matches=enemies.map(enemy=>({enemy,index:remaining.indexOf(enemy.name)})).filter(match=>match.index>=0).sort((a,b)=>a.index-b.index);
    const match=matches[0];
    if(!match){parts.push(remaining);break;}
    if(match.index)parts.push(remaining.slice(0,match.index));
    const {enemy}=match;
    parts.push(<React.Fragment key={parts.length}><a className="act-wave-enemy" href={enemy.wikiUrl} target="_blank" rel="noreferrer" aria-label={`View ${enemy.name} on Fandom`} title={enemy.name}><img src={enemyIcons[`./assets/enemies/${enemy.icon}`]} alt="" width="24" height="24" loading="lazy"/></a></React.Fragment>);
    remaining=remaining.slice(match.index+enemy.name.length);
  }
  return <>{parts}</>;
}
function ChallengeRequirements({value}:{value:string}){
  const lines=splitChallengeRequirements(value).requirements.split('\n').filter(Boolean);
  if(!lines.length)return null;
  const clear=lines.filter(line=>/^Clear:/i.test(line)).map(line=>line.replace(/^Clear:\s*/i,'')).join('\n');
  const star=lines.filter(line=>/^Star(?: Challenge)?:/i.test(line)).map(line=>line.replace(/^Star(?: Challenge)?:\s*/i,'')).join('\n');
  const other=lines.filter(line=>!/^(?:Clear|Star(?: Challenge)?):/i.test(line));
  const content=(text:string)=>{
    const capitalized=text.charAt(0).toUpperCase()+text.slice(1);
    return capitalized.split(/(\d+(?:\.\d+)?%?|\d+m(?: \d+s)?)/g).map((part,index)=>/^\d/.test(part)?<strong key={index}>{part}</strong>:part);
  };
  return <div className="act-detail-field"><strong>Challenge Requirements</strong><div className="act-requirements-comparison">
    {clear&&<div className="act-requirement-card"><strong className="act-requirement-label">Clear</strong><div>{content(clear)}</div></div>}
    {star&&<div className="act-requirement-card is-star"><span className="act-requirement-label"><svg className="act-star-icon" viewBox="0 0 24 24" role="img" aria-label="Star Challenge"><path fill="currentColor" d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"/></svg></span><div>{content(star)}</div></div>}
  </div>{other.length>0&&<div className="act-requirements-lines">{other.map((line,index)=><div key={index}>{content(line)}</div>)}</div>}</div>;
}

function EnemyDetails({value,requirements}:{value:string;requirements:string}){
  const lines=playerEnemyNotes(value).split('\n').filter(Boolean);
  const waves=lines.filter(line=>/^Wave \d+:/i.test(line));
  const total=value.match(/(\d+) enemies (?:total|in (?:one|1) wave)/i)?.[1];
  const waveCount=waves.length||(/in (?:one|1) wave/i.test(value)?1:undefined);
  const summary=[total?total+' '+(total==='1'?'Enemy':'Enemies'):null,waveCount?waveCount+' '+(waveCount===1?'Wave':'Waves'):null].filter(Boolean).join(' | ');
  const details=[...lines.filter(line=>!/^\d+ enemies total\.?$/i.test(line)),...splitChallengeRequirements(requirements).details];
  if(!summary&&!details.length)return null;
  return <div className="act-detail-field act-enemy-details"><strong>Details</strong>{summary&&<div className="act-wave-summary">{summary}</div>}{details.map((line,index)=><div key={index} className="act-wave-row"><EnemyWaveText value={line.replace(/^\d+ enemies in (?:one|1) wave[^:]*:\s*/i,'Wave 1: ').replace(/\.$/,'')}/></div>)}</div>;
}

type Season = {season:number;id:string;startsAt:string;endsAt:string;sourceUrl:string};
const emptyAct = ():Act=>({requirements:'',notes:'',encounters:[]});
const modes:Record<string,number>={Easy:3,Normal:6,Hard:8,Visionary:10,Lunar:12};
const storageKey='itp-act-details-draft-v1';
function initialData():Data {
  if(import.meta.env.DEV)try {
    const saved=localStorage.getItem(storageKey);
    if(saved){const data=JSON.parse(saved);if(data&&typeof data.seasons==='object'&&data.seasons!==null)return siteActDetails(mergeActDetailsDraft(published as Data,data));}
  }catch{/* Use published details if the browser draft is unavailable. */}
  return published as Data;
}
export function ActDetails({seasons,now,bossesForAct,difficulty,onDifficultyChange}:{seasons:Season[];now:number;bossesForAct:(season:number,difficulty:string,act:number)=>Enemy[];difficulty:string;onDifficultyChange:(difficulty:string)=>void}) {
  const [data,setData]=useState<Data>(initialData);
  const [editing,setEditing]=useState(false);
  const [saveStatus,setSaveStatus]=useState('');
  const [collapsedActs,setCollapsedActs]=useState<Record<string,boolean>>({});
  const [collapsedChoices,setCollapsedChoices]=useState<Record<string,boolean>>({});
  const released=seasons.filter(season=>seasonStatus(season,now)==='Current');
  const [selected,setSelected]=useState<number|undefined>(released[0]?.season);
  const season=released.find(candidate=>candidate.season===selected)??released[0];
  useEffect(()=>{
    if(!import.meta.env.DEV)return;
    try{localStorage.setItem(storageKey,JSON.stringify(data));setSaveStatus('Draft saved in this browser.');}
    catch{setSaveStatus('Browser save unavailable. Download the JSON to keep your changes.');}
  },[data]);
  function update(act:number,value:Act){
    if(!season)return;
    const key=String(season.season);
    setData(current=>({...current,seasons:{...current.seasons,[key]:{...current.seasons[key],[difficulty]:{...current.seasons[key]?.[difficulty],[act]:value}}}}));
  }
  function download(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='theater-act-details.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const field=(label:string,value:string,onChange:(value:string)=>void)=>editing
    ? <label className="act-detail-field">{label}<textarea value={value} onChange={event=>onChange(event.target.value)} rows={3}/></label>
    : value?<div className="act-detail-field"><strong>{label}</strong><p>{label==='Enemies / waves'?<EnemyWaveText value={value}/>:value}</p></div>:null;
  const actOrder=difficulty==='Lunar'?[1,2,3,11,4,5,6,12,7,8,9,10]:Array.from({length:modes[difficulty]},(_,index)=>index+1);
  return <section className="act-details">
    <div className="sectionhead"><div><h2>Act Details (WIP)</h2><p>Enemy choices, resistances, clear requirements, and notes for the currently released theater.</p></div>
      {import.meta.env.DEV&&<div className="actions"><button onClick={()=>setEditing(!editing)}>{editing?'Finish editing':'Edit act details'}</button><button onClick={download}>Download act details JSON</button></div>}
    </div>
    {!season?<p role="status">No currently released theater is available in the bundled data.</p>:<>
      <div className="boss-editor-controls">
        <label>Theater<select value={season.season} onChange={event=>setSelected(Number(event.target.value))}>{released.map(candidate=><option key={candidate.season} value={candidate.season}>Season {candidate.season} · {candidate.id}</option>)}</select></label>
        <label>Difficulty<select value={difficulty} onChange={event=>onDifficultyChange(event.target.value)}>{Object.keys(modes).map(mode=><option key={mode}>{mode}</option>)}</select></label>
      </div>
      {editing&&<p className="note" role="status">{saveStatus} Replace src/data/theater-act-details.json with the download and redeploy to publish. Each encounter represents one selectable challenge; list its enemies and resistance exceptions together.</p>}
      <div className="act-details-grid">{actOrder.map(number=>{
        const act=data.seasons[String(season.season)]?.[difficulty]?.[number]??emptyAct();
        const bosses=bossesForAct(season.season,difficulty,number);
        const bossNames=[3,6,8,10,12].includes(number)
          ? [...new Set(act.encounters.flatMap(encounter=>encounterEnemyIds(encounter).map(id=>enemiesById[id]?.name).filter(Boolean))) ]
          : [];
        const headingBosses=bossNames.length?bossNames:bosses.map(boss=>boss.name);
        const actKey=`${season.season}-${difficulty}-${number}`;
        const actLabel=number>10?`Lunar Act ${number-10} · Arcanum Challenge`:`Act ${number}`;
        const actCollapsed=!editing&&Boolean(collapsedActs[actKey]);
        return <article className={`act-detail-card${actCollapsed?' is-collapsed':''}`} key={actKey}>
          <div className="act-detail-heading"><button type="button" className="details-toggle" disabled={editing} aria-label={`${actCollapsed?'Expand':'Collapse'} ${actLabel}`} aria-expanded={!actCollapsed} aria-controls={`act-content-${actKey}`} onClick={()=>setCollapsedActs(current=>({...current,[actKey]:!actCollapsed}))}><span aria-hidden="true">{actCollapsed?'▸':'▾'}</span></button><h3>{actLabel}</h3>{headingBosses.length>0&&<span className="act-objective">Boss</span>}{act.level!==undefined&&<span className="act-level">Level {act.level}</span>}</div>
          <div id={`act-content-${actKey}`}>
          {!actCollapsed&&bosses.length>0&&!act.encounters.some(encounter=>encounterEnemyIds(encounter).length)&&<div><strong>Bosses</strong>{bosses.map((boss,index)=><a className="boss-preview-entry" key={index} href={`https://genshin-impact.fandom.com/wiki/${encodeURIComponent(boss.name.replaceAll(' ','_'))}`} target="_blank" rel="noreferrer" title={`View ${boss.name} on Fandom`}>{boss.iconUrl&&<img src={boss.iconUrl} alt="" loading="lazy"/>}<span>{boss.name}</span></a>)}</div>}
          {!actCollapsed&&field('Act Requirements',editing?act.requirements:playerActRequirements(act.requirements),value=>update(number,{...act,requirements:value}))}
          {!act.encounters.length&&<p>No encounter choices recorded yet.</p>}
          {act.encounters.map((encounter,index)=>{
            const change=(key:keyof Encounter,value:string)=>update(number,{...act,encounters:act.encounters.map((item,i)=>i===index?{...item,[key]:value}:item)});
            const lineup=encounterEnemyIds(encounter).map(id=>enemiesById[id]).filter(Boolean);
            const choiceKey=`${actKey}-${index}`;
            const isBoss=[3,6,8,10,12].includes(number)&&lineup.length===1;
            const hasChoices=act.encounters.length>1;
            const compact=actCollapsed||(hasChoices&&!editing&&Boolean(collapsedChoices[choiceKey]));
            const bountyNames=new Set((encounter.bountyEnemyIds??[]).map(id=>enemiesById[id]?.name));
            const resistanceDetails=enemyResistanceDetails(encounter.resistances,lineup.map(enemy=>enemy.name));
            const resistances=groupedResistances(resistanceDetails.byEnemy,lineup.map(enemy=>enemy.name),Object.fromEntries(lineup.map(enemy=>[enemy.name,enemy.baseResistances])));
            const hasIndividual=!resistances.shared&&lineup.length>0;
            const hasResistances=Boolean(resistances.shared)||hasIndividual;
            const columnStyle=(position:number)=>({'--enemy-column':position+1,'--mobile-column':position%2+1,'--mobile-row':Math.floor(position/2)+1,'--mobile-resistance-row':Math.floor(position/2)+(resistances.shared?2:1)} as React.CSSProperties);
            const portraits=<div className={`act-enemy-lineup${hasIndividual?' has-resistances':''}${compact?' is-compact':''}`} style={{'--enemy-count':Math.max(1,lineup.length),'--mobile-count':Math.max(1,Math.min(2,lineup.length))} as React.CSSProperties} aria-label={hasChoices?`Choice ${index+1} enemy lineup`:`${actLabel} enemy lineup`}>{lineup.map((enemy,position)=><div className={`act-enemy-link${bountyNames.has(enemy.name)?' is-bounty':''}`} style={columnStyle(position)} key={enemy.name}><figure className={`act-enemy-portrait${compact&&isBoss?' is-compact-boss':''}`}>{!compact&&isBoss&&<figcaption>{enemy.name}</figcaption>}<a href={enemy.wikiUrl} target="_blank" rel="noreferrer" aria-label={`View ${enemy.name}${bountyNames.has(enemy.name)?' (Bounty)':''} on Fandom`} title={`View ${enemy.name} on Fandom`}><img src={enemyIcons[`./assets/enemies/${enemy.icon}`]} alt="" width="72" height="72" loading="lazy"/></a>{compact&&isBoss&&<figcaption>{enemy.name}</figcaption>}{!compact&&!isBoss&&<figcaption>{enemy.name}{bountyNames.has(enemy.name)&&<span className="act-bounty-badge">Bounty</span>}</figcaption>}</figure></div>)}
              {!compact&&hasResistances&&<div className={`act-resistance-section${resistances.shared?' has-shared':''}${hasIndividual?' has-individual':''}`} aria-label="Resistance exceptions">
                {resistances.shared&&<div className="act-resistance-shared" aria-label="Resistances shared by all enemies"><span className="resistance-scope">{lineup.length===2?'Both enemies':'All enemies'}</span><ResistanceLabels value={resistances.shared}/></div>}
                {hasIndividual&&lineup.map((enemy,position)=><div className="act-resistance-enemy" style={columnStyle(position)} key={enemy.name} aria-label={resistances.individual[enemy.name]?`${enemy.name} resistance exceptions`:undefined}>{resistances.individual[enemy.name]&&<ResistanceLabels value={resistances.individual[enemy.name]}/>}</div>)}
              </div>}
            </div>;
            const eliteAssault=/\bElite Assault\b/i.test(encounter.name);
            return <div className={`act-encounter${compact?' is-collapsed':''}${eliteAssault?' is-elite-assault':''}`} key={index}>
              {hasChoices&&<div className="act-choice-heading"><button type="button" className="details-toggle" disabled={editing} aria-label={`${compact?'Expand':'Collapse'} ${actLabel}, choice ${index+1}`} aria-expanded={!compact} aria-controls={`choice-content-${choiceKey}`} onClick={()=>{
                if(actCollapsed)setCollapsedActs(current=>({...current,[actKey]:false}));
                setCollapsedChoices(current=>({...current,[choiceKey]:!compact}));
              }}><span aria-hidden="true">{compact?'▸':'▾'}</span></button><h4>Choice {index+1}</h4>{eliteAssault&&<span className="act-elite-badge">Elite Assault</span>}{compact&&!!lineup.length&&portraits}</div>}
              {!hasChoices&&compact&&!!lineup.length&&portraits}
              <div id={`choice-content-${choiceKey}`} hidden={compact}>
              {field('Challenge',editing?encounter.name:playerDetailText(encounter.name),value=>change('name',value))}
              {!compact&&!!lineup.length&&portraits}
              {editing?field('Enemies / waves',encounter.enemies,value=>change('enemies',value)):<><ChallengeRequirements value={encounter.requirements}/><EnemyDetails value={encounter.enemies} requirements={encounter.requirements}/></>}
              {field(editing?'Resistances / immunities':'Resistance notes',editing?encounter.resistances:lineup.length?resistanceDetails.notes:resistanceExceptions(encounter.resistances),value=>change('resistances',value))}
              {editing&&field('Challenge Requirements',encounter.requirements,value=>change('requirements',value))}
              {(editing||((eliteAssault||number>10)&&encounter.stageEffects))&&field('Stage Effects',editing?encounter.stageEffects??'':playerDetailText(encounter.stageEffects??''),value=>change('stageEffects',value))}
              {(encounter.mechanics||editing)&&field('Mechanics',editing?encounter.mechanics??'':playerDetailText(encounter.mechanics??''),value=>change('mechanics',value))}
              {field('Challenge Notes',encounter.notes,value=>change('notes',value))}
              {editing&&<button onClick={()=>update(number,{...act,encounters:act.encounters.filter((_,i)=>i!==index)})}>Remove challenge {index+1}</button>}
              </div>
            </div>;
          })}
          {editing&&<button onClick={()=>update(number,{...act,encounters:[...act.encounters,{name:'',enemies:'',resistances:'',requirements:'',notes:''}]})}>Add enemy choice</button>}
          {!actCollapsed&&field('Act Notes',act.notes,value=>update(number,{...act,notes:value}))}
          </div>
        </article>;
      })}</div>
    </>}
  </section>;
}
