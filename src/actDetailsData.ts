export type DetailSource = {label:string;url:string};
export type EncounterDetails = {name:string;enemies:string;resistances:string;requirements:string;notes:string;enemyIds?:string[];bountyEnemyIds?:string[];mechanics?:string;stageEffects?:string;status?:string;sources?:DetailSource[];graphicSources?:string[];inference?:{confidence:'high'|'medium'|'low';basis:string}};
export type ActDetailsRecord = {requirements:string;notes:string;encounters:EncounterDetails[];level?:number};
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
        seasons[season][mode][act]={...seasons[season][mode][act],...details,encounters};
      }
    }
  }
  return {...published,seasons};
}
