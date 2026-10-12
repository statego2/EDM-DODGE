/** Deterministic beat-based mission expansion: no DOM, audio or randomness. */
export const MISSIONS = Object.freeze({
 neon:Object.freeze({id:'neon',number:'01',title:'NEON OVERDRIVE',subtitle:'Interceptor training · learn the flow',accent:'#75ffef',tier:1}),
 siege:Object.freeze({id:'siege',number:'02',title:'SKYFIRE SIEGE',subtitle:'Crossfire corridors · rapid pursuit',accent:'#ffb66c',tier:2}),
 rift:Object.freeze({id:'rift',number:'03',title:'PHANTOM RIFT',subtitle:'Ambush vectors · elite survival',accent:'#cd97ff',tier:3})
});
export const MISSION_IDS=Object.freeze(Object.keys(MISSIONS));
export function missionFor(id){return MISSIONS[id]||MISSIONS.neon;}
const event=(beat,type,properties)=>({beat,type,...properties});
export function missionChart(baseChart,id='neon'){
 const mission=missionFor(id),chart=baseChart.filter(e=>!(mission.id==='rift'&&e.beat>=224&&e.beat<280&&e.type!=='laser')).map(e=>({...e}));
 const push=(beat,type,data)=>chart.push(event(beat,type,data));
 for(const beat of [44,116,180,244]){const x=110+((beat*43+mission.tier*71)%380);push(beat,'pickup',{x,y:-45,vx:0,vy:155,r:16});}
 if(mission.id==='neon')return chart.sort((a,b)=>a.beat-b.beat);
 for(let b=36;b<280;b+=4){
  if((b>=128&&b<160)||(mission.id==='rift'&&b>=224))continue;
  const hard=b>=160,x=68+((b*59+mission.tier*97)%464);
  if(b%16===4){for(let i=-1;i<=1;i++)push(b+(i+1)*.2,'missile',{x:300+i*148,y:-72,vx:i*(hard?36:24),vy:hard?325:285,r:9});}
  else if(b%16===12)push(b,'homing',{x,y:-68,vx:0,vy:hard?305:260,r:12,tracking:hard?1.35:.95});
  if(hard&&b%24===8)push(b+.5,'mine',{x:560-x/2,y:-40,vx:0,vy:205,r:21});
 }
 if(mission.id==='rift'){
  for(let b=64;b<280;b+=8){
   if(b>=128&&b<160||b>=224)continue;
   const fromLeft=(b/8)%2===0;
   push(b+.5,'missile',{x:fromLeft?-20:620,y:250+((b*19)%290),vx:fromLeft?255:-255,vy:90,r:10});
   push(b+1.5,'missile',{x:fromLeft?620:-20,y:280+((b*13)%270),vx:fromLeft?-235:235,vy:100,r:10});
  }
  for(let b=172;b<224;b+=24){const safeGap=195+((b*37)%210);push(b+2,'gate',{gap:safeGap,half:87,y:-40,vy:265,r:18});}
  // Final-wave hunter carriers act as mobile mini-bosses, not invulnerable screen walls.
  for(const beat of [228,244,260]){
   push(beat,'boss',{x:300+Math.sin(beat)*110,y:-80,vx:0,vy:130,r:39,tracking:2.4});
   for(let i=-1;i<=1;i++)push(beat+1+(i+1)*.2,'missile',{x:300+i*166,y:-74,vx:i*35,vy:340,r:10});
  }
 }
 return chart.sort((a,b)=>a.beat-b.beat);
}
export function moveToward(point,target,maxDelta,bounds={minX:23,maxX:577,minY:115,maxY:740}){
 if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))return {x:point.x,y:point.y};
 const tx=Math.max(bounds.minX,Math.min(bounds.maxX,target.x)),ty=Math.max(bounds.minY,Math.min(bounds.maxY,target.y));
 const dx=tx-point.x,dy=ty-point.y,distance=Math.hypot(dx,dy);
 if(distance<1e-8)return {x:point.x,y:point.y};
 const ratio=Math.min(1,Math.max(0,maxDelta)/distance);
 return {x:point.x+dx*ratio,y:point.y+dy*ratio};
}
export function scoreKey(mission,difficulty){return `${missionFor(mission).id}:${['rookie','pilot','ace'].includes(difficulty)?difficulty:'pilot'}`;}
export function awardSalvage(run){
 if(run.hp<(run.maxHp||3)){run.hp+=1;run.pickups=(run.pickups||0)+1;run.score+=300;return 'SHIELD RESTORED';}
 run.pickups=(run.pickups||0)+1;run.score+=650;return 'SALVAGE BONUS +650';
}
