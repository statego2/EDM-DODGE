import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSIONS,missionFor,missionChart,moveToward,scoreKey,awardSalvage} from '../dist/missions.js';
const base=[{beat:10,type:'missile',x:200,y:-40,vy:200,r:9}];
test('three authored missions and fallback are stable',()=>{assert.deepEqual(Object.keys(MISSIONS),['neon','siege','rift']);assert.equal(missionFor('bad').id,'neon');assert.equal(scoreKey('rift','ace'),'rift:ace');assert.equal(scoreKey('unknown','unlisted'),'neon:pilot');});
test('mission charts are deterministic sorted and independent of their inputs',()=>{for(const name of Object.keys(MISSIONS)){const a=missionChart(base,name),b=missionChart(base,name);assert.deepEqual(a,b);assert.ok(a.length>base.length);assert.ok(a.every((e,i)=>i===0||e.beat>=a[i-1].beat));assert.ok(a.every(e=>e.beat<288));assert.equal(a.filter(e=>e.type==='pickup').length,4);}assert.deepEqual(base,[{beat:10,type:'missile',x:200,y:-40,vy:200,r:9}]);assert.ok(missionChart(base,'rift').length>missionChart(base,'siege').length);});
test('mission two preserves the break; mission three adds lateral ambushes',()=>{const siege=missionChart([],'siege'),rift=missionChart([],'rift');assert.equal(siege.filter(e=>e.beat>=128&&e.beat<160&&e.type!=='pickup').length,0);assert.ok(rift.some(e=>e.type==='missile'&&e.vx>200));assert.ok(rift.some(e=>e.type==='missile'&&e.vx<-200));assert.ok(rift.some(e=>e.type==='gate'));});
test('mobile movement is speed limited and clamped',()=>{const current={x:300,y:650},next=moveToward(current,{x:1e9,y:-1e9},10);assert.ok(Math.hypot(next.x-current.x,next.y-current.y)<=10+1e-9);assert.deepEqual(moveToward(current,{x:305,y:654},100),{x:305,y:654});assert.deepEqual(moveToward(current,{x:NaN,y:1},100),current);assert.deepEqual(current,{x:300,y:650});});
test('salvage repairs before awarding bonus points',()=>{const run={hp:1,maxHp:3,score:0,pickups:0};assert.equal(awardSalvage(run),'SHIELD RESTORED');assert.equal(run.hp,2);assert.equal(run.score,300);awardSalvage(run);assert.equal(run.hp,3);assert.equal(awardSalvage(run),'SALVAGE BONUS +650');assert.equal(run.hp,3);assert.equal(run.pickups,3);assert.equal(run.score,1250);});

test('Phantom Rift reserves its final drop for readable hunter encounters',()=>{
 const finale=missionChart([], 'rift').filter(e=>e.beat>=224);
 assert.equal(finale.filter(e=>e.type==='boss').length,3);
 assert.equal(finale.filter(e=>e.type==='missile').length,9);
 assert.equal(finale.filter(e=>e.type==='gate'||e.type==='mine'||e.type==='homing').length,0);
});
