import React from 'react';
import published from './data/theater-act-details.json';
import catalog from './data/theater-enemies.json';
import type {ActDetailsData} from './actDetailsData';
import {encounterEnemyIds} from './actDetailsPresentation';

const icons=import.meta.glob('./assets/enemies/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const enemies=catalog as Record<string,{name:string;icon:string}>;

export function PlannerEncounterPicker({season,difficulty,act,value,onChange}:{season:number;difficulty:string;act:number;value?:string;onChange:(value:string)=>void}){
  const choices=(published as ActDetailsData).seasons[season]?.[difficulty]?.[act]?.encounters??[];
  const dropdown=React.useRef<HTMLDetailsElement>(null);
  const lunarPreview=difficulty==='Lunar'&&act===11&&choices.length===1;
  if(choices.length<2&&!lunarPreview)return null;
  const selected=choices.find(choice=>choice.name===value);
  const portraits=(choice:typeof choices[number])=><span className="planner-encounter-icons">{encounterEnemyIds(choice).map(id=>enemies[id]&&<img key={id} src={icons[`./assets/enemies/${enemies[id].icon}`]} alt={enemies[id].name} title={enemies[id].name} width="28" height="28" draggable={false}/>)}</span>;
  if(lunarPreview)return <div className="planner-encounter-picker planner-lunar-preview" aria-label="Lunar Stage 1 enemies">{portraits(choices[0])}</div>;
  const select=(name:string)=>{onChange(name);if(dropdown.current){dropdown.current.open=false;dropdown.current.querySelector('summary')?.focus();}};
  return <details className="planner-encounter-picker" ref={dropdown} onKeyDown={event=>{
    if(event.key==='Escape'&&dropdown.current){dropdown.current.open=false;dropdown.current.querySelector('summary')?.focus();event.stopPropagation();}
  }} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null)&&dropdown.current)dropdown.current.open=false;}}>
    <summary aria-label={`Choose enemies for Act ${act}${selected?`: ${selected.name}`:''}`} title={selected?.name??'Choose the enemies you plan to face'}>{selected?portraits(selected):<span>Choose Enemies</span>}<span className="planner-encounter-arrow" aria-hidden="true">▾</span></summary>
    <div className="planner-encounter-options" aria-label={`Act ${act} encounter choices`}>
      <button type="button" className="planner-encounter-option" aria-pressed={!selected} onClick={()=>select('')}>No Preference</button>
      {choices.map((choice,index)=><button type="button" className="planner-encounter-option" key={choice.name} aria-pressed={choice.name===value} onClick={()=>select(choice.name)}><span className="planner-encounter-option-label">Choice {index+1}{/Elite Assault/i.test(choice.name)&&<span className="act-elite-badge">Elite Assault</span>}</span>{portraits(choice)}<span className="planner-encounter-description">{choice.name}</span></button>)}
    </div>
  </details>;
}
