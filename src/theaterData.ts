import {CHARACTERS,ELEMENTS,type Element} from './characters.ts';
import type {TheaterBossStage,TheaterSeason,TheaterLineupData,TheaterBossData,TheaterBoss,BossCatalogEntry,BossOverrideSlot} from './plannerTypes';
import rawLineupData from './data/theater-lineups.json' with {type:'json'};
import rawBossData from './data/theater-bosses.json' with {type:'json'};

export function parseSeason(value:unknown):TheaterSeason|null {
  if(value===null)return null;
  if(!value||typeof value!=='object')throw new Error('Invalid generated Theater season data.');
  const season=value as Record<string,unknown>;
  if(typeof season.id!=='string'||!Number.isInteger(season.season)||typeof season.startsAt!=='string'||typeof season.endsAt!=='string'||!Array.isArray(season.elements)||!season.elements.every(element=>ELEMENTS.includes(element as Element))||!Array.isArray(season.openingCharacters)||!season.openingCharacters.every(name=>typeof name==='string')||!Array.isArray(season.specialGuests)||!season.specialGuests.every(name=>typeof name==='string')||!Array.isArray(season.bossStages)||!season.bossStages.every(stage=>!!stage&&typeof stage==='object'&&Number.isInteger((stage as Record<string,unknown>).act)&&Array.isArray((stage as Record<string,unknown>).bosses)&&(stage as {bosses:unknown[]}).bosses.every(boss=>!!boss&&typeof boss==='object'&&typeof (boss as Record<string,unknown>).name==='string'&&((boss as Record<string,unknown>).iconUrl===null||typeof (boss as Record<string,unknown>).iconUrl==='string')))||typeof season.sourceUrl!=='string')throw new Error('Generated Theater season data has an invalid shape.');
  const openingCharacters=season.openingCharacters as string[];
  const specialGuests=season.specialGuests as string[];
  return {id:season.id,season:season.season as number,startsAt:season.startsAt,endsAt:season.endsAt,elements:season.elements as Element[],openingCharacters,specialGuests,bossStages:season.bossStages as TheaterBossStage[],charactersMissingFromRoster:[...openingCharacters,...specialGuests].filter(name=>!CHARACTERS.some(character=>character.name===name)),sourceUrl:season.sourceUrl};
}
export function parseLineupData(value:unknown):TheaterLineupData {
  if(!value||typeof value!=='object')throw new Error('Generated Theater lineup data is missing.');
  const data=value as Record<string,unknown>;
  if(typeof data.source!=='string'||(data.nextUnavailableReason!==null&&typeof data.nextUnavailableReason!=='string')||(data.generatedAt!==null&&typeof data.generatedAt!=='string')||!Array.isArray(data.bossCatalog)||!data.bossCatalog.every(boss=>!!boss&&typeof boss==='object'&&typeof (boss as Record<string,unknown>).name==='string'&&['Boss','Local Legend'].includes(String((boss as Record<string,unknown>).type))&&((boss as Record<string,unknown>).iconUrl===null||typeof (boss as Record<string,unknown>).iconUrl==='string')))throw new Error('Generated Theater lineup metadata has an invalid shape.');
  return {source:data.source,current:parseSeason(data.current),next:parseSeason(data.next),bossCatalog:data.bossCatalog as BossCatalogEntry[],nextUnavailableReason:data.nextUnavailableReason,generatedAt:data.generatedAt};
}
export function parseBossData(value:unknown):TheaterBossData {
  if(!value||typeof value!=='object'||!('seasons' in value)||(value as {seasons?:unknown}).seasons===null||typeof (value as {seasons?:unknown}).seasons!=='object')throw new Error('Theater boss data has an invalid shape.');
  const seasons=(value as {seasons:Record<string,unknown>}).seasons;
  const parsed: TheaterBossData['seasons']={};
  const slots:BossOverrideSlot[]=['boss1','boss2','boss3','boss4','lunar2'];
  for(const [season,overrides] of Object.entries(seasons)){
    if(!/^\d+$/.test(season)||!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw new Error('Theater boss override has an invalid season or slot map.');
    const parsedSlots:Partial<Record<BossOverrideSlot,TheaterBoss[]>>={};
    for(const [slot,bosses] of Object.entries(overrides)){
      if(!slots.includes(slot as BossOverrideSlot)||!Array.isArray(bosses)||!bosses.every(boss=>!!boss&&typeof boss==='object'&&typeof (boss as Record<string,unknown>).name==='string'&&((boss as Record<string,unknown>).iconUrl===null||typeof (boss as Record<string,unknown>).iconUrl==='string')))throw new Error('Theater boss override has an invalid slot or boss list.');
      parsedSlots[slot as BossOverrideSlot]=bosses as TheaterBoss[];
    }
    parsed[season]=parsedSlots;
  }
  return {seasons:parsed};
}
export const theaterLineups=parseLineupData(rawLineupData);
export const theaterBosses=parseBossData(rawBossData);
export const availableSeasons=[theaterLineups.current,theaterLineups.next].filter((season):season is TheaterSeason=>season!==null);
export function getDefaultBossesForSlot(season:TheaterSeason,slot:BossOverrideSlot):TheaterBoss[]{
  const act=slot==='boss1'?3:slot==='boss2'?6:slot==='boss3'?8:slot==='boss4'?10:12;
  const stage=season.bossStages.find(candidate=>candidate.act===act)
    ??(slot==='boss4'?season.bossStages.find(candidate=>candidate.act===8):undefined);
  return stage?.bosses??[];
}
export function getBossesForSlot(season:TheaterSeason,data:TheaterBossData,slot:BossOverrideSlot):TheaterBoss[]{
  const overrides=data.seasons[String(season.season)];
  const override=overrides?.[slot];
  if(override)return override;
  const generated=getDefaultBossesForSlot(season,slot);
  if(slot==='boss3'){
    const finalBosses=overrides?.boss4??getDefaultBossesForSlot(season,'boss4');
    const sameBosses=generated.length===finalBosses.length&&generated.every((boss,index)=>boss.name.toLocaleLowerCase()===finalBosses[index]?.name.toLocaleLowerCase());
    if(sameBosses)return [];
  }
  return generated;
}
