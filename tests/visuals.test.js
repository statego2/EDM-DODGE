import test from 'node:test';
import assert from 'node:assert/strict';
import {paintWorld,paintCraft,paintHazards,paintSpeedTrails,paintScreenGrade,PALETTES} from '../dist/visuals.js';

/**
 * A strict-enough Canvas2D spy to catch invalid transforms, argument shapes
 * and unsupported drawing calls without adding a native canvas dependency.
 */
function canvasSpy(){
 let draws=0;let saves=0;
 const gradients={addColorStop(offset,color){
  assert.ok(Number.isFinite(offset)&&offset>=0&&offset<=1);
  assert.equal(typeof color,'string');
 }};
 const methods=new Set(['beginPath','closePath','moveTo','lineTo','stroke','fill','fillRect','strokeRect','arc','rect','clip','save','restore','translate','rotate','scale','fillText','setLineDash']);
 const ctx=new Proxy({createLinearGradient:()=>gradients,createRadialGradient:()=>gradients},{
  get(target,prop){
   if(prop==='draws')return draws;
   if(prop==='depth')return saves;
   if(prop in target)return target[prop];
   if(methods.has(prop))return (...args)=>{
    if(['translate','rotate','scale','arc','rect','fillRect','strokeRect','moveTo','lineTo'].includes(prop))
     for(const x of args.slice(0,prop==='arc'?5:undefined))
      assert.ok(Number.isFinite(x),`Non-finite ${String(prop)} argument ${x}`);
    if(prop==='save')saves++;
    if(prop==='restore'){saves--;assert.ok(saves>=0,'Unbalanced restore');}
    draws++;
   };
   return undefined;
  },
  set(target,prop,value){target[prop]=value;return true;}
 });
 return ctx;
}
const sampleHazards=[
 {type:'missile',x:155,y:290,vx:0,vy:250,age:.5},
 {type:'homing',x:410,y:440,vx:22,vy:330,age:.8},
 {type:'drone',x:95,y:170,vx:0,vy:170,age:1},
 {type:'mine',x:280,y:360,vx:0,vy:150,age:.6},
 {type:'gate',y:365,gap:300,half:84,age:.5},
 {type:'laser',x:245,w:22,age:.7,warn:.9},
 {type:'laser',x:360,w:22,age:1.2,warn:.9},
 {type:'pickup',x:375,y:425,vx:0,vy:160,age:.2},
 {type:'boss',x:300,y:210,vx:0,vy:130,age:2}
];
test('all three mission palettes resolve to distinct looks',()=>{
 const ids=Object.keys(PALETTES);assert.deepEqual(ids,['neon','siege','rift']);
 assert.equal(new Set(ids.map(x=>PALETTES[x].accent)).size,3);
});
test('cinematic world, craft, each hazard and grading render without invalid geometry',()=>{
 for(const mission of ['neon','siege','rift']){
  for(const reduced of [false,true]){
   for(const [w,h] of [[390,844],[1440,900],[812,375]]){
    const c=canvasSpy();
    const scale=Math.min(w/600,h/800),view={x:(w-600*scale)/2,y:(h-800*scale)/2,scale};
    paintWorld(c,w,h,view,32.5,true,reduced,mission);
    paintWorld(c,w,h,view,12.8,false,reduced,mission);
    c.save();c.translate(view.x,view.y);c.scale(scale,scale);
    paintHazards(c,sampleHazards,reduced,mission);
    paintSpeedTrails(c,{x:300,y:600},35.2,reduced,mission);
    paintCraft(c,300,600,1,.17,35.2,false,reduced,mission);
    paintCraft(c,300,600,1,-.17,35.2,true,reduced,mission);
    c.restore();
    paintScreenGrade(c,w,h,reduced,mission);
    assert.equal(c.depth,0,'Unbalanced save/restore in '+mission);
    assert.ok(c.draws>100,'Artwork must not be blank');
   }
  }
 }
});
test('visual renderer is data-only and never modifies active mission entities',()=>{
 const hazards=structuredClone(sampleHazards),reference=structuredClone(sampleHazards);
 paintHazards(canvasSpy(),hazards,false,'rift');
 assert.deepEqual(hazards,reference);
});
