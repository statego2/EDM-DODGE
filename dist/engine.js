import {missionChart,moveToward,awardSalvage} from './missions.js';
export const W=600,H=800,BPM=144,BEAT=60/BPM,TOTAL_BEATS=288,DURATION=TOTAL_BEATS*BEAT;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const PHASES=[{beat:0,name:'INITIALIZE',hint:'Find your flow',power:0},{beat:32,name:'BUILD UP',hint:'Pressure rising',power:1},{beat:64,name:'FIRST DROP',hint:'Ride the barrage',power:2},{beat:128,name:'BREATHING ROOM',hint:'Stay in motion',power:0},{beat:160,name:'SECOND DROP',hint:'Thread the needle',power:3},{beat:224,name:'FINAL OVERDRIVE',hint:'Bring it home',power:4}];
export function phaseAt(beat){return PHASES.findLast(p=>beat>=p.beat)||PHASES[0];}
export function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;const t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
// Every event is authored in beat space. Replays use exactly the same chart.
export function makeChart(){const events=[];const add=(beat,type,data)=>events.push({beat,type,...data});
 for(let b=8;b<280;b+=2){const p=phaseAt(b).power;const lane=80+((b*73)%440);const speed=220+p*38;
  if(b<32||b>=128&&b<160){add(b,'missile',{x:lane,y:-50,vx:0,vy:speed,r:9});if(b%8===0)add(b,'drone',{x:520-lane/2,y:-50,vx:0,vy:170,r:18});continue;}
  if(b%8===0){const gap=130+Math.sin(b*.23)*150+150;add(b,'gate',{gap,half:p>=3?83:100,y:-40,vy:185+p*15,r:18});}
  else {const count=p>=2?3:2;for(let i=0;i<count;i++){const x=65+((b*47+i*160)%470);add(b+i*.25,'missile',{x,y:-70-i*15,vx:Math.sin(b+i)*22,vy:speed,r:9});}}
  if(p>=2&&b%16===12){const x=100+((b*41)%400);add(b,'laser',{x,y:0,w:22,warn:.9,active:.32});}
  if(p>=3&&b%16===6)add(b,'homing',{x:lane,y:-80,vx:0,vy:240,r:12,tracking:1.0});
  if(b%16===2)add(b,'mine',{x:100+((b*23)%400),y:-40,vx:0,vy:150,r:21});
 }
 return events.sort((a,b)=>a.beat-b.beat);
}
export function createRun(mission='neon'){return {mission,t:0,next:0,chart:missionChart(makeChart(),mission),hazards:[],player:{x:300,y:650,px:300,py:650},hp:3,maxHp:3,pickups:0,score:0,combo:0,bestCombo:0,near:0,hits:0,invulnerable:0,dashUntil:0,dashReady:0,finished:false,dead:false};}
export function dash(run){if(run.t<run.dashReady||run.dead||run.finished)return false;run.dashUntil=run.t+.32;run.invulnerable=Math.max(run.invulnerable,run.t+.32);run.dashReady=run.t+3.5;return true;}
export function rank(run){return run.hits===0&&run.near>=12?'S':run.hits<=1&&run.near>=5?'A':run.hits<=2?'B':'C';}
function segmentRectDistance(ax,ay,bx,by,l,t,r,b){let lo=0,hi=1;const dx=bx-ax,dy=by-ay;for(const [origin,delta,min,max] of [[ax,dx,l,r],[ay,dy,t,b]]){if(Math.abs(delta)<1e-9){if(origin<min||origin>max){lo=2;break;}}else{let a=(min-origin)/delta,z=(max-origin)/delta;if(a>z)[a,z]=[z,a];lo=Math.max(lo,a);hi=Math.min(hi,z);}}if(lo<=hi)return 0;const point=(x,y)=>Math.hypot(Math.max(l-x,0,x-r),Math.max(t-y,0,y-b));return Math.min(point(ax,ay),point(bx,by),...[[l,t],[r,t],[l,b],[r,b]].map(([x,y])=>segmentDistance(x,y,ax,ay,bx,by)));}
export function distanceToHazard(h,p){if(h.type==='laser')return h.age>=h.warn&&h.age<h.warn+h.active?segmentRectDistance(p.px,p.py,p.x,p.y,h.x-h.w/2,115,h.x+h.w/2,H):Infinity;
 if(h.type==='gate'){const ay=p.py-h.py,by=p.y-h.y;return Math.min(segmentRectDistance(p.px,ay,p.x,by,0,-h.r,h.gap-h.half,h.r),segmentRectDistance(p.px,ay,p.x,by,h.gap+h.half,-h.r,W,h.r));}
 return segmentDistance(0,0,h.px-p.px,h.py-p.py,h.x-p.x,h.y-p.y)-h.r;}
export function step(run,time,dt,input={x:0,y:0},onEvent=()=>{}){if(run.dead||run.finished)return;run.t=time;const p=run.player;p.px=p.x;p.py=p.y;
 const boost=time<run.dashUntil?1.6:1;const n=Math.hypot(input.x,input.y)||1;const normalized=n>1?1/n:1;p.x=clamp(p.x+input.x*normalized*355*boost*dt,23,W-23);p.y=clamp(p.y+input.y*normalized*355*boost*dt,115,H-60);
 if(input.target){const q=moveToward(p,input.target,355*boost*dt);p.x=q.x;p.y=q.y;}
 while(run.next<run.chart.length&&run.chart[run.next].beat*BEAT<=time){const e=run.chart[run.next++];run.hazards.push({...e,px:e.x,py:e.y,age:0,grazed:false,hit:false});if(e.type==='boss')onEvent('boss',e);}
 for(const h of run.hazards){h.px=h.x;h.py=h.y;h.age+=dt;
  if((h.type==='homing'||h.type==='boss')&&h.age<h.tracking){const target=clamp((p.x-h.x)*.85,h.type==='boss'?-85:-125,h.type==='boss'?85:125);h.vx+=(target-h.vx)*Math.min(1,dt*3);}
  if(h.type!=='laser'){h.x+=(h.vx||0)*dt;h.y+=h.vy*dt;}
  const d=distanceToHazard(h,p);
  if(h.type==='pickup'){
   if(!h.collected&&d<12){h.collected=true;onEvent('pickup',awardSalvage(run));}
   continue;
  }
  if(!h.hit&&d<7&&time>=run.invulnerable){h.hit=true;run.hp--;run.hits++;run.combo=0;run.invulnerable=time+1.35;onEvent('hit',h);if(run.hp<=0){run.dead=true;onEvent('dead');break;}}
  else if(!h.hit&&!h.grazed&&d>=7&&d<32&&time>=run.invulnerable&&h.type!=='laser'){h.grazed=true;run.near++;run.combo++;run.bestCombo=Math.max(run.bestCombo,run.combo);run.score+=100*(1+Math.min(4,Math.floor(run.combo/5)));onEvent('near',h);}
 }
 run.hazards=run.hazards.filter(h=>h.type==='laser'?h.age<h.warn+h.active:h.type==='pickup'?!h.collected&&h.y<H+100:h.y<H+100&&h.x>-120&&h.x<W+120);
 run.score+=dt*25;if(!run.dead&&time>=DURATION){run.finished=true;onEvent('complete');}
}
