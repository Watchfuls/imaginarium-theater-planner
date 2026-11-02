import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGoodOwnership,normalizeOwnership} from './ownership.ts';

test('GOOD imports resolve full character names, Traveler variants, and unknown keys',()=>{
  const parsed=parseGoodOwnership({format:'GOOD',characters:[
    {key:'SangonomiyaKokomi',level:89},{key:'AratakiItto',level:90},
    {key:'Traveler',level:77},{key:'NotACharacter',level:90},
  ]});
  assert.equal(parsed.characters.get('Kokomi'),80);
  assert.equal(parsed.characters.get('Itto'),90);
  assert.equal(parsed.characters.get('Hydro Traveler'),70);
  assert.equal(parsed.characters.get('Electro Traveler'),70);
  assert.deepEqual(parsed.unknownKeys,['NotACharacter']);
});

test('invalid GOOD imports are rejected before replacing ownership',()=>{
  assert.throws(()=>parseGoodOwnership({characters:[]}),/GOOD/);
  assert.throws(()=>parseGoodOwnership({format:'GOOD',characters:[{key:'Aino',level:0}]}),/level/);
  assert.throws(()=>parseGoodOwnership({format:'GOOD',characters:[]}),/No characters/);
});

test('legacy ownership saves keep levels and synchronize Traveler without mutating input',()=>{
  const saved={Aino:{owned:true,level70:false},'Geo Traveler':{owned:true,level:80}};
  const normalized=normalizeOwnership(saved);
  assert.deepEqual(normalized.Aino,{owned:true,level:60});
  assert.deepEqual(normalized['Geo Traveler'],{owned:true,level:80});
  assert.deepEqual(normalized['Hydro Traveler'],{owned:false,level:80});
  assert.equal(saved.Aino.level,undefined);
});
