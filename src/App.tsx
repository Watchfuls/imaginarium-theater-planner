import {SiteHeader} from './SiteHeader';
import {Feedback} from './Feedback';
import {BackupControls} from './BackupControls';
import {mergePlanHistory,type HistoricalPlan} from './plannerBackup';
import {BossPreview} from './BossPreview';
import type {Ownership,Setup,Plan,TheaterBossData,BossOverrideSlot} from './plannerTypes';
import {LEVEL_OPTIONS,travelerNames,difficulties,stageObjectives,isTraveler,enemyWikiUrl} from './plannerConfig';
import {availableSeasons,theaterLineups,theaterBosses,getBossesForSlot} from './theaterData';
import {parseGoodOwnership,normalizeOwnership} from './ownership';
import {CharacterIcon,ElementBadge} from './CharacterVisuals';
import {BorrowedCharacterPicker,ActAssignmentPicker,CharacterSelectionGrid} from './CharacterPickers';
import {BossOverrideEditor} from './BossOverrideEditor';
import {bossPortrait} from './bossPortraits';
import {stored,storedText,saveText} from './browserStorage';
import {activeAssignments,cappedCast} from './plannerAssignments';
import {VideoGuide} from './VideoGuide';
import {DifficultySelect} from './DifficultySelect';
import React, {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {CHARACTERS,ELEMENTS,sortCharacters,type Character,type CharacterSortOrder,type Element} from './characters';
import {countEligibleCharacters} from './eligibility';
import {canBorrowCharacter} from './borrowing';
import {teamPasteError,swapTeams} from './teamClipboard';
import {currentSeason,seasonStatus} from './seasonTiming';
import {changeTravelerElement, type TravelerElement} from './travelerSelection';
const PlannerKeyRecommendations=React.lazy(()=>import('./PlannerEncounterPicker').then(module=>({default:module.PlannerKeyRecommendations})));
const PlannerEncounterPicker=React.lazy(()=>import('./PlannerEncounterPicker').then(module=>({default:module.PlannerEncounterPicker})));
const ActDetails=React.lazy(()=>import('./ActDetails').then(module=>({default:module.ActDetails})));
const isRecord=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const isStringArray=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(item=>typeof item==='string');
const validSetup=(value:unknown)=>isRecord(value)&&typeof value.difficulty==='string'&&Object.hasOwn(difficulties,value.difficulty)&&isStringArray(value.elements)&&isStringArray(value.opening)&&isStringArray(value.guests);
const validPlan=(value:unknown)=>isRecord(value)&&isStringArray(value.roster)&&isRecord(value.acts)&&Object.values(value.acts).every(isStringArray);
function defaultSetup():Setup {
  const season=currentSeason(availableSeasons);
  return season
    ? {difficulty:'Hard',elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests,seasonId:season.season}
    : {difficulty:'Hard',elements:['Pyro','Hydro','Anemo'],opening:[],guests:[]};
}
export default function App(){
const [seasonTime,setSeasonTime]=useState(()=>Date.now());
useEffect(()=>{
  const refresh=()=>setSeasonTime(Date.now());
  const interval=window.setInterval(refresh,1000);
  window.addEventListener('focus',refresh);
  return ()=>{window.clearInterval(interval);window.removeEventListener('focus',refresh);};
},[]);
const [step,setStep]=useState(1);
const stickyHeaderRef=useRef<HTMLDivElement>(null);
useLayoutEffect(()=>{
  const header=stickyHeaderRef.current;
  if(!header)return;
  const measure=()=>header.parentElement?.style.setProperty('--app-header-height',header.getBoundingClientRect().height+'px');
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(header);
  return ()=>observer.disconnect();
},[]);
const [actDetailsTarget,setActDetailsTarget]=useState<{act:number;season:number}|null>(null);
const [ownership,setOwnership]=useState<Ownership>(()=>normalizeOwnership(stored<unknown>('itp-ownership-v1',{})));
const [setup,setSetup]=useState<Setup>(()=>stored('itp-setup-v1',defaultSetup(),validSetup));
const [bossData,setBossData]=useState<TheaterBossData>(theaterBosses);
const [plan,setPlan]=useState<Plan>(()=>stored('itp-plan-v1',{roster:[],acts:{},borrowed:''},validPlan));
const [planHistory,setPlanHistory]=useState<HistoricalPlan[]>(()=>stored('itp-plan-history-v1',[],Array.isArray));
const [dropTarget,setDropTarget]=useState('');
const [assignmentNotice,setAssignmentNotice]=useState<{message:string;id:number}|null>(null);
const [copiedTeam,setCopiedTeam]=useState<{act:number;team:string[]}|null>(null);
const [teamDropTarget,setTeamDropTarget]=useState<number|null>(null);
const assignmentNoticeId=useRef(0);
const [openCharacterPicker,setOpenCharacterPicker]=useState('');
const [search,setSearch]=useState('');const [ownedOnly,setOwnedOnly]=useState(false);
const [ownedElements,setOwnedElements]=useState<Element[]>([]);
const [ownedRarities,setOwnedRarities]=useState<(4|5)[]>([]);
const [importMessage,setImportMessage]=useState('');
const importFileInput=useRef<HTMLInputElement>(null);
const [chosenSearch,setChosenSearch]=useState('');
const [chosenElements,setChosenElements]=useState<Element[]>([]);
const [chosenRarities,setChosenRarities]=useState<(4|5)[]>([]);
const [plannerCharacterOrder,setPlannerCharacterOrder]=useState<CharacterSortOrder>(()=>storedText('itp-planner-sort-v1','name')==='game'?'game':'name');
const [storageUnavailable,setStorageUnavailable]=useState(false);
useEffect(()=>{
  const writes=[
    saveText('itp-planner-sort-v1',plannerCharacterOrder),
    saveText('itp-ownership-v1',JSON.stringify(ownership)),
    saveText('itp-setup-v1',JSON.stringify(setup)),
    saveText('itp-plan-v1',JSON.stringify(plan)),
    saveText('itp-plan-history-v1',JSON.stringify(planHistory)),
  ];
  setStorageUnavailable(writes.some(saved=>!saved));
},[plannerCharacterOrder,ownership,setup,plan,planHistory]);
useEffect(()=>{
  if(!copiedTeam)return;
  const cancelOnInteraction=(event:Event)=>{
    if(!(event.target instanceof Element)||!event.target.closest('.act-team-tools'))setCopiedTeam(null);
  };
  const cancelOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setCopiedTeam(null);};
  document.addEventListener('pointerdown',cancelOnInteraction,true);
  document.addEventListener('focusin',cancelOnInteraction,true);
  document.addEventListener('keydown',cancelOnEscape,true);
  return ()=>{
    document.removeEventListener('pointerdown',cancelOnInteraction,true);
    document.removeEventListener('focusin',cancelOnInteraction,true);
    document.removeEventListener('keydown',cancelOnEscape,true);
  };
},[copiedTeam]);
useEffect(()=>{
  if(!assignmentNotice)return;
  const timeout=window.setTimeout(()=>setAssignmentNotice(current=>current?.id===assignmentNotice.id?null:current),10000);
  return ()=>window.clearTimeout(timeout);
},[assignmentNotice]);
useEffect(()=>{
  if(setup.seasonId===undefined)return;
  const season=availableSeasons.find(candidate=>candidate.season===setup.seasonId)??currentSeason(availableSeasons);
  if(!season)return;
  setSetup(current=>current.seasonId===season.season?{...current,elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests}:{...current,seasonId:season.season,elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests});
},[setup.seasonId]);
const selectedSeason=availableSeasons.find(season=>season.season===setup.seasonId)??null;
const selectedElements=setup.elements.filter((element):element is Element=>ELEMENTS.includes(element));
const hasThreeElements=selectedElements.length===3;
const openingOptions=hasThreeElements?CHARACTERS.filter(c=>selectedElements.includes(c.element)):[];
const guestOptions=hasThreeElements?CHARACTERS.filter(c=>!selectedElements.includes(c.element)):[];
const selectedTraveler=[...setup.opening,...setup.guests].find(name=>isTraveler(name)&&selectedElements.some(element=>name===`${element} Traveler`));
const selectedOpening=setup.opening.filter(name=>openingOptions.some(c=>c.name===name)&&(!isTraveler(name)||name===selectedTraveler));
const selectedGuests=setup.guests.filter(name=>guestOptions.some(c=>c.name===name)&&(!isTraveler(name)||name===selectedTraveler));
const unavailableTravelers=selectedTraveler?CHARACTERS.filter(character=>isTraveler(character.name)&&character.name!==selectedTraveler).map(character=>character.name):[];
const requirement=difficulties[setup.difficulty]??difficulties.Hard;
const activeActs=(acts:Record<number,string[]>)=>activeAssignments(acts,requirement.acts,requirement.lunarActs);
const activePlanActs=activeActs(plan.acts);
const eligibleOwned=CHARACTERS.filter(c=>ownership[c.name]?.owned&&(ownership[c.name]?.level??90)>=requirement.minimumLevel&&(selectedElements.includes(c.element)||selectedGuests.includes(c.name)));
const eligibleCount=countEligibleCharacters([...eligibleOwned.map(c=>c.name),...selectedOpening],selectedTraveler);
const canContinueToPlanner=hasThreeElements&&eligibleCount>=requirement.minimum;
const available=CHARACTERS.filter(c=>selectedElements.includes(c.element)||selectedGuests.includes(c.name)||selectedOpening.includes(c.name));
const availableNames=new Set(available.map(c=>c.name));
const borrowedOptions=available.filter(character=>character.name!=='Aloy'&&!isTraveler(character.name));
const allowedTravelerNames=selectedElements.map(element=>`${element} Traveler`);
const preferredTraveler=selectedElements.includes(plan.travelerElement as Element)?`${plan.travelerElement} Traveler`:undefined;
const plannerTraveler=selectedTraveler??(plan.travelerElement==='None'?undefined:preferredTraveler??plan.roster.find(name=>allowedTravelerNames.includes(name))
  ??available.find(character=>allowedTravelerNames.includes(character.name)&&ownership[character.name]?.owned)?.name??allowedTravelerNames[0]??'Anemo Traveler');
const plannerTravelerElement=CHARACTERS.find(character=>character.name===plannerTraveler)?.element??'None';
const travelerOwnership=travelerNames.map(name=>ownership[name]).find(entry=>entry?.owned);
const rosterCandidates=CHARACTERS.filter(c=>{
  const owned=isTraveler(c.name)?travelerOwnership:ownership[c.name];
  return (!isTraveler(c.name)||c.name===plannerTraveler)&&(selectedOpening.includes(c.name)||(availableNames.has(c.name)&&owned?.owned&&(owned.level??90)>=requirement.minimumLevel));
});
const rosterCandidateNames=new Set(rosterCandidates.map(c=>c.name));
const borrowedCharacter=typeof plan.borrowed==='string'&&borrowedOptions.some(character=>character.name===plan.borrowed)?plan.borrowed:'';
const castForPlan=(current:Plan)=>{
  const borrowed=typeof current.borrowed==='string'&&borrowedOptions.some(character=>character.name===current.borrowed)?current.borrowed:'';
  return cappedCast(selectedOpening,current.roster.filter(name=>rosterCandidateNames.has(name)&&(!isTraveler(name)||name===plannerTraveler)),borrowed,requirement.cap);
};
const chosen=castForPlan(plan);
const plannerCharacters=CHARACTERS.filter(character=>rosterCandidateNames.has(character.name)||character.name===borrowedCharacter);
const chosenForRequirement=chosen.filter(name=>name!==borrowedCharacter).length;
const castStatus=chosenForRequirement<requirement.minimum?'below-minimum':chosen.length<requirement.cap?'minimum-met':'full-cast';
const castMessage=chosenForRequirement<requirement.minimum
  ?`Select ${requirement.minimum-chosenForRequirement} more non-supporting characters to meet the ${setup.difficulty} entry minimum.`
  :chosen.length<requirement.cap
    ?`Entry minimum met. You can select ${requirement.cap-chosen.length} more characters for additional blessing benefits.`
    :'Full cast selected for the maximum roster-size blessing benefits.';
const openingNames=new Set(selectedOpening);
const setTravelerElement=(element:TravelerElement)=>{
  const name=`${element} Traveler`;
  if((element!=='None'&&!selectedElements.includes(element))||selectedTraveler||name===plannerTraveler)return;
  setPlan(current=>changeTravelerElement(current,element,selectedElements));
};
const toggleOwn=(name:string)=>setOwnership(o=>({...o,[name]:{owned:!o[name]?.owned,level:o[name]?.level??90}}));
const setCharacterLevel=(name:string,level:number)=>setOwnership(current=>{
  if(!isTraveler(name))return {...current,[name]:{owned:current[name]?.owned??false,level}};
  const updated={...current};
  for(const traveler of travelerNames)updated[traveler]={owned:current[traveler]?.owned??false,level};
  return updated;
});
const toggleArray=(values:string[],name:string,limit:number)=>values.includes(name)?values.filter(v=>v!==name):values.length<limit?[...values,name]:values;
const updateCustomSetup=(update:(current:Setup)=>Setup)=>setSetup(current=>({...update(current),seasonId:undefined}));
const toggleRoster=(name:string)=>setPlan(current=>{
  const currentCast=new Set(castForPlan(current));
  const roster=current.roster.filter(value=>currentCast.has(value)&&rosterCandidateNames.has(value)&&value!==(current.borrowed??''));
  if(roster.includes(name))return {
    ...current,
    roster:roster.filter(value=>value!==name),
    acts:Object.fromEntries(Object.entries(current.acts).map(([act,names])=>[act,names.map(value=>value===name?'':value)])),
  };
  if(isTraveler(name)&&(selectedTraveler??roster.find(isTraveler)))return current;
  const currentBorrowed=typeof current.borrowed==='string'&&availableNames.has(current.borrowed)?current.borrowed:'';
  const count=new Set([...selectedOpening,...roster,...(currentBorrowed?[currentBorrowed]:[])]).size;
  return count>=requirement.cap?current:{...current,roster:[...roster,name]};
});
const canAssignToAct=(name:string,act:number,slot:number,assignments=plan.acts)=>{
  const alreadyChosen=chosen.includes(name);
  const canJoinRoster=rosterCandidateNames.has(name)
    &&chosen.length<requirement.cap
    &&(!isTraveler(name)||!plannerTraveler||name===plannerTraveler)
    &&(!isTraveler(name)||!chosen.some(chosenName=>isTraveler(chosenName)&&chosenName!==name));
  if(!alreadyChosen&&!canJoinRoster)return false;
  const otherActs=Object.entries(activeActs(assignments)).filter(([assignedAct,names])=>Number(assignedAct)!==act&&names.includes(name)).length;
  return otherActs<2;
};
const assignToAct=(act:number,slot:number,name:string)=>setPlan(current=>{
  if(name&&!canAssignToAct(name,act,slot,current.acts))return current;
  const assignments=[...(current.acts[act]??[])];
  if(name)assignments.forEach((value,index)=>{if(index!==slot&&value===name)assignments[index]='';});
  assignments[slot]=name;
  return {...current,acts:{...current.acts,[act]:assignments}};
});
const setBorrowedCharacter=(name:string)=>setPlan(current=>{
  if(name&&!borrowedOptions.some(character=>character.name===name))return current;
  const traveler=selectedTraveler??current.roster.find(value=>rosterCandidateNames.has(value)&&isTraveler(value));
  const currentChosen=castForPlan(current).filter(value=>value!==current.borrowed&&(!isTraveler(value)||value===traveler));
  if(!canBorrowCharacter(currentChosen,current.borrowed??'',name,requirement.cap))return current;
  const acts=current.borrowed&&current.borrowed!==name
    ?Object.fromEntries(Object.entries(current.acts).map(([act,names])=>[act,names.map(value=>value===current.borrowed?'':value)]))
    :current.acts;
  return {...current,borrowed:name,roster:current.roster.filter(value=>value!==name),acts};
});
const dropCharacterIntoAct=(name:string,act:number,slot:number)=>setPlan(current=>{
  const currentCast=new Set(castForPlan(current));
  const roster=current.roster.filter(value=>currentCast.has(value)&&rosterCandidateNames.has(value)&&value!==(current.borrowed??''));
  const currentBorrowed=typeof current.borrowed==='string'&&borrowedOptions.some(character=>character.name===current.borrowed)?current.borrowed:'';
  const selected=new Set([...selectedOpening,...roster,...(currentBorrowed?[currentBorrowed]:[])]);
  const actNames=current.acts[act]??[];
  const existingSlot=actNames.indexOf(name);
  if(existingSlot>=0){
    if(existingSlot===slot)return current;
    const assignments=[...actNames];
    assignments[existingSlot]=assignments[slot]??'';
    assignments[slot]=name;
    return {...current,acts:{...current.acts,[act]:assignments}};
  }
  if(!selected.has(name)){
    if(isTraveler(name)&&(selectedTraveler??roster.find(isTraveler)))return current;
    if(!rosterCandidateNames.has(name)||selected.size>=requirement.cap)return current;
    roster.push(name);
  }
  const otherActs=Object.entries(activeActs(current.acts)).filter(([assignedAct,names])=>Number(assignedAct)!==act&&names.includes(name)).length;
  if(otherActs>=2&&!actNames.includes(name))return current;
  const assignments=[...actNames];
  assignments.forEach((value,index)=>{if(index!==slot&&value===name)assignments[index]='';});
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
    const assignedActs=Object.values(activeActs(assignments)).filter(names=>names.includes(name)).length;
    if(assignedActs>2||Object.values(activeActs(assignments)).some(names=>names.filter(value=>value===name).length>1))return current;
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
const filtered=CHARACTERS.filter(c=>
  c.name.toLowerCase().includes(search.toLowerCase())
  &&(ownedElements.length===0||ownedElements.includes(c.element))
  &&(ownedRarities.length===0||ownedRarities.includes(c.rarity))
  &&(!ownedOnly||ownership[c.name]?.owned)
);
const count=CHARACTERS.filter(c=>ownership[c.name]?.owned).length;
const chosenCharacters=CHARACTERS.filter(character=>chosen.includes(character.name));
const plannerCharacterLevel=(character:Character)=>character.name===borrowedCharacter?90:(isTraveler(character.name)?travelerOwnership?.level:ownership[character.name]?.level)??90;
const unallocatedCharacters=sortCharacters(chosenCharacters.filter(character=>
  Object.values(activePlanActs).filter(names=>names.includes(character.name)).length<2
),plannerCharacterOrder,[],plannerCharacterLevel);
const filteredPlannerCharacters=sortCharacters(plannerCharacters.filter(character=>
  character.name.toLocaleLowerCase().includes(chosenSearch.toLocaleLowerCase())
  &&(chosenElements.length===0||chosenElements.includes(character.element))
  &&(chosenRarities.length===0||chosenRarities.includes(character.rarity))
),plannerCharacterOrder,[],plannerCharacterLevel);
const toggleChosenElement=(element:Element)=>setChosenElements(current=>current.includes(element)?current.filter(value=>value!==element):[...current,element]);
const toggleChosenRarity=(rarity:4|5)=>setChosenRarities(current=>current.includes(rarity)?current.filter(value=>value!==rarity):[...current,rarity]);
const toggleOwnedElement=(element:Element)=>setOwnedElements(current=>current.includes(element)?current.filter(value=>value!==element):[...current,element]);
const toggleOwnedRarity=(rarity:4|5)=>setOwnedRarities(current=>current.includes(rarity)?current.filter(value=>value!==rarity):[...current,rarity]);
const importOwnership=async(file:File)=>{
  try{
    const result=parseGoodOwnership(JSON.parse(await file.text()));
    if(!window.confirm(`Import ${result.characters.size} recognized characters and replace your current ownership list? Characters not in the file will be marked unowned.`))return;
    setOwnership(current=>{
      const updated=Object.fromEntries(CHARACTERS.map(character=>[character.name,{
        owned:result.characters.has(character.name),
        level:result.characters.get(character.name)??current[character.name]?.level??90
      }])) as Ownership;
      const travelerLevel=travelerNames.map(name=>result.characters.get(name)).find((level):level is number=>level!==undefined)
        ??current[travelerNames[0]]?.level??90;
      for(const name of travelerNames)updated[name]={owned:result.characters.has(name),level:travelerLevel};
      return updated;
    });
    const unknownMessage=result.unknownKeys.length?` ${result.unknownKeys.length} unrecognized character key(s) were skipped.`:'';
    setImportMessage(`Imported ${result.characters.size} characters. Levels were rounded down to the nearest 10.${unknownMessage}`);
  }catch(error){
    setImportMessage(`Import failed: ${error instanceof Error?error.message:'Unable to read this file.'}`);
  }finally{
    if(importFileInput.current)importFileInput.current.value='';
  }
};
const renderPlannerCharacter=(character:Character)=>{
  const name=character.name;
  const chosenNumber=chosen.indexOf(name)+1;
  const isChosen=chosenNumber>0;
  const borrowed=name===borrowedCharacter;
  const forced=openingNames.has(name);
  const canChoose=rosterCandidateNames.has(name)||borrowed;
  const full=!isChosen&&chosen.length>=requirement.cap;
  const travelerConflict=isTraveler(name)&&((plannerTraveler!==undefined&&name!==plannerTraveler)||chosen.some(chosenName=>isTraveler(chosenName)&&chosenName!==name));
  const usedActs=Object.values(activePlanActs).filter(names=>names.includes(name)).length;
  const remainingUses=Math.max(0,2-usedActs);
  const exhausted=usedActs>=2;
  const disabled=!canChoose||full||travelerConflict;
  return <div className={`character chosen-card ${isChosen?'owned':''} ${disabled?'unavailable':''} ${forced?'required-character':''} ${exhausted?'exhausted-character':''}`} key={name} role="checkbox" aria-checked={isChosen} aria-disabled={disabled||forced||borrowed} tabIndex={disabled||forced||borrowed?-1:0} aria-label={`${name}${borrowed?' supporting':forced?' opening character':exhausted?' exhausted':isChosen?' selected':' eligible to choose'}`} onClick={()=>{if(!disabled&&!forced&&!borrowed)toggleRoster(name);}} onKeyDown={e=>{if(!disabled&&!forced&&!borrowed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleRoster(name);}}} draggable={!disabled} onDragStart={e=>{if(disabled){e.preventDefault();return;}e.dataTransfer.setData('text/plain',name);e.dataTransfer.effectAllowed='copy';}} onDragEnd={()=>setDropTarget('')}><div className="character-top">{isChosen&&<span className="chosen-number" aria-label={`Chosen character ${chosenNumber}`} title={`Chosen character ${chosenNumber}`}>{chosenNumber}</span>}<CharacterIcon name={name}/><ElementBadge element={character.element}/><strong>{name}</strong><span className="chosen-tag">{borrowed?'Supporting':forced?'Opening · Required':exhausted?'Exhausted':isChosen?'Selected':'Available'}</span><span className="vigor-hearts" role="img" aria-label={`${remainingUses} of 2 uses remaining`}>{[0,1].map(index=><span key={index} className={index<remainingUses?'heart-remaining':'heart-used'}>♥</span>)}</span></div></div>;
};
const renderAct=(act:number,label:string)=>{
  const copyActive=copiedTeam?.act===act;
  const hasTeam=(plan.acts[act]??[]).some(name=>chosen.includes(name));
  const copyTeam=()=>{
    if(copyActive){setCopiedTeam(null);return;}
    const team=Array.from({length:4},(_,slot)=>{const name=plan.acts[act]?.[slot]??'';return chosen.includes(name)?name:'';});
    if(team.some(Boolean))setCopiedTeam({act,team});
  };
  const pasteTeam=()=>{
    if(!copiedTeam)return;
    const error=teamPasteError(copiedTeam.team,act,activePlanActs,chosen);
    if(error){setCopiedTeam(null);setAssignmentNotice({message:error,id:++assignmentNoticeId.current});return;}
    setAssignmentNotice(null);
    setPlan(current=>teamPasteError(copiedTeam.team,act,activeActs(current.acts),chosen)?current:{...current,acts:{...current.acts,[act]:[...copiedTeam.team]}});
    setCopiedTeam(null);
  };
  const overrideSlot:BossOverrideSlot|undefined=act===3?'boss1':act===6?'boss2':act===8?(setup.difficulty==='Hard'?'boss4':'boss3'):act===10?'boss4':act===12&&setup.difficulty==='Lunar'?'lunar2':undefined;
  const bossStage=selectedSeason?.bossStages.find(stage=>stage.act===act);
  const bosses=selectedSeason&&overrideSlot?getBossesForSlot(selectedSeason,bossData,overrideSlot):bossStage?.bosses??[];
  const objective=bosses.length?'Boss':stageObjectives[setup.difficulty]?.[act];
  const encounterKey=`${selectedSeason?.season}-${setup.difficulty}-${act}`;
  return <div className={`act ${teamDropTarget===act?'team-drop-target':''}`} key={act} onDragOverCapture={event=>{
    if(!event.dataTransfer.types.includes('application/x-itp-team'))return;
    event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='move';setTeamDropTarget(act);
  }} onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setTeamDropTarget(value=>value===act?null:value);}} onDropCapture={event=>{
    if(!event.dataTransfer.types.includes('application/x-itp-team'))return;
    event.preventDefault();event.stopPropagation();
    const raw=event.dataTransfer.getData('application/x-itp-team');
    const source=Number(raw);
    const activeActs=new Set(Array.from({length:requirement.acts},(_,index)=>index+1));
    if(setup.difficulty==='Lunar'){activeActs.add(11);activeActs.add(12);}
    if(raw&&Number.isInteger(source)&&activeActs.has(source))setPlan(current=>({...current,acts:swapTeams(current.acts,source,act)}));
    setTeamDropTarget(null);setCopiedTeam(null);
  }}><div className="act-heading"><div className="act-heading-content"><strong>{selectedSeason&&seasonStatus(selectedSeason,seasonTime)==='Current'?<a className="act-details-link" href={`#act-details-act-${act}`} title={`View ${label} details`} onClick={event=>{event.preventDefault();setActDetailsTarget({act,season:selectedSeason.season});setStep(4);}}>{label}</a>:label}</strong>{objective&&<span className="act-objective">{objective==='Monolith Defense'?'Monolith':objective==='Defeat Bounties'?'Bounties':objective}</span>}</div>{bosses.length>0&&<div className="planner-encounter-picker planner-boss-preview"><span className="act-bosses">{bosses.map(boss=><a className="act-boss" key={boss.name} href={enemyWikiUrl(boss.name)} target="_blank" rel="noreferrer" title={`View ${boss.name} on Fandom`}>{boss.iconUrl&&<img src={bossPortrait(boss.name,boss.iconUrl)} alt="" loading="lazy"/>}<span>{boss.name.replace(/^Lord of the Hidden Depths:\s*/,'')}</span></a>)}</span>{selectedSeason&&<React.Suspense fallback={null}><PlannerKeyRecommendations season={selectedSeason.season} difficulty={setup.difficulty} act={act} bossNames={bosses.map(boss=>boss.name)}/></React.Suspense>}</div>}{!bosses.length&&selectedSeason&&<React.Suspense fallback={null}><PlannerEncounterPicker season={selectedSeason.season} difficulty={setup.difficulty} act={act} value={plan.encounterChoices?.[encounterKey]} onChange={value=>setPlan(current=>({...current,encounterChoices:{...current.encounterChoices,[encounterKey]:value}}))}/></React.Suspense>}<div className="act-team-tools">
    <button type="button" className={`team-icon paste-team ${copiedTeam?'':'clipboard-empty'}`} disabled={!copiedTeam} aria-label={`Paste copied team into ${label}`} title={`Paste copied team into ${label} (replaces this team)`} onClick={pasteTeam}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M8 13h8M8 17h6"/></svg></button>
    <button type="button" className={`team-icon copy-team ${copyActive?'copied':''} ${hasTeam?'':'clipboard-empty'}`} aria-pressed={copyActive} disabled={!hasTeam} aria-label={copyActive?`Clear copied team from ${label}`:`Copy team from ${label}`} title={copyActive?'Team copied — click again to clear':`Copy team from ${label}`} onClick={copyTeam}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg></button>
    <button type="button" className={`team-icon clear-team ${hasTeam?'':'clipboard-empty'}`} disabled={!hasTeam} aria-label={`Clear whole team from ${label}`} title="Clear whole team" onClick={()=>{setPlan(current=>({...current,acts:{...current.acts,[act]:[]}}));setCopiedTeam(null);setAssignmentNotice(null);}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
    <button type="button" className={`team-icon drag-team ${hasTeam?'':'clipboard-empty'}`} disabled={!hasTeam} draggable={hasTeam} aria-label={`Drag team from ${label}`} title="Drag to move the whole team; drop on another team to swap" onDragStart={event=>{event.dataTransfer.setData('application/x-itp-team',String(act));event.dataTransfer.effectAllowed='move';setCopiedTeam(null);setOpenCharacterPicker('');}} onDragEnd={()=>setTeamDropTarget(null)}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="8" cy="5" r="1.7"/><circle cx="16" cy="5" r="1.7"/><circle cx="8" cy="12" r="1.7"/><circle cx="16" cy="12" r="1.7"/><circle cx="8" cy="19" r="1.7"/><circle cx="16" cy="19" r="1.7"/></svg></button>
  </div></div><div className="slots">{Array.from({length:4},(_,slot)=>{
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
        if(name){
          const alreadyInAct=(plan.acts[act]??[]).includes(name);
          const assignedActs=Object.values(activePlanActs).filter(names=>names.includes(name)).length;
          if(assignedActs>=2&&!alreadyInAct)setAssignmentNotice({message:`${name} is exhausted: already assigned to two acts.`,id:++assignmentNoticeId.current});
          else{setAssignmentNotice(null);dropCharacterIntoAct(name,act,slot);}
        }else setAssignmentNotice(null);
      }
      setDropTarget('');
    }}><ActAssignmentPicker act={act} slot={slot} characters={plannerCharacters} chosenNames={new Set(chosen)} selected={chosen.includes(current)?current:''} borrowed={borrowedCharacter} opening={openingNames} guests={new Set(selectedGuests)} canSelect={name=>canAssignToAct(name,act,slot)} isExhausted={name=>Object.values(activePlanActs).filter(names=>names.includes(name)).length>=2} onSelect={name=>name?dropCharacterIntoAct(name,act,slot):assignToAct(act,slot,'')} open={openCharacterPicker===target} onOpenChange={open=>setOpenCharacterPicker(open?target:'')}/></div>;
  })}</div></div>;
};
return <main><SiteHeader stickyHeaderRef={stickyHeaderRef} step={step} canContinueToPlanner={canContinueToPlanner} setStep={setStep}/>
<BackupControls save={{ownership,setup,plan,sort:plannerCharacterOrder,history:planHistory}} onRestore={save=>{
  const unavailable=save.setup.seasonId!==undefined&&!availableSeasons.some(season=>season.season===save.setup.seasonId);
  setOwnership(normalizeOwnership(save.ownership));setPlannerCharacterOrder(save.sort);
  setPlanHistory(current=>mergePlanHistory(current,save.history??[],unavailable?[{setup:save.setup,plan:save.plan}]:[]));
  if(!unavailable){setSetup(save.setup);setPlan(save.plan);}
  setCopiedTeam(null);setOpenCharacterPicker('');setActDetailsTarget(null);setStep(1);
  return unavailable?`Characters restored. Season ${save.setup.seasonId} is no longer available, so its plan was kept under Historical plans. Your current challenge setup and plan were left in place.`:'Backup restored.';
}}/>
{step===4&&<React.Suspense fallback={<section><h2>Act Details</h2><p>Loading act details…</p></section>}><ActDetails target={actDetailsTarget} difficulty={setup.difficulty} onDifficultyChange={difficulty=>setSetup(current=>({...current,difficulty}))} seasons={availableSeasons} now={seasonTime} bossesForAct={(seasonNumber,difficulty,act)=>{
  const season=availableSeasons.find(candidate=>candidate.season===seasonNumber);
  if(!season)return [];
  const slot:BossOverrideSlot|undefined=act===3?'boss1':act===6?'boss2':act===8?(difficulty==='Hard'?'boss4':'boss3'):act===10?'boss4':act===12?'lunar2':undefined;
  return slot?getBossesForSlot(season,bossData,slot):season.bossStages.find(stage=>stage.act===act)?.bosses??[];
}}/></React.Suspense>}
{step===5&&<VideoGuide/>}
{step===1&&<section>
  <div className="sectionhead">
    <div><h2>Your Characters</h2><p>{count} owned · {CHARACTERS.length} in starter database</p></div>
    <div className="actions">
      <button type="button" onClick={()=>importFileInput.current?.click()}>Import GOOD JSON</button>
      <input ref={importFileInput} type="file" accept=".json,application/json" hidden aria-label="Import a GOOD character export" onChange={event=>{const file=event.target.files?.[0];if(file)void importOwnership(file);}}/>
      <button onClick={()=>setOwnership(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:true,level:ownership[c.name]?.level??90}])))}>Own All</button>
      <button onClick={()=>setOwnership(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:false,level:ownership[c.name]?.level??90}])))}>Clear All</button>
    </div>
  </div>
  {importMessage&&<p role="status">{importMessage}</p>}
  <div className="toolbar">
    <input aria-label="Search your characters" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search characters…"/>
    <div className="chosen-element-filters" role="group" aria-label="Filter by element">{ELEMENTS.map(element=><button type="button" key={element} className={`chosen-filter-icon ${ownedElements.includes(element)?'selected':''}`} aria-label={`${ownedElements.includes(element)?'Remove':'Filter by'} ${element}`} aria-pressed={ownedElements.includes(element)} title={element} onClick={()=>toggleOwnedElement(element)}><img src={`${import.meta.env.BASE_URL}icons/elements/${element}_Icon.png`} alt=""/></button>)}</div>
    <div className="chosen-rarity-filters" role="group" aria-label="Filter by rarity">{([4,5] as const).map(rarity=><button type="button" key={rarity} className={ownedRarities.includes(rarity)?'selected':''} aria-pressed={ownedRarities.includes(rarity)} onClick={()=>toggleOwnedRarity(rarity)}>{rarity}★</button>)}</div>
    <label><input type="checkbox" checked={ownedOnly} onChange={e=>setOwnedOnly(e.target.checked)}/> Owned only</label>
  </div>
  <div className="characters">{filtered.map(c=><div className={'character '+(ownership[c.name]?.owned?'owned':'')} key={c.name} role="group" tabIndex={0} aria-label={`${c.name}. Click card to toggle owned.`} onClick={e=>{if(!(e.target as HTMLElement).closest('label'))toggleOwn(c.name);}} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleOwn(c.name);}}}><div className="character-top"><CharacterIcon name={c.name}/><ElementBadge element={c.element}/><strong>{c.name}</strong></div><label className="level-control"><span>Level</span><select aria-label={`${c.name} level`} value={ownership[c.name]?.level??90} onChange={e=>setCharacterLevel(c.name,Number(e.target.value))}>{LEVEL_OPTIONS.map(level=><option key={level} value={level}>{level}</option>)}</select></label></div>)}</div>
  <div className="bottom"><button className="primary" onClick={()=>setStep(2)}>Continue to Challenge Setup →</button></div>
