import {useState} from 'react';
import {saveText,storedText} from './browserStorage';

type Theme='light'|'dark';
const storageKey='itp-theme';

export function initializeTheme():Theme {
  const saved=storedText(storageKey,'');
  const theme=saved==='light'||saved==='dark'?saved:window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
  document.documentElement.dataset.theme=theme;
  return theme;
}

export function ThemeToggle(){
  const [theme,setTheme]=useState<Theme>(()=>document.documentElement.dataset.theme==='light'?'light':'dark');
  const next=theme==='dark'?'light':'dark';
  return <button className="theme-toggle" type="button" aria-label={`Switch to ${next} mode`} onClick={()=>{
    document.documentElement.dataset.theme=next;
    saveText(storageKey,next);
    setTheme(next);
  }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{theme==='dark'?<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"/>:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>}</svg>{theme==='dark'?'Dark':'Light'} mode</button>;
}
