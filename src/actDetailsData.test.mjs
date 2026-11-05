import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../docs/act-details-research/2026-11-01.json' with {type:'json'};
import {mergeActDetailsDraft} from './actDetailsData.ts';
import published from './data/theater-act-details.json' with {type:'json'};
import previousMechanics from './data/theater-mechanics-history.json' with {type:'json'};

test('old Act 9 elite draft timings upgrade without dropping authored text or changing other encounters',()=>{
  for(const mode of ['Visionary','Lunar']){
    const draft=structuredClone(published);
    const encounter=draft.seasons[29][mode][9].encounters.find(entry=>entry.name.startsWith('Elite Assault'));
    encounter.requirements='Clear: defeat 3 bounty opponents within 2m.\nStar Challenge: complete the bounty objective within 1m 20s.\nActive enemies: 1.\nMy extra requirement note.';
    encounter.stageEffects='Thrilling Duel gives 40% increased damage inside an elite enemy’s Duel Zone and inflicts periodic damage outside.';
    encounter.notes='Keep my bounty team';
    const merged=mergeActDetailsDraft(published,draft).seasons[29][mode][9];
    const updated=merged.encounters.find(entry=>entry.name.startsWith('Elite Assault'));
    assert.match(updated.requirements,/within 1m 40s/);
    assert.match(updated.requirements,/within 1m 5s/);
    assert.match(updated.requirements,/My extra requirement note/);
    assert.match(updated.stageEffects,/every 2s/);
    assert.equal(updated.notes,'Keep my bounty team');
    assert.deepEqual(merged.encounters[0],draft.seasons[29][mode][9].encounters[0]);
    assert.match(encounter.requirements,/within 2m/,'does not mutate draft input');
    encounter.requirements='My custom challenge requirements';encounter.stageEffects='My custom stage effects';
    const custom=mergeActDetailsDraft(published,draft).seasons[29][mode][9].encounters.find(entry=>entry.name.startsWith('Elite Assault'));
    assert.equal(custom.requirements,encounter.requirements);assert.equal(custom.stageEffects,encounter.stageEffects);
  }
});

test('old Act 1 and 2 elite draft effects inherit current hazards while preserving notes and custom effects',()=>{
  for(const mode of ['Easy','Normal','Hard','Visionary','Lunar']){
    const draft=structuredClone(published);
    const elite=act=>draft.seasons[29][mode][act].encounters.find(entry=>entry.name.startsWith('Elite Assault'));
    elite(1).stageEffects='';
    elite(2).stageEffects='Inferred stage effects: Treacherous Thunder plus Horrific Explosion, a timed bomb that transfers between enemies.';
    elite(1).notes='My Act 1 team';elite(2).notes='My Act 2 team';
    const merged=mergeActDetailsDraft(published,draft);
    for(const act of [1,2]){
      const updated=merged.seasons[29][mode][act].encounters.find(entry=>entry.name.startsWith('Elite Assault'));
      assert.equal(updated.stageEffects,published.seasons[29][mode][act].encounters.find(entry=>entry.name.startsWith('Elite Assault')).stageEffects);
      assert.equal(updated.notes,`My Act ${act} team`);
      assert.equal(updated.requirements,elite(act).requirements);
      assert.deepEqual(updated.enemyIds,elite(act).enemyIds);
      elite(act).stageEffects=`My custom Act ${act} effect`;
    }
    assert.equal(elite(1).notes,'My Act 1 team');
    const custom=mergeActDetailsDraft(published,draft);
    for(const act of [1,2])assert.equal(custom.seasons[29][mode][act].encounters.find(entry=>entry.name.startsWith('Elite Assault')).stageEffects,`My custom Act ${act} effect`);
  }
});

