import {enemyPortraitFile} from './enemyIdentity';

const icons=import.meta.glob('./assets/enemies/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;

// Resolve at display time: exported overrides keep their original portable URLs.
export function bossPortrait(name:string,fallback:string|null):string|undefined {
  const file=enemyPortraitFile(name);
  return (file?icons[`./assets/enemies/${file}`]:undefined)??fallback??undefined;
}
