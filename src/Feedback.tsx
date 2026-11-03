import {useEffect,useRef,useState} from 'react';

const formUrl='https://tally.so/r/jeZg4J';
const tally=()=> (window as Window & {Tally?:{loadEmbeds:()=>void}}).Tally;

export function Feedback(){
  const dialog=useRef<HTMLDialogElement>(null);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{
    if(!loaded)return;
    if(tally()){tally()?.loadEmbeds();return;}
    let script=document.querySelector<HTMLScriptElement>('script[data-feedback-embed]');
    const initialize=()=>tally()?.loadEmbeds();
    if(!script){
      script=document.createElement('script');
      script.src='https://tally.so/widgets/embed.js';
      script.async=true;
      script.dataset.feedbackEmbed='true';
      document.body.appendChild(script);
    }
    script.addEventListener('load',initialize);
    return ()=>script.removeEventListener('load',initialize);
  },[loaded]);
  return <>
    <button type="button" onClick={()=>{setLoaded(true);dialog.current?.showModal();}}>Send feedback</button>
    <dialog ref={dialog} className="feedback-dialog" aria-labelledby="feedback-title" onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close();}}>
      <div className="feedback-content">
        <div className="feedback-heading">
          <h2 id="feedback-title">Send feedback</h2>
          <button type="button" autoFocus onClick={()=>dialog.current?.close()} aria-label="Close feedback">Close</button>
        </div>
        <p>Form not loading? <a href={formUrl} target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.</p>
        <div className="feedback-body">
        {loaded&&<iframe title="Imaginarium Theater Planner feedback form" onLoad={()=>tally()?.loadEmbeds()} src="https://tally.so/embed/jeZg4J?hideTitle=1&alignLeft=1&dynamicHeight=1"/>}
        </div>
      </div>
    </dialog>
  </>;
}