test('old Act 1 Geovishap draft wording upgrades to Pyro without losing personal edits',()=>{
  const draft=structuredClone(published);
  const encounter=draft.seasons[29].Lunar[1].encounters.find(entry=>entry.enemyIds.includes('60401'));
  const oldNote="The Geovishap's transformations adds 20% RES to the respective element.";
  encounter.resistances=`My resistance observation.\n${oldNote}`;
  encounter.enemies='Wave 1: 1 Geovishap.\nWave 2: 1 Primordial Bathysmal Vishap.';
  encounter.notes='Keep my team note';
  const result=mergeActDetailsDraft(published,draft).seasons[29].Lunar[1].encounters.find(entry=>entry.enemyIds.includes('60401'));
  assert.equal(result.resistances,"My resistance observation.\nThe Geovishap's Pyro transformation adds 20% Pyro RES.");
  assert.match(result.enemies,/Geovishap \(Pyro\)/);
  assert.equal(result.notes,'Keep my team note');
  assert.ok(encounter.resistances.includes(oldNote),'migration does not mutate the saved draft');
  encounter.resistances='My own custom resistance wording';
  assert.equal(mergeActDetailsDraft(published,draft).seasons[29].Lunar[1].encounters.find(entry=>entry.enemyIds.includes('60401')).resistances,'My own custom resistance wording');
});

test('the original Protection Spirit healer list upgrades without losing personal notes',()=>{
  const draft=structuredClone(published);
  const encounter=draft.seasons[29].Lunar[12].encounters[0];
  encounter.notableCharacters=['Sigewinne','Sangonomiya Kokomi','Barbara'].map(name=>({name,reason:''}));
  encounter.notes='Keep my healer rotation';
  const merged=mergeActDetailsDraft(published,draft).seasons[29].Lunar[12].encounters[0];
  assert.deepEqual(merged.notableCharacters,published.seasons[29].Lunar[12].encounters[0].notableCharacters);
  assert.equal(merged.notes,'Keep my healer rotation');
  encounter.notableCharacters[0].reason='My own Sigewinne note';
  assert.equal(mergeActDetailsDraft(published,draft).seasons[29].Lunar[12].encounters[0].notableCharacters[0].reason,'My own Sigewinne note');
});

test('Monolith recommendations stay shared when loading older per-choice drafts',()=>{
  const draft=structuredClone(published);
  const act=draft.seasons[29].Hard[4];
  for(const encounter of act.encounters){encounter.keyRecommendations=[{label:'Taunts'}];encounter.notableCharacters=act.notableCharacters;}
  delete act.keyRecommendations;delete act.notableCharacters;
  const merged=mergeActDetailsDraft(published,draft).seasons[29].Hard[4];
  assert.deepEqual(merged.keyRecommendations,[{label:'Taunts'},{label:'Freeze'}]);
  assert.equal(merged.notableCharacters.length,5);
  for(const encounter of merged.encounters){assert.equal(encounter.keyRecommendations?.length??0,0);assert.equal(encounter.notableCharacters?.length??0,0);}
});

test('the original Lunar Beast Energy Block wording is removed from saved drafts',()=>{
  const draft=structuredClone(published);
  const encounter=draft.seasons[29].Lunar[11].encounters[0];
  encounter.mechanics='Destroy matching-element Energy Blocks, absorb their power, then hit the corresponding Consecrated Beast to paralyze it. Its enhanced resistance falls outside the base resistance values.';
  encounter.notes='Keep my healing team note';
  const migrated=mergeActDetailsDraft(published,draft).seasons[29].Lunar[11].encounters[0];
  assert.equal(migrated.mechanics,'');
  assert.equal(migrated.notes,'Keep my healing team note');
});

test('expanded mechanics upgrade exact legacy drafts while preserving personal mechanics and notes',()=>{
  const draft=structuredClone(published);
  const encounter=draft.seasons[29].Lunar[3].encounters[0];
  encounter.mechanics=previousMechanics[`29/3/${encounter.name}`][0];
  encounter.notes='Save my Electro team';
  const merged=mergeActDetailsDraft(published,draft);
  assert.equal(merged.seasons[29].Lunar[3].encounters[0].mechanics,published.seasons[29].Lunar[3].encounters[0].mechanics);
  assert.equal(merged.seasons[29].Lunar[3].encounters[0].notes,'Save my Electro team');
  encounter.mechanics='My custom positioning observation';
  assert.equal(mergeActDetailsDraft(published,draft).seasons[29].Lunar[3].encounters[0].mechanics,'My custom positioning observation');
});

