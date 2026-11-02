import catalog from './data/theater-enemies.json' with {type:'json'};

const aliases:Record<string,string>={
  Churldric:'Battle-Hardened Samachurl',
  "Potapo's Solidarity":"Potapo's Solidarity: Secret Shadow's Re-Emergence",
};

export const canonicalEnemyName=(name:string)=>aliases[name]??name;

const portraits=new Map(Object.values(catalog).map(enemy=>[enemy.name,enemy.icon]));
export const enemyPortraitFile=(name:string)=>portraits.get(canonicalEnemyName(name));
