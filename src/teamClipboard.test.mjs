import test from 'node:test';
import assert from 'node:assert/strict';
import { teamPasteError, swapTeams } from './teamClipboard.ts';

const team = ['Amber', 'Lisa', 'Kaeya', 'Barbara'];
test('dragging onto an empty act moves the whole team without mutating the original', () => {
  const acts = { 1: [...team] };
  const moved = swapTeams(acts, 1, 8);
  assert.deepEqual(moved[1], []);
  assert.deepEqual(moved[8], team);
  assert.deepEqual(acts[1], team);
  assert.notEqual(moved[8], acts[1]);
});
test('swapping overlapping teams preserves uses even when a character is exhausted', () => {
  const other = ['Amber', 'Zibai', '', ''];
  const acts = { 6: [...team], 8: other };
  const swapped = swapTeams(acts, 6, 8);
  assert.deepEqual(swapped[6], other);
  assert.deepEqual(swapped[8], team);
  for (const name of new Set([...team, ...other].filter(Boolean))) {
    assert.equal(Object.values(swapped).filter(names => names.includes(name)).length,
      Object.values(acts).filter(names => names.includes(name)).length);
  }
});
test('dropping a team onto its own act changes nothing', () => {
  const acts = { 1: team };
  assert.equal(swapTeams(acts, 1, 1), acts);
});
test('a team can be duplicated into an adjacent or distant act for its second use', () => {
  assert.equal(teamPasteError(team, 2, { 1: team }, team), null);
  assert.equal(teamPasteError(team, 8, { 6: team }, team), null);
});
test('one exhausted character blocks the whole paste', () => {
  const acts = { 1: [...team], 3: ['Amber'], 8: ['Lisa'] };
  const before = structuredClone(acts);
  assert.match(teamPasteError(team, 8, acts, team), /Amber is exhausted/);
  assert.deepEqual(acts, before);
});
test('existing destination assignments are replaced rather than counted as an extra use', () => {
  assert.equal(teamPasteError(team, 8, { 6: team, 8: team }, team), null);
});
test('a copied character removed from the cast cannot be pasted', () => {
  assert.match(teamPasteError(team, 2, { 1: team }, team.slice(1)), /no longer in your selected cast/);
});
test('partial teams retain empty slots while empty and duplicate teams are rejected', () => {
  assert.equal(teamPasteError(['Amber', '', '', ''], 2, { 1: ['Amber'] }, team), null);
  assert.match(teamPasteError(['', '', '', ''], 2, {}, team), /empty/);
  assert.match(teamPasteError(['Amber', 'Amber'], 2, {}, team), /invalid/);
});
