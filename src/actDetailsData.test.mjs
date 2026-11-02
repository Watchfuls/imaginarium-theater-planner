import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../docs/act-details-research/2026-11-01.json' with {type:'json'};
import {mergeActDetailsDraft} from './actDetailsData.ts';

test('an empty pre-research browser draft retains the published lineup',()=>{
  assert.deepEqual(mergeActDetailsDraft(data,{seasons:{}}),data);
});

test('every act has its difficulty-specific enemy level, including with older drafts',()=>{
  const expected={Easy:[75,75,80],Normal:[80,80,85,85,85,90],Hard:[85,85,90,90,90,92,92,95],Visionary:[85,85,90,90,90,92,92,95,95,100],Lunar:[85,85,90,90,90,92,92,95,95,100,100,100]};
  const draft=structuredClone(data);
  for(const acts of Object.values(draft.seasons[29]))for(const act of Object.values(acts))delete act.level;
  const merged=mergeActDetailsDraft(data,draft);
  for(const [mode,levels]of Object.entries(expected))levels.forEach((level,index)=>{
    assert.equal(data.seasons[29][mode][index+1].level,level);
    assert.equal(merged.seasons[29][mode][index+1].level,level);
  });
});

test('older browser drafts inherit bounty targets without losing personal edits',()=>{
  const draft=structuredClone(data);
  const encounters=draft.seasons[29].Visionary[9].encounters;
  encounters.reverse();
  for(const encounter of encounters){delete encounter.bountyEnemyIds;encounter.notes='My strategy';}
  const merged=mergeActDetailsDraft(data,draft).seasons[29].Visionary[9].encounters;
  for(const encounter of merged){
    const original=data.seasons[29].Visionary[9].encounters.find(item=>item.name===encounter.name);
    assert.deepEqual(encounter.bountyEnemyIds,original.bountyEnemyIds);
    assert.equal(encounter.notes,'My strategy');
  }
  assert.equal(encounters[0].bountyEnemyIds,undefined);
});

test('a personal draft preserves notes without hiding other researched acts or seasons',()=>{
  const published={seasons:{29:{Visionary:{1:{requirements:'Research',notes:'',encounters:[]},2:{requirements:'Other act',notes:'',encounters:[]}}}},research:{29:{checkedOn:'2026-11-01',summary:'Sources',sources:[]}}};
  const draft={seasons:{29:{Visionary:{1:{requirements:'Research',notes:'My team note',encounters:[]}}},28:{Hard:{1:{requirements:'',notes:'Older note',encounters:[]}}}}};
  const merged=mergeActDetailsDraft(published,draft);
  assert.equal(merged.seasons[29].Visionary[1].notes,'My team note');
  assert.equal(merged.seasons[29].Visionary[2].requirements,'Other act');
  assert.equal(merged.seasons[28].Hard[1].notes,'Older note');
  assert.deepEqual(merged.research,published.research);
  assert.equal(published.seasons[29].Visionary[1].notes,'');
});

test('Season 29 keeps all Alioth choices grouped by act and the Lunar challenges separate',()=>{
  const season=data.seasons[29];
  assert.deepEqual(Object.values(season.Lunar).map(act=>act.encounters.length),[3,3,1,3,3,1,3,1,3,1,1,1]);
  assert.equal(Object.keys(season.Visionary).length,10);
  for(let act=1;act<=10;act++)assert.deepEqual(season.Lunar[act],season.Visionary[act]);
  assert.match(season.Visionary[8].encounters[0].name,/Battle-Hardened Samachurl/);
  assert.match(season.Lunar[12].encounters[0].enemies,/Potapo/);
  // Cross-difficulty inference must respect the final-boss slot and include
  // Act 1 Elite Assault alongside the two normal encounter choices.
  for(const mode of ['Easy','Normal','Hard']){
    assert.equal(season[mode][1].encounters.length,3);
    assert.match(season[mode][1].encounters[2].name,/Elite Assault/);
    for(const act of Object.values(season[mode]))for(const encounter of act.encounters){
      assert.match(encounter.status,/mapping.*inferred/);
      assert.ok(encounter.inference.basis);
    }
  }
  assert.match(season.Hard[8].encounters[0].name,/Radiant Moonfly/);
  assert.doesNotMatch(season.Hard[8].encounters[0].name,/Samachurl/);
});

