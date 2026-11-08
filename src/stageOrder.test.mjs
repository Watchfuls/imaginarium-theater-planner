import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStageOrder,validStageOrder,moveArcana,moveArcanaPlan} from './stageOrder.ts';
import {blessingLevel,recruitedBy} from './actPreparationData.ts';

test('Arcana stages stay after their unlock act and before Act 10',()=>{
  for(const [stage,before] of [[11,1],[11,3],[12,3],[12,6],[1,7],[11,99]]){
    assert.equal(moveArcana(defaultStageOrder,stage,before),defaultStageOrder);
  }
  for(const [stage,before] of [[11,4],[11,10],[12,7],[12,10],[11,12]]){
    assert.equal(validStageOrder(moveArcana(defaultStageOrder,stage,before)),true);
  }
  assert.equal(validStageOrder([...defaultStageOrder.slice(0,-1),11]),false);
  assert.equal(validStageOrder([1,2,3,4,5,6,7,8,9,10,11,12]),false);
});

test('moving an unlocked Arcana clears only its own team and preparation',()=>{
  const plan={roster:['Razor'],acts:{3:['Yelan'],11:['Razor'],12:['Beidou']},unlockedArcana:[11],preparations:{11:{recruits:['Razor'],blessings:[{name:'Electro-Hydro',levels:2}]},12:{recruits:['Beidou'],blessings:[]}}};
  const original=structuredClone(plan);
  const moved=moveArcanaPlan(plan,11,8);
  assert.deepEqual(moved.stageOrder,[1,2,3,4,5,6,12,7,11,8,9,10]);
  assert.deepEqual(moved.acts,{3:['Yelan'],11:[],12:['Beidou']});
  assert.deepEqual(moved.preparations,{12:plan.preparations[12]});
  assert.equal(moveArcanaPlan(plan,11,3),plan);
  assert.equal(moveArcanaPlan(plan,11,4),plan,'dropping back in the same place keeps the plan');
  assert.equal(moveArcanaPlan(plan,12,9),plan,'locked Arcana stays put');
  assert.deepEqual(plan,original);
});

test('recruitment and blessings follow the displayed stage order',()=>{
  const preparations={4:{recruits:['Razor'],blessings:[{name:'Electro-Hydro',levels:2}]},11:{recruits:['Beidou'],blessings:[{name:'Electro-Hydro',levels:1}]}};
  assert.equal(recruitedBy(preparations,11,[]).has('Razor'),false);
  const order=moveArcana(defaultStageOrder,11,7);
  assert.equal(recruitedBy(preparations,11,[],order).has('Razor'),true);
  assert.equal(recruitedBy(preparations,6,[],order).has('Beidou'),false);
  assert.equal(blessingLevel(preparations,11,'Electro-Hydro',order,false),2);
  assert.equal(blessingLevel(preparations,11,'Electro-Hydro',order),3);
  assert.equal(blessingLevel(preparations,7,'Electro-Hydro',order),3);
});