test('mechanics retain important encounter variants and do not transfer disputed timings',()=>{
  const acts=published.seasons[29].Lunar;
  assert.match(acts[3].encounters[0].mechanics,/2%.*15%/s);
  assert.match(acts[6].encounters[0].mechanics,/Four.*25%/s);
  assert.match(acts[6].encounters[0].mechanics,/paralyzes the boss for 10s/);
  assert.match(acts[7].encounters[1].mechanics,/this state for 10s/);
  assert.match(acts[10].encounters[0].mechanics,/15s of exhaustion/);
  assert.doesNotMatch(acts[6].encounters[0].mechanics,/18s|16s|15s|36.*Energy/);
  assert.match(acts[7].encounters[1].mechanics,/maximum HP/);
  assert.match(acts[7].encounters[1].mechanics,/^Maximum HP Bar:/);
  assert.match(acts[8].encounters[0].mechanics,/^Cooking Progress Meter:/);
  assert.match(acts[12].encounters[0].mechanics,/^Protection Spirit HP:/);
  assert.equal(acts[11].encounters[0].mechanics,'');
  assert.match(acts[11].encounters[0].stageEffects,/Unavoidable.*healing or shielding/s);
  assert.match(acts[12].encounters[0].mechanics,/Protection Spirit/);
  assert.doesNotMatch(acts[12].encounters[0].mechanics,/ordinary Wayob|normal variant/);
  assert.equal(acts[1].encounters[2].mechanics,'');
  assert.equal(acts[2].encounters[1].mechanics,'');
  assert.doesNotMatch(acts[1].encounters[1].mechanics,/ordinary Vishap|Battle-Hardened version/);
  assert.match(acts[10].encounters[0].mechanics,/Incoming Healing Bonus.*100% CRIT Rate/s);
  for(const modes of Object.values(published.seasons))for(const entries of Object.values(modes))for(const act of Object.values(entries))for(const encounter of act.encounters){
    assert.equal(typeof encounter.mechanics,'string');
    assert.doesNotMatch(encounter.mechanics,/Positioning:|Kuuvahki interrupts|Kuuvahki can also interrupt/i);
    assert.doesNotMatch(encounter.mechanics,/estimated|percentage points|https?:|alioth|fandom|Enemy HP:/i);
  }
});

test('an empty pre-research browser draft retains the published lineup',()=>{
  assert.deepEqual(mergeActDetailsDraft(data,{seasons:{}}),data);
});

test('older Fluid Avatar drafts inherit mechanics without losing notes or replacing authored mechanics',()=>{
  const draft=structuredClone(data);
  for(const mode of Object.keys(draft.seasons[29])){
    const encounter=draft.seasons[29][mode][2].encounters[0];
    encounter.mechanics='';
    encounter.notes='My Mualani team';
  }
  const merged=mergeActDetailsDraft(data,draft);
  for(const mode of Object.keys(merged.seasons[29])){
    const encounter=merged.seasons[29][mode][2].encounters[0];
    assert.equal(encounter.notableCharacters[0].name,'Mualani');
    assert.match(encounter.mechanics,/Pyro infusion/);
    assert.equal(encounter.notes,'My Mualani team');
  }
  draft.seasons[29].Hard[2].encounters[0].mechanics='My edited mechanics';
  assert.equal(mergeActDetailsDraft(data,draft).seasons[29].Hard[2].encounters[0].mechanics,'My edited mechanics');
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
  assert.match(acts[9].encounters[2].requirements,/3 bounty opponents within 100 s/);
  assert.match(acts[9].encounters[2].requirements,/within 65 s/);
  assert.match(acts[6].encounters[0].requirements,/110 s/);
  assert.match(acts[8].encounters[0].requirements,/110 s/);
  assert.match(acts[12].encounters[0].requirements,/125 s/);
  assert.match(acts[4].encounters[0].requirements,/each defeat removes 15 s/);
  assert.match(acts[11].encounters[0].requirements,/each defeat removes 30 s/);
});

test('historical lineup references stay within regular acts and Lunar references stay within Lunar challenges',()=>{
  for(const modes of Object.values(data.seasons))for(const acts of Object.values(modes))for(const [act,record]of Object.entries(acts)){
    const anchor=act==='11'?'Arcana_Challenge_I':act==='12'?'Arcana_Challenge_II':`Act_${act}`;
    for(const encounter of record.encounters)for(const source of encounter.sources??[]){
      if(source.url.includes('/Seasons/')){
        const sourceAnchor=new URL(source.url).hash;
        if(Number(act)>10)assert.ok(['#Arcana_Challenge_I','#Arcana_Challenge_II'].includes(sourceAnchor),`${encounter.name}: ${source.url}`);
        else assert.equal(sourceAnchor,`#${anchor}`,`${encounter.name}: ${source.url}`);
      }
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
