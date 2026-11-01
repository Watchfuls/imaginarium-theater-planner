import test from 'node:test';
import assert from 'node:assert/strict';
import {changeTravelerElement} from './travelerSelection.ts';

test('None removes Traveler from the cast and clears their act slots',()=>{
  const plan={roster:['Fischl','Geo Traveler','Yelan'],acts:{1:['Geo Traveler','Fischl','','']},borrowed:'Zhongli'};
  const before=structuredClone(plan);
  const updated=changeTravelerElement(plan,'None',['Geo']);
  assert.deepEqual(updated,{roster:['Fischl','Yelan'],acts:{1:['','Fischl','','']},borrowed:'Zhongli',travelerElement:'None'});
  assert.deepEqual(plan,before);
  const restored=changeTravelerElement(updated,'Geo',['Geo']);
  assert.equal(restored.travelerElement,'Geo');
  assert.deepEqual(restored.roster,['Fischl','Yelan']);
});

test('switching Traveler retains cast position, assignments, and borrowed character without mutating the saved plan',()=>{
  const plan={roster:['Fischl','Geo Traveler','Yelan'],acts:{1:['Geo Traveler','Fischl','',''],2:['Yelan','','Geo Traveler','']},borrowed:'Zhongli'};
  const before=structuredClone(plan);
  const updated=changeTravelerElement(plan,'Hydro',['Hydro','Electro','Geo']);
  assert.deepEqual(updated,{roster:['Fischl','Hydro Traveler','Yelan'],acts:{1:['Hydro Traveler','Fischl','',''],2:['Yelan','','Hydro Traveler','']},borrowed:'Zhongli',travelerElement:'Hydro'});
  assert.deepEqual(plan,before);
});

test('an element outside the season is rejected',()=>{
  const plan={roster:['Geo Traveler'],acts:{}};
  assert.equal(changeTravelerElement(plan,'Pyro',['Hydro','Electro','Geo']),plan);
});

test('switching an unselected Traveler does not add a cast member',()=>{
  const updated=changeTravelerElement({roster:['Fischl'],acts:{1:['Fischl','','','']}},'Electro',['Hydro','Electro','Geo']);
  assert.deepEqual(updated.roster,['Fischl']);
  assert.deepEqual(updated.acts,{1:['Fischl','','','']});
  assert.equal(updated.travelerElement,'Electro');
});

test('switching after reloading a plan with empty earlier slots does not crash',()=>{
  const slots=[];
  slots[2]='Geo Traveler';
  slots[3]='Fischl';
  const plan=JSON.parse(JSON.stringify({roster:['Geo Traveler','Fischl'],acts:{1:slots}}));
  assert.deepEqual(plan.acts[1],[null,null,'Geo Traveler','Fischl']);
  const updated=changeTravelerElement(plan,'Hydro',['Hydro','Electro','Geo']);
  assert.deepEqual(updated.acts[1],['','','Hydro Traveler','Fischl']);
  assert.deepEqual(updated.roster,['Hydro Traveler','Fischl']);
});
