import type {Plan} from './plannerTypes';
export const defaultStageOrder=[1,2,3,11,4,5,6,12,7,8,9,10];
export const stageLabel=(stage:number)=>stage===11?'Arcana 1':stage===12?'Arcana 2':`Act ${stage}`;

export function validStageOrder(value:unknown):value is number[]{
  if(!Array.isArray(value)||value.length!==12||new Set(value).size!==12||!defaultStageOrder.every(stage=>value.includes(stage)))return false;
  if(value.filter(stage=>stage<=10).some((stage,index)=>stage!==index+1))return false;
  return value.indexOf(11)>value.indexOf(3)&&value.indexOf(12)>value.indexOf(6)
    &&value.indexOf(11)<value.indexOf(10)&&value.indexOf(12)<value.indexOf(10);
}
export function validUnlockedArcana(value:unknown):value is number[]{
  return Array.isArray(value)&&new Set(value).size===value.length&&value.every(stage=>stage===11||stage===12);
}
export function moveArcana(order:number[],stage:number,before:number):number[]{
  if((stage!==11&&stage!==12)||stage===before||!order.includes(before))return order;
  const next=order.filter(value=>value!==stage);
  next.splice(next.indexOf(before),0,stage);
  return validStageOrder(next)?next:order;
}
export function stagesThrough(order:readonly number[],stage:number,include=true){
  const index=order.indexOf(stage);
  return index<0?[]:order.slice(0,index+(include?1:0));
}

export function moveArcanaPlan(plan:Plan,stage:number,before:number):Plan{
  if(!plan.unlockedArcana?.includes(stage))return plan;
  const order=plan.stageOrder??defaultStageOrder;
  const next=moveArcana(order,stage,before);
  if(next===order||next.every((value,index)=>value===order[index]))return plan;
  const preparations={...plan.preparations};
  delete preparations[stage];
  return {...plan,stageOrder:next,acts:{...plan.acts,[stage]:[]},preparations};
}
