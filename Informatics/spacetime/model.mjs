// Spacetime mathematics, v1. Calendar alignment is an explicit research convention.
export const DAY = 86400000;
export const ZERO = Date.parse('2012-12-21T11:00:00Z'); // 06:00 Colombia, UTC−05:00.
export const ANCHOR = Date.parse('2000-01-01T00:00:00Z');
export const mod = (x, n) => ((x % n) + n) % n;
export const ALPHA = (() => { let a=0,b=1; const s=[]; do {s.push(a); [a,b]=[b,(a+b)%9];} while(a!==0||b!==1); return s; })();
// Each string lists lines bottom to top. Yang=1; bottom line has weight 2^0.
export const KING_BITS = '111111 000000 100010 010001 111010 010111 010000 000010 111011 110111 111000 000111 101111 111101 001000 000100 100110 011001 110000 000011 100101 101001 000001 100000 100111 111001 100001 011110 010010 101101 001110 011100 001111 111100 000101 101000 101011 110101 001010 010100 110001 100011 111110 011111 000110 011000 010110 011010 101110 011101 100100 001001 001011 110100 101100 001101 011011 110110 010011 110010 110011 001100 101010 010101'.split(' ');
export const KING_INTS = KING_BITS.map(b=>[...b].reduce((v,c,i)=>v+Number(c)*2**i,0));
export const KING = KING_INTS.map(n=>n%9);
export const HAMMING = KING_BITS.map((b,i)=>[...b].reduce((n,c,j)=>n+Number(c!==KING_BITS[(i+1)%64][j]),0));
export function calendarCoordinate(ms, unit='month') {
  const d=new Date(ms), y=d.getUTCFullYear(), m=d.getUTCMonth();
  if(unit==='day') return (ms-ANCHOR)/DAY;
  if(unit==='month') {const a=Date.UTC(y,m,1), b=Date.UTC(y,m+1,1); return (y-2000)*12+m+(ms-a)/(b-a);}
  const a=Date.UTC(y,0,1),b=Date.UTC(y+1,0,1);
  return (y-2000+(ms-a)/(b-a))/(unit==='decade'?10:1);
}
export function coordinate(ms, unit, anchor=ANCHOR) {return calendarCoordinate(ms,unit)-calendarCoordinate(anchor,unit);}
export function fromCoordinate(x,unit,anchor=ANCHOR) {
  const c=x+calendarCoordinate(anchor,unit);
  if(unit==='day')return ANCHOR+c*DAY;
  if(unit==='month'){const n=Math.floor(c),y=2000+Math.floor(n/12),m=mod(n,12),a=Date.UTC(y,m,1);return a+(c-n)*(Date.UTC(y,m+1,1)-a);}
  const v=c*(unit==='decade'?10:1),n=Math.floor(v),y=2000+n,a=Date.UTC(y,0,1);return a+(v-n)*(Date.UTC(y+1,0,1)-a);
}
export function interpolate(seq, x) {const i=Math.floor(x),f=x-i;return seq[mod(i,seq.length)]*(1-f)+seq[mod(i+1,seq.length)]*f;}
export function entropy(seq, i, window=12) {
  const counts=new Map(); for(let j=0;j<window;j++){const v=seq[mod(i-j,seq.length)];counts.set(v,(counts.get(v)||0)+1);}
  return [...counts.values()].reduce((h,c)=>h-(c/window)*Math.log2(c/window),0);
}
export function transform(seq, x, method='values', depth=3) {
  if(method==='change') {const i=Math.floor(x);return Math.abs(seq[mod(i+1,seq.length)]-seq[mod(i,seq.length)]);}
  if(method==='entropy') return entropy(seq,Math.floor(x));
  if(method==='multiscale') {let total=0,weight=0;for(let k=0;k<depth;k++){total+=interpolate(seq,x*2**k)/2**k;weight+=1/2**k;}return total/weight;}
  return interpolate(seq,x);
}
// Port of Peter Meyer's public-domain twz-point.c (1998, Linux port John A Phelps).
// Kelley seed, factor 64, Apple II normalization 64^3; original pre-zero domain.
export function timewave(daysToZero, seed) {
  if(daysToZero<0 || !Number.isFinite(daysToZero)) return null;
  if(daysToZero===0) return 0;
  const v=y=>interpolate(seed,y);
  let sum=0;
  for(let p=1;daysToZero>=p;p*=64) sum+=v(daysToZero/p)*p;
  for(let i=1;i<=32;i++) {const p=64**i, next=sum+v(daysToZero*p)/p;if(next===sum&&sum!==0) break;sum=next;}
  return sum/64**3;
}
export function timewaveAt(ms,seed){return timewave((ZERO-ms)/DAY,seed);}
export function extent(values){const xs=values.filter(Number.isFinite);return xs.length?[Math.min(...xs),Math.max(...xs)]:[0,1];}
