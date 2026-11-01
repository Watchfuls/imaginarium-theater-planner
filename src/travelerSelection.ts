import type {Element} from './characters.ts';

export function changeTravelerElement<T extends {roster:string[];acts:Record<number,string[]>}>(plan:T,element:Element,allowedElements:readonly Element[]):T & {travelerElement?:Element} {
  if(!allowedElements.includes(element))return plan;
  const name=`${element} Traveler`;
  // Sparse act slots become null when a plan is saved and reloaded as JSON.
  const replace=(value:string|null|undefined)=>typeof value!=='string'?'':value.endsWith(' Traveler')?name:value;
  return {...plan,travelerElement:element,
    roster:[...new Set(plan.roster.map(replace))],
    acts:Object.fromEntries(Object.entries(plan.acts).map(([act,names])=>[act,Array.from(names,replace)])),
  };
}
