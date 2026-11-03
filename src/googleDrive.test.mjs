import test from 'node:test';
import assert from 'node:assert/strict';
import {PlannerDrive,DriveError} from './googleDrive.ts';

const save={ownership:{Aino:{owned:true,level:95},Mona:{owned:false,level:90}},setup:{difficulty:'Hard',elements:['Hydro'],opening:[],guests:[],seasonId:29},plan:{roster:['Aino'],acts:{1:['Aino']}},sort:'name'};

test('Drive lookup is restricted to the app folder and newest matching backup',async()=>{
  const drive=new PlannerDrive('test',async(url,options)=>{
    const query=new URL(url).searchParams;
    assert.equal(query.get('spaces'),'appDataFolder');
    assert.equal(query.get('orderBy'),'modifiedTime desc');
    assert.match(query.get('q'),/imaginarium-planner.json/);
    assert.equal(options.headers.Authorization,'Bearer test');
    return Response.json({files:[{id:'saved-file'}]});
  });
  assert.deepEqual(await drive.find(),{id:'saved-file'});
});

test('Drive creates one compact JSON in appDataFolder and updates existing files in place',async()=>{
  const requests=[];
  const drive=new PlannerDrive('test',async(url,options)=>{requests.push({url,...options});return Response.json({id:'new'});});
  await drive.save(save,null);
  assert.equal(requests[0].method,'POST');
  assert.match(requests[0].body,/"parents":\["appDataFolder"\]/);
  assert.ok(!requests[0].body.includes('Mona'));
  await drive.save(save,{id:'existing'});
  assert.equal(requests[1].method,'PATCH');
  assert.match(requests[1].url,/files\/existing\?uploadType=media/);
  assert.equal(JSON.parse(requests[1].body).ownership.Aino.level,95);
});

test('Drive validates loaded JSON before returning any restored state',async()=>{
  const drive=new PlannerDrive('test',async()=>Response.json({format:'GOOD',characters:[]}));
  await assert.rejects(()=>drive.load({id:'bad'}),/valid planner backup/);
  const large=new PlannerDrive('test',async()=>new Response('',{headers:{'Content-Length':String(3*1024*1024)}}));
  await assert.rejects(()=>large.load({id:'large'}),/too large/);
});

test('Drive distinguishes expired authorization from other API errors',async()=>{
  const expired=new PlannerDrive('test',async()=>new Response('',{status:401}));
  await assert.rejects(()=>expired.find(),error=>error instanceof DriveError&&error.status===401&&/expired/.test(error.message));
  const offline=new PlannerDrive('test',async()=>{throw new TypeError('Failed to fetch');});
  await assert.rejects(()=>offline.find(),/Failed to fetch/);
});
