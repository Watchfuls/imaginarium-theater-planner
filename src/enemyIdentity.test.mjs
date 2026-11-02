import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import bosses from './data/theater-bosses.json' with {type:'json'};
import {canonicalEnemyName,enemyPortraitFile} from './enemyIdentity.ts';

test('every current boss preview has a local portrait, including alternate names',()=>{
  for(const entries of Object.values(bosses.seasons[29]))for(const boss of entries){
    const file=enemyPortraitFile(boss.name);
    assert.ok(file,`Missing portrait for ${boss.name}`);
    assert.ok(existsSync(new URL(`./assets/enemies/${file}`,import.meta.url)));
  }
  assert.equal(canonicalEnemyName('Churldric'),'Battle-Hardened Samachurl');
  assert.equal(canonicalEnemyName("Potapo's Solidarity"),"Potapo's Solidarity: Secret Shadow's Re-Emergence");
});

test('unmapped bosses keep their identity and allow the existing image fallback',()=>{
  assert.equal(canonicalEnemyName('Custom Boss'),'Custom Boss');
  assert.equal(enemyPortraitFile('Custom Boss'),undefined);
});
