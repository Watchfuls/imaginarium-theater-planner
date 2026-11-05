import {canonicalEnemyName} from './enemyIdentity';
import React from 'react';
import published from './data/theater-act-details.json';
import catalog from './data/theater-enemies.json' with {type:'json'};
import type {ActDetailsData,EncounterDetails} from './actDetailsData';
import {encounterEnemyIds} from './actDetailsPresentation';
import {KeyRecommendations} from './KeyRecommendations';

const icons=import.meta.glob('./assets/enemies/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
type EnemyPreview={name:string;iconUrl:string;wikiUrl:string};
type Enemy={name:string;icon?:string;iconUrl?:string;wikiUrl?:string};
const enemies=catalog as Record<string,Enemy>;

export function LunarActOnePreview({season,act=11,data=published as ActDetailsData,privateEnemies={}}:{season:number;act?:11|12;data?:ActDetailsData;privateEnemies?:Record<string,EnemyPreview>}){
  const choices=data.seasons[season]?.Lunar?.[act]?.encounters??[];
  const ids=[...new Set(choices.flatMap(encounterEnemyIds))];
  if(!ids.length)return null;
  const enemyCatalog:Record<string,Enemy>={...enemies,...privateEnemies};
  return <div className="boss-preview-card"><strong>Arcana {act-10}</strong><div className="lunar-act-enemy-icons">{ids.map(id=>{
    const enemy=enemyCatalog[id];
    return enemy?<a key={id} href={enemy.wikiUrl} target="_blank" rel="noreferrer" title={enemy.name} aria-label={enemy.name}><img src={enemy.icon?icons[`./assets/enemies/${enemy.icon}`]:enemy.iconUrl} alt="" width="38" height="38" loading="lazy"/></a>:null;
  })}</div></div>;
}

function Recommendations({choice,compact=false}:{choice:Pick<EncounterDetails,'recommendedElements'|'keyRecommendations'|'notableCharacters'>;compact?:boolean}){
    if(compact&&!choice.notableCharacters?.length&&!choice.recommendedElements?.length)return choice.keyRecommendations?.length?<KeyRecommendations items={choice.keyRecommendations}/>:null;
    if(compact&&choice.notableCharacters?.length)return <details className="planner-recommendation-dropdown" onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();event.stopPropagation();}}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))event.currentTarget.open=false;}}>
      <summary aria-label="Show recommended characters"><Recommendations choice={{...choice,notableCharacters:undefined}}/>{!choice.keyRecommendations?.length&&!choice.recommendedElements?.length&&<span>Characters</span>}<span aria-hidden="true">▾</span></summary>
      <div className="planner-character-panel"><strong>Recommended Characters</strong>{choice.notableCharacters.map(character=><div className="planner-character-recommendation" key={character.name}><img src={`${import.meta.env.BASE_URL}icons/characters/${(character.name==='Itto'?'Arataki_Itto':character.name.replaceAll(' ','_'))}_Icon.webp`} alt="" width="32" height="32" loading="lazy"/><div><strong>{character.name}</strong>{character.reason&&<p>{character.reason}</p>}</div></div>)}</div>
    </details>;
    if(!choice.recommendedElements?.length&&!choice.keyRecommendations?.length&&!choice.notableCharacters?.length)return null;
    return <span className="planner-option-recommendations" aria-label="Recommendations">
      {!!choice.recommendedElements?.length&&<span className="key-recommendations">{choice.recommendedElements.map(element=><span className={`element ${element}`} key={element} title={`Recommended Element: ${element}`}><img className="element-icon" src={`${import.meta.env.BASE_URL}icons/elements/${element}_Icon.png`} alt="" width="16" height="16"/>{element}</span>)}</span>}
      {!!choice.keyRecommendations?.length&&<KeyRecommendations items={choice.keyRecommendations}/>}
      {choice.notableCharacters?.map(character=><span className="planner-notable-character" key={character.name} title={`${character.name}: ${character.reason}`}><img src={`${import.meta.env.BASE_URL}icons/characters/${(character.name==='Itto'?'Arataki_Itto':character.name.replaceAll(' ','_'))}_Icon.webp`} alt="" width="24" height="24" loading="lazy"/>{character.name}</span>)}
    </span>;
}

