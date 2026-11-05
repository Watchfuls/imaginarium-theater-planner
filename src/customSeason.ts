import {isActDetailsDataForSeason,type ActDetailsData} from './actDetailsData.ts';
import {parseSeason} from './theaterData.ts';
import type {TheaterSeason} from './plannerTypes';
import {expandActDetails} from './actDetailsStorage.ts';

export type CustomEnemyPreview={name:string;iconUrl:string;wikiUrl:string;baseResistances?:Record<string,number>};
export type CustomSeasonPackage={format:'imaginarium-theater-custom-season';version:1;season:TheaterSeason;actDetails:ActDetailsData;enemies:Record<string,CustomEnemyPreview>};

const isRecord=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const isResistanceMap=(value:unknown):value is Record<string,number>=>isRecord(value)&&Object.entries(value).every(([element,resistance])=>['Physical','Pyro','Hydro','Electro','Cryo','Dendro','Anemo','Geo'].includes(element)&&typeof resistance==='number'&&Number.isFinite(resistance));
const allowedHost=(value:string,hosts:string[])=>{
  try{
    const url=new URL(value);
    return url.protocol==='https:'&&!url.username&&!url.password&&hosts.includes(url.hostname);
  }catch{return false;}
};

export function parseCustomSeasonPackage(value:unknown):CustomSeasonPackage {
  if(!isRecord(value)||value.format!=='imaginarium-theater-custom-season'||value.version!==1)throw new Error('Unsupported custom season file format.');
  const season=parseSeason(value.season);
  if(!season||season.season<1||season.season>999)throw new Error('Custom season metadata is invalid.');
  if(season.sourceUrl&&!allowedHost(season.sourceUrl,['genshin-impact.fandom.com']))throw new Error('Custom season source must be a Fandom URL.');
  for(const stage of season.bossStages)for(const boss of stage.bosses){
    if(boss.iconUrl&&!allowedHost(boss.iconUrl,['transform.alioth.wiki','static.wikia.nocookie.net']))throw new Error(`Boss ${boss.name} has an unsupported image host.`);
  }
  const start=Date.parse(season.startsAt),end=Date.parse(season.endsAt);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw new Error('Custom season dates are invalid.');
  const actDetails=expandActDetails(value.actDetails);
  if(!isActDetailsDataForSeason(actDetails,season.season))throw new Error('Custom season Act Details are invalid.');
  if(!isRecord(value.enemies))throw new Error('Custom season enemy previews are invalid.');
  const enemies:Record<string,CustomEnemyPreview>={};
  for(const [id,enemy] of Object.entries(value.enemies)){
    if(!/^\d+$/.test(id)||!isRecord(enemy)||typeof enemy.name!=='string'||typeof enemy.iconUrl!=='string'||typeof enemy.wikiUrl!=='string')throw new Error(`Custom enemy preview ${id} is invalid.`);
    const baseResistances=enemy.baseResistances;
    if(baseResistances!==undefined&&!isResistanceMap(baseResistances))throw new Error(`Custom enemy preview ${id} has invalid base resistances.`);
    if(!allowedHost(enemy.iconUrl,['transform.alioth.wiki','static.wikia.nocookie.net']))throw new Error(`Custom enemy ${id} has an unsupported image host.`);
    if(!allowedHost(enemy.wikiUrl,['genshin-impact.fandom.com']))throw new Error(`Custom enemy ${id} has an unsupported wiki URL.`);
    enemies[id]={name:enemy.name,iconUrl:enemy.iconUrl,wikiUrl:enemy.wikiUrl,...(baseResistances?{baseResistances}: {})};
  }
  return {format:'imaginarium-theater-custom-season',version:1,season,actDetails,enemies};
}
