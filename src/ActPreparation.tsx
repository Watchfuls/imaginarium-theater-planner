import {useState} from 'react';
import type {Preparation} from './plannerTypes';
import type {Character,Element} from './characters';
import {ActAssignmentPicker} from './CharacterPickers';
import {CharacterIcon,ElementBadge} from './CharacterVisuals';
import {blessingPairs,blessingReactions,blessingLevel} from './actPreparationData';
const icons=import.meta.glob('./assets/reactions/*',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const reactionIcon=(pair:string)=>{
  const reaction=blessingReactions[pair];
  return reaction?Object.entries(icons).find(([path])=>path.endsWith(`_${reaction.icon}.png`)||path.endsWith(`_${reaction.icon}.webp`))?.[1]:undefined;
};

export function ActPreparation({act,label,order,value,characters,previousRecruits,opening,elements,preparations,onChange}:{
  act:number;label:string;order:number[];value?:Preparation;characters:Character[];previousRecruits:string[];opening:string[];elements:Element[];preparations?:Record<number,Preparation>;onChange:(value:Preparation)=>void;
}){
  const [open,setOpen]=useState(false);
  const plan=value??{recruits:[],blessings:[]};
  const available=characters.filter(character=>!opening.includes(character.name)&&!previousRecruits.includes(character.name));
  const pairs=blessingPairs(elements);
  const plannedPairs=pairs.filter(pair=>blessingLevel({[act]:plan},act,pair,order)>0);
  const hasSummary=plan.recruits.length>0||plannedPairs.length>0;
  return <details className={`act-preparation ${hasSummary?'has-preparation':''}`} onToggle={event=>{if(!event.currentTarget.open)setOpen(false);}}>
    <summary><span>Before {label}</span>{hasSummary&&<span className="preparation-summary">
      {plan.recruits.map(name=><span className="preparation-summary-item" key={name}><span aria-hidden="true"><CharacterIcon name={name}/></span>{name}</span>)}
      {plannedPairs.map(pair=><span className="preparation-summary-item" key={pair}>{reactionIcon(pair)&&<img src={reactionIcon(pair)} alt=""/>}{pair} Lv. {blessingLevel(preparations,act,pair,order)}</span>)}
    </span>}</summary>
    <div className="preparation-compact">
      <ActAssignmentPicker recruitment={plan.recruits} label={label} act={act} slot={0} characters={available} chosenNames={new Set(available.map(character=>character.name))} placeholderElements={[]} selected="" borrowed="" opening={new Set()} guests={new Set()} canSelect={()=>true} isExhausted={()=>false} open={open} onOpenChange={setOpen} onSelect={name=>onChange({...plan,recruits:!name?[]:plan.recruits.includes(name)?plan.recruits.filter(recruit=>recruit!==name):[...plan.recruits,name]})}/>
      <div className="preparation-counters">{pairs.map(pair=>{
        const previous=blessingLevel(preparations,act,pair,order,false);
        const level=blessingLevel(preparations,act,pair,order);
        const reaction=blessingReactions[pair];
        const icon=reactionIcon(pair);
        const change=(next:number)=>onChange({...plan,blessings:[...plan.blessings.filter(blessing=>blessing.name!==pair&&blessing.name!==reaction?.legacy),...(next>previous?[{name:pair,levels:next-previous}]:[])]});
        return <div className="blessing-counter" key={pair}>
          <span className="blessing-pair" title={pair}>{icon?<img src={icon} alt=""/>:<span className="blessing-element-icons">{pair.split('-').map(element=><ElementBadge key={element} element={element as Element}/>)}</span>}<span>{pair}</span></span>
          <span className="blessing-stepper"><button type="button" aria-label={`Decrease ${pair} before ${label}`} disabled={level<=previous} onClick={()=>change(level-1)}>−</button><output aria-label={`${pair} level before ${label}`}>{level}</output><button type="button" aria-label={`Increase ${pair} before ${label}`} onClick={()=>change(level+1)}>+</button></span>
        </div>;
      })}</div>
    </div>
  </details>;
}
