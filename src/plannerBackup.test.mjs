import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlannerBackup,parsePlannerBackup,mergePlanHistory} from './plannerBackup.ts';
import {defaultStageOrder,moveArcana} from './stageOrder.ts';

const save=()=>({ownership:{Aino:{owned:true,level:95},Mona:{owned:false,level:90},Itto:{owned:false,level:80}},setup:{difficulty:'Hard',elements:['Hydro','Geo','Electro'],opening:['Aino'],guests:['Mona'],seasonId:29},plan:{roster:['Aino','Mona'],acts:{1:['Aino','','Mona','']},borrowed:'Mona',travelerElement:'None',encounterChoices:{'29-Hard-1':'choice-2'}},sort:'game'});

test('Arcana positions, locks and preparations round-trip and reject invalid orders',()=>{
  const original=save();
  original.setup.difficulty='Lunar';
  original.plan.stageOrder=moveArcana(defaultStageOrder,11,8);
  original.plan.unlockedArcana=[11];
  original.plan.preparations={11:{recruits:['Mona'],blessings:[{name:'Electro-Hydro',levels:2}]}};
  assert.deepEqual(parsePlannerBackup(createPlannerBackup(original)).plan,original.plan);
  for(const order of [[1,2,3,4,5,6,7,8,9,10,11,12],[],[...defaultStageOrder,11]]){
    const backup=createPlannerBackup(original);backup.plan.stageOrder=order;
    assert.throws(()=>parsePlannerBackup(backup));
  }
  const backup=createPlannerBackup(original);backup.plan.unlockedArcana=[1];
  assert.throws(()=>parsePlannerBackup(backup));
});

test('recruitment and blessing notes survive backups and reject invalid upgrade amounts',()=>{
  const original=save();
  original.plan.preparations={1:{recruits:['Mona'],blessings:[]},2:{recruits:[],blessings:[{name:'Electro-Charged',levels:2}]}};
  assert.deepEqual(parsePlannerBackup(JSON.parse(JSON.stringify(createPlannerBackup(original)))).plan,original.plan);
  original.plan.recruitedOnly=true;
  assert.equal(parsePlannerBackup(createPlannerBackup(original)).plan.recruitedOnly,true);
  for(const levels of [0,-1,1.5,'2']){
    const backup=createPlannerBackup(original);
    backup.plan.preparations[2].blessings[0].levels=levels;
    assert.throws(()=>parsePlannerBackup(backup));
  }
});

test('backups preserve repeated element and unallocated slot placeholders',()=>{
  const original=save();
  original.plan.acts={1:['placeholder:Electro','placeholder:Electro','placeholder:unallocated','Aino']};
  assert.deepEqual(parsePlannerBackup(JSON.parse(JSON.stringify(createPlannerBackup(original)))).plan,original.plan);
});

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
