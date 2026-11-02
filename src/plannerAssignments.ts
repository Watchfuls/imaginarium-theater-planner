// Hidden assignments are retained when changing difficulty but consume no vigor.
export function activeAssignments(acts:Record<number,string[]>,normalActs:number,lunarActs=0):Record<number,string[]> {
  return Object.fromEntries(Object.entries(acts).filter(([key])=>{
    const act=Number(key);
    return Number.isInteger(act)&&act>0&&(act<=normalActs||(act>=11&&act<11+lunarActs));
  }));
}

export function cappedCast(opening:string[],roster:string[],borrowed:string,cap:number):string[] {
  const names=[...new Set([...opening,...roster])].filter(name=>name!==borrowed);
  return [...names.slice(0,Math.max(0,cap-(borrowed?1:0))),...(borrowed?[borrowed]:[])];
}
