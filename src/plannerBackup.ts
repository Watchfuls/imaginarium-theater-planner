import type {Ownership,Plan,Setup} from './plannerTypes';
import {validStageOrder,validUnlockedArcana} from './stageOrder.ts';
import {validPreparations,copyPreparations} from './actPreparationData.ts';
import {ELEMENTS} from './characters.ts';
import {difficulties,LEVEL_OPTIONS} from './plannerConfig.ts';

export type HistoricalPlan={setup:Setup;plan:Plan};
export type PlannerSave={ownership:Ownership;setup:Setup;plan:Plan;sort:'name'|'game';history?:HistoricalPlan[]};
type Backup=Omit<PlannerSave,'sort'> & {format:'ITP';version:1;sort?:'name'|'game'};
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(item=>typeof item==='string');
const fail=():never=>{throw new Error('This file is not a valid planner backup.');};

// Explicit fields keep site data, imported inventory, and browser credentials out of backups.
export function createPlannerBackup(save:PlannerSave):Backup {
  return {
    format:'ITP',version:1,
    ownership:Object.fromEntries(Object.entries(save.ownership)
      .filter(([,value])=>value.owned||value.level!==90)
      .map(([name,value])=>[name,{owned:value.owned,level:value.level}])),
    setup:{difficulty:save.setup.difficulty,elements:save.setup.elements,opening:save.setup.opening,guests:save.setup.guests,...(save.setup.seasonId===undefined?{}:{seasonId:save.setup.seasonId}),...(save.setup.customSeasonSelected===undefined?{}:{customSeasonSelected:save.setup.customSeasonSelected}),...(save.setup.privateSeasonSelected===undefined?{}:{privateSeasonSelected:save.setup.privateSeasonSelected})},
    plan:{...(save.plan.automatedRecruitment===undefined?{}:{automatedRecruitment:save.plan.automatedRecruitment}),...(save.plan.stageOrder?{stageOrder:[...save.plan.stageOrder]}:{}),...(save.plan.unlockedArcana?{unlockedArcana:[...save.plan.unlockedArcana]}:{}),...(save.plan.recruitedOnly===undefined?{}:{recruitedOnly:save.plan.recruitedOnly}),...(Object.keys(save.plan.preparations??{}).length?{preparations:copyPreparations(save.plan.preparations!)}:{}),roster:save.plan.roster,acts:Object.fromEntries(Object.entries(save.plan.acts).map(([act,team])=>[act,Array.from(team,name=>name??'')])),...(save.plan.borrowed?{borrowed:save.plan.borrowed}:{}),...(save.plan.travelerElement?{travelerElement:save.plan.travelerElement}:{}),...(Object.keys(save.plan.encounterChoices??{}).length?{encounterChoices:save.plan.encounterChoices}:{})},
    ...(save.sort==='name'?{}:{sort:save.sort}),
    ...(save.history?.length?{history:save.history.map(entry=>{const saved=createPlannerBackup({...entry,ownership:{},sort:'name'});return {setup:saved.setup,plan:saved.plan};})}:{}),
  };
}

export function parsePlannerBackup(value:unknown):PlannerSave {
  if(!record(value)||value.format!=='ITP')return fail();
  if(value.version!==1)throw new Error('This backup version is not supported. Try updating the planner.');
  const {ownership,setup,plan}=value;
  if(!record(ownership)||!record(setup)||!record(plan))return fail();
  for(const entry of Object.values(ownership)){
    if(!record(entry)||typeof entry.owned!=='boolean'||!LEVEL_OPTIONS.includes(entry.level as typeof LEVEL_OPTIONS[number]))return fail();
  }
  if(typeof setup.difficulty!=='string'||!Object.hasOwn(difficulties,setup.difficulty)
    ||!strings(setup.elements)||!setup.elements.every(element=>ELEMENTS.includes(element as typeof ELEMENTS[number]))
    ||!strings(setup.opening)||!strings(setup.guests)
    ||(setup.seasonId!==undefined&&(!Number.isInteger(setup.seasonId)||Number(setup.seasonId)<1))
    ||(setup.customSeasonSelected!==undefined&&typeof setup.customSeasonSelected!=='boolean')
    ||(setup.privateSeasonSelected!==undefined&&typeof setup.privateSeasonSelected!=='boolean')
    ||(setup.customSeasonSelected&&setup.privateSeasonSelected)
    ||((setup.customSeasonSelected||setup.privateSeasonSelected)&&setup.seasonId===undefined))return fail();
  if(!strings(plan.roster)||!record(plan.acts)||!Object.entries(plan.acts).every(([act,team])=>/^(?:[1-9]|1[0-2])$/.test(act)&&strings(team)&&team.length<=4)
    ||(plan.stageOrder!==undefined&&!validStageOrder(plan.stageOrder))
    ||(plan.unlockedArcana!==undefined&&!validUnlockedArcana(plan.unlockedArcana))
    ||(plan.automatedRecruitment!==undefined&&typeof plan.automatedRecruitment!=='boolean')
    ||(plan.recruitedOnly!==undefined&&typeof plan.recruitedOnly!=='boolean')
    ||(plan.preparations!==undefined&&!validPreparations(plan.preparations))
    ||(plan.borrowed!==undefined&&typeof plan.borrowed!=='string')
    ||(plan.travelerElement!==undefined&&plan.travelerElement!=='None'&&!ELEMENTS.includes(plan.travelerElement as typeof ELEMENTS[number]))
    ||(plan.encounterChoices!==undefined&&(!record(plan.encounterChoices)||!Object.values(plan.encounterChoices).every(choice=>typeof choice==='string')))
    ||(value.sort!==undefined&&value.sort!=='name'&&value.sort!=='game'))return fail();
  // Project known fields again so uploads cannot sneak unrelated payloads into storage.
  if(value.history!==undefined&&!Array.isArray(value.history))return fail();
  const history=(value.history as unknown[]|undefined)?.map(entry=>{
    if(!record(entry))return fail();
    const saved=parsePlannerBackup({format:'ITP',version:1,ownership:{},setup:entry.setup,plan:entry.plan});
    return {setup:saved.setup,plan:saved.plan};
  });
  const clean=createPlannerBackup({ownership:ownership as Ownership,setup:setup as Setup,plan:plan as Plan,sort:value.sort==='game'?'game':'name',history});
  return {ownership:clean.ownership,setup:clean.setup,plan:clean.plan,sort:clean.sort??'name',...(history?.length?{history}: {})};
}

export function mergePlanHistory(...groups:HistoricalPlan[][]):HistoricalPlan[]{
  return [...new Map(groups.flat().map(entry=>[JSON.stringify(entry),entry])).values()];
}
