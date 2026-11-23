export const pct=v=>Number.isFinite(v)?`${v.toFixed(1)}%`:'—';
export function analyze(ticks,mode,barrier){const n=ticks.length,counts=Array(10).fill(0);ticks.forEach(t=>counts[t.digit]++);let hits=0,total=n,label='Even';
if(mode==='Even / Odd'){hits=ticks.filter(t=>t.digit%2===0).length;if(hits<n/2){hits=n-hits;label='Odd';}}
if(mode==='Over / Under'){const over=ticks.filter(t=>t.digit>barrier).length,under=ticks.filter(t=>t.digit<barrier).length;hits=Math.max(over,under);label=over>=under?`Over ${barrier}`:`Under ${barrier}`;}
if(mode==='Matches / Differs'){hits=n-counts[barrier];label=`Differs ${barrier}`;}
if(mode==='Rise / Fall'){total=Math.max(0,n-1);let up=0,down=0;for(let i=1;i<n;i++){if(ticks[i].price>ticks[i-1].price)up++;if(ticks[i].price<ticks[i-1].price)down++;}hits=Math.max(up,down);label=up>=down?'Rise':'Fall';}
const p=total?hits/total:0,z=1.96,den=1+z*z/(total||1),center=(p+z*z/(2*(total||1)))/den,margin=z*Math.sqrt((p*(1-p)+z*z/(4*(total||1)))/(total||1))/den;
const returns=ticks.slice(1).map((t,i)=>(t.price-ticks[i].price)/ticks[i].price*100),mean=returns.reduce((a,b)=>a+b,0)/(returns.length||1),vol=Math.sqrt(returns.reduce((a,b)=>a+(b-mean)**2,0)/(returns.length||1));
return {n,counts,label,p:p*100,low:Math.max(0,center-margin)*100,high:Math.min(1,center+margin)*100,total,confidence:n>=500?'Larger sample':n>=100?'Moderate sample':'Limited sample',vol,change:n>1?(ticks.at(-1).price/ticks[0].price-1)*100:0};}
