import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLineupData,parseBossData,getBossesForSlot} from './theaterData.ts';

test('lineup parsing accepts an unavailable next season and validates malformed input',()=>{
  const data={source:'fixture',current:null,next:null,bossCatalog:[],nextUnavailableReason:null,generatedAt:null};
  assert.equal(parseLineupData(data).next,null);
  assert.throws(()=>parseLineupData({...data,bossCatalog:[{name:'Unknown'}]}),/invalid shape/);
  assert.throws(()=>parseBossData({seasons:{29:{invalid:[]}}}),/invalid slot/);
});

test('boss overrides preserve an intentionally empty slot and keep final boss fallback',()=>{
  const boss={name:'Jadeplume Terrorshroom',iconUrl:null};
  const season={season:29,bossStages:[{act:8,bosses:[boss]}]};
  assert.deepEqual(getBossesForSlot(season,{seasons:{}},'boss4'),[boss]);
  assert.deepEqual(getBossesForSlot(season,{seasons:{}},'boss3'),[]);
  assert.deepEqual(getBossesForSlot(season,{seasons:{29:{boss4:[]}}},'boss4'),[]);
});
