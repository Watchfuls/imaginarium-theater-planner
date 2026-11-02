export function storedText(key:string,fallback:string):string {
  try{return localStorage.getItem(key)??fallback;}catch{return fallback;}
}

export function stored<T>(key:string,fallback:T,valid?:(value:unknown)=>boolean):T {
  try{
    const text=localStorage.getItem(key);
    if(text===null)return fallback;
    const value:unknown=JSON.parse(text);
    return value!==null&&(!valid||valid(value))?value as T:fallback;
  }catch{return fallback;}
}

export function saveText(key:string,value:string):boolean {
  try{localStorage.setItem(key,value);return true;}catch{return false;}
}
