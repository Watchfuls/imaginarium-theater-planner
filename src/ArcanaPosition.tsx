import {moveArcana,stageLabel} from './stageOrder';

export function ArcanaPosition({stage,order,unlocked,onToggle,onMove,onDragStart,onDragEnd}:{
  stage:number;order:number[];unlocked:boolean;onToggle:()=>void;onMove:(before:number)=>void;
  onDragStart:(event:React.DragEvent)=>void;onDragEnd:()=>void;
}){
  const label=stageLabel(stage);
  return <span className="arcana-position">
    <button type="button" className={`arcana-lock ${unlocked?'unlocked':''}`} aria-label={`${unlocked?'Lock':'Unlock'} ${label} position`} aria-pressed={!unlocked}
      title={unlocked?'Drag to move. Moving clears this Arcana team and its pre-stage plans.':`Unlock to move ${label}. Moving clears its team and pre-stage plans.`}
      draggable={unlocked} onClick={onToggle} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/>{unlocked?<path d="M9 10V6a4 4 0 0 1 8 0"/>:<path d="M8 10V6a4 4 0 0 1 8 0v4"/>}<path d="M12 14v3"/></svg>
    </button>
    {unlocked&&<select aria-label={`Move ${label} before`} title="Moving clears this Arcana team and its pre-stage plans." value={order[order.indexOf(stage)+1]} onChange={event=>onMove(Number(event.target.value))}>
      {order.filter(before=>moveArcana(order,stage,before)!==order).map(before=><option key={before} value={before}>Before {stageLabel(before)}</option>)}
    </select>}
  </span>;
}
