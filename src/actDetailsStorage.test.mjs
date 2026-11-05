import test from 'node:test';
import assert from 'node:assert/strict';
import {compactActDetails,expandActDetails} from './actDetailsStorage.ts';

const act=()=>({requirements:'Clear within 2m.',notes:'My notes',encounters:[{name:'Enemy',enemies:'Wave 1',requirements:'',resistances:'',notes:''}]});
test('only identical same-numbered acts share storage and expanded edits are independent',()=>{
  const source={seasons:{30:{Visionary:{8:act(),9:act()},Lunar:{8:{...act(),requirements:'Different timer'},9:act(),11:act()}}}};
  const compact=compactActDetails(source);
  assert.deepEqual(compact.seasons[30].Lunar[9],{$ref:'Visionary/9'});
  assert.ok(compact.seasons[30].Lunar[8].encounters);
  assert.ok(compact.seasons[30].Lunar[11].encounters);
  const expanded=expandActDetails(compact);
  assert.deepEqual(expanded,source);
  expanded.seasons[30].Lunar[9].encounters[0].notes='Edited';
  assert.equal(expanded.seasons[30].Visionary[9].encounters[0].notes,'');
  assert.deepEqual(compactActDetails(expandActDetails(compact)),compact);
});
test('references reject missing targets, cycles, cross-act links, and mixed overrides',()=>{
  for(const modes of [
    {Lunar:{9:{$ref:'Missing/9'}}},
    {Visionary:{9:{$ref:'Lunar/9'}},Lunar:{9:{$ref:'Visionary/9'}}},
    {Visionary:{8:act()},Lunar:{9:{$ref:'Visionary/8'}}},
    {Visionary:{9:act()},Lunar:{9:{$ref:'Visionary/9',notes:'Override'}}}
  ])assert.throws(()=>expandActDetails({seasons:{30:modes}}));
});
