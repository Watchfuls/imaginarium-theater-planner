import test from 'node:test';
import assert from 'node:assert/strict';
import {clearUnrecruitedAssignments} from './recruitmentPlan.ts';
import {defaultStageOrder,moveArcanaPlan} from './stageOrder.ts';

test('moving Arcana removes assignments that depended on its deleted recruitment plan',()=>{
  const plan={roster:['Jahoda'],recruitedOnly:true,unlockedArcana:[11],acts:{6:['Flins','Jahoda'],11:['Jahoda'],12:['Jahoda']},preparations:{11:{recruits:['Jahoda'],blessings:[]}}};
  const next=moveArcanaPlan(plan,11,9);
  const cleaned=clearUnrecruitedAssignments(next,['Flins'],next.stageOrder);
  assert.deepEqual(cleaned.acts,{6:['Flins',''],11:[],12:['']});
  assert.deepEqual(plan.acts[6],['Flins','Jahoda']);
});
test('saved and edited plans remove characters unavailable at their assigned stage',()=>{
  const plan={roster:['Razor'],recruitedOnly:true,acts:{3:['Razor','placeholder:Electro'],6:['Razor'],11:['Razor']},preparations:{5:{recruits:['Razor'],blessings:[]}}};
  const cleaned=clearUnrecruitedAssignments(plan,[],defaultStageOrder);
  assert.deepEqual(cleaned.acts,{3:['','placeholder:Electro'],6:['Razor'],11:['']});
  assert.equal(clearUnrecruitedAssignments(cleaned,[],defaultStageOrder),cleaned);
  const unrestricted={...plan,recruitedOnly:false};
  assert.equal(clearUnrecruitedAssignments(unrestricted,[],defaultStageOrder),unrestricted);
});
