export interface CapacityInputs{space:number;equipment:number;staffed:number;}
export function availableThroughput(i:CapacityInputs){return Math.max(0,Math.min(i.space,i.equipment,i.staffed));}
export function utilizationBp(demand:number,capacity:number){return capacity<=0?(demand>0?10000:0):Math.min(20000,Math.round(demand*10000/capacity));}
