import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, sortCharacters } from './characters.ts';

test('fixed planner groups follow the lineup order shown in game', () => {
  for (const names of [
    ['Yelan', 'Aino', 'Flins', 'Fischl', 'Zhongli', 'Kachina'],
    ['Vesna', 'Odette', 'Qiqi', 'Jahoda'],
  ]) {
    const characters = CHARACTERS.filter(character => names.includes(character.name));
    assert.deepEqual(sortCharacters(characters, 'game', names).map(character => character.name), names);
    assert.deepEqual(sortCharacters(characters, 'name', names).map(character => character.name), [...names].sort((a,b)=>a.localeCompare(b)));
  }
});

test('planner game order sorts by rarity, element, and newest release', () => {
  const sorted = sortCharacters([
    CHARACTERS.find(character => character.name === 'Amber'),
    CHARACTERS.find(character => character.name === 'Hu Tao'),
    CHARACTERS.find(character => character.name === 'Zhongli'),
    CHARACTERS.find(character => character.name === 'Navia'),
    CHARACTERS.find(character => character.name === 'Yae Miko'),
    CHARACTERS.find(character => character.name === 'Varesa'),
  ].filter(Boolean), 'game');

  assert.deepEqual(sorted.map(character => character.name), [
    'Navia', 'Zhongli', 'Varesa', 'Yae Miko', 'Hu Tao', 'Amber',
  ]);
});

test('planner name order remains alphabetical and does not mutate its input', () => {
  const characters = [
    CHARACTERS.find(character => character.name === 'Zhongli'),
    CHARACTERS.find(character => character.name === 'Amber'),
  ].filter(Boolean);

  assert.deepEqual(sortCharacters(characters, 'name').map(character => character.name), ['Amber', 'Zhongli']);
  assert.deepEqual(characters.map(character => character.name), ['Zhongli', 'Amber']);
});

test('game order prioritizes rarity, then level before element and release', () => {
  const levels = {Zhongli:70, Gorou:90, Ningguang:80, Razor:90, Fischl:80, Xingqiu:90};
  const characters = CHARACTERS.filter(character => character.name in levels);
  const levelOf = character => levels[character.name];
  assert.deepEqual(sortCharacters(characters, 'game', [], levelOf).map(character => character.name),
    ['Zhongli', 'Gorou', 'Razor', 'Xingqiu', 'Ningguang', 'Fischl']);
  assert.deepEqual(sortCharacters(characters, 'name', [], levelOf).map(character => character.name),
    [...characters].map(character => character.name).sort((a,b)=>a.localeCompare(b)));
});

test('Cryo Traveler uses the version 7.0 release date', () => {
  const characters = CHARACTERS.filter(character => ['Cryo Traveler', 'Eula'].includes(character.name));
  assert.equal(CHARACTERS.find(character => character.name === 'Cryo Traveler').releaseDate, '2026-08-12');
  assert.deepEqual(sortCharacters(characters, 'game').map(character => character.name), ['Cryo Traveler', 'Eula']);
});
