import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {expandActDetails} from '../src/actDetailsStorage.ts';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');

export function actArchiveSnapshots(data,lineups={}){
  if(!data?.seasons||typeof data.seasons!=='object'||Array.isArray(data.seasons))throw new Error('Expected act details JSON with a seasons object.');
  data=expandActDetails(data);
  return Object.entries(data.seasons).map(([season,modes])=>{
    if(!/^\d+$/.test(season)||!modes||typeof modes!=='object'||Array.isArray(modes))throw new Error('Invalid season in act details.');
    const lineup=[lineups.current,lineups.next].find(candidate=>candidate?.season===Number(season));
    const record={
      format:'imaginarium-theater-act-archive-v1',
      season:Number(season),
      ...(lineup?{seasonId:lineup.id,startsAt:lineup.startsAt,endsAt:lineup.endsAt}:{}),
      seasons:{[season]:structuredClone(modes)}
    };
    const fingerprint=createHash('sha256').update(JSON.stringify(record)).digest('hex').slice(0,16);
    return {relativePath:`season-${season}/${fingerprint}.json`,record};
  });
}

async function main(){
  const input=resolve(process.cwd(),process.argv[2]??resolve(projectRoot,'src/data/theater-act-details.json'));
  const [data,lineups]=await Promise.all([
    readFile(input,'utf8').then(JSON.parse),
    readFile(resolve(projectRoot,'src/data/theater-lineups.json'),'utf8').then(JSON.parse)
  ]);
  const archiveRoot=resolve(projectRoot,'docs/act-details-archive');
  for(const {relativePath,record} of actArchiveSnapshots(data,lineups)){
    const destination=resolve(archiveRoot,relativePath);
    await mkdir(dirname(destination),{recursive:true});
    try{
      await writeFile(destination,JSON.stringify({...record,recordedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
      console.log(`Archived ${relativePath}`);
    }catch(error){
      if(error.code!=='EEXIST')throw error;
      console.log(`Already archived ${relativePath}`);
    }
  }
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
