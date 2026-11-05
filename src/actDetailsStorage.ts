import type {ActDetailsData,ActDetailsRecord} from './actDetailsData.ts';

type ActReference={$ref:string};
export type StoredActDetailsData=Omit<ActDetailsData,'seasons'>&{
  seasons:Record<string,Record<string,Record<string,ActDetailsRecord|ActReference>>>;
};
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));

// References stay inside one season and act number. Expanded copies are independent
// so editing one difficulty never changes another difficulty's notes or objectives.
export function expandActDetails(value:unknown):ActDetailsData {
  if(!record(value)||!record(value.seasons))throw new Error('Expected Act Details seasons.');
  const seasons:ActDetailsData['seasons']={};
  for(const [season,modes] of Object.entries(value.seasons)){
    if(!record(modes))throw new Error('Invalid Act Details difficulties.');
    seasons[season]={};
    for(const [mode,acts] of Object.entries(modes)){
      if(!record(acts))throw new Error('Invalid Act Details acts.');
      seasons[season][mode]={};
      for(const act of Object.keys(acts)){
        const visiting=new Set<string>();
        const resolve=(difficulty:string):ActDetailsRecord=>{
          if(visiting.has(difficulty))throw new Error(`Circular Act Details reference: ${season}/${difficulty}/${act}`);
          visiting.add(difficulty);
          const modeActs=modes[difficulty];
          const entry=record(modeActs)?modeActs[act]:undefined;
          if(!record(entry))throw new Error(`Missing Act Details reference: ${season}/${difficulty}/${act}`);
          if('$ref' in entry){
            if(Object.keys(entry).length!==1||typeof entry.$ref!=='string')throw new Error('Invalid Act Details reference.');
            const parts=entry.$ref.split('/');
            if(parts.length!==2||parts[1]!==act)throw new Error('Act Details references must use the same act number.');
            return resolve(parts[0]);
          }
          if(!Array.isArray(entry.encounters))throw new Error('Invalid Act Details encounters.');
          return structuredClone(entry) as ActDetailsRecord;
        };
        seasons[season][mode][act]=resolve(mode);
      }
    }
  }
  return {...value,seasons} as ActDetailsData;
}

function canonical(value:unknown):string {
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(record(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function compactActDetails(value:ActDetailsData):StoredActDetailsData {
  const expanded=expandActDetails(value);
  const seasons:StoredActDetailsData['seasons']={};
  for(const [season,modes] of Object.entries(expanded.seasons)){
    seasons[season]={};
    const seen=new Map<string,string>();
    for(const [mode,acts] of Object.entries(modes)){
      seasons[season][mode]={};
      for(const [act,details] of Object.entries(acts)){
        const signature=`${act}:${canonical(details)}`;
        const previous=seen.get(signature);
        seasons[season][mode][act]=previous?{$ref:previous}:details;
        if(!previous)seen.set(signature,`${mode}/${act}`);
      }
    }
  }
  return {...expanded,seasons};
}
