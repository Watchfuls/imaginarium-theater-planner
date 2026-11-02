import test from 'node:test';
import assert from 'node:assert/strict';
import {mechanicsTokens} from './mechanicsText.ts';

test('gauge units attach to their elements without swallowing the explanation',()=>{
  const tokens=mechanicsTokens('The fire has 1U of Pyro gauge; the pot has 30U Geo gauge.');
  assert.deepEqual(tokens.filter(token=>token.kind==='gauge'),[
    {kind:'gauge',text:'1U',element:'Pyro'},
    {kind:'gauge',text:'30U',element:'Geo'},
  ]);
  assert.equal(tokens.at(-1).text,' gauge.');
});

test('mechanic states retain their tooltips alongside elemental and numerical highlights',()=>{
  const tokens=mechanicsTokens('Hydro paralyzes it for 10s and reduces all RES by 25%.');
  assert.deepEqual(tokens.filter(token=>token.kind==='state'),[{kind:'state',text:'paralyzes'}]);
  assert.deepEqual(tokens.filter(token=>token.kind==='value').map(token=>token.text),['10s','25%']);
  assert.equal(tokens[0].element,'Hydro');
});

test('ordinary text and Fury meter units remain ordinary text',()=>{
  const text='The Fury meter has 100 units.';
  assert.deepEqual(mechanicsTokens(text),[{kind:'text',text}]);
});

test('reaction names stay whole before matching individual element names',()=>{
  const tokens=mechanicsTokens('Electro-Charged, Lunar-Charged, Lunar damage, Stellar damage, and Freeze.');
  assert.deepEqual(tokens.filter(token=>token.kind==='reaction').map(token=>token.reaction),['electrocharged','lunarcharged','lunar','stellar','freeze']);
  assert.equal(tokens.some(token=>token.kind==='element'||token.kind==='state'),false);
});

test('gauge amounts stay highlighted when the element appears earlier in the sentence',()=>{
  const tokens=mechanicsTokens('Its Geo ward has 20U of gauge.');
  assert.equal(tokens.find(token=>token.kind==='element').element,'Geo');
  assert.deepEqual(tokens.find(token=>token.kind==='value'),{kind:'value',text:'20U'});
});
