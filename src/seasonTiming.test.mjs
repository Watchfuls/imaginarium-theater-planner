import test from 'node:test';
import assert from 'node:assert/strict';
import {currentSeason,seasonStatus} from './seasonTiming.ts';
import data from './data/theater-lineups.json' with {type:'json'};

test('bundled upcoming season becomes current at its start, and previous becomes past',()=>{
  const seasons=[data.current,data.next];
  const reset=Date.parse(data.next.startsAt);
  assert.equal(seasonStatus(data.next,reset-1),'Upcoming');
  assert.equal(seasonStatus(data.current,reset-1),'Current');
  assert.equal(seasonStatus(data.next,reset),'Current');
  assert.equal(seasonStatus(data.current,reset),'Past');
  assert.equal(currentSeason(seasons,reset),data.next);
});

test('expired bundled data does not claim that a season is current',()=>{
  const after=Date.parse(data.next.endsAt)+1000;
  assert.equal(seasonStatus(data.next,after),'Past');
  assert.equal(currentSeason([data.current,data.next],after),null);
});
