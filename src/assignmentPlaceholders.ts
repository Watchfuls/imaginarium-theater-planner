import {ELEMENTS,type Element} from './characters.ts';

export const unallocatedPlaceholder='placeholder:unallocated';
export const elementPlaceholder=(element:Element)=>`placeholder:${element}`;
export const placeholderElement=(value:string):Element|undefined=>ELEMENTS.find(element=>value===elementPlaceholder(element));
export const isAssignmentPlaceholder=(value:string)=>value===unallocatedPlaceholder||placeholderElement(value)!==undefined;
export const assignmentPlaceholderLabel=(value:string)=>value===unallocatedPlaceholder?'Unallocated Character':placeholderElement(value)?`Any ${placeholderElement(value)}`:'';
