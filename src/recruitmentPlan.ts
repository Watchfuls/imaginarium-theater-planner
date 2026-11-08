import type {Plan} from './plannerTypes';
import {recruitedBy} from './actPreparationData.ts';
import {isAssignmentPlaceholder} from './assignmentPlaceholders.ts';

export function clearUnrecruitedAssignments(plan:Plan,opening:string[],order:number[]):Plan{
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
