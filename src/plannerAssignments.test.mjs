import test from 'node:test';
import assert from 'node:assert/strict';
import {activeAssignments,cappedCast} from './plannerAssignments.ts';
import {teamPasteError} from './teamClipboard.ts';

test('hidden acts do not exhaust characters after switching to a lower difficulty',()=>{
  const acts={1:['Aino'],9:['Aino'],11:['Aino'],12:['Qiqi']};
  const hard=activeAssignments(acts,8);
  assert.deepEqual(hard,{1:['Aino']});
  assert.equal(teamPasteError(['Aino'],2,hard,['Aino']),null);
  assert.deepEqual(activeAssignments(acts,10,2),acts);
  assert.deepEqual(acts[11],['Aino']);
});

test('normal act limits exclude Lunar challenges and invalid act keys',()=>{
  assert.deepEqual(activeAssignments({0:['Aino'],1:['Aino'],4:['Aino'],11:['Aino'],1.5:['Aino']},3),{1:['Aino']});
});

test('lower difficulty caps a saved cast while retaining openings and the borrowed slot',()=>{
  const roster=['Aino','Mona','Itto','Flins','Qiqi'];
  assert.deepEqual(cappedCast(['Aino'],roster,'Qiqi',3),['Aino','Mona','Qiqi']);
  assert.deepEqual(cappedCast(['Aino'],roster,'',3),['Aino','Mona','Itto']);
  assert.deepEqual(cappedCast(['Aino'],roster,'Qiqi',6),roster);
  assert.equal(roster.length,5);
});
