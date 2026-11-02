import {canonicalEnemyName} from './enemyIdentity';
import React from 'react';
import published from './data/theater-act-details.json';
import catalog from './data/theater-enemies.json' with {type:'json'};
import type {ActDetailsData} from './actDetailsData';
import {encounterEnemyIds} from './actDetailsPresentation';
import {KeyRecommendations} from './KeyRecommendations';

const icons=import.meta.glob('./assets/enemies/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const enemies=catalog as Record<string,{name:string;icon:string}>;

export function LunarActOnePreview({season}:{season:number}){
  const choices=(published as ActDetailsData).seasons[season]?.Lunar?.[11]?.encounters??[];
  const ids=[...new Set(choices.flatMap(encounterEnemyIds))];
  if(!ids.length)return null;
  return <div className="boss-preview-card"><strong>Lunar Act 1</strong><div className="lunar-act-enemy-icons">{ids.map(id=>{
    const enemy=catalog[id as keyof typeof catalog];
    return enemy?<a key={id} href={enemy.wikiUrl} target="_blank" rel="noreferrer" title={enemy.name} aria-label={enemy.name}><img src={icons[`./assets/enemies/${enemy.icon}`]} alt="" width="38" height="38" loading="lazy"/></a>:null;
  })}</div></div>;
}

export function PlannerKeyRecommendations({season,difficulty,act,bossNames}:{season:number;difficulty:string;act:number;bossNames:string[]}){
  const encounters=(published as ActDetailsData).seasons[season]?.[difficulty]?.[act]?.encounters??[];
  const canonicalNames=bossNames.map(canonicalEnemyName);
  const items=encounters.filter(encounter=>encounterEnemyIds(encounter).some(id=>canonicalNames.includes(enemies[id]?.name))).flatMap(encounter=>encounter.keyRecommendations??[]);
  return items.length?<KeyRecommendations items={items}/>:null;
}

export function PlannerEncounterPicker({season,difficulty,act,value,onChange}:{season:number;difficulty:string;act:number;value?:string;onChange:(value:string)=>void}){
  const stage=(published as ActDetailsData).seasons[season]?.[difficulty]?.[act];
  const choices=stage?.encounters??[];
  const dropdown=React.useRef<HTMLDetailsElement>(null);
  const lunarPreview=difficulty==='Lunar'&&act===11&&choices.length===1;
  if(choices.length<2&&!lunarPreview)return null;
  const selected=choices.find(choice=>choice.name===value);
  const portraits=(choice:typeof choices[number])=><span className="planner-encounter-icons">{encounterEnemyIds(choice).map(id=>enemies[id]&&<img key={id} src={icons[`./assets/enemies/${enemies[id].icon}`]} alt={enemies[id].name} title={enemies[id].name} width="28" height="28" draggable={false}/>)}</span>;
  const recommendations=(choice:typeof choices[number])=>{
    if(!choice.recommendedElements?.length&&!choice.keyRecommendations?.length&&!choice.notableCharacters?.length)return null;
    return <span className="planner-option-recommendations" aria-label="Recommendations">
      {!!choice.recommendedElements?.length&&<span className="key-recommendations">{choice.recommendedElements.map(element=><span className={`element ${element}`} key={element} title={`Recommended Element: ${element}`}><img className="element-icon" src={`${import.meta.env.BASE_URL}icons/elements/${element}_Icon.png`} alt="" width="16" height="16"/>{element}</span>)}</span>}
      {!!choice.keyRecommendations?.length&&<KeyRecommendations items={choice.keyRecommendations}/>}
      {choice.notableCharacters?.map(character=><span className="planner-notable-character" key={character.name} title={`${character.name}: ${character.reason}`}><img src={`${import.meta.env.BASE_URL}icons/characters/${(character.name==='Itto'?'Arataki_Itto':character.name.replaceAll(' ','_'))}_Icon.webp`} alt="" width="24" height="24" loading="lazy"/>{character.name}</span>)}
    </span>;
  };
  if(lunarPreview)return <div className="planner-encounter-picker planner-lunar-preview" aria-label="Lunar Stage 1 enemies">{portraits(choices[0])}{!!choices[0].keyRecommendations?.length&&<KeyRecommendations items={choices[0].keyRecommendations}/>}</div>;
  const select=(name:string)=>{onChange(name);if(dropdown.current){dropdown.current.open=false;dropdown.current.querySelector('summary')?.focus();}};
  return <div className="planner-encounter-picker planner-stage-preview"><details className="planner-choice-dropdown" ref={dropdown} onKeyDown={event=>{
    if(event.key==='Escape'&&dropdown.current){dropdown.current.open=false;dropdown.current.querySelector('summary')?.focus();event.stopPropagation();}
  }} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null)&&dropdown.current)dropdown.current.open=false;}}>
    <summary aria-label={`Choose enemies for Act ${act}${selected?`: ${selected.name}`:''}`} title={selected?.name??'Choose the enemies you plan to face'}>{selected?portraits(selected):<span>Choose Enemies</span>}<span className="planner-encounter-arrow" aria-hidden="true">▾</span></summary>
    <div className="planner-encounter-options" aria-label={`Act ${act} encounter choices`}>
      <button type="button" className="planner-encounter-option" aria-pressed={!selected} onClick={()=>select('')}>No Preference</button>
      {choices.map((choice,index)=><button type="button" className="planner-encounter-option" key={choice.name} aria-pressed={choice.name===value} onClick={()=>select(choice.name)}><span className="planner-encounter-option-label">Choice {index+1}{/Elite Assault/i.test(choice.name)&&<span className="act-elite-badge">Elite Assault</span>}</span>{portraits(choice)}<span className="planner-encounter-description">{choice.name}</span>{recommendations(choice)}</button>)}
    </div>
  </details>{!!stage?.keyRecommendations?.length&&<KeyRecommendations items={stage.keyRecommendations}/>}</div>;
}
