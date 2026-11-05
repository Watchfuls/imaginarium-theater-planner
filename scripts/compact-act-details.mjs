import {readFile,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {compactActDetails,expandActDetails} from '../src/actDetailsStorage.ts';

// Pass explicit paths; research records and historical snapshots are not rewritten.
for(const path of process.argv.slice(2)){
  const original=await readFile(path,'utf8');
  const data=JSON.parse(original);
  const details=data.format==='imaginarium-theater-custom-season'?data.actDetails:data;
  const expanded=expandActDetails(details);
  const compact=compactActDetails(expanded);
  if(!isDeepStrictEqual(expandActDetails(compact),expanded))throw new Error(`Round-trip mismatch: ${path}`);
  const result=data.format==='imaginarium-theater-custom-season'?{...data,actDetails:compact}:compact;
  const output=JSON.stringify(result,null,2)+'\n';
  await writeFile(path,output);
  console.log(`${path}: ${Buffer.byteLength(original)} → ${Buffer.byteLength(output)} bytes; all fields preserved`);
}
