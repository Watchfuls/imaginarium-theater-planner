import type {ActDetailsData,EncounterDetails} from './actDetailsData';

export function encounterEnemyIds(encounter:EncounterDetails):string[] {
  if(encounter.enemyIds)return [...new Set(encounter.enemyIds)];
  return [...new Set((encounter.sources??[]).flatMap(source=>{
    const id=source.url.match(/\/gi\/monster\/(\d+)(?:[?#].*)?$/)?.[1];
    return id?[id]:[];
  }))];
}

export function siteActDetails(data:ActDetailsData):ActDetailsData {
  return {seasons:Object.fromEntries(Object.entries(data.seasons).map(([season,modes])=>[
    season,Object.fromEntries(Object.entries(modes).map(([mode,acts])=>[
      mode,Object.fromEntries(Object.entries(acts).map(([act,record])=>[
        act,{...(record.level!==undefined?{level:record.level}:{}),requirements:playerActRequirements(record.requirements),notes:record.notes,encounters:record.encounters.map(encounter=>({
          name:playerDetailText(encounter.name),enemyIds:encounterEnemyIds(encounter),enemies:playerEnemyNotes(encounter.enemies),
          ...(encounter.bountyEnemyIds?{bountyEnemyIds:encounter.bountyEnemyIds}:{}),
          resistances:resistanceExceptions(encounter.resistances),requirements:playerDetailText(encounter.requirements),
          notes:encounter.notes,mechanics:playerDetailText(encounter.mechanics??''),stageEffects:playerDetailText(encounter.stageEffects??'')
        }))}
      ]))
    ]))
  ]))};
}

// Retain the full curation text in storage and the editor; show gameplay text to players.
export function playerDetailText(value:string):string {
  return value
    .replace(/(\d)[ \t]+(s|ms|min)\b/g,'$1$2')
    .replace(/\b(\d+)s\b/g,(text,seconds)=>Number(seconds)>60?`${Math.floor(Number(seconds)/60)}m${Number(seconds)%60?` ${Number(seconds)%60}s`:''}`:text)
    .replace(/^Current enemy types \(Alioth:?\)?\s*:\s*/gm,'')
    .replace(/^Current enemy types \(Alioth:\s*/gm,'')
    .replace(/^.*(?:The graphic says only|The graphic does not explicitly|The graphic depicts this|Artwork groups|These higher-level graphic counts).*$/gm,'')
    .replace(/^Alioth lists enemy types[^\n]*$/gm,'')
    .replace(/\s*The caption does not explicitly[^\n]*/g,'')
    .replace(/\s*This threshold is not printed in the graphic\./g,'')
    .replace(/\s*Sources disagree on[^.]*\./g,'')
    .replace(/\s*Enemy types are confirmed by Alioth[^.]*\./g,'')
    .replace(/\s*\(graphic-sourced\)/g,'')
    .replace(/\s*\(graphic\)/g,'')
    .replace(/\s*\((?:inferred[^)]*|same-act historical inference|provisional[^)]*)\)/gi,' (estimated)')
    .replace(/^Inferred from [^:]+:\s*/gm,'Estimated: ')
    .replace(/^Inferred stage effects:\s*/gm,'Estimated: ')
    .replace(/^Current Alioth description:\s*/gm,'')
    .replace(/Active enemies in the graphic:/g,'Active enemies:')
    .replace(/Enemy HP in the depicted profile:/g,'Enemy HP:')
    .replace(/^Enemy HP:[^\n]*(?:\n|$)/gm,'')
    .replace(/; Alioth identifies /g,': ')
    .replace(/\bAlioth (?:final-boss )?target:\s*/g,'Target time: ')
    .replace(/ Its interpretation as the star timer is inferred;[^\n]*/g,' (estimated).')
    .replace(/ no matching prior Act 8 encounter supports a deadline\./g,'')
    .replace(/\breference\s*·/gi,'·')
    .replace(/\n[ \t]+/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

export function playerEnemyNotes(value:string):string {
  // Portraits already provide the exact type names; this block supplies spawn details.
  const notes=value.startsWith('Current enemy types')?value.split('\n\n').slice(1).join('\n\n'):value;
  const cleaned=playerDetailText(notes);
  return /^Active enemies: [^.]+\.$/.test(cleaned)?'':cleaned;
}

export function playerActRequirements(value:string):string {
  if(/^(?:Current-season reference:|Historically supported |No sufficiently supported |Enemy types are from Alioth|November lineup reference|This difficulty['’]s November)/.test(value))return '';
  return playerDetailText(value);
}

export function resistanceExceptions(value:string):string {
  return value.split('\n').map(line=>{
    const match=line.match(/^(.+?:\s*)(?=(?:Physical|Pyro|Hydro|Electro|Cryo|Dendro|Anemo|Geo|all damage types)\b)(.*)$/);
    const label=match?.[1]??'';
    const body=match?.[2]??line;
    const sentences=body.split(/\.\s+/).map(sentence=>{
      const state=sentence.match(/^([^:]+:\s*)(.*)$/);
      const heading=state?.[1]??'';
      const clauses=(state?.[2]??sentence).replace(/\.$/,'').split(';').map(part=>part.trim())
        .filter(part=>part&&!/\s10%$/.test(part));
      return clauses.length?heading+clauses.join('; '):'';
    }).filter(Boolean);
    return sentences.length?label+sentences.join('. ')+'.':'';
  }).filter(Boolean).join('\n');
}

export function enemyResistanceDetails(value:string,names:string[]):{byEnemy:Record<string,string>;notes:string} {
  const byEnemy:Record<string,string>={};
  const notes:string[]=[];
  const ordered=[...names].sort((a,b)=>b.length-a.length);
  for(const line of resistanceExceptions(value).split('\n').filter(Boolean)){
    const name=ordered.find(name=>line.startsWith(name+': '));
    if(name)byEnemy[name]=[byEnemy[name],line.slice(name.length+2)].filter(Boolean).join('\n');
    else notes.push(line);
  }
  return {byEnemy,notes:notes.join('\n')};
}

export function groupedResistances(byEnemy:Record<string,string>,names:string[],baseByEnemy:Record<string,Record<string,number>>={}):{shared:string;individual:Record<string,string>} {
  const elements=['Physical','Pyro','Hydro','Electro','Cryo','Dendro','Anemo','Geo'];
  type Entry={state:string;element:string;value:string};
  const parse=(text:string):Entry[]=>text.split(/\.(?:\s+|$)/).flatMap(sentence=>{
    if(!sentence)return [];
    const match=sentence.match(/^([^:]+):\s*(.*)$/);
    const state=match?.[1]??'';
    return (match?.[2]??sentence).split(';').flatMap(clause=>{
      const part=clause.trim().match(/^(.*?)\s+(-?\d+(?:\.\d+)?%|immune)$/);
      if(!part)return [{state,element:clause.trim(),value:''}];
      const types=part[1]==='all damage types'?elements:part[1].split(',').map(type=>type.trim());
      return types.map(element=>({state,element,value:part[2]}));
    });
  });
  const key=(entry:Entry)=>JSON.stringify(entry);
  const entries=Object.fromEntries(names.map(name=>{
    const parsed=parse(byEnemy[name]??'');
    // Consecrated Beasts enter these encounters in their enhanced form.
    const enhanced=parsed.some(entry=>entry.state==='Consecrated Enhance');
    return [name,enhanced?parsed.filter(entry=>entry.state!=='').map(entry=>entry.state==='Consecrated Enhance'?{...entry,state:''}:entry):parsed];
  }));
  const profile=(name:string)=>JSON.stringify([entries[name].map(key).sort(),elements.map(element=>baseByEnemy[name]?.[element]??null)]);
  const allMatch=names.length>1&&names.every(name=>profile(name)===profile(names[0]));
  const common=allMatch?(entries[names[0]]??[]):[];
  const sharedKeys=new Set(common.map(key));
  const format=(items:Entry[],knownBase?:Record<string,number>)=>{
    const states=new Map<string,Map<string,string[]>>();
    for(const {state,element,value} of items){
      if(!states.has(state))states.set(state,new Map());
      const values=states.get(state)!;
      values.set(value,[...(values.get(value)??[]),element]);
    }
    const numericState=(state:string)=>{
      const entries=items.filter(entry=>entry.state===state&&elements.includes(entry.element)&&/^-?\d+(?:\.\d+)?%$/.test(entry.value));
      const result=new Map(entries.map(entry=>[entry.element,parseFloat(entry.value)]));
      return result.size===elements.length?result:null;
    };
    const base=numericState('')??(knownBase&&elements.every(element=>Number.isFinite(knownBase[element]))?new Map(elements.map(element=>[element,knownBase[element]])):null);
    if(base)for(const entry of items.filter(entry=>entry.state===''&&/^-?\d+(?:\.\d+)?%$/.test(entry.value)))base.set(entry.element,parseFloat(entry.value));
    const summarize=(groups:[string,string[]][],complete:boolean,signed=false)=>{
      const baseline=complete?groups.find(([,types])=>types.length>=5&&types.every(type=>elements.includes(type))):undefined;
      const valueText=(value:string)=>signed&&parseFloat(value)>0?'+'+value:value;
      return baseline
        ? [`All RES ${valueText(baseline[0])}`,...groups.filter(group=>group!==baseline).map(([value,types])=>{
          const exception=signed?(Math.round((parseFloat(value)-parseFloat(baseline[0]))*1000)/1000)+'%':value;
          return types.join(', ')+' '+valueText(exception)+(signed?' extra':'');
        })].join('; ')
        : groups.map(([value,types])=>types.join(', ')+(value?' '+valueText(value):'')).join('; ');
    };
    return [...states].map(([state,values])=>{
      const current=state?numericState(state):null;
      if(base&&current){
        const deltas=elements.map(element=>Math.round((current.get(element)!-base.get(element)!)*1000)/1000);
        const changes=new Map<string,string[]>();
        elements.forEach((element,index)=>{const value=deltas[index]+'%';changes.set(value,[...(changes.get(value)??[]),element]);});
        const label=state==='Weak'?'Weakened':state==='Consecrated Enhance'?'Enhanced':state;
        return `${label}: ${summarize([...changes],true,true)}`;
      }
      const groups=[...values];
      const complete=elements.every(element=>groups.some(([,types])=>types.includes(element)));
      const text=summarize(groups,complete);
      return (state?state+': ':'')+text;
    }).join('\n');
  };
  return {shared:format(common,baseByEnemy[names[0]]),individual:Object.fromEntries(names.map(name=>[name,format(entries[name].filter(entry=>!sharedKeys.has(key(entry))),baseByEnemy[name])]).filter(([,text])=>text))};
}
