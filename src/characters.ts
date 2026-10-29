export const ELEMENTS = ['Pyro','Hydro','Electro','Cryo','Dendro','Anemo','Geo'] as const;
export type Element = typeof ELEMENTS[number];
export type Character = {name:string;element:Element};
// Editable starter roster. Extend this list as new characters release.
const roster: Record<Element,string> = {
Pyro:'Amber,Arlecchino,Bennett,Chevreuse,Dehya,Diluc,Durin,Ga Ming,Hu Tao,Klee,Lyney,Mavuika,Thoma,Xiangling,Xinyan,Yoimiya,Yanfei',
Hydro:'Ayato,Barbara,Candace,Furina,Hydro Traveler,Kokomi,Mona,Mualani,Neuvillette,Nilou,Sigewinne,Tartaglia,Xingqiu,Yelan',
Electro:'Beidou,Clorinde,Cyno,Dori,Fischl,Iansan,Keqing,Kuki Shinobu,Lisa,Ororon,Raiden Shogun,Razor,Sara,Sethos,Varesa,Yae Miko',
Cryo:'Aloy,Charlotte,Chongyun,Citlali,Cryo Traveler,Diona,Eula,Freminet,Ganyu,Kaeya,Layla,Mika,Rosaria,Shenhe,Skirk,Wriothesley,Ayaka',
Dendro:'Alhaitham,Baizhu,Collei,Dendro Traveler,Emilie,Kinich,Kirara,Lauma,Nahida,Tighnari,Yaoyao',
Anemo:'Anemo Traveler,Chasca,Faruzan,Heizou,Ifa,Jean,Kazuha,Lan Yan,Lynette,Mizuki,Sayu,Sucrose,Venti,Wanderer,Xianyun,Xiao',
Geo:'Albedo,Chiori,Gorou,Geo Traveler,Itto,Kachina,Navia,Ningguang,Noelle,Xilonen,Yun Jin,Zhongli'
};
export const CHARACTERS: Character[] = ELEMENTS.flatMap(element=>roster[element].split(',').map(name=>({name,element}))).sort((a,b)=>a.name.localeCompare(b.name));
