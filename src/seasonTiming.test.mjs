import test from 'node:test';
import assert from 'node:assert/strict';
import {currentSeason,seasonStatus} from './seasonTiming.ts';
import data from './data/theater-lineups.json' with {type:'json'};

const previous={startsAt:'2026-10-01T04:00:00.000Z',endsAt:'2026-11-01T03:59:59.000Z'};
const next={startsAt:'2026-11-01T04:00:00.000Z',endsAt:'2026-12-01T03:59:59.000Z'};

test('upcoming season becomes current at its start, and previous becomes past',()=>{
  const reset=Date.parse(next.startsAt);
  assert.equal(seasonStatus(next,reset-1),'Upcoming');
  assert.equal(seasonStatus(previous,reset-1),'Current');
  assert.equal(seasonStatus(next,reset),'Current');
  assert.equal(seasonStatus(previous,reset),'Past');
  assert.equal(currentSeason([previous,next],reset),next);
});

test('expired bundled data does not claim that a season is current',()=>{
  const seasons=[data.current,data.next].filter(Boolean);
  const after=Math.max(...seasons.map(season=>Date.parse(season.endsAt)))+1000;
  assert.ok(seasons.length>0);
  assert.ok(seasons.every(season=>seasonStatus(season,after)==='Past'));
  assert.equal(currentSeason(seasons,after),null);
});
