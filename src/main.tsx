import React, {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CHARACTERS,ELEMENTS,type Character,type Element} from './characters';
import rawLineupData from './data/theater-lineups.json';
import rawBossData from './data/theater-bosses.json';
import './style.css';
type Ownership = Record<string,{owned:boolean;level:number}>;
type Setup = {difficulty:string;elements:Element[];opening:string[];guests:string[];seasonId?:number};
type Plan = {roster:string[];acts:Record<number,string[]>;borrowed?:string};
type TheaterBoss = {name:string;iconUrl:string|null};
type BossCatalogEntry = TheaterBoss & {type:'Boss'|'Local Legend'};
type TheaterBossStage = {act:number;bosses:TheaterBoss[]};
type BossOverrideSlot = 'boss1'|'boss2'|'boss3'|'boss4'|'lunar2';
type TheaterSeason = {id:string;season:number;startsAt:string;endsAt:string;elements:Element[];openingCharacters:string[];specialGuests:string[];bossStages:TheaterBossStage[];charactersMissingFromRoster:string[];sourceUrl:string};
type TheaterLineupData = {source:string;current:TheaterSeason|null;next:TheaterSeason|null;bossCatalog:BossCatalogEntry[];nextUnavailableReason:string|null;generatedAt:string|null};
type TheaterBossData = {seasons:Record<string,Partial<Record<BossOverrideSlot,TheaterBoss[]>>>};
function stored<T>(key:string,fallback:T):T {try {const v=localStorage.getItem(key);return v?JSON.parse(v) as T:fallback;}catch{return fallback;}}
function parseSeason(value:unknown):TheaterSeason|null {
  if(value===null)return null;
  if(!value||typeof value!=='object')throw new Error('Invalid generated Theater season data.');
  const season=value as Record<string,unknown>;
  if(typeof season.id!=='string'||!Number.isInteger(season.season)||typeof season.startsAt!=='string'||typeof season.endsAt!=='string'||!Array.isArray(season.elements)||!season.elements.every(element=>ELEMENTS.includes(element as Element))||!Array.isArray(season.openingCharacters)||!season.openingCharacters.every(name=>typeof name==='string')||!Array.isArray(season.specialGuests)||!season.specialGuests.every(name=>typeof name==='string')||!Array.isArray(season.bossStages)||!season.bossStages.every(stage=>!!stage&&typeof stage==='object'&&Number.isInteger((stage as Record<string,unknown>).act)&&Array.isArray((stage as Record<string,unknown>).bosses)&&(stage as {bosses:unknown[]}).bosses.every(boss=>!!boss&&typeof boss==='object'&&typeof (boss as Record<string,unknown>).name==='string'&&((boss as Record<string,unknown>).iconUrl===null||typeof (boss as Record<string,unknown>).iconUrl==='string')))||typeof season.sourceUrl!=='string')throw new Error('Generated Theater season data has an invalid shape.');
  const openingCharacters=season.openingCharacters as string[];
  const specialGuests=season.specialGuests as string[];
  return {id:season.id,season:season.season as number,startsAt:season.startsAt,endsAt:season.endsAt,elements:season.elements as Element[],openingCharacters,specialGuests,bossStages:season.bossStages as TheaterBossStage[],charactersMissingFromRoster:[...openingCharacters,...specialGuests].filter(name=>!CHARACTERS.some(character=>character.name===name)),sourceUrl:season.sourceUrl};
}
function parseLineupData(value:unknown):TheaterLineupData {
  if(!value||typeof value!=='object')throw new Error('Generated Theater lineup data is missing.');
  const data=value as Record<string,unknown>;
  if(typeof data.source!=='string'||(data.nextUnavailableReason!==null&&typeof data.nextUnavailableReason!=='string')||(data.generatedAt!==null&&typeof data.generatedAt!=='string')||!Array.isArray(data.bossCatalog)||!data.bossCatalog.every(boss=>!!boss&&typeof boss==='object'&&typeof (boss as Record<string,unknown>).name==='string'&&['Boss','Local Legend'].includes(String((boss as Record<string,unknown>).type))&&((boss as Record<string,unknown>).iconUrl===null||typeof (boss as Record<string,unknown>).iconUrl==='string')))throw new Error('Generated Theater lineup metadata has an invalid shape.');
  return {source:data.source,current:parseSeason(data.current),next:parseSeason(data.next),bossCatalog:data.bossCatalog as BossCatalogEntry[],nextUnavailableReason:data.nextUnavailableReason,generatedAt:data.generatedAt};
}
function parseBossData(value:unknown):TheaterBossData {
  if(!value||typeof value!=='object'||!('seasons' in value)||(value as {seasons?:unknown}).seasons===null||typeof (value as {seasons?:unknown}).seasons!=='object')throw new Error('Theater boss data has an invalid shape.');
  const seasons=(value as {seasons:Record<string,unknown>}).seasons;
  const parsed: TheaterBossData['seasons']={};
  const slots:BossOverrideSlot[]=['boss1','boss2','boss3','boss4','lunar2'];
  for(const [season,overrides] of Object.entries(seasons)){
    if(!/^\d+$/.test(season)||!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw new Error('Theater boss override has an invalid season or slot map.');
    const parsedSlots:Partial<Record<BossOverrideSlot,TheaterBoss[]>>={};
    for(const [slot,bosses] of Object.entries(overrides)){
      if(!slots.includes(slot as BossOverrideSlot)||!Array.isArray(bosses)||!bosses.every(boss=>!!boss&&typeof boss==='object'&&typeof (boss as Record<string,unknown>).name==='string'&&((boss as Record<string,unknown>).iconUrl===null||typeof (boss as Record<string,unknown>).iconUrl==='string')))throw new Error('Theater boss override has an invalid slot or boss list.');
      parsedSlots[slot as BossOverrideSlot]=bosses as TheaterBoss[];
    }
    parsed[season]=parsedSlots;
  }
  return {seasons:parsed};
}
const theaterLineups=parseLineupData(rawLineupData);
const theaterBosses=parseBossData(rawBossData);
const availableSeasons=[theaterLineups.current,theaterLineups.next].filter((season):season is TheaterSeason=>season!==null);
const LEVEL_OPTIONS=[20,40,50,60,70,80,90] as const;
const difficulties:Record<string,{acts:number;lunarActs?:number;minimum:number;cap:number;minimumLevel:number}> = {'Easy':{acts:3,minimum:8,cap:10,minimumLevel:60},'Normal':{acts:6,minimum:12,cap:14,minimumLevel:60},'Hard':{acts:8,minimum:16,cap:20,minimumLevel:70},'Visionary':{acts:10,minimum:22,cap:26,minimumLevel:70},'Lunar':{acts:10,lunarActs:2,minimum:28,cap:32,minimumLevel:70}};
function getDefaultBossesForSlot(season:TheaterSeason,slot:BossOverrideSlot):TheaterBoss[]{
  const act=slot==='boss1'?3:slot==='boss2'?6:slot==='boss3'?8:slot==='boss4'?10:12;
  const stage=season.bossStages.find(candidate=>candidate.act===act)
    ??(slot==='boss4'?season.bossStages.find(candidate=>candidate.act===8):undefined);
  return stage?.bosses??[];
}
function getBossesForSlot(season:TheaterSeason,data:TheaterBossData,slot:BossOverrideSlot):TheaterBoss[]{
  const overrides=data.seasons[String(season.season)];
  const override=overrides?.[slot];
  if(override)return override;
  const generated=getDefaultBossesForSlot(season,slot);
  if(slot==='boss3'){
    const finalBosses=overrides?.boss4??getDefaultBossesForSlot(season,'boss4');
    const sameBosses=generated.length===finalBosses.length&&generated.every((boss,index)=>boss.name.toLocaleLowerCase()===finalBosses[index]?.name.toLocaleLowerCase());
    if(sameBosses)return [];
  }
  return generated;
}
function defaultSetup():Setup {
  const season=theaterLineups.current;
  return season
    ? {difficulty:'Hard',elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests,seasonId:season.season}
    : {difficulty:'Hard',elements:['Pyro','Hydro','Anemo'],opening:[],guests:[]};
}
const stageObjectives:Record<string,Record<number,string>>={
  Normal:{4:'Monolith Defense'},
  Hard:{4:'Monolith Defense'},
  Visionary:{4:'Monolith Defense',9:'Defeat Bounties'},
  Lunar:{4:'Monolith Defense',9:'Defeat Bounties'}
};
// Difficulty counts are configurable estimates: verify against the live game's rules.
function normalizeOwnership(data:unknown):Ownership {
  if(!data||typeof data!=='object'||Array.isArray(data))return {};
  return Object.fromEntries(Object.entries(data).map(([name,value])=>{
    const saved=value&&typeof value==='object'?value as {owned?:unknown;level?:unknown;level70?:unknown}:{};
    const level=LEVEL_OPTIONS.includes(saved.level as typeof LEVEL_OPTIONS[number])?saved.level as number:saved.level70===false?60:90;
    return [name,{owned:saved.owned===true,level}];
  }));
}
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
function ElementBadge({element}:{element:Element}){
  return <span className={`element ${element}`}>{element}<img className="element-icon" src={`${import.meta.env.BASE_URL}icons/elements/${element}_Icon.png`} alt="" aria-hidden="true"/></span>;
}
function BorrowedCharacterPicker({characters,selected,onSelect}:{characters:Character[];selected:string;onSelect:(name:string)=>void}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const selectedCharacter=characters.find(character=>character.name===selected);
  const filtered=characters.filter(character=>character.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="borrowed-picker">
    <button className="borrowed-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
      {selectedCharacter?<><CharacterIcon name={selectedCharacter.name}/><span>{selectedCharacter.name}</span><ElementBadge element={selectedCharacter.element}/></>:<span>No borrowed character</span>}
      <span className="borrowed-chevron" aria-hidden="true">▾</span>
    </button>
    {open&&<div className="borrowed-menu">
      <input className="borrowed-search" aria-label="Search borrowed characters" placeholder="Search characters…" value={query} onChange={event=>setQuery(event.target.value)}/>
      <div className="borrowed-options" role="listbox" aria-label="Borrowed character options">
        <button type="button" role="option" aria-selected={!selected} className="borrowed-option" onClick={()=>{onSelect('');setOpen(false);setQuery('');}}>No borrowed character</button>
        {filtered.map(character=><button type="button" role="option" aria-selected={character.name===selected} className="borrowed-option" key={character.name} onClick={()=>{onSelect(character.name);setOpen(false);setQuery('');}}>
          <CharacterIcon name={character.name}/><span>{character.name}</span><ElementBadge element={character.element}/>
        </button>)}
        {filtered.length===0&&<p className="selection-empty">No characters match your search.</p>}
      </div>
    </div>}
  </div>;
}
function ActAssignmentPicker({act,slot,characters,selected,borrowed,opening,canSelect,onSelect}:{act:number;slot:number;characters:Character[];selected:string;borrowed:string;opening:Set<string>;canSelect:(name:string)=>boolean;onSelect:(name:string)=>void}){
  const [open,setOpen]=useState(false);
  const selectedCharacter=characters.find(character=>character.name===selected);
  return <div className="act-picker">
    <button className="act-picker-trigger" type="button" aria-label={`Act ${act}, slot ${slot+1}`} aria-haspopup="listbox" aria-expanded={open} draggable={Boolean(selected)} onDragStart={event=>{if(!selected)return;event.dataTransfer.setData('application/x-itp-act-slot',`${act}:${slot}`);event.dataTransfer.effectAllowed='move';}} onClick={()=>setOpen(value=>!value)}>
      {selectedCharacter?<><CharacterIcon name={selectedCharacter.name}/><span className="act-picker-name">{selectedCharacter.name}</span><ElementBadge element={selectedCharacter.element}/><small>{selectedCharacter.name===borrowed?'Borrowed':opening.has(selectedCharacter.name)?'Opening':''}</small></>:<span>+ Slot {slot+1}</span>}
      <span className="borrowed-chevron" aria-hidden="true">▾</span>
    </button>
    {open&&<div className="act-picker-menu" role="listbox" aria-label={`Act ${act}, slot ${slot+1} characters`}>
      <button type="button" role="option" aria-selected={!selected} className="act-picker-option clear-act-option" onClick={()=>{onSelect('');setOpen(false);}}>Clear slot</button>
      {characters.map(character=><button type="button" role="option" aria-selected={character.name===selected} className="act-picker-option" key={character.name} disabled={!canSelect(character.name)} onClick={()=>{onSelect(character.name);setOpen(false);}}>
        <CharacterIcon name={character.name}/><span>{character.name}</span><ElementBadge element={character.element}/><small>{character.name===borrowed?'Borrowed':opening.has(character.name)?'Opening':''}</small>
      </button>)}
    </div>}
    {selected&&<button className="act-clear-button" type="button" aria-label={`Clear Act ${act}, slot ${slot+1}`} title="Clear slot" onClick={()=>onSelect('')}>×</button>}
  </div>;
}
function CharacterSelectionGrid({characters,selected,limit,disabled,onToggle}:{characters:Character[];selected:string[];limit:number;disabled:boolean;onToggle:(name:string)=>void}){
  const [query,setQuery]=useState('');
  const filtered=characters.filter(c=>c.name.toLowerCase().includes(query.toLowerCase()));
  return <><input className="selection-search" aria-label="Search characters" placeholder="Search characters…" value={query} onChange={e=>setQuery(e.target.value)} disabled={disabled}/><div className="characters selection-grid">{filtered.map(c=>{
    const checked=selected.includes(c.name);
    const unavailable=disabled||(!checked&&selected.length>=limit);
    return <div className={'character '+(checked?'owned':'')} key={c.name} role="checkbox" aria-checked={checked} tabIndex={unavailable?-1:0} aria-label={c.name} aria-disabled={unavailable} onClick={()=>{if(!unavailable)onToggle(c.name);}} onKeyDown={e=>{if(!unavailable&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onToggle(c.name);}}}><div className="character-top"><CharacterIcon name={c.name}/><ElementBadge element={c.element}/><strong>{c.name}</strong></div></div>;
  })}{filtered.length===0&&<p className="selection-empty">No characters match your search.</p>}</div></>;
}
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
        {normalBosses.length>0&&<div className="boss-search-group"><strong>Boss enemies</strong>{normalBosses.map(boss=><button type="button" role="option" aria-selected={value===boss.name} className="boss-search-option" key={boss.name} onClick={()=>choose(boss.name)}>{boss.iconUrl&&<img src={boss.iconUrl} alt="" loading="lazy"/>}<span>{boss.name}</span></button>)}</div>}
        {localLegends.length>0&&<div className="boss-search-group"><strong>Local Legends</strong>{localLegends.map(boss=><button type="button" role="option" aria-selected={value===boss.name} className="boss-search-option" key={boss.name} onClick={()=>choose(boss.name)}>{boss.iconUrl&&<img src={boss.iconUrl} alt="" loading="lazy"/>}<span>{boss.name}</span></button>)}</div>}
        {otherMatches.length>0&&<div className="boss-search-group"><strong>Other</strong>{otherMatches.map(boss=><button type="button" role="option" aria-selected={value===boss.name} className="boss-search-option" key={boss.name} onClick={()=>choose(boss.name)}>{boss.iconUrl&&<img src={boss.iconUrl} alt="" loading="lazy"/>}<span>{boss.name}</span></button>)}</div>}
        {!normalBosses.length&&!localLegends.length&&!otherMatches.length&&<p className="selection-empty">No known bosses match your search.</p>}
      </div>
    </div>}
  </div>;
}
function BossOverrideEditor({data,seasons,bossCatalog,onChange}:{data:TheaterBossData;seasons:TheaterSeason[];bossCatalog:BossCatalogEntry[];onChange:React.Dispatch<React.SetStateAction<TheaterBossData>>}){
  const [seasonNumber,setSeasonNumber]=useState(seasons[0]?.season??0);
  const [slot,setSlot]=useState<BossOverrideSlot>('boss1');
  const [selectedBoss,setSelectedBoss]=useState('');
  const [customName,setCustomName]=useState('');
  const [customIcon,setCustomIcon]=useState('');
  const [editingBoss,setEditingBoss]=useState<number|null>(null);
  const [editedBossName,setEditedBossName]=useState('');
  const season=seasons.find(candidate=>candidate.season===seasonNumber)??seasons[0];
  const slotTitles:Record<BossOverrideSlot,string>={boss1:'Boss 1',boss2:'Boss 2',boss3:'Boss 3',boss4:'Boss 4',lunar2:'Lunar Act 2 boss'};
  const slotDescriptions:Record<BossOverrideSlot,string>={boss1:'Act 3 in every difficulty.',boss2:'Act 6 in Normal and above.',boss3:'Act 8 in Visionary and Lunar.',boss4:'Act 8 in Hard; Act 10 in Visionary and Lunar.',lunar2:'Second Lunar stage (Act 12), if it has a boss.'};
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
        {boss.iconUrl&&<img src={boss.iconUrl} alt="" loading="lazy"/>}{editingBoss===index?<><input aria-label={`Name for ${boss.name}`} value={editedBossName} onChange={event=>setEditedBossName(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();const name=editedBossName.trim();if(name)updateStage(current=>current.map((item,bossIndex)=>bossIndex===index?{...item,name}:item));setEditingBoss(null);}}}/><button type="button" onClick={()=>{const name=editedBossName.trim();if(name)updateStage(current=>current.map((item,bossIndex)=>bossIndex===index?{...item,name}:item));setEditingBoss(null);}}>Save name</button></>:<><span>{boss.name}</span><button type="button" onClick={()=>{setEditingBoss(index);setEditedBossName(boss.name);}}>Rename</button></>}<button type="button" aria-label={`Remove ${boss.name}`} onClick={()=>updateStage(current=>{
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
function App(){
const [step,setStep]=useState(1);
const [ownership,setOwnership]=useState<Ownership>(()=>normalizeOwnership(stored<unknown>('itp-ownership-v1',{})));
const [setup,setSetup]=useState<Setup>(()=>stored('itp-setup-v1',defaultSetup()));
const [bossData,setBossData]=useState<TheaterBossData>(theaterBosses);
const [plan,setPlan]=useState<Plan>(()=>stored('itp-plan-v1',{roster:[],acts:{},borrowed:''}));
const [dropTarget,setDropTarget]=useState('');
const [search,setSearch]=useState('');const [filter,setFilter]=useState('All');const [ownedOnly,setOwnedOnly]=useState(false);
useEffect(()=>localStorage.setItem('itp-ownership-v1',JSON.stringify(ownership)),[ownership]);
useEffect(()=>localStorage.setItem('itp-setup-v1',JSON.stringify(setup)),[setup]);
useEffect(()=>localStorage.setItem('itp-plan-v1',JSON.stringify(plan)),[plan]);
useEffect(()=>{
  if(setup.seasonId===undefined)return;
  const season=availableSeasons.find(candidate=>candidate.season===setup.seasonId)??theaterLineups.current;
  if(!season)return;
  setSetup(current=>current.seasonId===season.season?{...current,elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests}:{...current,seasonId:season.season,elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests});
},[setup.seasonId]);
const selectedSeason=availableSeasons.find(season=>season.season===setup.seasonId)??null;
const selectedElements=setup.elements.filter((element):element is Element=>ELEMENTS.includes(element));
const hasThreeElements=selectedElements.length===3;
const openingOptions=hasThreeElements?CHARACTERS.filter(c=>selectedElements.includes(c.element)):[];
const guestOptions=hasThreeElements?CHARACTERS.filter(c=>!selectedElements.includes(c.element)):[];
const selectedOpening=setup.opening.filter(name=>openingOptions.some(c=>c.name===name));
const selectedGuests=setup.guests.filter(name=>guestOptions.some(c=>c.name===name));
const requirement=difficulties[setup.difficulty]??difficulties.Hard;
const eligibleOwned=CHARACTERS.filter(c=>ownership[c.name]?.owned&&(ownership[c.name]?.level??90)>=requirement.minimumLevel&&(selectedElements.includes(c.element)||selectedGuests.includes(c.name)));
const eligibleNames=new Set([...eligibleOwned.map(c=>c.name),...selectedOpening]);
const eligibleCount=eligibleNames.size;
const canContinueToPlanner=hasThreeElements&&eligibleCount>=requirement.minimum;
const available=CHARACTERS.filter(c=>selectedElements.includes(c.element)||selectedGuests.includes(c.name)||selectedOpening.includes(c.name));
const availableNames=new Set(available.map(c=>c.name));
const borrowedOptions=available.filter(character=>character.name!=='Aloy'&&!character.name.endsWith(' Traveler'));
const rosterCandidates=CHARACTERS.filter(c=>selectedOpening.includes(c.name)||(availableNames.has(c.name)&&ownership[c.name]?.owned&&(ownership[c.name]?.level??90)>=requirement.minimumLevel));
const rosterCandidateNames=new Set(rosterCandidates.map(c=>c.name));
const borrowedCharacter=typeof plan.borrowed==='string'&&borrowedOptions.some(character=>character.name===plan.borrowed)?plan.borrowed:'';
const chosen=[...new Set([...selectedOpening,...plan.roster.filter(name=>rosterCandidateNames.has(name)&&name!==borrowedCharacter),...(borrowedCharacter?[borrowedCharacter]:[])])];
const plannerCharacters=CHARACTERS.filter(character=>rosterCandidateNames.has(character.name)||character.name===borrowedCharacter);
const chosenForRequirement=chosen.filter(name=>name!==borrowedCharacter).length;
const openingNames=new Set(selectedOpening);
const toggleOwn=(name:string)=>setOwnership(o=>({...o,[name]:{owned:!o[name]?.owned,level:o[name]?.level??90}}));
const setCharacterLevel=(name:string,level:number)=>setOwnership(o=>({...o,[name]:{owned:o[name]?.owned??false,level}}));
const toggleArray=(values:string[],name:string,limit:number)=>values.includes(name)?values.filter(v=>v!==name):values.length<limit?[...values,name]:values;
const updateCustomSetup=(update:(current:Setup)=>Setup)=>setSetup(current=>({...update(current),seasonId:undefined}));
const toggleRoster=(name:string)=>setPlan(current=>{
  const roster=current.roster.filter(value=>rosterCandidateNames.has(value)&&value!==(current.borrowed??''));
  if(roster.includes(name))return {
    ...current,
    roster:roster.filter(value=>value!==name),
    acts:Object.fromEntries(Object.entries(current.acts).map(([act,names])=>[act,names.map(value=>value===name?'':value)])),
  };
  const currentBorrowed=typeof current.borrowed==='string'&&availableNames.has(current.borrowed)?current.borrowed:'';
  const count=new Set([...selectedOpening,...roster,...(currentBorrowed?[currentBorrowed]:[])]).size;
  return count>=requirement.cap?current:{...current,roster:[...roster,name]};
});
const canAssignToAct=(name:string,act:number,slot:number,assignments=plan.acts)=>{
  if(!chosen.includes(name)||(assignments[act]??[]).some((value,index)=>value===name&&index!==slot))return false;
  const otherActs=Object.entries(assignments).filter(([assignedAct,names])=>Number(assignedAct)!==act&&names.includes(name)).length;
  return otherActs<2;
};
const assignToAct=(act:number,slot:number,name:string)=>setPlan(current=>{
  if(name&&!canAssignToAct(name,act,slot,current.acts))return current;
  const assignments=[...(current.acts[act]??[])];
  assignments[slot]=name;
  return {...current,acts:{...current.acts,[act]:assignments}};
});
const dropCharacterIntoAct=(name:string,act:number,slot:number)=>setPlan(current=>{
  const roster=current.roster.filter(value=>rosterCandidateNames.has(value)&&value!==(current.borrowed??''));
  const currentBorrowed=typeof current.borrowed==='string'&&borrowedOptions.some(character=>character.name===current.borrowed)?current.borrowed:'';
  const selected=new Set([...selectedOpening,...roster,...(currentBorrowed?[currentBorrowed]:[])]);
  if(!selected.has(name)){
    if(!rosterCandidateNames.has(name)||selected.size>=requirement.cap)return current;
    roster.push(name);
  }
  const actNames=current.acts[act]??[];
  if(actNames.some((value,index)=>value===name&&index!==slot))return current;
  const otherActs=Object.entries(current.acts).filter(([assignedAct,names])=>Number(assignedAct)!==act&&names.includes(name)).length;
  if(otherActs>=2)return current;
  const assignments=[...actNames];
  assignments[slot]=name;
  return {...current,roster,acts:{...current.acts,[act]:assignments}};
});
const swapActSlots=(sourceAct:number,sourceSlot:number,targetAct:number,targetSlot:number)=>setPlan(current=>{
  if(sourceAct===targetAct&&sourceSlot===targetSlot)return current;
  const assignments=Object.fromEntries(Object.entries(current.acts).map(([act,names])=>[act,[...names]])) as Record<number,string[]>;
  const sourceNames=[...(assignments[sourceAct]??[])];
  const targetNames=sourceAct===targetAct?sourceNames:[...(assignments[targetAct]??[])];
  const sourceName=sourceNames[sourceSlot]??'';
  const targetName=targetNames[targetSlot]??'';
  sourceNames[sourceSlot]=targetName;
  targetNames[targetSlot]=sourceName;
  assignments[sourceAct]=sourceNames;
  assignments[targetAct]=targetNames;
  for(const name of new Set([sourceName,targetName].filter(Boolean))){
    const assignedActs=Object.values(assignments).filter(names=>names.includes(name)).length;
    if(assignedActs>2||Object.values(assignments).some(names=>names.filter(value=>value===name).length>1))return current;
  }
  return {...current,acts:assignments};
});
const toggleElement=(element:Element)=>updateCustomSetup(current=>{
  const elements=toggleArray(current.elements.filter((value):value is Element=>ELEMENTS.includes(value)),element,3) as Element[];
  if(elements.length!==3)return {...current,elements,opening:[],guests:[]};
  const openingNames=new Set(CHARACTERS.filter(c=>elements.includes(c.element)).map(c=>c.name));
  const guestNames=new Set(CHARACTERS.filter(c=>!elements.includes(c.element)).map(c=>c.name));
  return {...current,elements,opening:current.opening.filter(name=>openingNames.has(name)),guests:current.guests.filter(name=>guestNames.has(name))};
});
const filtered=CHARACTERS.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())&&(filter==='All'||c.element===filter)&&(!ownedOnly||ownership[c.name]?.owned));
const count=CHARACTERS.filter(c=>ownership[c.name]?.owned).length;
const chosenCharacters=CHARACTERS.filter(character=>chosen.includes(character.name));
const renderPlannerCharacter=(character:Character)=>{
  const name=character.name;
  const isChosen=chosen.includes(name);
  const borrowed=name===borrowedCharacter;
  const forced=openingNames.has(name);
  const canChoose=rosterCandidateNames.has(name)||borrowed;
  const full=!isChosen&&chosen.length>=requirement.cap;
  const usedActs=Object.values(plan.acts).filter(names=>names.includes(name)).length;
  const remainingUses=Math.max(0,2-usedActs);
  const disabled=!canChoose||full;
  return <div className={`character chosen-card ${isChosen?'owned':''} ${disabled?'unavailable':''} ${forced?'required-character':''}`} key={name} role="checkbox" aria-checked={isChosen} aria-disabled={disabled||forced||borrowed} tabIndex={disabled||forced||borrowed?-1:0} aria-label={`${name}${borrowed?' borrowed':forced?' opening character':' eligible to choose'}`} onClick={()=>{if(!disabled&&!forced&&!borrowed)toggleRoster(name);}} onKeyDown={e=>{if(!disabled&&!forced&&!borrowed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleRoster(name);}}} draggable={!disabled} onDragStart={e=>{if(disabled){e.preventDefault();return;}e.dataTransfer.setData('text/plain',name);e.dataTransfer.effectAllowed='copy';}} onDragEnd={()=>setDropTarget('')}><div className="character-top"><CharacterIcon name={name}/><ElementBadge element={character.element}/><strong>{name}</strong><span className="chosen-tag">{borrowed?'Borrowed':forced?'Opening · Required':isChosen?'Selected':'Available'}</span><span className="vigor-hearts" role="img" aria-label={`${remainingUses} of 2 uses remaining`}>{[0,1].map(index=><span key={index} className={index<remainingUses?'heart-remaining':'heart-used'}>♥</span>)}</span></div></div>;
};
const renderAct=(act:number,label:string)=>{
  const overrideSlot:BossOverrideSlot|undefined=act===3?'boss1':act===6?'boss2':act===8?(setup.difficulty==='Hard'?'boss4':'boss3'):act===10?'boss4':act===12&&setup.difficulty==='Lunar'?'lunar2':undefined;
  const bossStage=selectedSeason?.bossStages.find(stage=>stage.act===act);
  const bosses=selectedSeason&&overrideSlot?getBossesForSlot(selectedSeason,bossData,overrideSlot):bossStage?.bosses??[];
  const objective=bosses.length?'Boss':stageObjectives[setup.difficulty]?.[act];
  return <div className="act" key={act}><div className="act-heading"><strong>{label}</strong>{objective&&<span className={`act-objective ${objective==='Monolith Defense'?'monolith-objective':objective==='Defeat Bounties'?'bounty-objective':'boss-objective'}`}>{objective}</span>}{bosses.length>0&&<span className="act-bosses">{bosses.map(boss=><span className="act-boss" key={boss.name}>{boss.iconUrl&&<img src={boss.iconUrl} alt="" loading="lazy"/>}<span>{boss.name}</span></span>)}</span>}</div><div className="slots">{Array.from({length:4},(_,slot)=>{
    const current=plan.acts[act]?.[slot]??'';
    const target=`${act}-${slot}`;
    return <div key={slot} className={`act-slot ${dropTarget===target?'drop-target':''}`} onContextMenu={event=>{event.preventDefault();assignToAct(act,slot,'');}} onDragOver={event=>{event.preventDefault();event.dataTransfer.dropEffect=event.dataTransfer.types.includes('application/x-itp-act-slot')?'move':'copy';setDropTarget(target);}} onDragLeave={()=>setDropTarget(value=>value===target?'':value)} onDrop={event=>{
      event.preventDefault();
      const source=event.dataTransfer.getData('application/x-itp-act-slot');
      if(source){
        const [sourceAct,sourceSlot]=source.split(':').map(Number);
        if(Number.isInteger(sourceAct)&&Number.isInteger(sourceSlot))swapActSlots(sourceAct,sourceSlot,act,slot);
      }else{
        const name=event.dataTransfer.getData('text/plain');
        if(name)dropCharacterIntoAct(name,act,slot);
      }
      setDropTarget('');
    }}><ActAssignmentPicker act={act} slot={slot} characters={chosenCharacters} selected={chosen.includes(current)?current:''} borrowed={borrowedCharacter} opening={openingNames} canSelect={name=>canAssignToAct(name,act,slot)} onSelect={name=>assignToAct(act,slot,name)}/></div>;
  })}</div></div>;
};
return <main><header><div><p className="eyebrow">GENSHIN IMPACT · COMMUNITY PLANNING TOOL</p><h1>Imaginarium Theater Planner</h1><p>Build your roster, configure a rotation, and plan your acts.</p></div><span className="version">v0.1 · Local save</span></header>
<nav>{['Your Characters','Challenge Setup','Theater Planner'].map((n,i)=><button key={n} className={step===i+1?'active':''} disabled={i===2&&!canContinueToPlanner} title={i===2&&!canContinueToPlanner?'Meet the eligibility minimum in Challenge Setup first.':undefined} onClick={()=>{if(i!==2||canContinueToPlanner)setStep(i+1);}}><span className="stepnum">{i+1}</span>{n}</button>)}</nav>
{step===1&&<section><div className="sectionhead"><div><h2>Your Characters</h2><p>{count} owned · {CHARACTERS.length} in starter database</p></div><div className="actions"><button onClick={()=>setOwnership(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:true,level:ownership[c.name]?.level??90}])))}>Own All</button><button onClick={()=>setOwnership(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:false,level:ownership[c.name]?.level??90}])))}>Clear All</button></div></div><div className="toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search characters…"/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{ELEMENTS.map(e=><option key={e}>{e}</option>)}</select><label><input type="checkbox" checked={ownedOnly} onChange={e=>setOwnedOnly(e.target.checked)}/> Owned only</label></div><div className="characters">{filtered.map(c=><div className={'character '+(ownership[c.name]?.owned?'owned':'')} key={c.name} role="group" tabIndex={0} aria-label={`${c.name}. Click card to toggle owned.`} onClick={e=>{if(!(e.target as HTMLElement).closest('label'))toggleOwn(c.name);}} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleOwn(c.name);}}}><div className="character-top"><CharacterIcon name={c.name}/><ElementBadge element={c.element}/><strong>{c.name}</strong></div><label className="level-control"><span>Level</span><select aria-label={`${c.name} level`} value={ownership[c.name]?.level??90} onChange={e=>setCharacterLevel(c.name,Number(e.target.value))}>{LEVEL_OPTIONS.map(level=><option key={level} value={level}>{level}</option>)}</select></label></div>)}</div><div className="bottom"><button className="primary" onClick={()=>setStep(2)}>Continue to Challenge Setup →</button></div></section>}
{step===2&&<section>
  <h2>Challenge Setup</h2>
  <p>Configure the current rotation. You can edit these settings at any time.</p>
  <div className="lineup-source">
    <label htmlFor="theater-season">Season lineup</label>
    <select id="theater-season" value={selectedSeason?.season??''} onChange={event=>{
      const season=availableSeasons.find(candidate=>candidate.season===Number(event.target.value));
      if(season)setSetup(current=>({...current,seasonId:season.season}));
      else setSetup(current=>({...current,seasonId:undefined}));
    }}>
      <option value="">Custom settings</option>
      {availableSeasons.map(season=><option key={season.id} value={season.season}>{season.season===theaterLineups.current?.season?'Current':'Upcoming'} · Season {season.season} ({season.id})</option>)}
    </select>
    {selectedSeason&&<p>
      {new Date(selectedSeason.startsAt).toLocaleDateString()} – {new Date(selectedSeason.endsAt).toLocaleDateString()} · <a href={selectedSeason.sourceUrl} target="_blank" rel="noreferrer">Fandom source</a>
      {theaterLineups.generatedAt&&<> · source updated {new Date(theaterLineups.generatedAt).toLocaleDateString()}</>}
    </p>}
    {selectedSeason&&selectedSeason.charactersMissingFromRoster.length>0&&<p className="lineup-warning">Not in the local character roster: {selectedSeason.charactersMissingFromRoster.join(', ')}</p>}
    {!selectedSeason&&theaterLineups.nextUnavailableReason&&<p className="lineup-warning">{theaterLineups.nextUnavailableReason}</p>}
  </div>
  {selectedSeason&&<div className="boss-preview">
    <div><h3>Boss preview</h3><p>Bosses for Season {selectedSeason.season}. Boss 4 is used for Act 8 in Hard and Act 10 in Visionary/Lunar.</p></div>
    <div className="boss-preview-grid">{(['boss1','boss2','boss3','boss4'] as const).map((slot,index)=>{
      const bosses=getBossesForSlot(selectedSeason,bossData,slot);
      return <div className="boss-preview-card" key={slot}><strong>Boss {index+1}</strong>{bosses.length?bosses.map((boss,bossIndex)=><div className="boss-preview-entry" key={`${boss.name}-${bossIndex}`}>{boss.iconUrl?<img src={boss.iconUrl} alt="" loading="lazy"/>:<span className="boss-preview-icon-fallback" aria-hidden="true">?</span>}<span>{boss.name}</span></div>):<p>No boss listed.</p>}</div>;
    })}</div>
  </div>}
  <div className="settings">
    <div>
      <h3>Difficulty</h3>
      <select value={setup.difficulty} onChange={event=>setSetup(current=>({...current,difficulty:event.target.value}))}>{Object.keys(difficulties).map(difficulty=><option key={difficulty}>{difficulty}</option>)}</select>
      <p>{requirement.acts} acts{requirement.lunarActs?` + ${requirement.lunarActs} Lunar acts`:''} · at least {requirement.minimum}, up to {requirement.cap} characters · Level {requirement.minimumLevel}+</p>
      <h3>Three featured elements</h3>
      <div className="chips">{ELEMENTS.map(element=><button className={selectedElements.includes(element)?'selected':''} key={element} onClick={()=>toggleElement(element)}>{element}</button>)}</div>
      <p>{selectedElements.length}/3 selected</p>
    </div>
    <div className="eligibility">
      <h3>Eligibility estimate</h3>
      <div className="big">{eligibleCount} / {requirement.minimum}</div>
      <p>{eligibleCount>=requirement.minimum?'Enough eligible characters by this estimate.':'You need more eligible characters by this estimate.'}</p>
      <small>Owned characters need to meet Level {requirement.minimumLevel}+. Opening characters are included once, even if also owned.</small>
    </div>
  </div>
  <div className="pickers character-pickers">
    <div>
      <h3>Opening Characters ({selectedOpening.length}/6)</h3>
      {!hasThreeElements&&<p className="selection-help">Select all three featured elements before choosing characters.</p>}
      <CharacterSelectionGrid characters={openingOptions} selected={selectedOpening} limit={6} disabled={!hasThreeElements} onToggle={name=>updateCustomSetup(current=>({...current,opening:toggleArray(current.opening,name,6)}))}/>
    </div>
    <div>
      <h3>Special Guest Stars ({selectedGuests.length}/4)</h3>
      {!hasThreeElements&&<p className="selection-help">Select all three featured elements before choosing characters.</p>}
      <CharacterSelectionGrid characters={guestOptions} selected={selectedGuests} limit={4} disabled={!hasThreeElements} onToggle={name=>updateCustomSetup(current=>({...current,guests:toggleArray(current.guests,name,4)}))}/>
    </div>
  </div>
  {import.meta.env.DEV&&<BossOverrideEditor data={bossData} seasons={availableSeasons} bossCatalog={theaterLineups.bossCatalog} onChange={setBossData}/>}
  <div className="bottom"><button onClick={()=>setStep(1)}>← Characters</button><div className="continue-control">{!canContinueToPlanner&&<p className="selection-help" role="status">{!hasThreeElements?'Select all three featured elements first.':`You need at least ${requirement.minimum} eligible characters at Level ${requirement.minimumLevel}+; currently ${eligibleCount} qualify.`}</p>}<button className="primary" disabled={!canContinueToPlanner} onClick={()=>{if(canContinueToPlanner)setStep(3);}}>Continue to Planner →</button></div></div>
</section>}
{step===3&&<section>
  <h2>Theater Planner</h2>
  <p>Select your cast, then assign up to four characters to each act. Changes are saved locally.</p>
  <div className="borrowed-control">
    <div><h3>Borrowed Character</h3><p>Choose any character allowed by this rotation. Borrowed characters count toward the cast cap, but not the minimum requirement.</p></div>
    <BorrowedCharacterPicker characters={borrowedOptions} selected={borrowedCharacter} onSelect={name=>setPlan(p=>({...p,borrowed:name,roster:p.roster.filter(value=>value!==name)}))}/>
  </div>
  <div className="planner-layout">
    <section className="chosen-section">
      <div className="sectionhead"><div><h3>Chosen ({chosen.length}/{requirement.cap})</h3><p>{chosenForRequirement}/{requirement.minimum} count toward the minimum; borrowed characters use a cast slot. Click available character cards to add or remove them.</p></div></div>
      <h4 className="chosen-group-title">Opening Characters ({plannerCharacters.filter(character=>openingNames.has(character.name)).length}/6)</h4>
      <div className="characters chosen-grid opening-grid">{plannerCharacters.filter(character=>openingNames.has(character.name)).map(renderPlannerCharacter)}</div>
      <div className="chosen-divider" role="separator" aria-label="Other available characters"><span/></div>
      <div className="characters chosen-grid">{plannerCharacters.filter(character=>!openingNames.has(character.name)).map(renderPlannerCharacter)}</div>
    </section>
    <section className="assignment-only">
      <h3>Act Assignments</h3>
      <p className="drag-help">Drag any eligible character directly into a slot to select and assign them, or drag between slots to swap. Right-click a slot or use × to clear it. Each character can be assigned to at most two acts. Lunar Arcanum Challenges unlock after Acts 3 and 6 and can be completed any time before Act 10. See the <a href="https://alioth.wiki/en/gi/theater" target="_blank" rel="noreferrer">Alioth Theater guide</a>.</p>
      <div className="act-group"><h4>Acts</h4><div className="acts">{setup.difficulty==='Lunar'
        ? <>{renderAct(1,'Act 1')}{renderAct(2,'Act 2')}{renderAct(3,'Act 3')}{renderAct(11,'Lunar Act 1')}{renderAct(4,'Act 4')}{renderAct(5,'Act 5')}{renderAct(6,'Act 6')}{renderAct(12,'Lunar Act 2')}{Array.from({length:4},(_,index)=>renderAct(index+7,`Act ${index+7}`))}</>
        : Array.from({length:requirement.acts},(_,index)=>renderAct(index+1,`Act ${index+1}`))}</div></div>
    </section>
  </div>
  <div className="bottom"><button onClick={()=>setStep(2)}>← Challenge Setup</button><button onClick={()=>setPlan({roster:[],acts:{},borrowed:''})}>Reset Plan</button></div>
</section>}
<footer>Unofficial fan-made planning tool. All settings are saved in this browser.</footer></main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
