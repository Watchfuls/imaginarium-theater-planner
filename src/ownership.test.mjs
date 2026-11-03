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
  for(const level of [101,95.5,'100',null]){
    assert.throws(()=>parseGoodOwnership({format:'GOOD',characters:[{key:'Aino',level}]}),/level from 1 to 100/);
  }
  assert.throws(()=>parseGoodOwnership({format:'GOOD',characters:[]}),/No characters/);
});

test('character-only and full inventory GOOD exports retain levels 95 and 100 after saving',()=>{
  for(const inventory of [{},{weapons:[],artifacts:[],materials:{}}]){
    const parsed=parseGoodOwnership({format:'GOOD',...inventory,characters:[
      {key:'Aino',level:95},{key:'SangonomiyaKokomi',level:100},{key:'Traveler',level:100},
    ]});
    const saved=Object.fromEntries([...parsed.characters].map(([name,level])=>[name,{owned:true,level}]));
    const restored=normalizeOwnership(JSON.parse(JSON.stringify(saved)));
    assert.deepEqual(restored.Aino,{owned:true,level:95});
    assert.deepEqual(restored.Kokomi,{owned:true,level:100});
    assert.equal(restored['Hydro Traveler'].level,100);
    assert.equal(restored['Geo Traveler'].level,100);
  }
});

test('GOOD imports round intermediate levels down to supported level options',()=>{
  for(const [level,expected] of [[1,10],[94,90],[96,95],[99,95]]){
    assert.equal(parseGoodOwnership({format:'GOOD',characters:[{key:'Aino',level}]}).characters.get('Aino'),expected);
  }
});

test('legacy ownership saves keep levels and synchronize Traveler without mutating input',()=>{
  const saved={Aino:{owned:true,level70:false},'Geo Traveler':{owned:true,level:80}};
  const normalized=normalizeOwnership(saved);
  assert.deepEqual(normalized.Aino,{owned:true,level:60});
  assert.deepEqual(normalized['Geo Traveler'],{owned:true,level:80});
  assert.deepEqual(normalized['Hydro Traveler'],{owned:false,level:80});
  assert.equal(saved.Aino.level,undefined);
});
