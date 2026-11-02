const elements='Physical|Pyro|Hydro|Electro|Cryo|Dendro|Anemo|Geo';
const reactions='Lunar(?:[- ](?:Charged|Bloom|Crystallize))?|Stellar(?:[- ](?:Conduct|Glimmer|Swirl))?|Electro[- ]Charged|Vaporize|Vape|Melt|Overloaded|Overload|Superconduct|Swirl|Crystallize|Hyperbloom|Burgeon|Bloom|Burning|Quicken|Aggravate|Spread|Freeze|Frozen';
const states='paraly[sz](?:ed|es|e|ing)|paralysis|stunned|stuns?|exhaust(?:ed|ion)|weaken(?:ed|s)?|disabled|disabling|Grief-Stricken|interrupt(?:ed|s|ion)?';
const pattern=new RegExp(`(?<gauge>\\b\\d+(?:\\.\\d+)?\\s*(?:GU|U)\\s+(?:of\\s+)?(?<gaugeElement>${elements})\\b)|(?<reaction>\\b(?:${reactions})\\b)|(?<state>\\b(?:${states})\\b)|(?<element>\\b(?:${elements})\\b)|(?<value>\\b\\d+(?:\\.\\d+)?(?:%|(?:GU|U)\\b|s\\b|m(?: \\d+s)?\\b))`,'gi');

export type MechanicsToken={kind:'text'|'gauge'|'state'|'element'|'reaction'|'value';text:string;element?:string;reaction?:string};
export function mechanicsTokens(text:string,reactionsOnly=false):MechanicsToken[]{
  const tokens:MechanicsToken[]=[];
  let end=0;
  for(const match of text.matchAll(reactionsOnly?new RegExp(`(?<reaction>\\b(?:${reactions})\\b)`,'gi'):pattern)){
    if(match.index>end)tokens.push({kind:'text',text:text.slice(end,match.index)});
    const groups=match.groups!;
    if(groups.gauge){
      const amount=match[0].match(/^\d+(?:\.\d+)?\s*(?:GU|U)/i)![0];
      tokens.push({kind:'gauge',text:amount,element:groups.gaugeElement[0].toUpperCase()+groups.gaugeElement.slice(1).toLowerCase()});
    }else if(groups.reaction)tokens.push({kind:'reaction',text:match[0],reaction:match[0].toLowerCase().replace(/[- ]/g,'')});
    else if(groups.state)tokens.push({kind:'state',text:match[0]});
    else if(groups.element)tokens.push({kind:'element',text:match[0],element:match[0][0].toUpperCase()+match[0].slice(1).toLowerCase()});
    else tokens.push({kind:'value',text:match[0]});
    end=match.index+match[0].length;
  }
  if(end<text.length)tokens.push({kind:'text',text:text.slice(end)});
  return tokens;
}
