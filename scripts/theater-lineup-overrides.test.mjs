import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeLineupOverrides} from './theater-lineup-overrides.mjs';

test('user announcement survives a missing upcoming wiki season', () => {
  const override = {id:'2026-12-01', elements:['Pyro','Hydro','Geo']};
  const result = mergeLineupOverrides([{id:'2026-11-01'}], [override]);
  assert.equal(result.length, 2);
  assert.deepEqual(result[1], {bossStages:[],sourceUrl:'',...override});
});

test('user lineup wins while newly fetched bosses remain available', () => {
  const bosses = [{act:3,bosses:[{name:'Example'}]}];
  const fetched = {id:'2026-12-01',elements:['Cryo'],bossStages:bosses,sourceUrl:'wiki'};
  const [result] = mergeLineupOverrides([fetched], [{id:fetched.id,elements:['Pyro','Hydro','Geo']}]);
  assert.deepEqual(result.elements, ['Pyro','Hydro','Geo']);
  assert.deepEqual(result.bossStages, bosses);
  assert.equal(result.sourceUrl, 'wiki');
  assert.deepEqual(fetched.elements, ['Cryo']);
});
