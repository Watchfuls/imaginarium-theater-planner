import test from 'node:test';
import assert from 'node:assert/strict';
import {positionRecruitmentAutomatically,advanceRecruitmentForMove,clearUnrecruitedAssignments} from './recruitmentPlan.ts';
import {defaultStageOrder,moveArcanaPlan} from './stageOrder.ts';

test('automated recruitment follows first use, removes unused recruits, and keeps blessings',()=>{
  const blessings=[{name:'Electro-Hydro',levels:2}];
  const plan={automatedRecruitment:true,recruitedOnly:true,roster:['Candace','Mona'],acts:{8:['Candace','Zhongli','placeholder:Hydro'],10:['Candace','Mona']},preparations:{1:{recruits:['Candace','Barbara'],blessings},9:{recruits:['Mona'],blessings:[]}}};
  const next=positionRecruitmentAutomatically(plan,['Zhongli'],defaultStageOrder);
  assert.deepEqual(next.preparations[1],{recruits:[],blessings});
  assert.deepEqual(next.preparations[8].recruits,['Candace']);
  assert.deepEqual(next.preparations[9].recruits,[]);
  assert.deepEqual(next.preparations[10].recruits,['Mona']);
  assert.equal(positionRecruitmentAutomatically(next,['Zhongli'],defaultStageOrder),next);
  const moved=clearUnrecruitedAssignments({...next,acts:{10:['Candace','Mona']}},['Zhongli'],defaultStageOrder);
  assert.deepEqual(moved.preparations[8].recruits,[]);
  assert.deepEqual(moved.preparations[10].recruits,['Candace','Mona']);
  assert.deepEqual(moved.acts[10],['Candace','Mona']);
  assert.deepEqual(plan.preparations[1].recruits,['Candace','Barbara']);
  const manual={...plan,automatedRecruitment:false};
  assert.equal(positionRecruitmentAutomatically(manual,[],defaultStageOrder),manual);
});

test('automated recruitment uses the displayed stage order and ignores inactive acts',()=>{
  const plan={automatedRecruitment:true,roster:['Candace'],acts:{4:['Candace'],11:['Candace'],12:['Mona']}};
  assert.deepEqual(positionRecruitmentAutomatically(plan,[],defaultStageOrder).preparations[11].recruits,['Candace']);
  const reordered=[1,2,3,4,5,11,6,12,7,8,9,10];
  assert.deepEqual(positionRecruitmentAutomatically(plan,[],reordered).preparations[4].recruits,['Candace']);
  const normal=positionRecruitmentAutomatically(plan,[],[1,2,3,4,5,6,7,8]);
  assert.equal(normal.preparations[12],undefined);
});

test('moving Candace from Act 10 to Act 8 advances recruitment and preserves blessings',()=>{
  const blessings=[{name:'Electro-Hydro',levels:2}];
  const plan={roster:['Candace'],recruitedOnly:true,acts:{10:['Candace']},preparations:{10:{recruits:['Candace','Mona'],blessings},8:{recruits:['Razor'],blessings:[]}}};
  const next=advanceRecruitmentForMove(plan,'Candace',8,[],defaultStageOrder);
  assert.deepEqual(next.preparations[8].recruits,['Razor','Candace']);
  assert.deepEqual(next.preparations[10],{recruits:['Mona'],blessings});
  assert.deepEqual(plan.preparations[10].recruits,['Candace','Mona']);
  assert.equal(advanceRecruitmentForMove(next,'Candace',10,[],defaultStageOrder),next);
  assert.equal(advanceRecruitmentForMove(plan,'Mona',8,['Mona'],defaultStageOrder),plan);
  assert.equal(advanceRecruitmentForMove(plan,'Barbara',8,[],defaultStageOrder),plan);
});

test('advancing recruitment follows displayed Arcana order',()=>{
  const plan={roster:['Candace'],recruitedOnly:true,acts:{10:['Candace']},preparations:{8:{recruits:['Candace'],blessings:[]}}};
  const order=[1,2,3,4,5,6,7,11,8,12,9,10];
  assert.deepEqual(advanceRecruitmentForMove(plan,'Candace',11,[],order).preparations[11].recruits,['Candace']);
});

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
