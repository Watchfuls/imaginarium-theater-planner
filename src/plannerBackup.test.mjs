import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlannerBackup,parsePlannerBackup,mergePlanHistory} from './plannerBackup.ts';

const save=()=>({ownership:{Aino:{owned:true,level:95},Mona:{owned:false,level:90},Itto:{owned:false,level:80}},setup:{difficulty:'Hard',elements:['Hydro','Geo','Electro'],opening:['Aino'],guests:['Mona'],seasonId:29},plan:{roster:['Aino','Mona'],acts:{1:['Aino','','Mona','']},borrowed:'Mona',travelerElement:'None',encounterChoices:{'29-Hard-1':'choice-2'}},sort:'game'});

test('backups preserve uploaded and private season identity in current and historical plans',()=>{
  for(const selection of [{customSeasonSelected:true,privateSeasonSelected:false},{customSeasonSelected:false,privateSeasonSelected:true}]){
    const original=save();
    Object.assign(original.setup,selection);
    original.history=[{setup:structuredClone(original.setup),plan:structuredClone(original.plan)}];
    const restored=parsePlannerBackup(JSON.parse(JSON.stringify(createPlannerBackup(original))));
    assert.deepEqual(restored.setup,original.setup);
    assert.deepEqual(restored.history,original.history);
  }
  for(const selection of [{customSeasonSelected:'true'},{privateSeasonSelected:1},{customSeasonSelected:true,privateSeasonSelected:true}]){
    const backup=createPlannerBackup(save());Object.assign(backup.setup,selection);
    assert.throws(()=>parsePlannerBackup(backup));
  }
});

test('compact backup preserves personal choices and omits default unowned characters and unrelated data',()=>{
  const original=save();
  original.setup.enemyDatabase='not player data';
  original.plan.inventory={artifacts:['unneeded']};
  const backup=createPlannerBackup(original);
  assert.equal(backup.ownership.Mona,undefined);
  assert.deepEqual(backup.ownership.Itto,{owned:false,level:80});
  assert.equal(backup.setup.enemyDatabase,undefined);
  assert.equal(backup.plan.inventory,undefined);
  const restored=parsePlannerBackup(JSON.parse(JSON.stringify(backup)));
  assert.deepEqual(restored.plan,save().plan);
  assert.deepEqual(restored.setup,save().setup);
  assert.equal(restored.ownership.Aino.level,95);
  assert.equal(restored.sort,'game');
});

test('backup handles sparse assignment slots and default sort',()=>{
  const original=save();original.plan.acts={1:[,,'Aino']};original.sort='name';
  const backup=createPlannerBackup(original);
  assert.equal(backup.sort,undefined);
  assert.deepEqual(parsePlannerBackup(JSON.parse(JSON.stringify(backup))).plan.acts[1],['','','Aino']);
});

test('invalid backups and unsupported versions are rejected',()=>{
  for(const change of [value=>({...value,version:2}),value=>({...value,format:'GOOD'}),value=>({...value,ownership:{Aino:{owned:true,level:101}}}),value=>({...value,plan:{...value.plan,acts:{1:'bad'}}}),value=>({...value,setup:{...value.setup,difficulty:'missing'}}),value=>({...value,history:[{setup:{},plan:{}}]})]){
    assert.throws(()=>parsePlannerBackup(change(createPlannerBackup(save()))));
  }
});

test('unavailable seasons survive backups as historical selections without bundled encounter data',()=>{
  const historical={setup:{...save().setup,seasonId:1},plan:save().plan};
  const original={...save(),history:mergePlanHistory([historical],[historical])};
  const restored=parsePlannerBackup(JSON.parse(JSON.stringify(createPlannerBackup(original))));
  assert.equal(restored.history.length,1);
  assert.deepEqual(restored.history[0],historical);
});
