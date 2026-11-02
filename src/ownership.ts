import {CHARACTERS,ELEMENTS} from './characters.ts';
import {LEVEL_OPTIONS,travelerNames} from './plannerConfig.ts';
import type {Ownership} from './plannerTypes';

export function parseGoodOwnership(value:unknown):{characters:Map<string,number>;unknownKeys:string[]} {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('The file must contain a GOOD JSON object.');
  const data=value as Record<string,unknown>;
  if(data.format!=='GOOD'||!Array.isArray(data.characters))throw new Error('Expected a GOOD export with a characters array.');
  const keyToNames=new Map<string,string[]>();
  const addKey=(key:string,name:string)=>{
    const normalized=key.replace(/[^a-z0-9]/gi,'').toLocaleLowerCase();
    keyToNames.set(normalized,[...(keyToNames.get(normalized)??[]),name]);
  };
  for(const character of CHARACTERS)addKey(character.name,character.name);
  for(const [key,name] of Object.entries({
    AratakiItto:'Itto',
    KaedeharaKazuha:'Kazuha',
    KamisatoAyaka:'Ayaka',
    KamisatoAyato:'Ayato',
    KujouSara:'Sara',
    SangonomiyaKokomi:'Kokomi',
    ShikanoinHeizou:'Heizou',
    YumemizukiMizuki:'Mizuki'
  }))addKey(key,name);
  for(const element of ELEMENTS)addKey(`Traveler${element}`,`${element} Traveler`);
  keyToNames.set('traveler',travelerNames);

  const characters=new Map<string,number>();
  const unknownKeys:string[]=[];
  for(const entry of data.characters){
    if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error('A character entry is invalid.');
    const character=entry as Record<string,unknown>;
    if(typeof character.key!=='string'||typeof character.level!=='number'||!Number.isInteger(character.level)||character.level<1||character.level>90)throw new Error('Every character must have a key and a level from 1 to 90.');
    const names=keyToNames.get(character.key.replace(/[^a-z0-9]/gi,'').toLocaleLowerCase());
    if(!names){unknownKeys.push(character.key);continue;}
    const level=Math.max(10,Math.floor(character.level/10)*10);
    for(const name of names)characters.set(name,Math.max(characters.get(name)??0,level));
  }
  if(characters.size===0)throw new Error('No characters in the file match this planner roster.');
  return {characters,unknownKeys};
}
export function normalizeOwnership(data:unknown):Ownership {
  if(!data||typeof data!=='object'||Array.isArray(data))return {};
  const ownership=Object.fromEntries(Object.entries(data).map(([name,value])=>{
    const saved=value&&typeof value==='object'?value as {owned?:unknown;level?:unknown;level70?:unknown}:{};
    const level=LEVEL_OPTIONS.includes(saved.level as typeof LEVEL_OPTIONS[number])?saved.level as number:saved.level70===false?60:90;
    return [name,{owned:saved.owned===true,level}];
  })) as Ownership;
  const travelerLevel=travelerNames.map(name=>ownership[name]?.level).find((level):level is number=>level!==undefined)??90;
  for(const name of travelerNames)ownership[name]={owned:ownership[name]?.owned??false,level:travelerLevel};
  return ownership;
}
