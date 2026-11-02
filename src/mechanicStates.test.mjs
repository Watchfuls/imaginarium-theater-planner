import test from 'node:test';
import assert from 'node:assert/strict';
import {mechanicStateDescription} from './mechanicStates.ts';
test('state definitions stay identical across enemies with different accompanying effects',()=>{
 for(const term of ['paralyzed','exhausted','weakened','disabled'])for(const id of ['40204','61101','63011','21501','61004','10308'])assert.equal(mechanicStateDescription(term,[id]),mechanicStateDescription(term));
});
test('action lock, reduced resistance, and attack interruption are distinct',()=>{
 assert.equal(mechanicStateDescription('paralyzed'),'The enemy cannot perform actions.');
 assert.equal(mechanicStateDescription('exhaustion'),'A recovery state in which the enemy cannot perform actions.');
 assert.equal(mechanicStateDescription('weakened'),'Resistance is reduced.');
 assert.equal(mechanicStateDescription('interrupted'),'The current attack is canceled.');
});
test('partial disabling and Grief-Stricken retain precise meanings',()=>{
 assert.equal(mechanicStateDescription('disabled'),'The affected weak-point system is inactive and cannot be used for its associated attacks.');
 assert.match(mechanicStateDescription('Grief-Stricken'),/early Ascendant Gleam trigger allows it to keep attacking/);
});
