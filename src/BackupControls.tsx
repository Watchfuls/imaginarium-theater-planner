import {useRef,useState} from 'react';
import {createPlannerBackup,parsePlannerBackup,type PlannerSave} from './plannerBackup';
import {DriveControls} from './DriveControls';

export function BackupControls({save,onRestore}:{save:PlannerSave;onRestore:(save:PlannerSave)=>string}){
  const input=useRef<HTMLInputElement>(null);
  const [message,setMessage]=useState('');
  const [expanded,setExpanded]=useState(false);
  function download(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(createPlannerBackup(save))],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=url;link.download=`imaginarium-planner-${new Date().toISOString().slice(0,10)}.json`;
    link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    setMessage('Backup downloaded. Keep this file to restore your settings on another device.');
  }
  async function restore(file:File){
    try{
      if(file.size>2*1024*1024)throw new Error('This file is too large to be a planner backup.');
      const restored=parsePlannerBackup(JSON.parse(await file.text()));
      if(!window.confirm('Restore this backup? It will replace your characters and preferences, plus your challenge setup and plan if its season is available. Unavailable-season plans are kept as history. Download a backup first to keep your current settings.'))return;
      setMessage(onRestore(restored));
    }catch(error){setMessage(`Restore failed: ${error instanceof Error?error.message:'Unable to read this file.'}`);}
    finally{if(input.current)input.current.value='';}
  }
  return <details className="backup-controls" onToggle={event=>setExpanded(event.currentTarget.open)}><summary>Saves &amp; backups</summary>
    <p>Move your characters, current challenge setup, and plan between devices with one backup file.</p>
    <div className="actions"><button type="button" onClick={download}>Download backup</button><button type="button" onClick={()=>input.current?.click()}>Restore backup</button></div>
    <input ref={input} type="file" accept=".json,application/json" aria-label="Planner backup file" hidden onChange={event=>{const file=event.target.files?.[0];if(file)void restore(file);}}/>
    {message&&<p role="status">{message}</p>}
    {expanded&&import.meta.env.VITE_GOOGLE_CLIENT_ID&&<DriveControls save={save} onRestore={onRestore} clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}/>}
    {!!save.history?.length&&<details><summary>Historical plans ({save.history.length})</summary>
      <p>Saved team selections for reference. Historical enemy details are not included.</p>
      {save.history.map((entry,index)=><details key={index}><summary>Season {entry.setup.seasonId??'custom'} · {entry.setup.difficulty}</summary>
        <p>Elements: {entry.setup.elements.join(', ')}. Cast: {entry.plan.roster.join(', ')||'None'}.</p>
        {Object.entries(entry.plan.acts).map(([act,team])=><p key={act}>Act {act}: {team.map(name=>name||'Empty').join(' / ')||'Empty'}</p>)}
      </details>)}
    </details>}
  </details>;
}
