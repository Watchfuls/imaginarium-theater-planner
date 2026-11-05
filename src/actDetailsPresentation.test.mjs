import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import data from './data/theater-act-details.json' with {type:'json'};
import research from '../docs/act-details-research/2026-11-01.json' with {type:'json'};
import catalog from './data/theater-enemies.json' with {type:'json'};
import {encounterEnemyIds,enemyResistanceDetails,groupedResistances,playerActRequirements,playerDetailText,playerEnemyNotes,resistanceExceptions,siteActDetails,splitChallengeRequirements} from './actDetailsPresentation.ts';

test('countdown reductions and active enemy counts belong in details, not objectives',()=>{
  const result=splitChallengeRequirements('Clear: protect the monolith through a 190s countdown; each defeat removes 15s.\nStar Challenge: finish with at least 35% monolith HP.\nActive enemies: 2 or 3.');
  assert.equal(result.requirements,'Clear: protect the monolith through a 3m 10s countdown.\nStar Challenge: finish with at least 35% monolith HP.');
  assert.deepEqual(result.details,['Each defeat removes 15s.','Active Enemies: 2 or 3.']);
});

test('mechanic notes omit repeated static resistance profiles but retain resistance changes',()=>{
  assert.equal(playerDetailText('Qucusaurus Warriors: Approaching Blazing Sky can stop her sustained projectile attack. Heartstar Hammer can leap away after an explosive strike'),'');
  assert.equal(playerDetailText('The listed saurian species have elevated resistance to their own elements.'),'');
  assert.equal(playerDetailText('Ruin Guard and Ruin Grader have 70% Physical resistance; the smaller Ruin machines have 30% or 50%. This differs from a uniform resistance assumption.'),'');
  assert.equal(playerDetailText('Breaking it weakens the boss and reduces all resistance.'),'Breaking it weakens the boss and reduces all resistance.');
});

test('standard resistance is hidden without losing negative values, immunity, or conditional states',()=>{
  assert.equal(resistanceExceptions('Enemy: all damage types 10%.'),'');
  assert.equal(resistanceExceptions('Enemy: Physical -20%; Pyro, Hydro 10%.'),'Enemy: Physical -20%.');
  assert.equal(resistanceExceptions('Enemy: all damage types 10%. Enhanced: Physical 40%; Hydro 70%.'),'Enemy: Enhanced: Physical 40%; Hydro 70%.');
  const exceptions=resistanceExceptions('Enemy: Physical 0%; Hydro immune; Pyro -10%; Geo 110%; Cryo 10.5%; Anemo 10%.');
  assert.match(exceptions,/Physical 0%/);
  assert.match(exceptions,/Hydro immune/);
  assert.match(exceptions,/Pyro -10%/);
  assert.match(exceptions,/Geo 110%/);
  assert.match(exceptions,/Cryo 10.5%/);
  assert.doesNotMatch(exceptions,/Anemo/);
});

test('resistance exceptions attach to the correct portrait, including names with colons',()=>{
  const name="Potapo's Solidarity: Secret Shadow's Re-Emergence";
  const result=enemyResistanceDetails(`Ruin Guard: Physical 70%; Pyro 10%.\n${name}: Cryo 50%.\nWilderness Hunter: all damage types 10%.\nShield strength changes during combat.`,['Ruin Guard',name,'Wilderness Hunter']);
  assert.equal(result.byEnemy['Ruin Guard'],'Physical 70%.');
  assert.equal(result.byEnemy[name],'Cryo 50%.');
  assert.equal(result.byEnemy['Wilderness Hunter'],undefined);
  assert.equal(result.notes,'Shield strength changes during combat.');
});

test('mixed profiles retain their full resistance exceptions under each enemy',()=>{
  const grouped=groupedResistances({A:'Physical, Pyro 25%; Hydro immune.',B:'Physical, Geo 25%; Hydro immune.'},['A','B']);
  assert.equal(grouped.shared,'');
  assert.equal(grouped.individual.A,'Physical, Pyro 25%; Hydro immune');
  assert.equal(grouped.individual.B,'Physical, Geo 25%; Hydro immune');
  assert.equal(groupedResistances({A:'Physical 70%.'},['A','B']).shared,'');
});

test('only identical complete profiles are combined for all enemies',()=>{
  assert.deepEqual(groupedResistances({A:'Physical -20%.',B:'Physical -20%.',C:'Physical -20%.'},['A','B','C']),{shared:'Physical -20%',individual:{}});
  const mixed=groupedResistances({A:'Physical -20%.',B:'Physical -20%.',C:'Geo 50%.'},['A','B','C']);
  assert.equal(mixed.shared,'');
  assert.equal(mixed.individual.C,'Geo 50%');
});

test('resistance grouping keeps conditional states, decimals, and single enemies distinct',()=>{
  const grouped=groupedResistances({A:'Physical 10.5%. Weak: Physical 0%.',B:'Physical 10.5%. Enhanced: Physical 0%.'},['A','B']);
  assert.equal(grouped.shared,'');
  assert.equal(grouped.individual.A,'Physical 10.5%\nWeak: Physical 0%');
  assert.equal(grouped.individual.B,'Physical 10.5%\nEnhanced: Physical 0%');
  assert.deepEqual(groupedResistances({A:'Dendro 80%.'},['A']),{shared:'',individual:{A:'Dendro 80%'}});
});

test('Jadeplume shows an overall baseline, its Dendro exception, and a separate weakened reduction',()=>{
  const name='Jadeplume Terrorshroom';
  const encounter=data.seasons[29].Lunar[3].encounters[0];
  const details=enemyResistanceDetails(encounter.resistances,[name]);
  assert.equal(groupedResistances(details.byEnemy,[name]).individual[name],
    'All RES 25%; Dendro 80%\nWeakened: All RES -25%');
});

