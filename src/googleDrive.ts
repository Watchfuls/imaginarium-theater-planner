import {createPlannerBackup,parsePlannerBackup,type PlannerSave} from './plannerBackup.ts';

export const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
const filename='imaginarium-planner.json';
const api='https://www.googleapis.com/drive/v3/files';
export type DriveFile={id:string;modifiedTime?:string};
export class DriveError extends Error {
  status:number;
  constructor(message:string,status:number){super(message);this.status=status;}
}
export class PlannerDrive {
  private token:string;
  private request:typeof fetch;
  constructor(token:string,request:typeof fetch=fetch){this.token=token;this.request=request;}
  private async call(url:string,init:RequestInit={}){
    const response=await this.request.call(globalThis,url,{...init,headers:{...init.headers,Authorization:`Bearer ${this.token}`}});
    if(!response.ok)throw new DriveError(response.status===401?'Your Google connection expired. Connect again.':response.status===403?'Google Drive access was denied. Check that the Drive API is enabled and access was granted.':`Google Drive request failed (${response.status}). Try again.`,response.status);
    return response;
  }
  async find():Promise<DriveFile|null>{
    const query=new URLSearchParams({spaces:'appDataFolder',q:`name = '${filename}' and trashed = false`,fields:'files(id,modifiedTime)',orderBy:'modifiedTime desc',pageSize:'1'});
    const data=await (await this.call(`${api}?${query}`)).json();
    return data.files?.[0]??null;
  }
  async load(file:DriveFile):Promise<PlannerSave>{
    const response=await this.call(`${api}/${encodeURIComponent(file.id)}?alt=media`);
    if(Number(response.headers.get('content-length'))>2*1024*1024)throw new Error('The Drive backup is too large.');
    const text=await response.text();
    if(new Blob([text]).size>2*1024*1024)throw new Error('The Drive backup is too large.');
    return parsePlannerBackup(JSON.parse(text));
  }
  async save(save:PlannerSave,file:DriveFile|null):Promise<void>{
    const content=JSON.stringify(createPlannerBackup(save));
    if(new Blob([content]).size>2*1024*1024)throw new Error('This backup is too large. Download a local backup instead.');
    if(file){
      await this.call(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(file.id)}?uploadType=media`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:content});
    }else{
      const boundary=`itp_${crypto.randomUUID()}`;
      const metadata=JSON.stringify({name:filename,mimeType:'application/json',parents:['appDataFolder']});
      const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
      await this.call('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
    }
  }
}

type TokenResponse={access_token?:string;expires_in?:number;scope?:string;error?:string};
type GoogleOAuth={initTokenClient:(config:{client_id:string;scope:string;include_granted_scopes:boolean;callback:(response:TokenResponse)=>void;error_callback:()=>void})=>{requestAccessToken:(options:{prompt:string})=>void}};
export const googleOAuth=()=> (window as Window & {google?:{accounts?:{oauth2?:GoogleOAuth}}}).google?.accounts?.oauth2;
let loading:Promise<void>|undefined;
export function loadGoogleIdentity():Promise<void>{
  if(googleOAuth())return Promise.resolve();
  return loading??=new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
    script.onload=()=>{if(googleOAuth())resolve();else{loading=undefined;script.remove();reject(new Error('Google sign-in could not initialize.'));}};
    script.onerror=()=>{loading=undefined;script.remove();reject(new Error('Google sign-in could not load. Check your connection or browser blocking settings.'));};
    document.head.appendChild(script);
  });
}

// Called directly from a click after the library is ready so browsers allow the popup.
export function connectGoogleDrive(clientId:string):Promise<{token:string;expiresAt:number}>{
  return new Promise((resolve,reject)=>{
    const oauth=googleOAuth();if(!oauth){reject(new Error('Google sign-in is still loading. Try again.'));return;}
    oauth.initTokenClient({client_id:clientId,scope:DRIVE_SCOPE,include_granted_scopes:false,
      callback:response=>{
        if(response.error||!response.access_token||!response.scope?.split(' ').includes(DRIVE_SCOPE)){
          reject(new Error('Google Drive permission was not granted.'));return;
        }
        resolve({token:response.access_token,expiresAt:Date.now()+Math.max(0,(Number(response.expires_in)||0)-30)*1000});
      },error_callback:()=>reject(new Error('Google sign-in was closed or blocked. Try connecting again.')),
    }).requestAccessToken({prompt:'select_account'});
  });
}
