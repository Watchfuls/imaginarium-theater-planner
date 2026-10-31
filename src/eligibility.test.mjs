import test from 'node:test';
import assert from 'node:assert/strict';
import { countEligibleCharacters } from './eligibility.ts';

test('multiple eligible Traveler elements cannot satisfy the character minimum', () => {
  const otherCharacters = Array.from({ length: 14 }, (_, index) => `Character ${index}`);
  const count = countEligibleCharacters([...otherCharacters, 'Anemo Traveler', 'Geo Traveler', 'Dendro Traveler']);
  assert.equal(count, 15);
  assert.equal(count >= 16, false);
});

test('a fixed Traveler element excludes other owned variants', () => {
  assert.equal(countEligibleCharacters(['Amber', 'Geo Traveler'], 'Anemo Traveler'), 1);
});

test('opening and owned copies of the same character count once', () => {
  assert.equal(countEligibleCharacters(['Amber', 'Anemo Traveler', 'Amber', 'Anemo Traveler'], 'Anemo Traveler'), 2);
});

test('a single eligible Traveler counts once and an absent Traveler counts zero', () => {
  assert.equal(countEligibleCharacters(['Amber', 'Geo Traveler']), 2);
  assert.equal(countEligibleCharacters(['Amber']), 1);
  assert.equal(countEligibleCharacters([]), 0);
});