export function PlannerKeyRecommendations({season,difficulty,act,bossNames,data=published as ActDetailsData,privateEnemies={}}:{season:number;difficulty:string;act:number;bossNames:string[];data?:ActDetailsData;privateEnemies?:Record<string,EnemyPreview>}){
  const stage=data.seasons[season]?.[difficulty]?.[act];
  const encounters=stage?.encounters??[];
  const canonicalNames=bossNames.map(canonicalEnemyName);
  const enemyCatalog:Record<string,Enemy>={...enemies,...privateEnemies};
  const matched=encounters.filter(encounter=>encounterEnemyIds(encounter).some(id=>canonicalNames.includes(enemyCatalog[id]?.name)));
  return <><Recommendations compact choice={stage??{}}/>{matched.map(encounter=><Recommendations compact key={encounter.name} choice={encounter}/>)}</>;
}

export function PlannerEncounterPicker({season,difficulty,act,value,onChange,data=published as ActDetailsData,privateEnemies={}}:{season:number;difficulty:string;act:number;value?:string;onChange:(value:string)=>void;data?:ActDetailsData;privateEnemies?:Record<string,EnemyPreview>}){
  const stage=data.seasons[season]?.[difficulty]?.[act];
  const choices=stage?.encounters??[];
  const dropdown=React.useRef<HTMLDetailsElement>(null);
  const lunarPreview=difficulty==='Lunar'&&act===11&&choices.length===1;
  const enemyCatalog:Record<string,Enemy>={...enemies,...privateEnemies};

  const selected=choices.find(choice=>choice.name===value);
  const portraits=(choice:typeof choices[number])=><span className="planner-encounter-icons">{encounterEnemyIds(choice).map(id=>enemyCatalog[id]&&<img key={id} src={enemyCatalog[id].icon?icons[`./assets/enemies/${enemyCatalog[id].icon}`]:enemyCatalog[id].iconUrl} alt={enemyCatalog[id].name} title={enemyCatalog[id].name} width="28" height="28" draggable={false}/>)}</span>;
  if(choices.length<2&&!lunarPreview){
    if(!stage)return null;
    return <div className="planner-encounter-picker planner-fixed-recommendations" aria-label={`Act ${act} recommendations`}><Recommendations compact choice={stage}/>{choices.map(choice=><Recommendations compact key={choice.name} choice={choice}/>)}</div>;
  }
  if(lunarPreview)return <div className="planner-encounter-picker planner-lunar-preview" aria-label="Arcana 1 enemies">{portraits(choices[0])}<Recommendations compact choice={stage??{}}/><Recommendations compact choice={choices[0]}/></div>;
  const select=(name:string)=>{onChange(name);if(dropdown.current){dropdown.current.open=false;dropdown.current.querySelector('summary')?.focus();}};
  return <div className="planner-encounter-picker planner-stage-preview"><details className="planner-choice-dropdown" ref={dropdown} onKeyDown={event=>{
    if(event.key==='Escape'&&dropdown.current){dropdown.current.open=false;dropdown.current.querySelector('summary')?.focus();event.stopPropagation();}
  }} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null)&&dropdown.current)dropdown.current.open=false;}}>
    <summary aria-label={`Choose enemies for Act ${act}${selected?`: ${selected.name}`:''}`} title={selected?.name??'Choose the enemies you plan to face'}>{selected?portraits(selected):<span>Choose Enemies</span>}<span className="planner-encounter-arrow" aria-hidden="true">▾</span></summary>
    <div className="planner-encounter-options" aria-label={`Act ${act} encounter choices`}>
      <button type="button" className="planner-encounter-option" aria-pressed={!selected} onClick={()=>select('')}>No Preference</button>
      {choices.map((choice,index)=><button type="button" className="planner-encounter-option" key={choice.name} aria-pressed={choice.name===value} onClick={()=>select(choice.name)}><span className="planner-encounter-option-label">Choice {index+1}{/Elite Assault/i.test(choice.name)&&<span className="act-elite-badge">Elite Assault</span>}</span>{portraits(choice)}<span className="planner-encounter-description">{choice.name}</span><Recommendations choice={choice}/></button>)}
    </div>
  </details><Recommendations compact choice={stage??{}}/></div>;
}
