import React from 'react';
import {bossPortrait} from './bossPortraits';
import {enemyWikiUrl} from './plannerConfig';
import {getBossesForSlot} from './theaterData';
import type {TheaterSeason,TheaterBossData} from './plannerTypes';
import type {ActDetailsData} from './actDetailsData';

const LunarActOnePreview=React.lazy(()=>import('./PlannerEncounterPicker').then(module=>({default:module.LunarActOnePreview})));

export function BossPreview({season,bossData,difficulty,privatePreview=false,actDetailsData,privateEnemies}:{season:TheaterSeason;bossData:TheaterBossData;difficulty:string;privatePreview?:boolean;actDetailsData?:ActDetailsData;privateEnemies?:Record<string,{name:string;iconUrl:string;wikiUrl:string;baseResistances?:Record<string,number>}>}){
  const stages=privatePreview
    ? [3,6,8,10].map(act=>season.bossStages.find(stage=>stage.act===act)?.bosses??[])
    : (['boss1','boss2','boss3','boss4'] as const).map(slot=>getBossesForSlot(season,bossData,slot));
  return <div className="boss-preview">
    <div><h3>Boss preview</h3><p>{privatePreview?'Private provisional preview · Season 30 bosses by act.':'Bosses for Season '+season.season+'. Boss 4 is used for Act 8 in Hard and Act 10 in Visionary/Lunar.'}</p></div>
    <div className="boss-preview-grid">{stages.map((bosses,index)=>{
      return <div className="boss-preview-card" key={index}><strong>{privatePreview?`Act ${[3,6,8,10][index]} Boss`:`Boss ${index+1}`}</strong>{bosses.length?bosses.map((boss,bossIndex)=><a className="boss-preview-entry" key={`${boss.name}-${bossIndex}`} href={enemyWikiUrl(boss.name)} target="_blank" rel="noreferrer" title={`View ${boss.name} on Fandom`}>{boss.iconUrl?<img src={bossPortrait(boss.name,boss.iconUrl)} alt="" loading="lazy"/>:<span className="boss-preview-icon-fallback" aria-hidden="true">?</span>}<span>{boss.name}</span></a>):<p>No boss listed.</p>}</div>;
    })}</div>
    {difficulty==='Lunar'&&<div className="boss-preview-grid lunar-enemy-preview">{[11,12].map((act,index)=>{
      if(act===11)return <React.Suspense key={act} fallback={null}><LunarActOnePreview season={season.season} data={actDetailsData} privateEnemies={privateEnemies}/></React.Suspense>;
      if(privatePreview)return <React.Suspense key={act} fallback={null}><LunarActOnePreview season={season.season} act={12} data={actDetailsData} privateEnemies={privateEnemies}/></React.Suspense>;
      const bosses=act===12?getBossesForSlot(season,bossData,'lunar2'):season.bossStages.find(stage=>stage.act===act)?.bosses??[];
      if(!bosses.length)return null;
      return <div className="boss-preview-card" key={act}><strong>Arcana {index+1}</strong>{bosses.map((boss,bossIndex)=><a className="boss-preview-entry" key={`${boss.name}-${bossIndex}`} href={enemyWikiUrl(boss.name)} target="_blank" rel="noreferrer" title={`View ${boss.name} on Fandom`}>{boss.iconUrl?<img src={bossPortrait(boss.name,boss.iconUrl)} alt="" loading="lazy"/>:<span className="boss-preview-icon-fallback" aria-hidden="true">?</span>}<span>{boss.name}</span></a>)}</div>;
    })}</div>}
  </div>;
}
