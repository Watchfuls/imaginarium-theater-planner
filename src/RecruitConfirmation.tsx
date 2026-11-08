import {useEffect,useRef} from 'react';

export function RecruitConfirmation({name,onAnswer}:{name:string;onAnswer:(yes:boolean)=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{dialog.current?.showModal();},[]);
  return <dialog ref={dialog} className="recruit-dialog" aria-labelledby="recruit-question" onCancel={event=>{event.preventDefault();onAnswer(false);}}>
    <p id="recruit-question">Recruit {name}?</p>
    <div><button type="button" onClick={()=>onAnswer(true)}>Yes</button><button type="button" autoFocus onClick={()=>onAnswer(false)}>No</button></div>
  </dialog>;
}