test('resistance records distinguish immunity and enhanced states from base values',()=>{
  const acts=data.seasons[29].Lunar;
  assert.match(acts[5].encounters[1].resistances,/Hydro immune/);
  assert.match(acts[3].encounters[0].resistances,/Dendro 80%/);
  assert.match(acts[3].encounters[0].resistances,/Dendro 55%/);
  assert.match(acts[11].encounters[0].resistances,/Consecrated Enhance/);
  assert.match(acts[11].encounters[0].resistances,/70%/);
});

test('every curated choice has provenance and current-vs-historical qualification',()=>{
  const enemyReferences=new Set();
  for(const act of Object.values(data.seasons[29].Lunar))for(const encounter of act.encounters){
    assert.match(encounter.status,/Current enemy types: Alioth/);
    assert.ok(encounter.sources.some(source=>source.url==='https://alioth.wiki/en/gi/theater?id=29'));
    for(const source of encounter.sources){
      assert.equal(new URL(source.url).protocol,'https:');
      if(source.url.includes('/gi/monster/'))enemyReferences.add(source.url);
    }
    assert.match(encounter.requirements,/inferred|inference|unresolved|unknown|Alioth|graphic-sourced/i);
    assert.ok(['high','medium','low'].includes(encounter.inference.confidence));
    assert.equal(encounter.notes,'');
  }
  assert.equal(enemyReferences.size,62);
  assert.doesNotMatch(JSON.stringify(data),/[\u0080-\u009F\uFFFD]/);
});

test('provided act graphics supply counts and resolve the recorded timer gaps',()=>{
  const acts=data.seasons[29].Lunar;
  assert.match(acts[1].encounters[0].requirements,/80 s/);
  assert.equal(acts[1].encounters[0].inference.confidence,'high');
  assert.ok(acts[1].encounters[0].sources.some(s=>s.url.includes('2026-03-01')));
  assert.match(acts[3].encounters[0].requirements,/105 s/);
  assert.match(acts[5].encounters[1].requirements,/20 opponents within 120 s/);
  assert.match(acts[11].encounters[0].requirements,/360 s/);
  assert.match(acts[1].encounters[2].requirements,/75 s/);
  assert.match(acts[1].encounters[2].enemies,/6 enemies total/);
  assert.match(acts[9].encounters[2].requirements,/3 bounty opponents within 120 s/);
  assert.match(acts[9].encounters[2].requirements,/within 80 s/);
  assert.match(acts[6].encounters[0].requirements,/110 s/);
  assert.match(acts[8].encounters[0].requirements,/110 s/);
  assert.match(acts[12].encounters[0].requirements,/125 s/);
  assert.match(acts[4].encounters[0].requirements,/each defeat removes 15 s/);
  assert.match(acts[11].encounters[0].requirements,/each defeat removes 30 s/);
});

test('historical lineup references never cross act or Lunar challenge boundaries',()=>{
  for(const modes of Object.values(data.seasons))for(const acts of Object.values(modes))for(const [act,record]of Object.entries(acts)){
    const anchor=act==='11'?'Arcana_Challenge_I':act==='12'?'Arcana_Challenge_II':`Act_${act}`;
    for(const encounter of record.encounters)for(const source of encounter.sources??[]){
      if(source.url.includes('/Seasons/'))assert.equal(new URL(source.url).hash,`#${anchor}`,`${encounter.name}: ${source.url}`);
    }
  }
  for(const acts of Object.values(data.seasons[29]))for(const [act,record]of Object.entries(acts))for(const encounter of record.encounters){
    const graphic=Number(act)>10?`Arcana${Number(act)-10}.jpg`:`Act${act}.jpg`;
    for(const source of encounter.graphicSources??[])assert.equal(source,graphic);
  }
  assert.deepEqual(data.seasons[29].Lunar[6].encounters[0].graphicSources,['Act6.jpg']);
  assert.doesNotMatch(data.seasons[29].Hard[8].encounters[0].requirements,/105 s/);
  assert.deepEqual(data.seasons[29].Lunar[12].encounters[0].graphicSources,['Arcana2.jpg']);
});

test('graphic HP stays in its depicted profile and lower modes retain inference labels',()=>{
  assert.match(data.seasons[29].Lunar[6].encounters[0].requirements,/4,412,201/);
  for(const mode of ['Easy','Normal','Hard'])for(const act of Object.values(data.seasons[29][mode]))for(const encounter of act.encounters){
    assert.doesNotMatch(encounter.requirements,/Enemy HP in the depicted profile/);
    assert.match(encounter.status,/inferred/);
  }
});
