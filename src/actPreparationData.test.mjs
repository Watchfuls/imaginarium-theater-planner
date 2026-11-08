import test from 'node:test';
import assert from 'node:assert/strict';
import {blessingPairs,blessingLevel,recruitedBy} from './actPreparationData.ts';

test('featured element pairs use primary then secondary, alphabetically within each group',()=>{
  assert.deepEqual(blessingPairs(['Hydro','Geo','Electro']),['Electro-Hydro','Electro-Geo','Hydro-Geo']);
  assert.deepEqual(blessingPairs(['Anemo','Pyro','Dendro']),['Pyro-Anemo','Pyro-Dendro','Anemo-Dendro']);
});
test('blessings carry forward including saved reaction names',()=>{
  const preparations={1:{recruits:[],blessings:[{name:'Electro-Charged',levels:2}]},3:{recruits:[],blessings:[{name:'Electro-Hydro',levels:1}]}};
  assert.equal(blessingLevel(preparations,2,'Electro-Hydro'),2);
  assert.equal(blessingLevel(preparations,3,'Electro-Hydro'),3);
});
test('recruitment includes opening cast and only recruits available by the stage',()=>{
  const preparations={2:{recruits:['Razor'],blessings:[]},5:{recruits:['Beidou'],blessings:[]}};
  assert.deepEqual([...recruitedBy(preparations,1,['Yelan'])],['Yelan']);
  assert.deepEqual([...recruitedBy(preparations,2,['Yelan'])],['Yelan','Razor']);
  assert.equal(recruitedBy(preparations,11,[]).has('Beidou'),false);
  assert.equal(recruitedBy(preparations,12,[]).has('Beidou'),true);
});
