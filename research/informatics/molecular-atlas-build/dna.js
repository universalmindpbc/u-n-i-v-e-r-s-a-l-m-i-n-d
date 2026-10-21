// An idealised base-pair schematic. These are display coordinates, not measured DNA atoms.
export const DNA_WINDOW=48;
export const complement={A:'T',T:'A',C:'G',G:'C',N:'N'};
export const baseColors={A:0xd9b27a,T:0x82d4cf,C:0x86abd4,G:0xc4a3d9,N:0x89949d};
export function genomicPosition(g,offset){return g.strand===1?g.start+offset:g.end-offset;}
export function dnaWindow(g,offset=0){
 const start=Math.max(0,Math.min(Math.trunc(offset),g.sequence.length-DNA_WINDOW));
 const sequence=g.sequence.slice(start,start+DNA_WINDOW),rise=3.4,radius=10,twist=2*Math.PI/10.5;
 const point=(i,side)=>[(i-(sequence.length-1)/2)*rise,radius*Math.cos(i*twist+side*Math.PI),radius*Math.sin(i*twist+side*Math.PI)];
 return {kind:'gene',start,sequence,rise,radius,twist,point,sphere:{center:[0,0,0],radius:Math.hypot(sequence.length*rise/2,radius)+3},position:i=>genomicPosition(g,start+i)};
}
