import test from 'node:test';
import assert from 'node:assert/strict';
import { canBorrowCharacter } from './borrowing.ts';

test('a new borrowed character cannot exceed a full cast', () => {
  assert.equal(canBorrowCharacter(['Amber', 'Lisa'], '', 'Kaeya', 2), false);
});

test('a borrowed character can fill the last available slot', () => {
  assert.equal(canBorrowCharacter(['Amber'], '', 'Kaeya', 2), true);
});

test('a borrowed character can be replaced in a full cast', () => {
  assert.equal(canBorrowCharacter(['Amber', 'Lisa'], 'Lisa', 'Kaeya', 2), true);
});

test('borrowing an already chosen character does not consume an extra slot', () => {
  assert.equal(canBorrowCharacter(['Amber', 'Lisa'], '', 'Lisa', 2), true);
});

test('keeping or removing a borrowed character remains possible at the cap', () => {
  assert.equal(canBorrowCharacter(['Amber', 'Lisa'], 'Lisa', 'Lisa', 2), true);
  assert.equal(canBorrowCharacter(['Amber', 'Lisa'], 'Lisa', '', 2), true);
});
