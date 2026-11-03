import React,{useEffect,useMemo,useRef,useState} from 'react';
import {bossPortrait} from './bossPortraits';
import {getBossesForSlot,getDefaultBossesForSlot} from './theaterData';
import type {TheaterBoss,TheaterBossData,TheaterSeason,BossOverrideSlot,BossCatalogEntry} from './plannerTypes';

function BossSearchPicker({bossCatalog,otherBosses,value,onChange}:{bossCatalog:BossCatalogEntry[];otherBosses:TheaterBoss[];value:string;onChange:(name:string)=>void}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const container=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open)return;
    const closeOutside=(event:PointerEvent)=>{
      if(container.current&&!container.current.contains(event.target as Node))setOpen(false);
    };
    document.addEventListener('pointerdown',closeOutside);
    return ()=>document.removeEventListener('pointerdown',closeOutside);
  },[open]);
  const term=query.trim().toLocaleLowerCase();
  const matches=(boss:TheaterBoss)=>boss.name.toLocaleLowerCase().includes(term);
  const normalBosses=bossCatalog.filter(boss=>boss.type==='Boss'&&matches(boss));
  const localLegends=bossCatalog.filter(boss=>boss.type==='Local Legend'&&matches(boss));
  const otherMatches=otherBosses.filter(matches);
  const choose=(name:string)=>{onChange(name);setQuery('');setOpen(false);};
  return <div className="boss-search-picker" ref={container}>
    <button className="boss-search-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(current=>!current)}>
      <span className={!value?'placeholder':''}>{value||'Search and select a boss…'}</span><span className="borrowed-chevron" aria-hidden="true">{open?'▴':'▾'}</span>
    </button>
    {open&&<div className="boss-search-menu">
      <input autoFocus type="search" aria-label="Search known bosses" placeholder="Search bosses…" value={query} onChange={event=>setQuery(event.target.value)}/>
      <div className="boss-search-options" role="listbox" aria-label="Known bosses">
        {normalBosses.length>0&&<div className="boss-search-group"><strong>Boss enemies</strong>{normalBosses.map(boss=><button type="button" role="option" aria-selected={value===boss.name} className="boss-search-option" key={boss.name} onClick={()=>choose(boss.name)}>{boss.iconUrl&&<img src={bossPortrait(boss.name,boss.iconUrl)} alt="" loading="lazy"/>}<span>{boss.name}</span></button>)}</div>}
        {localLegends.length>0&&<div className="boss-search-group"><strong>Local Legends</strong>{localLegends.map(boss=><button type="button" role="option" aria-selected={value===boss.name} className="boss-search-option" key={boss.name} onClick={()=>choose(boss.name)}>{boss.iconUrl&&<img src={bossPortrait(boss.name,boss.iconUrl)} alt="" loading="lazy"/>}<span>{boss.name}</span></button>)}</div>}
        {otherMatches.length>0&&<div className="boss-search-group"><strong>Other</strong>{otherMatches.map(boss=><button type="button" role="option" aria-selected={value===boss.name} className="boss-search-option" key={boss.name} onClick={()=>choose(boss.name)}>{boss.iconUrl&&<img src={bossPortrait(boss.name,boss.iconUrl)} alt="" loading="lazy"/>}<span>{boss.name}</span></button>)}</div>}
        {!normalBosses.length&&!localLegends.length&&!otherMatches.length&&<p className="selection-empty">No known bosses match your search.</p>}
      </div>
    </div>}
  </div>;
}
export function BossOverrideEditor({data,seasons,bossCatalog,onChange}:{data:TheaterBossData;seasons:TheaterSeason[];bossCatalog:BossCatalogEntry[];onChange:React.Dispatch<React.SetStateAction<TheaterBossData>>}){
  const [seasonNumber,setSeasonNumber]=useState(seasons[0]?.season??0);
  const [slot,setSlot]=useState<BossOverrideSlot>('boss1');
  const [selectedBoss,setSelectedBoss]=useState('');
  const [customName,setCustomName]=useState('');
  const [customIcon,setCustomIcon]=useState('');
  const [editingBoss,setEditingBoss]=useState<number|null>(null);
  const [editedBossName,setEditedBossName]=useState('');
  const season=seasons.find(candidate=>candidate.season===seasonNumber)??seasons[0];
  const slotTitles:Record<BossOverrideSlot,string>={boss1:'Boss 1',boss2:'Boss 2',boss3:'Boss 3',boss4:'Boss 4',lunar2:'Arcana 2 boss'};
  const slotDescriptions:Record<BossOverrideSlot,string>={boss1:'Act 3 in every difficulty.',boss2:'Act 6 in Normal and above.',boss3:'Act 8 in Visionary and Lunar.',boss4:'Act 8 in Hard; Act 10 in Visionary and Lunar.',lunar2:'Arcana Challenge 2, if it has a boss.'};
  const generatedBosses=season?getDefaultBossesForSlot(season,slot):[];
  const currentBosses=season?getBossesForSlot(season,data,slot):[];
  const bossOptions=useMemo(()=>{
    const options=new Map<string,TheaterBoss>();
    for(const boss of bossCatalog)options.set(boss.name,boss);
    for(const candidate of seasons)for(const stage of candidate.bossStages)for(const boss of stage.bosses)options.set(boss.name,boss);
    for(const seasonOverrides of Object.values(data.seasons))for(const bosses of Object.values(seasonOverrides))for(const boss of bosses??[])options.set(boss.name,boss);
    return [...options.values()].sort((left,right)=>left.name.localeCompare(right.name));
  },[bossCatalog,data,seasons]);
  const availableBossCatalog=bossCatalog.filter(boss=>!currentBosses.some(current=>current.name===boss.name));
  const availableOtherBosses=bossOptions.filter(boss=>!bossCatalog.some(entry=>entry.name===boss.name)&&!currentBosses.some(current=>current.name===boss.name));
  const updateStage=(update:(current:TheaterBoss[])=>TheaterBoss[])=>{
    if(!season)return;
    onChange(current=>{
      const seasonKey=String(season.season);
      const updated=update(current.seasons[seasonKey]?.[slot]??generatedBosses);
      return {seasons:{...current.seasons,[seasonKey]:{...current.seasons[seasonKey],[slot]:updated}}};
    });
  };
  const removeOverride=()=>{
    if(!season)return;
    const seasonKey=String(season.season);
    const nextSeasons={...data.seasons};
    const nextSlots={...nextSeasons[seasonKey]};
    delete nextSlots[slot];
    if(Object.keys(nextSlots).length)nextSeasons[seasonKey]=nextSlots;
    else delete nextSeasons[seasonKey];
    onChange({seasons:nextSeasons});
  };
  const addBoss=(boss:TheaterBoss)=>{
    if(currentBosses.some(current=>current.name===boss.name))return;
    updateStage(current=>[...current,boss]);
  };
  const downloadOverrides=()=>{
    const blob=new Blob([`${JSON.stringify(data,null,2)}\n`],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download='theater-bosses.json';
    anchor.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  if(!seasons.length)return <p>No season data is available yet for boss overrides.</p>;
  return <div className="boss-override-editor">
    <div className="sectionhead"><div><h3>Boss Overrides</h3><p>Choose the season and boss slot. The planner maps slots to the right acts for each difficulty automatically. Download the JSON to share changes with everyone.</p></div><button type="button" onClick={downloadOverrides}>Download boss overrides JSON</button></div>
    <div className="boss-editor-controls">
      <label>Season<select value={season?.season??''} onChange={event=>setSeasonNumber(Number(event.target.value))}>{seasons.map(candidate=><option key={candidate.season} value={candidate.season}>Season {candidate.season} · {candidate.id}</option>)}</select></label>
      <label>Boss slot<select value={slot} onChange={event=>setSlot(event.target.value as BossOverrideSlot)}>{(['boss1','boss2','boss3','boss4','lunar2'] as const).map(value=><option key={value} value={value}>{slotTitles[value]}</option>)}</select></label>
    </div>
    <p className="note">{slotDescriptions[slot]}</p>
    <div className="boss-editor-list">
      <strong>{slotTitles[slot]}</strong>
      {currentBosses.length?currentBosses.map((boss,index)=><div className="boss-editor-row" key={index}>
        {boss.iconUrl&&<img src={bossPortrait(boss.name,boss.iconUrl)} alt="" loading="lazy"/>}{editingBoss===index?<><input aria-label={`Name for ${boss.name}`} value={editedBossName} onChange={event=>setEditedBossName(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();const name=editedBossName.trim();if(name)updateStage(current=>current.map((item,bossIndex)=>bossIndex===index?{...item,name}:item));setEditingBoss(null);}}}/><button type="button" onClick={()=>{const name=editedBossName.trim();if(name)updateStage(current=>current.map((item,bossIndex)=>bossIndex===index?{...item,name}:item));setEditingBoss(null);}}>Save name</button></>:<><span>{boss.name}</span><button type="button" onClick={()=>{setEditingBoss(index);setEditedBossName(boss.name);}}>Rename</button></>}<button type="button" aria-label={`Remove ${boss.name}`} onClick={()=>updateStage(current=>{
          return current.filter((_,bossIndex)=>bossIndex!==index);
        })}>Remove</button>
      </div>):<p>No boss selected. Add one below or keep this slot empty.</p>}
    </div>
    <div className="boss-editor-controls">
      <label>Known boss<BossSearchPicker bossCatalog={availableBossCatalog} otherBosses={availableOtherBosses} value={selectedBoss} onChange={setSelectedBoss}/></label>
      <button type="button" disabled={!selectedBoss} onClick={()=>{
        const boss=bossOptions.find(candidate=>candidate.name===selectedBoss);
        if(boss)addBoss(boss);
        setSelectedBoss('');
      }}>Add selected boss</button>
      <label>Other boss name<input value={customName} onChange={event=>setCustomName(event.target.value)} placeholder="Enter a boss name"/></label>
      <label>Optional icon URL<input value={customIcon} onChange={event=>setCustomIcon(event.target.value)} placeholder="https://…"/></label>
      <button type="button" disabled={!customName.trim()} onClick={()=>{
        const name=customName.trim();
        const matchingBoss=bossOptions.find(boss=>boss.name.toLocaleLowerCase()===name.toLocaleLowerCase());
        addBoss({name,iconUrl:customIcon.trim()||matchingBoss?.iconUrl||null});
        setCustomName('');
        setCustomIcon('');
      }}>Add custom boss</button>
    </div>
    <button className="boss-reset-button" type="button" disabled={!season||!data.seasons[String(season.season)]?.[slot]} onClick={removeOverride}>Restore Fandom data for this slot</button>
    <p className="note">Edits preview immediately. Download the JSON, replace <code>src/data/theater-bosses.json</code>, then commit and redeploy to publish them.</p>
  </div>;
}
