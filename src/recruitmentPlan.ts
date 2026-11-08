import type {Plan} from './plannerTypes';
import {recruitedBy} from './actPreparationData.ts';
import {isAssignmentPlaceholder} from './assignmentPlaceholders.ts';

export function positionRecruitmentAutomatically(plan:Plan,opening:string[],order:number[]):Plan{
  if(!plan.automatedRecruitment)return plan;
  if(plan.recruitedOnly)plan={...plan,recruitedOnly:false};
  const seen=new Set(opening);
  const recruits=new Map<number,string[]>();
  for(const stage of order){
    const names:string[]=[];
    for(const name of plan.acts[stage]??[]){
      if(!name||isAssignmentPlaceholder(name)||seen.has(name))continue;
      seen.add(name);names.push(name);
    }
    recruits.set(stage,names);
  }
  const preparations={...plan.preparations};
  let changed=false;
  for(const stage of new Set([...Object.keys(preparations).map(Number),...order])){
    const entry=preparations[stage];
    const names=recruits.get(stage)??[];
    if((entry?.recruits.length??0)===names.length&&names.every((name,index)=>entry?.recruits[index]===name))continue;
    preparations[stage]={recruits:names,blessings:entry?.blessings??[]};
    changed=true;
  }
  return changed?{...plan,preparations}:plan;
}

export function advanceRecruitmentForMove(plan:Plan,name:string,stage:number,opening:string[],order:number[]):Plan{
  if(plan.automatedRecruitment||!plan.recruitedOnly||!name||isAssignmentPlaceholder(name)||recruitedBy(plan.preparations,stage,opening,order).has(name))return plan;
  const index=order.indexOf(stage);
  if(index<0)return plan;
  const later=new Set(order.slice(index+1));
  if(!Object.entries(plan.preparations??{}).some(([act,entry])=>later.has(Number(act))&&entry.recruits.includes(name)))return plan;
  const preparations=Object.fromEntries(Object.entries(plan.preparations??{}).map(([act,entry])=>[act,later.has(Number(act))?{...entry,recruits:entry.recruits.filter(value=>value!==name)}:entry]));
  const entry=preparations[stage]??{recruits:[],blessings:[]};
  preparations[stage]={...entry,recruits:[...entry.recruits,name]};
  return {...plan,preparations};
}

export function clearUnrecruitedAssignments(plan:Plan,opening:string[],order:number[]):Plan{
  if(plan.automatedRecruitment)return positionRecruitmentAutomatically(plan,opening,order);
  if(!plan.recruitedOnly)return plan;
  let changed=false;
  const acts={...plan.acts};
  for(const stage of order){
    if(!acts[stage])continue;
    const recruited=recruitedBy(plan.preparations,stage,opening,order);
    acts[stage]=acts[stage].map(name=>{
      if(!name||isAssignmentPlaceholder(name)||recruited.has(name))return name;
      changed=true;
      return '';
    });
  }
  return changed?{...plan,acts}:plan;
}
