import previousMechanics from './data/theater-mechanics-history.json' with {type:'json'};
export type DetailSource = {label:string;url:string};
export type EncounterDetails = {name:string;enemies:string;resistances:string;requirements:string;notes:string;enemyIds?:string[];recommendedElements?:string[];keyRecommendations?:{label:string;element?:string;avoid?:boolean;icon?:'moon'}[];notableCharacters?:{name:string;reason:string;ability?:{name:string;icon:string}}[];bountyEnemyIds?:string[];mechanics?:string;stageEffects?:string;status?:string;sources?:DetailSource[];graphicSources?:string[];inference?:{confidence:'high'|'medium'|'low';basis:string}};
export type ActDetailsRecord = {requirements:string;notes:string;encounters:EncounterDetails[];level?:number;keyRecommendations?:EncounterDetails['keyRecommendations'];notableCharacters?:EncounterDetails['notableCharacters']};
export type ActDetailsData = {
  seasons:Record<string,Record<string,Record<string,ActDetailsRecord>>>;
  research?:Record<string,{checkedOn:string;summary:string;sources:DetailSource[]}>;
};

// An older browser draft must not hide newly researched seasons or acts.
export function mergeActDetailsDraft(published:ActDetailsData,draft:ActDetailsData):ActDetailsData {
  const seasons={...published.seasons};
  for(const [season,modes] of Object.entries(draft.seasons)){
    seasons[season]={...seasons[season]};
    for(const [mode,acts] of Object.entries(modes)){
      seasons[season][mode]={...seasons[season][mode]};
      for(const [act,details] of Object.entries(acts)){
        const bundled=published.seasons[season]?.[mode]?.[act];
        const encounters=details.encounters.map(encounter=>{
          const match=bundled?.encounters.find(candidate=>candidate.name===encounter.name||(
            encounter.enemyIds?.length&&candidate.enemyIds?.length&&
            [...encounter.enemyIds].sort().join(',')===[...candidate.enemyIds].sort().join(',')
          ));
          // Older saved drafts predate bounty markers; keep their notes and
          // edits while inheriting newly published target identities.
          let merged=encounter.bountyEnemyIds===undefined&&match?.bountyEnemyIds
            ? {...encounter,bountyEnemyIds:match.bountyEnemyIds}
            : encounter;
          if(match){
            if(season==='29'&&act==='9'&&match.name.startsWith('Elite Assault')&&match.bountyEnemyIds?.includes('40103')){
              const requirements=merged.requirements
                .replace(/^Clear: defeat 3 bounty opponents within (?:2m|120 s)\.$/m,'Clear: defeat 3 bounty opponents within 1m 40s.')
                .replace(/^Star Challenge: complete the bounty objective within (?:1m 20s|80 s)\.$/m,'Star Challenge: complete the bounty objective within 1m 5s.');
              const oldEffect='Thrilling Duel gives 40% increased damage inside an elite enemy’s Duel Zone and inflicts periodic damage outside.';
              const stageEffects=(merged.stageEffects??'').replace(/^Inferred stage effects:\s*/,'').trim()===oldEffect?match.stageEffects:merged.stageEffects;
              merged={...merged,requirements,stageEffects};
            }
            if(season==='29'&&(act==='1'||act==='2')&&match.name.startsWith('Elite Assault')){
              const previousEffects=(merged.stageEffects??'').replace(/^Inferred stage effects:\s*/,'').trim();
              const oldBombEffect='Treacherous Thunder plus Horrific Explosion, a timed bomb that transfers between enemies.';
              if(!previousEffects||(act==='2'&&previousEffects===oldBombEffect)){
                merged={...merged,stageEffects:match.stageEffects};
              }
            }
            if(season==='29'&&act==='1'&&match.enemyIds?.includes('60401')){
              const currentNote="The Geovishap's Pyro transformation adds 20% Pyro RES.";
              let resistances=merged.resistances;
              for(const oldNote of [
                "The Geovishap's transformations adds 20% RES to the respective element.",
                'Geovishap conversion adds 20% of resistance to its absorbed element; the current infusion is unverified.',
                'Geovishap conversion adds 20 percentage points of resistance to its absorbed element; the current infusion is unverified.',
              ])resistances=resistances.replace(oldNote,currentNote);
              merged={...merged,resistances,enemies:merged.enemies.replace('Wave 1: 1 Geovishap.','Wave 1: 1 Geovishap (Pyro).')};
            }
            if(encounter.enemyIds?.includes('10308')&&merged.resistances==='Completed soup greatly raises resistance; the amount is unverified.'){
              merged={...merged,resistances:match.resistances};
            }
            if(bundled?.keyRecommendations?.some(item=>item.label==='Taunts')){
              merged={...merged,keyRecommendations:merged.keyRecommendations?.filter(item=>item.label!=='Taunts'),notableCharacters:merged.notableCharacters?.filter(character=>!bundled.notableCharacters?.some(item=>item.name===character.name))};
            }
            if(season==='29'&&act==='11'&&/^(?:Current Alioth description: )?Geo bursts periodically damage the active character\.$/.test(merged.stageEffects??'')){
              merged={...merged,stageEffects:match.stageEffects};
            }
            const legacy=(previousMechanics as Record<string,string[]>)[`${season}/${act}/${match.name}`]??[];
            if(match.mechanics!==undefined&&(!merged.mechanics?.trim()||legacy.includes(merged.mechanics))){
              merged={...merged,mechanics:match.mechanics};
            }
            if(merged.keyRecommendations===undefined&&match.keyRecommendations)merged={...merged,keyRecommendations:match.keyRecommendations};
            if(merged.recommendedElements===undefined&&match.recommendedElements)merged={...merged,recommendedElements:match.recommendedElements};
            if(merged.notableCharacters===undefined&&match.notableCharacters)merged={...merged,notableCharacters:match.notableCharacters};
            if(season==='29'&&act==='12'&&merged.notableCharacters){
              merged={...merged,notableCharacters:merged.notableCharacters.filter(character=>!(['Neuvillette','Clorinde'].includes(character.name)&&character.reason==='Self-healing.'))};
              merged={...merged,notableCharacters:merged.notableCharacters?.map(character=>character.reason==="Healing helps fill the Protection Spirit's HP bar and strengthen its attack."?{...character,reason:''}:character)};
              const originalHealers=['Sigewinne','Sangonomiya Kokomi','Barbara'];
              if(merged.notableCharacters?.length===originalHealers.length&&merged.notableCharacters.every(character=>originalHealers.includes(character.name)&&!character.reason.trim())){
                merged={...merged,notableCharacters:match.notableCharacters};
              }
            }
            // Older Fluid Avatar drafts had no mechanics. Restore the newly
            // curated explanation without replacing any authored mechanics.
            if(/Fluid Avatar/i.test(match.name)&&!merged.mechanics?.trim()&&match.mechanics){
              merged={...merged,mechanics:match.mechanics};
            }
            if(merged.enemies.includes('6 enemies total across 2 waves (wave order unconfirmed).')||merged.enemies.includes('6 enemies total (graphic), arranged in 3 waves of 2 warriors.')||merged.enemies.includes('6 enemies total, arranged in 3 waves of 2 warriors.')){
              merged={...merged,enemies:match.enemies};
            }
            const genericWaves=/Wave 1: (?:1 saurian and 2 warriors\.|2 Troopers and 1 Hailstorm Cannoneer\.|3 × Tatankasaurus\.)\r?\nWave 2: [^\n]+/;
            if(genericWaves.test(merged.enemies)){
              const detailed=match.enemies.split('\n').filter(line=>/^(?:Wave \d+:|Group:)/.test(line)).join('\n');
              if(detailed)merged={...merged,enemies:merged.enemies.replace(genericWaves,()=>detailed)};
            }
          }
          return merged;
        });
        // Migrate drafts saved before the missing Season 29 Act 1 choice was restored.
        if(season==='29'&&act==='1'&&encounters.length===2&&encounters.every(encounter=>encounter.name.startsWith('Normal · '))){
          const elite=bundled?.encounters.find(encounter=>encounter.name.startsWith('Elite Assault'));
          if(elite)encounters.push(elite);
        }
        const notable=details.notableCharacters??bundled?.notableCharacters;
        const notableCharacters=notable?.map(character=>({...character,...(!character.ability&&bundled?.notableCharacters?.find(item=>item.name===character.name)?.ability?{ability:bundled.notableCharacters.find(item=>item.name===character.name)!.ability}:{})}));
        seasons[season][mode][act]={...seasons[season][mode][act],...details,encounters,...(notableCharacters?{notableCharacters}:{})};
      }
    }
  }
  return {...published,seasons};
}
