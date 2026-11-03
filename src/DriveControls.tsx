import {useEffect,useState} from 'react';
import type {PlannerSave} from './plannerBackup';
import {connectGoogleDrive,loadGoogleIdentity,PlannerDrive,DriveError} from './googleDrive';

export function DriveControls({save,onRestore,clientId}:{save:PlannerSave;onRestore:(save:PlannerSave)=>string;clientId:string}){
  const [ready,setReady]=useState(false);
  const [connection,setConnection]=useState<{token:string;expiresAt:number}|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  function initialize(){setMessage('');void loadGoogleIdentity().then(()=>setReady(true)).catch(error=>setMessage(error.message));}
  useEffect(()=>{initialize();},[]);
  async function connect(){
    setBusy(true);setMessage('');
    try{setConnection(await connectGoogleDrive(clientId));setMessage('Connected. Choose Save to Drive or Load from Drive.');}
    catch(error){setMessage(error instanceof Error?error.message:'Unable to connect to Google.');}
    finally{setBusy(false);}
  }
  async function transfer(action:'save'|'load'){
    if(!connection||Date.now()>=connection.expiresAt){setConnection(null);setMessage('Your Google connection expired. Connect again.');return;}
    setBusy(true);setMessage('');
    try{
      const drive=new PlannerDrive(connection.token);
      const file=await drive.find();
      if(action==='save'){
        if(file&&!window.confirm(`Replace the backup in this Google account${file.modifiedTime?` (last saved ${new Date(file.modifiedTime).toLocaleString()})`:''} with this device’s current settings? Load from Drive first if you want to keep the cloud version.`))return;
        await drive.save(save,file);setMessage('Saved to Google Drive.');
      }else{
        if(!file){setMessage('No planner backup was found in this Google account. Save from your other device first.');return;}
        const restored=await drive.load(file);
        if(!window.confirm('Load the Drive backup? It will replace local characters and preferences, plus the plan if its season is available. Unavailable-season plans are kept as history. Download a backup first to keep your current settings.'))return;
        setMessage(onRestore(restored));
      }
    }catch(error){
      if(error instanceof DriveError&&(error.status===401||error.status===403))setConnection(null);
      setMessage(error instanceof Error?error.message:'Google Drive could not be reached.');
    }finally{setBusy(false);}
  }
  return <div className="drive-controls"><h3>Google Drive</h3>
    <p>Save and load manually between devices. Your backup is stored privately in this app’s Google Drive storage.</p>
    <div className="actions">
      {!ready?<button type="button" disabled={busy||!message} onClick={initialize}>{message?'Retry Google connection':'Loading Google connection…'}</button>:!connection?<button type="button" disabled={busy} onClick={()=>void connect()}>Connect Google Drive</button>:<>
        <button type="button" disabled={busy} onClick={()=>void transfer('save')}>Save to Drive</button>
        <button type="button" disabled={busy} onClick={()=>void transfer('load')}>Load from Drive</button>
        <button type="button" disabled={busy} onClick={()=>{setConnection(null);setMessage('Disconnected on this device. Your Drive backup is unchanged.');}}>Disconnect</button>
      </>}
    </div>
    {busy&&<p role="status">Working…</p>}
    {message&&<p role="status">{message}</p>}
  </div>;
}
