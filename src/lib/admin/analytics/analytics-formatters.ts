export const percent=(part:number,total:number)=>total?Math.round(part/total*1000)/10:0;
export const average=(values:number[])=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:0;
export function increment(map:Record<string,number>,key:string){map[key]=(map[key]??0)+1}
export const trDay=(n:number)=>['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][n];
export type Comparison={current:number;previous:number;absolute:number;percentage:number|null;label:string};
export function comparison(current:number,previous:number):Comparison{const absolute=current-previous,percentage=previous===0?null:Math.round(absolute/previous*1000)/10;return{current,previous,absolute,percentage,label:percentage===null?'Karşılaştırma için yeterli veri yok':`${absolute>=0?'+':''}${absolute} · %${percentage>=0?'+':''}${percentage}`}}