test('Mimics, Consecrated Beasts, and Whisperer use baseline/exception and state-change formatting',()=>{
  const render=(act,index)=>{
    const encounter=data.seasons[29].Lunar[act].encounters[index];
    const enemies=encounterEnemyIds(encounter).map(id=>catalog[id]);
    const names=enemies.map(enemy=>enemy.name);
    const details=enemyResistanceDetails(encounter.resistances,names);
    return groupedResistances(details.byEnemy,names,Object.fromEntries(enemies.map(enemy=>[enemy.name,enemy.baseResistances])));
  };
  const mimics=render(5,1);
  assert.equal(mimics.individual['Hydro Mimic Boar'],'All RES 15%; Pyro -40%; Hydro immune');
  assert.match(mimics.individual['Hydro Mimic Crane'],/^All RES 15%; Hydro immune; Electro -40%$/);
  assert.equal(render(6,0).individual['Lord of the Hidden Depths: Whisperer of Nightmares'],'Weakened: All RES -70%');
  const beasts=render(11,0);
  assert.equal(beasts.individual['Consecrated Horned Crocodile'],'All RES 40%; Hydro 70%');
  assert.equal(beasts.individual['Consecrated Fanged Beast'],'All RES 40%; Dendro 70%');
  assert.doesNotMatch(Object.values(beasts.individual).join('\n'),/\b10%/);
});

test('player text keeps gameplay goals and estimates but removes research commentary',()=>{
  assert.equal(playerDetailText('Clear (graphic-sourced): defeat all opponents within 110 s.'),'Clear: defeat all opponents within 1m 50s.');
  assert.equal(playerDetailText('190s, 120 s, 60s, 55s, 3m 10s.'),'3m 10s, 2m, 60s, 55s, 3m 10s.');
  assert.equal(playerDetailText('Star Challenge (same-act historical inference): finish with at least 35% monolith HP. This threshold is not printed in the graphic.'),'Star Challenge: finish with at least 35% monolith HP.');
  assert.equal(playerDetailText('Inferred from July 2026 Act 2: Thunder strikes.'),'Thunder strikes.');
  assert.equal(playerDetailText('Wave 1: 3 Tatankasaurus.\nWave order estimated; confirm during a run.'),'Wave 1: 3 Tatankasaurus.');
  assert.equal(playerEnemyNotes('Current enemy types (Alioth:\n• Enemy\n\n6 enemies total (graphic).\nWave 1: 3 enemies.\nThe graphic says only Trooper; Alioth distinguishes variants.'),'6 enemies total.\nWave 1: 3 enemies.');
});

test('all curated gameplay fields are free from research attribution in player view',()=>{
  assert.equal(playerActRequirements('Protect the monolith.'),'Protect the monolith.');
  for(const modes of Object.values(data.seasons))for(const acts of Object.values(modes))for(const act of Object.values(acts))for(const encounter of act.encounters){
    const visible=[playerActRequirements(act.requirements),playerDetailText(encounter.name),playerEnemyNotes(encounter.enemies),playerDetailText(encounter.requirements),playerDetailText(encounter.stageEffects??''),playerDetailText(encounter.mechanics??'')].join('\n');
    assert.doesNotMatch(visible,/\b(?:Alioth|Fandom|graphic|historical|inference|reference|confidence|artwork|caption)\b/i);
    assert.doesNotMatch(resistanceExceptions(encounter.resistances),/(?<![\d.-])10%/);
  }
});

test('every listed enemy has a bundled PNG portrait and repeated source links do not duplicate enemies',()=>{
  const used=new Set();
  for(const act of Object.values(data.seasons[29].Lunar))for(const encounter of act.encounters){
    for(const id of encounterEnemyIds(encounter)){
      used.add(id);
      assert.ok(catalog[id],`Missing enemy ${id}`);
      const png=readFileSync(new URL('./assets/enemies/'+catalog[id].icon,import.meta.url));
      assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    }
  }
  assert.equal(used.size,62);
  const encounter=research.seasons[29].Lunar[3].encounters[0];
  assert.deepEqual(encounterEnemyIds({...encounter,sources:[...encounter.sources,...encounter.sources]}),['61101']);
});

test('shipped act data contains gameplay and enemy IDs without source links or research metadata',()=>{
  // Published gameplay text can include personal edits made after research.
  // Check its structure and sanitization without overwriting those edits.
  const prepared=siteActDetails(research);
  for(const [season,modes]of Object.entries(prepared.seasons))for(const [mode,acts]of Object.entries(modes))for(const [act,record]of Object.entries(acts)){
    assert.deepEqual(record.encounters.map(encounter=>encounter.enemyIds),data.seasons[season][mode][act].encounters.map(encounter=>encounter.enemyIds));
  }
  assert.doesNotMatch(JSON.stringify(prepared),/alioth|fandom|https?:|graphicSources|confidence|"sources"|"research"/i);
  assert.deepEqual(siteActDetails(data),data);
  assert.equal(playerDetailText('Enemy group 1'),'Enemy lineup 1');
  assert.doesNotMatch(JSON.stringify(data),/alioth|fandom|https?:|graphicSources|confidence|"sources"|"research"/i);
  const draft=structuredClone(research);
  draft.seasons[29].Lunar[3].notes='My team note';
  draft.seasons[29].Lunar[3].encounters[0].notes='My boss note';
  const cleaned=siteActDetails(draft);
  assert.equal(cleaned.seasons[29].Lunar[3].notes,'My team note');
  assert.equal(cleaned.seasons[29].Lunar[3].encounters[0].notes,'My boss note');
  assert.deepEqual(cleaned.seasons[29].Lunar[3].encounters[0].enemyIds,['61101']);
});
