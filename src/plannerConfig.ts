import {CHARACTERS} from './characters.ts';

export const isTraveler=(name:string)=>name.endsWith(' Traveler');
export const enemyWikiUrl=(name:string)=>`https://genshin-impact.fandom.com/wiki/${encodeURIComponent(name.replaceAll(' ','_'))}`;
export const LEVEL_OPTIONS=[10,20,30,40,50,60,70,80,90,95,100] as const;
export const travelerNames=CHARACTERS.filter(character=>isTraveler(character.name)).map(character=>character.name);
export const difficulties:Record<string,{acts:number;lunarActs?:number;minimum:number;cap:number;minimumLevel:number}> = {'Easy':{acts:3,minimum:8,cap:10,minimumLevel:60},'Normal':{acts:6,minimum:12,cap:14,minimumLevel:60},'Hard':{acts:8,minimum:16,cap:20,minimumLevel:70},'Visionary':{acts:10,minimum:22,cap:26,minimumLevel:70},'Lunar':{acts:10,lunarActs:2,minimum:28,cap:32,minimumLevel:70}};
export const stageObjectives:Record<string,Record<number,string>>={
  Normal:{4:'Monolith Defense'},
  Hard:{4:'Monolith Defense'},
  Visionary:{4:'Monolith Defense',9:'Defeat Bounties'},
  Lunar:{4:'Monolith Defense',9:'Defeat Bounties'}
};
