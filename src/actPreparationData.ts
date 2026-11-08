import type {Preparation} from './plannerTypes';
import type {Element} from './characters';
import {defaultStageOrder,stagesThrough} from './stageOrder.ts';

const secondary=new Set(['Dendro','Geo','Anemo']);
export function blessingPairs(elements:Element[]){
  const ordered=[...new Set(elements)].sort((a,b)=>Number(secondary.has(a))-Number(secondary.has(b))||a.localeCompare(b));
  return ordered.flatMap((first,index)=>ordered.slice(index+1).map(second=>`${first}-${second}`));
}
export const blessingReactions:Record<string,{legacy:string;icon:string}>={
  'Electro-Hydro':{legacy:'Electro-Charged',icon:'ElectroCharged'},
  'Electro-Geo':{legacy:'Electro Crystallize',icon:'CrystallizeElectric'},
  'Hydro-Geo':{legacy:'Hydro Crystallize',icon:'CrystallizeWater'},
  'Pyro-Geo':{legacy:'Pyro Crystallize',icon:'CrystallizeFire'},
  'Cryo-Geo':{legacy:'Cryo Crystallize',icon:'CrystallizeIce'},
  'Pyro-Dendro':{legacy:'Burning',icon:'Burning'},
  'Electro-Pyro':{legacy:'Overloaded',icon:'Explode'},
  'Cryo-Hydro':{legacy:'Frozen',icon:'Frozen'},
  'Cryo-Pyro':{legacy:'Melt',icon:'Melt'},
  'Electro-Dendro':{legacy:'Quicken',icon:'Overdose'},
  'Hydro-Dendro':{legacy:'Bloom',icon:'Overgrow'},
  'Hydro-Pyro':{legacy:'Vaporize',icon:'Stream'},
  'Cryo-Electro':{legacy:'Superconduct',icon:'Superconduct'},
  'Cryo-Anemo':{legacy:'Cryo Swirl',icon:'SwirlCryo'},
  'Electro-Anemo':{legacy:'Electro Swirl',icon:'SwirlElectric'},
  'Pyro-Anemo':{legacy:'Pyro Swirl',icon:'SwirlFire'},
  'Hydro-Anemo':{legacy:'Hydro Swirl',icon:'SwirlWater'},
  'Cryo-Dendro':{legacy:'Cryo-Dendro',icon:'IceGrass'},
};
export function blessingLevel(preparations:Record<number,Preparation>|undefined,act:number,pair:string,order:readonly number[]=defaultStageOrder,include=true){
  const stages=new Set(stagesThrough(order,act,include));
  return Object.entries(preparations??{}).filter(([stage])=>stages.has(Number(stage)))
    .reduce((total,[,entry])=>total+entry.blessings.filter(blessing=>blessing.name===pair||blessing.name===blessingReactions[pair]?.legacy).reduce((sum,blessing)=>sum+blessing.levels,0),0);
}
export function recruitedBy(preparations:Record<number,Preparation>|undefined,act:number,opening:string[],order:readonly number[]=defaultStageOrder,include=true){
  const stages=new Set(stagesThrough(order,act,include));
  return new Set([...opening,...Object.entries(preparations??{}).filter(([before])=>stages.has(Number(before))).flatMap(([,entry])=>entry.recruits)]);
}

export function validPreparations(value:unknown):value is Record<number,Preparation>{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  return Object.entries(value).every(([act,entry])=>{
    if(!/^(?:[1-9]|1[0-2])$/.test(act)||!entry||typeof entry!=='object')return false;
    const {recruits,blessings}=entry as Preparation;
    return Array.isArray(recruits)&&recruits.every(name=>typeof name==='string')
      &&Array.isArray(blessings)&&blessings.every(blessing=>blessing&&typeof blessing.name==='string'&&Number.isSafeInteger(blessing.levels)&&blessing.levels>=1);
  });
}

export function copyPreparations(value:Record<number,Preparation>):Record<number,Preparation>{
  return Object.fromEntries(Object.entries(value).map(([act,entry])=>[act,{recruits:[...entry.recruits],blessings:entry.blessings.map(({name,levels})=>({name,levels}))}]));
}
