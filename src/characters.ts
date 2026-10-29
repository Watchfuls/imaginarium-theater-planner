export const ELEMENTS = ['Pyro','Hydro','Electro','Cryo','Dendro','Anemo','Geo'] as const;
export type Element = typeof ELEMENTS[number];
export type Character = {name:string;element:Element};
// Editable starter roster. Extend this list as new characters release.
const roster: Record<Element,string> = {
Pyro:'Amber,Arlecchino,Bennett,Chevreuse,Dehya,Diluc,Durin,Ga Ming,Hu Tao,Klee,Lyney,Mavuika,Nicole,Pyro Traveler,Thoma,Xiangling,Xinyan,Yoimiya,Yanfei',
Hydro:'Aino,Ayato,Barbara,Candace,Columbina,Dahlia,Furina,Hydro Traveler,Kokomi,Mona,Mualani,Neuvillette,Nilou,Sigewinne,Tartaglia,Vodyanitsa,Xingqiu,Yelan',
Electro:'Alyosha,Beidou,Clorinde,Cyno,Dori,Electro Traveler,Fischl,Flins,Iansan,Ineffa,Keqing,Kuki Shinobu,Lisa,Ororon,Raiden Shogun,Razor,Sara,Sethos,Varesa,Yae Miko',
Cryo:'Aloy,Charlotte,Chongyun,Citlali,Cryo Traveler,Diona,Eula,Escoffier,Freminet,Ganyu,Kaeya,Lohen,Layla,Mika,Odette,Qiqi,Rosaria,Sandrone,Shenhe,Skirk,Wriothesley,Ayaka',
Dendro:'Alhaitham,Baizhu,Collei,Dendro Traveler,Emilie,Kaveh,Kinich,Kirara,Lauma,Nahida,Nefer,Tighnari,Yaoyao',
Anemo:'Anemo Traveler,Chasca,Faruzan,Heizou,Ifa,Jahoda,Jean,Kazuha,Lan Yan,Lynette,Mizuki,Prune,Sayu,Sucrose,Varka,Venti,Vesna,Wanderer,Xianyun,Xiao',
Geo:'Albedo,Chiori,Gorou,Geo Traveler,Illuga,Itto,Kachina,Linnea,Navia,Ningguang,Noelle,Xilonen,Yun Jin,Zhongli,Zibai'
};
export const CHARACTERS: Character[] = ELEMENTS.flatMap(element=>roster[element].split(',').map(name=>({name,element}))).sort((a,b)=>a.name.localeCompare(b.name));
