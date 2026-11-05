import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCustomSeasonPackage} from './customSeason.ts';

const validPackage=()=>({
  format:'imaginarium-theater-custom-season',
  version:1,
  season:{
    id:'2026-12-01',
    season:99,
    startsAt:'2026-12-01T00:00:00Z',
    endsAt:'2027-01-01T00:00:00Z',
    elements:['Pyro','Hydro','Anemo'],
    openingCharacters:[],
    specialGuests:[],
    bossStages:[],
    sourceUrl:''
  },
  actDetails:{seasons:{'99':{Hard:{1:{encounters:[{
    name:'Enemy lineup 1',
    enemies:'',
    resistances:'',
    requirements:'',
    notes:'',
    enemyIds:['123']
  }]}}}}},
  enemies:{'123':{
    name:'Test Enemy',
    iconUrl:'https://transform.alioth.wiki/i/gi/MonsterIcon/test.png',
    wikiUrl:'https://genshin-impact.fandom.com/wiki/Test_Enemy'
  }}
});

test('custom season package validates and normalizes its season and enemy data',()=>{
  const parsed=parseCustomSeasonPackage(validPackage());
  assert.equal(parsed.season.season,99);
  assert.equal(parseCustomSeasonPackage(JSON.parse(JSON.stringify(parsed))).season.season,99);
  assert.equal(parsed.actDetails.seasons['99'].Hard['1'].encounters[0].enemyIds[0],'123');
  assert.equal(parsed.enemies['123'].name,'Test Enemy');
});

test('custom season package rejects unsupported versions, mismatched act details, and untrusted image hosts',()=>{
  assert.throws(()=>parseCustomSeasonPackage({...validPackage(),version:2}),/Unsupported custom season/);
  const wrongSeason=validPackage();
  wrongSeason.actDetails.seasons['98']=wrongSeason.actDetails.seasons['99'];
  delete wrongSeason.actDetails.seasons['99'];
  assert.throws(()=>parseCustomSeasonPackage(wrongSeason),/Act Details are invalid/);
  const untrusted=validPackage();
  untrusted.enemies['123'].iconUrl='https://example.com/image.png';
  assert.throws(()=>parseCustomSeasonPackage(untrusted),/unsupported image host/);
});
