import {useEffect,useRef,useState} from 'react';
import {assignmentPlaceholderLabel,elementPlaceholder,placeholderElement,unallocatedPlaceholder} from './assignmentPlaceholders';
import type {Element} from './characters';
import type {Character} from './characters';
import {CharacterIcon,ElementBadge} from './CharacterVisuals';

export function BorrowedCharacterPicker({characters,selected,onSelect,open,onOpenChange,canSelect}:{characters:Character[];selected:string;onSelect:(name:string)=>void;open:boolean;onOpenChange:(open:boolean)=>void;canSelect:(name:string)=>boolean}){
  const container=useRef<HTMLDivElement>(null);
  const [query,setQuery]=useState('');
  useEffect(()=>{if(!open)setQuery('');},[open]);
  useEffect(()=>{
    if(!open)return;
    const closeOnOutsideClick=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!container.current?.contains(event.target))onOpenChange(false);
    };
    document.addEventListener('pointerdown',closeOnOutsideClick);
    return ()=>document.removeEventListener('pointerdown',closeOnOutsideClick);
  },[open,onOpenChange]);
  const selectedCharacter=characters.find(character=>character.name===selected);
  const filtered=characters.filter(character=>character.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="borrowed-picker" ref={container}>
    <button className="borrowed-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={()=>onOpenChange(!open)}>
      {selectedCharacter?<><CharacterIcon name={selectedCharacter.name}/><span>{selectedCharacter.name}</span><ElementBadge element={selectedCharacter.element}/></>:<span>No supporting character</span>}
      <span className="borrowed-chevron" aria-hidden="true">▾</span>
    </button>
    {open&&<div className="borrowed-menu">
      <input className="borrowed-search" aria-label="Search supporting characters" placeholder="Search characters…" value={query} onChange={event=>setQuery(event.target.value)}/>
      <div className="borrowed-options" role="listbox" aria-label="Supporting character options">
        <button type="button" role="option" aria-selected={!selected} className="borrowed-option" onClick={()=>{onSelect('');onOpenChange(false);}}>No supporting character</button>
        {filtered.map(character=><button type="button" role="option" aria-selected={character.name===selected} disabled={!canSelect(character.name)} className="borrowed-option" key={character.name} onClick={()=>{onSelect(character.name);onOpenChange(false);}}>
          <CharacterIcon name={character.name}/><span>{character.name}</span><ElementBadge element={character.element}/>
        </button>)}
        {filtered.length===0&&<p className="selection-empty">No characters match your search.</p>}
      </div>
    </div>}
  </div>;
}
export function ActAssignmentPicker({act,slot,placeholderElements,characters,chosenNames,selected,borrowed,opening,guests,canSelect,isExhausted,onSelect,open,onOpenChange}:{act:number;slot:number;placeholderElements:Element[];characters:Character[];chosenNames:Set<string>;selected:string;borrowed:string;opening:Set<string>;guests:Set<string>;canSelect:(name:string)=>boolean;isExhausted:(name:string)=>boolean;onSelect:(name:string)=>void;open:boolean;onOpenChange:(open:boolean)=>void}){
  const selectedElement=placeholderElement(selected);
  const placeholderLabel=assignmentPlaceholderLabel(selected);
  const characterLabel=(name:string)=>name===borrowed?'Supporting':opening.has(name)?'Opening':guests.has(name)?'Guest':'';
  const container=useRef<HTMLDivElement>(null);
  const [query,setQuery]=useState('');
  useEffect(()=>{if(!open)setQuery('');},[open]);
  useEffect(()=>{
    if(!open)return;
    const closeOnOutsideClick=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!container.current?.contains(event.target))onOpenChange(false);
    };
    document.addEventListener('pointerdown',closeOnOutsideClick);
    return ()=>document.removeEventListener('pointerdown',closeOnOutsideClick);
  },[open,onOpenChange]);
  const selectedCharacter=characters.find(character=>character.name===selected);
  const matchingCharacters=characters.filter(character=>
    (Boolean(query)||chosenNames.has(character.name))
    &&character.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  const availableCharacters=matchingCharacters.filter(character=>canSelect(character.name));
  const elementCharacters=selectedElement?characters.filter(character=>character.element===selectedElement&&character.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())):[];
  const unavailableCharacters=matchingCharacters.filter(character=>!canSelect(character.name)&&!isExhausted(character.name));
  const exhaustedCharacters=matchingCharacters.filter(character=>!canSelect(character.name)&&isExhausted(character.name));
  return <div className="act-picker" ref={container} onKeyDown={event=>{
    const trigger=container.current?.querySelector<HTMLButtonElement>('.act-picker-trigger');
    if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();onOpenChange(false);trigger?.focus();return;}
    if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
    event.preventDefault();
    if(!open){onOpenChange(true);return;}
    const options=Array.from(container.current?.querySelectorAll<HTMLButtonElement>('.act-picker-option:not(:disabled):not(.clear-act-option)')??[]);
    if(!options.length)return;
    const index=options.indexOf(document.activeElement as HTMLButtonElement);
    const next=index<0?(event.key==='ArrowDown'?0:options.length-1):(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
    options[next].focus();
    options[next].scrollIntoView({block:'nearest'});
  }}>
    <button className="act-picker-trigger" type="button" aria-label={`Act ${act}, slot ${slot+1}${selectedCharacter?`: ${selectedCharacter.name}`:placeholderLabel?`: ${placeholderLabel}`:''}`} title={selectedCharacter?.name??placeholderLabel} aria-haspopup="listbox" aria-expanded={open} draggable={Boolean(selected)} onDragStart={event=>{if(!selected)return;event.dataTransfer.setData('application/x-itp-act-slot',`${act}:${slot}`);event.dataTransfer.effectAllowed='move';}} onClick={()=>onOpenChange(!open)}>
      {selectedCharacter?<><CharacterIcon name={selectedCharacter.name}/><span className="act-picker-identity"><span className="act-picker-name">{selectedCharacter.name}</span>{characterLabel(selectedCharacter.name)&&<small>{characterLabel(selectedCharacter.name)}</small>}</span><ElementBadge element={selectedCharacter.element}/></>:placeholderLabel?<><span className="act-picker-name">{placeholderLabel}</span>{selectedElement&&<ElementBadge element={selectedElement}/>}</>:<span className="act-empty-label"><span>+ Slot </span>{slot+1}</span>}
      <span className="borrowed-chevron" aria-hidden="true">▾</span>
    </button>
    {open&&<div className="act-picker-menu">
      <input autoFocus className="act-picker-search" type="search" aria-label={`Search characters for Act ${act}, slot ${slot+1}`} placeholder="Search characters…" value={query} onChange={event=>setQuery(event.target.value)}/>
      <div className="act-picker-options" role="listbox" aria-label={`Act ${act}, slot ${slot+1} characters`}>
      <div className="act-picker-options-content">
      <button type="button" role="option" aria-selected={!selected} className="act-picker-option clear-act-option" onClick={()=>{onSelect('');onOpenChange(false);}}>Clear slot</button>
      {selectedElement&&<>
        <div className="act-picker-group-label">{selectedElement} characters</div>
        {elementCharacters.map(character=><button type="button" role="option" aria-selected={false} disabled={!canSelect(character.name)} className="act-picker-option" key={character.name} onClick={()=>{onSelect(character.name);onOpenChange(false);}}>
          <CharacterIcon name={character.name}/><span className="act-picker-identity"><span className="act-picker-name">{character.name}</span><small>{isExhausted(character.name)?'Exhausted':characterLabel(character.name)}</small></span><ElementBadge element={character.element}/>
        </button>)}
        {elementCharacters.length===0&&<p className="selection-empty">No {selectedElement} characters match your search.</p>}
        <div className="act-picker-divider" role="separator"/>
      </>}
      {availableCharacters.map(character=><button type="button" role="option" aria-selected={character.name===selected} className="act-picker-option" key={character.name} onClick={()=>{onSelect(character.name);onOpenChange(false);}}>
        <CharacterIcon name={character.name}/><span className="act-picker-identity"><span className="act-picker-name">{character.name}</span>{characterLabel(character.name)&&<small>{characterLabel(character.name)}</small>}</span><ElementBadge element={character.element}/>
      </button>)}
      {exhaustedCharacters.length>0&&<><div className="act-picker-group-label">Exhausted</div>{exhaustedCharacters.map(character=><button type="button" role="option" aria-selected={character.name===selected} className="act-picker-option" key={character.name} disabled onClick={()=>{onSelect(character.name);onOpenChange(false);}}>
        <CharacterIcon name={character.name}/><span className="act-picker-identity"><span className="act-picker-name">{character.name}</span>{characterLabel(character.name)&&<small>{characterLabel(character.name)}</small>}</span><ElementBadge element={character.element}/>
      </button>)}</>}
      {unavailableCharacters.length>0&&<><div className="act-picker-group-label">Unavailable</div>{unavailableCharacters.map(character=><button type="button" role="option" aria-selected={character.name===selected} className="act-picker-option" key={character.name} disabled onClick={()=>{onSelect(character.name);onOpenChange(false);}}>
        <CharacterIcon name={character.name}/><span className="act-picker-identity"><span className="act-picker-name">{character.name}</span>{characterLabel(character.name)&&<small>{characterLabel(character.name)}</small>}</span><ElementBadge element={character.element}/>
      </button>)}</>}
      <div className="act-picker-divider" role="separator"/>
      <div className="act-picker-group-label">Reserve a slot</div>
      {[...placeholderElements.map(elementPlaceholder),unallocatedPlaceholder].map(value=><button type="button" role="option" aria-selected={selected===value} aria-label={assignmentPlaceholderLabel(value)} className="act-picker-option" key={value} onClick={()=>{onSelect(value);onOpenChange(false);}}>
        <span className="act-picker-name">{assignmentPlaceholderLabel(value)}</span>{placeholderElement(value)&&<ElementBadge element={placeholderElement(value)!}/>}
      </button>)}
      {matchingCharacters.length===0&&<p className="selection-empty">No characters match your search.</p>}
      </div>
      </div>
    </div>}
    {selected&&<button className="act-clear-button" type="button" aria-label={`Clear Act ${act}, slot ${slot+1}`} title="Clear slot" onClick={()=>onSelect('')}>×</button>}
  </div>;
}
export function CharacterSelectionGrid({characters,selected,limit,disabled,unavailableNames=[],onToggle}:{characters:Character[];selected:string[];limit:number;disabled:boolean;unavailableNames?:string[];onToggle:(name:string)=>void}){
  const [query,setQuery]=useState('');
  const filtered=characters.filter(c=>c.name.toLowerCase().includes(query.toLowerCase()));
  return <><input className="selection-search" aria-label="Search characters" placeholder="Search characters…" value={query} onChange={e=>setQuery(e.target.value)} disabled={disabled}/><div className="characters selection-grid">{filtered.map(c=>{
    const checked=selected.includes(c.name);
    const unavailable=disabled||(!checked&&(selected.length>=limit||unavailableNames.includes(c.name)));
    return <div className={'character '+(checked?'owned':'')} key={c.name} role="checkbox" aria-checked={checked} tabIndex={unavailable?-1:0} aria-label={c.name} aria-disabled={unavailable} onClick={()=>{if(!unavailable)onToggle(c.name);}} onKeyDown={e=>{if(!unavailable&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onToggle(c.name);}}}><div className="character-top"><CharacterIcon name={c.name}/><ElementBadge element={c.element}/><strong>{c.name}</strong></div></div>;
  })}{filtered.length===0&&<p className="selection-empty">No characters match your search.</p>}</div></>;
}
