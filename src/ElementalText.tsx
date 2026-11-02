import type {ReactNode} from 'react';
import {mechanicsTokens} from './mechanicsText';
import physicalIcon from './assets/elements/Physical_Icon.png';

export function ElementalText({text,icons=true,values=false,renderState}:{text:string;icons?:boolean;values?:boolean;renderState?:(text:string)=>ReactNode}){
  return <>{mechanicsTokens(text).map((token,index)=>{
    if(token.kind==='reaction')return <span key={index} className={`mechanics-reaction reaction-${token.reaction}`}>{token.text}</span>;
    if(token.kind==='element'||token.kind==='gauge')return <span key={index} className={`mechanics-element ${token.element}${token.kind==='gauge'?' is-gauge':''}`}>
      {token.kind==='gauge'&&<span>{token.text}</span>}{icons&&<img src={token.element==='Physical'?physicalIcon:`${import.meta.env.BASE_URL}icons/elements/${token.element}_Icon.png`} alt="" width="14" height="14"/>}{token.element}
    </span>;
    if(token.kind==='state'&&renderState)return <span key={index}>{renderState(token.text)}</span>;
    return token.kind==='value'&&values?<span key={index} className="mechanics-value">{token.text}</span>:token.text;
  })}</>;
}