</section>}
{step===2&&<section>
  <h2>Challenge Setup</h2>
  <p>Configure the current rotation. You can edit these settings at any time. Only one elemental Traveler version can be used per Theater run.</p>
  <div className="lineup-source">
    <label htmlFor="theater-season">Season lineup</label>
    <select id="theater-season" value={selectedSeason?.season??''} onChange={event=>{
      const season=availableSeasons.find(candidate=>candidate.season===Number(event.target.value));
      if(season)setSetup(current=>({...current,seasonId:season.season}));
      else setSetup(current=>({...current,seasonId:undefined}));
    }}>
      <option value="">Custom settings</option>
      {availableSeasons.map(season=><option key={season.id} value={season.season}>{seasonStatus(season,seasonTime)} · Season {season.season} ({season.id})</option>)}
    </select>
    {selectedSeason&&<p>
      {new Date(selectedSeason.startsAt).toLocaleDateString()} – {new Date(selectedSeason.endsAt).toLocaleDateString()} · <a href={selectedSeason.sourceUrl} target="_blank" rel="noreferrer">Fandom source</a>
      {theaterLineups.generatedAt&&<> · source updated {new Date(theaterLineups.generatedAt).toLocaleDateString()}</>}
    </p>}
    {selectedSeason&&selectedSeason.charactersMissingFromRoster.length>0&&<p className="lineup-warning">Not in the local character roster: {selectedSeason.charactersMissingFromRoster.join(', ')}</p>}
    {!selectedSeason&&theaterLineups.nextUnavailableReason&&<p className="lineup-warning">{theaterLineups.nextUnavailableReason}</p>}
  </div>
  {selectedSeason&&<BossPreview season={selectedSeason} bossData={bossData} difficulty={setup.difficulty}/>}
  <div className="settings">
    <div>
      <h3>Difficulty</h3>
      <DifficultySelect value={setup.difficulty} onChange={difficulty=>setSetup(current=>({...current,difficulty}))}/>
      <p>{requirement.acts} acts{requirement.lunarActs?` + ${requirement.lunarActs} Arcana Challenges`:''} · at least {requirement.minimum}, up to {requirement.cap} characters · Level {requirement.minimumLevel}+</p>
      <h3>Three featured elements</h3>
      <div className="chips featured-elements">{ELEMENTS.map(element=><button type="button" className={selectedElements.includes(element)?'selected':''} key={element} aria-pressed={selectedElements.includes(element)} onClick={()=>toggleElement(element)}><img src={`${import.meta.env.BASE_URL}icons/elements/${element}_Icon.png`} alt="" aria-hidden="true"/><span>{element}</span></button>)}</div>
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
      <CharacterSelectionGrid characters={openingOptions} selected={selectedOpening} limit={6} disabled={!hasThreeElements} unavailableNames={unavailableTravelers} onToggle={name=>updateCustomSetup(current=>({...current,opening:toggleArray(current.opening,name,6)}))}/>
    </div>
    <div>
      <h3>Special Guest Stars ({selectedGuests.length}/4)</h3>
      {!hasThreeElements&&<p className="selection-help">Select all three featured elements before choosing characters.</p>}
      <CharacterSelectionGrid characters={guestOptions} selected={selectedGuests} limit={4} disabled={!hasThreeElements} unavailableNames={unavailableTravelers} onToggle={name=>updateCustomSetup(current=>({...current,guests:toggleArray(current.guests,name,4)}))}/>
    </div>
  </div>
  {import.meta.env.DEV&&<BossOverrideEditor data={bossData} seasons={availableSeasons} bossCatalog={theaterLineups.bossCatalog} onChange={setBossData}/>}
  <div className="bottom"><button onClick={()=>setStep(1)}>← Characters</button><div className="continue-control">{!canContinueToPlanner&&<p className="selection-help" role="status">{!hasThreeElements?'Select all three featured elements first.':`You need at least ${requirement.minimum} eligible characters at Level ${requirement.minimumLevel}+; currently ${eligibleCount} qualify.`}</p>}<button className="primary" disabled={!canContinueToPlanner} onClick={()=>{if(canContinueToPlanner)setStep(3);}}>Continue to Planner →</button></div></div>
</section>}
{step===3&&<section>
  <h2>Theater Planner</h2>
  <p>Select your cast, then assign up to four characters to each act. Changes are saved locally.</p>
  <div className="planner-character-controls">
  <div className="borrowed-control">
    <div><h3>Supporting Character</h3><p>Choose any character allowed by this rotation. Supporting characters count toward the cast cap, but not the minimum requirement.</p></div>
    <div className="borrowed-field"><span>Supporting character</span><BorrowedCharacterPicker characters={borrowedOptions} selected={borrowedCharacter} canSelect={name=>canBorrowCharacter(chosen,borrowedCharacter,name,requirement.cap)} onSelect={setBorrowedCharacter} open={openCharacterPicker==='borrowed'} onOpenChange={open=>setOpenCharacterPicker(open?'borrowed':'')}/></div>
    {chosen.length>=requirement.cap&&!borrowedCharacter&&<p role="status">Your cast is full. Remove a character to add someone new as Supporting, or choose a Supporting character already in your cast.</p>}
  </div>
  <div className="traveler-control">
    <label className="traveler-element-control"><span>Traveler element</span>
      <span className="traveler-select-wrap">
      {plannerTravelerElement!=='None'&&<img className="traveler-select-icon" src={`${import.meta.env.BASE_URL}icons/elements/${plannerTravelerElement}_Icon.png`} alt="" aria-hidden="true"/>}
      <select value={plannerTravelerElement} disabled={!!selectedTraveler} title={selectedTraveler?'Set by your opening or guest lineup.':'Choose an element, or None to hide Traveler and remove their cast selection and act assignments.'} onChange={event=>setTravelerElement(event.target.value as TravelerElement)}>
        {selectedElements.map(element=><option key={element} value={element}>{element}</option>)}
        <option value="None">None</option>
      </select>
      </span>
    </label>
  </div>
  </div>
  <div className="planner-layout">
    <section className="chosen-section">
      <div className="sectionhead"><div><h3 className={`cast-count ${castStatus}`}>Chosen ({chosen.length}/{requirement.cap})</h3><div className={`cast-status ${castStatus}`} role="status"><strong>{chosenForRequirement}/{requirement.minimum} toward entry minimum</strong><p>{castMessage}</p></div><p>Supporting characters use a cast slot but do not count toward the entry minimum. Assigning every act does not replace this requirement.</p></div></div>
      <div className="chosen-filters">
        <input aria-label="Search chosen characters" placeholder="Search characters…" value={chosenSearch} onChange={event=>setChosenSearch(event.target.value)}/>
        <label className="chosen-sort-control">Sort <select aria-label="Sort planner characters" value={plannerCharacterOrder} onChange={event=>setPlannerCharacterOrder(event.target.value as CharacterSortOrder)}><option value="name">Name</option><option value="game">In-game order</option></select></label>
        <div className="chosen-element-filters" role="group" aria-label="Filter by element">
          {ELEMENTS.map(element=><button type="button" key={element} className={`chosen-filter-icon ${chosenElements.includes(element)?'selected':''}`} aria-label={`${chosenElements.includes(element)?'Remove':'Filter by'} ${element}`} aria-pressed={chosenElements.includes(element)} title={element} onClick={()=>toggleChosenElement(element)}><img src={`${import.meta.env.BASE_URL}icons/elements/${element}_Icon.png`} alt=""/></button>)}
        </div>
        <div className="chosen-rarity-filters" role="group" aria-label="Filter by rarity">
          {([4,5] as const).map(rarity=><button type="button" key={rarity} className={chosenRarities.includes(rarity)?'selected':''} aria-pressed={chosenRarities.includes(rarity)} onClick={()=>toggleChosenRarity(rarity)}>{rarity}★</button>)}
        </div>
      </div>
      <h4 className="chosen-group-title">Opening Characters ({plannerCharacters.filter(character=>openingNames.has(character.name)).length}/6)</h4>
      <div className="characters chosen-grid opening-grid">{sortCharacters(filteredPlannerCharacters.filter(character=>openingNames.has(character.name)),plannerCharacterOrder,selectedOpening).map(renderPlannerCharacter)}</div>
      <h4 className="chosen-group-title">Special Guest Stars ({plannerCharacters.filter(character=>selectedGuests.includes(character.name)).length}/4)</h4>
      <div className="characters chosen-grid guest-grid">{sortCharacters(filteredPlannerCharacters.filter(character=>selectedGuests.includes(character.name)&&!openingNames.has(character.name)),plannerCharacterOrder,selectedGuests).map(renderPlannerCharacter)}</div>
      <div className="chosen-divider" role="separator" aria-label="Other available characters"><span/></div>
      <div className="characters chosen-grid">{filteredPlannerCharacters.filter(character=>!openingNames.has(character.name)&&!selectedGuests.includes(character.name)).map(renderPlannerCharacter)}</div>
    </section>
    <section className="assignment-only">
      <h3>Act Assignments</h3>
      <p className="drag-help">Drag any eligible character directly into a slot to select and assign them, or drag between slots to swap. Right-click a slot or use × to clear it. Each character can be assigned to at most two acts. Arcana Challenges unlock after Acts 3 and 6 and can be completed any time before Act 10.</p>
      <div className="act-group"><h4>Acts</h4><div className="acts">{setup.difficulty==='Lunar'
        ? <>{renderAct(1,'Act 1')}{renderAct(2,'Act 2')}{renderAct(3,'Act 3')}{renderAct(11,'Arcana 1')}{renderAct(4,'Act 4')}{renderAct(5,'Act 5')}{renderAct(6,'Act 6')}{renderAct(12,'Arcana 2')}{Array.from({length:4},(_,index)=>renderAct(index+7,`Act ${index+7}`))}</>
        : Array.from({length:requirement.acts},(_,index)=>renderAct(index+1,`Act ${index+1}`))}</div></div>
    </section>
    <aside className="unallocated-panel" aria-labelledby="unallocated-heading">
      <h3 id="unallocated-heading">Unallocated <span>({unallocatedCharacters.length})</span></h3>
      <p>Chosen characters with stamina remaining. Drag into an act, or click to fill the first empty slot.</p>
      <div className="unallocated-list">
        {unallocatedCharacters.map(character=>{
          const remainingStamina=Math.max(0,2-Object.values(activePlanActs).filter(names=>names.includes(character.name)).length);
          return <button type="button" className="act-picker-trigger unallocated-character" key={character.name}
          aria-label={`Assign ${character.name} to the first empty act slot, ${remainingStamina} of 2 stamina remaining`}
          draggable onDragStart={event=>{event.dataTransfer.setData('text/plain',character.name);event.dataTransfer.effectAllowed='copy';}}
          onDragEnd={()=>setDropTarget('')}
          onClick={()=>{
            const acts=setup.difficulty==='Lunar'?[1,2,3,11,4,5,6,12,7,8,9,10]:Array.from({length:requirement.acts},(_,index)=>index+1);
            for(const act of acts){
              for(let slot=0;slot<4;slot++){
                if(!chosen.includes(plan.acts[act]?.[slot]??'')&&canAssignToAct(character.name,act,slot)){
                  dropCharacterIntoAct(character.name,act,slot);
                  return;
                }
              }
            }
            setAssignmentNotice({message:'All act slots are filled. Drag a character onto a slot to replace its assignment.',id:++assignmentNoticeId.current});
          }}>
          <CharacterIcon name={character.name}/><span className="act-picker-name">{character.name}</span><span className="vigor-hearts" role="img" aria-label={`${remainingStamina} of 2 stamina remaining`} title={`${remainingStamina} of 2 stamina remaining`}>{[0,1].map(index=><span key={index} className={index<remainingStamina?'heart-remaining':'heart-used'}>♥</span>)}</span>
        </button>;})}
        {unallocatedCharacters.length===0&&<p className="unallocated-empty">{chosen.length?'Every chosen character has used all their stamina.':'Select characters to build your cast.'}</p>}
      </div>
    </aside>
  </div>
  <div className="bottom"><button onClick={()=>setStep(2)}>← Challenge Setup</button><button onClick={()=>{setPlan({roster:[],acts:{},borrowed:''});setCopiedTeam(null);}}>Reset Plan</button></div>
</section>}
{assignmentNotice&&<div key={assignmentNotice.id} className="assignment-notice" role="status">{assignmentNotice.message}</div>}
<footer><span>Unofficial fan-made planning tool. {storageUnavailable?<span role="status">Browser saving is unavailable. Changes will last only until this page closes.</span>:'All settings are saved in this browser.'} <a href="./privacy.html">Privacy policy</a></span><Feedback/></footer></main>
}

