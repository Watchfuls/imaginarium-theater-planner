import {useState} from 'react';
import type {Element} from './characters';

const CHARACTER_ICON_FILES: Record<string,string> = {
  'Ga Ming':'Gaming_Icon.webp',
  'Ayato':'Kamisato_Ayato_Icon.webp',
  'Ayaka':'Kamisato_Ayaka_Icon.webp',
  'Kokomi':'Sangonomiya_Kokomi_Icon.webp',
  'Kazuha':'Kaedehara_Kazuha_Icon.webp',
  'Heizou':'Shikanoin_Heizou_Icon.webp',
  'Sara':'Kujou_Sara_Icon.webp',
  'Raiden Shogun':'Raiden_Shogun_Icon.webp',
  'Itto':'Arataki_Itto_Icon.webp',
  'Yun Jin':'Yun_Jin_Icon.webp',
  'Mizuki':'Yumemizuki_Mizuki_Icon.webp',
  'Anemo Traveler':'AnemoTraveler_Icon.png',
  'Cryo Traveler':'CryoTraveler_Icon.png',
  'Dendro Traveler':'DendroTraveler_Icon.png',
  'Electro Traveler':'ElectroTraveler_Icon.png',
  'Geo Traveler':'GeoTraveler_Icon.png',
  'Hydro Traveler':'HydroTraveler_Icon.png',
  'Pyro Traveler':'PyroTraveler_Icon.png'
};
export function CharacterIcon({name}:{name:string}){
  const [failed,setFailed]=useState(false);
  const file=CHARACTER_ICON_FILES[name]??`${name.replace(/\s+/g,'_')}_Icon.webp`;
  return <span className="character-icon">{failed?<span className="icon-fallback">{name.charAt(0)}</span>:<img loading="lazy" alt={name} src={`${import.meta.env.BASE_URL}icons/characters/${file}`} onError={()=>setFailed(true)}/>}</span>;
}
export function ElementBadge({element}:{element:Element}){
  return <span className={`element ${element}`}>{element}<img className="element-icon" src={`${import.meta.env.BASE_URL}icons/elements/${element}_Icon.png`} alt="" aria-hidden="true"/></span>;
}
