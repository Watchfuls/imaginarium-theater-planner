import test from 'node:test';
import assert from 'node:assert/strict';
import {stored,storedText,saveText} from './browserStorage.ts';

test('blocked storage falls back on reads and reports failed saves without throwing',()=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Blocked');}});
  try{
    assert.equal(storedText('sort','name'),'name');
    assert.deepEqual(stored('plan',{acts:{}}),{acts:{}});
    assert.equal(saveText('plan','{}'),false);
  }finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;}
});

test('invalid saved JSON or data shape uses defaults; valid saves survive and quota failures are reported',()=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  let value='null';
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){return value;},setItem(){throw new Error('Quota exceeded');}}});
  try{
    assert.deepEqual(stored('plan',[]),[]);
    value='{broken';assert.deepEqual(stored('plan',[]),[]);
    value='{}';assert.deepEqual(stored('plan',[],Array.isArray),[]);
    value='["Aino"]';assert.deepEqual(stored('plan',[],Array.isArray),['Aino']);
    assert.equal(saveText('plan','{}'),false);
  }finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;}
});
