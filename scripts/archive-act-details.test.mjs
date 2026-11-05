import test from 'node:test';
import assert from 'node:assert/strict';
import {actArchiveSnapshots} from './archive-act-details.mjs';
import {compactActDetails} from '../src/actDetailsStorage.ts';

test('compact and expanded data produce the same self-contained archive',()=>{
  const act={requirements:'',notes:'Preserve me',encounters:[]};
  const data={seasons:{29:{Visionary:{9:act},Lunar:{9:structuredClone(act)}}}};
  assert.deepEqual(actArchiveSnapshots(compactActDetails(data)),actArchiveSnapshots(data));
});

test('archives keep timings, mechanics, and personal notes under the original season/difficulty/act',()=>{
  const act={requirements:'Clear within 110 s',notes:'Bring a healer',encounters:[{name:'Boss',requirements:'Star within 75 s',mechanics:'Break its shield',notes:'Use my borrowed character'}]};
  const data={seasons:{29:{Visionary:{6:act},Lunar:{12:{requirements:'Clear within 125 s',notes:'Challenge two',encounters:[]}}}}};
  const [{record,relativePath}]=actArchiveSnapshots(data,{current:{season:29,id:'2026-11-01',startsAt:'2026-11-01T04:00:00Z',endsAt:'2026-12-01T03:59:59Z'}});
  assert.deepEqual(record.seasons,data.seasons);
  assert.equal(record.seasonId,'2026-11-01');
  assert.match(relativePath,/^season-29\/[a-f0-9]+\.json$/);
  data.seasons[29].Visionary[6].notes='Changed later';
  assert.equal(record.seasons[29].Visionary[6].notes,'Bring a healer');
});

test('later edits produce a new snapshot while unchanged data reuses the same destination',()=>{
  const data={seasons:{29:{Hard:{3:{requirements:'105 s',notes:'',encounters:[]}}},30:{Normal:{1:{requirements:'80 s',notes:'New season',encounters:[]}}}}};
  const initial=actArchiveSnapshots(data);
  assert.equal(initial[0].relativePath,actArchiveSnapshots(data)[0].relativePath);
  data.seasons[29].Hard[3].notes='New tactic';
  const updated=actArchiveSnapshots(data);
  assert.notEqual(initial[0].relativePath,updated[0].relativePath);
  assert.equal(initial[1].relativePath,updated[1].relativePath);
  assert.equal(initial[0].record.seasons[29].Hard[3].notes,'');
});
