import type {Element} from './characters';
import type {TravelerElement} from './travelerSelection';

export type Ownership = Record<string,{owned:boolean;level:number}>;
export type Setup = {difficulty:string;elements:Element[];opening:string[];guests:string[];seasonId?:number;customSeasonSelected?:boolean;privateSeasonSelected?:boolean};
export type Preparation = {recruits:string[];blessings:{name:string;levels:number}[]};
export type Plan = {stageOrder?:number[];unlockedArcana?:number[];recruitedOnly?:boolean;automatedRecruitment?:boolean;preparations?:Record<number,Preparation>;encounterChoices?:Record<string,string>;roster:string[];acts:Record<number,string[]>;borrowed?:string;travelerElement?:TravelerElement};
export type TheaterBoss = {name:string;iconUrl:string|null};
export type BossCatalogEntry = TheaterBoss & {type:'Boss'|'Local Legend'};
export type TheaterBossStage = {act:number;bosses:TheaterBoss[]};
export type BossOverrideSlot = 'boss1'|'boss2'|'boss3'|'boss4'|'lunar2';
export type TheaterSeason = {id:string;season:number;startsAt:string;endsAt:string;elements:Element[];openingCharacters:string[];specialGuests:string[];bossStages:TheaterBossStage[];charactersMissingFromRoster:string[];sourceUrl:string};
export type TheaterLineupData = {source:string;current:TheaterSeason|null;next:TheaterSeason|null;bossCatalog:BossCatalogEntry[];nextUnavailableReason:string|null;generatedAt:string|null};
export type TheaterBossData = {seasons:Record<string,Partial<Record<BossOverrideSlot,TheaterBoss[]>>>};
