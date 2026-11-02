import easy from './assets/difficulties/Easy.webp';
import normal from './assets/difficulties/Normal.webp';
import hard from './assets/difficulties/Hard.webp';
import visionary from './assets/difficulties/Visionary.webp';
import lunar from './assets/difficulties/Lunar.webp';

const medals:Record<string,string>={Easy:easy,Normal:normal,Hard:hard,Visionary:visionary,Lunar:lunar};
const modes=Object.keys(medals);

export function DifficultySelect({value,onChange}:{value:string;onChange:(value:string)=>void}){
  return <span className="difficulty-select">
    {medals[value]&&<img key={value} src={medals[value]} alt="" width="44" height="44"/>}
    <select aria-label="Difficulty" value={value} onChange={event=>onChange(event.target.value)}>{modes.map(mode=><option key={mode}>{mode}</option>)}</select>
  </span>;
}
