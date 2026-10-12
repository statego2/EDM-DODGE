import test from 'node:test';
import assert from 'node:assert/strict';
import {missionGoals,evaluateMission,recordMission,getRecord} from '../dist/progression.js';
test('mission objective thresholds reward distinct skill paths',()=>{
 assert.equal(missionGoals('neon').near,8);
 assert.equal(missionGoals('siege').near,14);
 assert.equal(missionGoals('rift').near,18);
});
test('medals require a complete mission and scale with performance',()=>{
 const run={mission:'neon',finished:true,dead:false,near:12,pickups:2};
 assert.equal(evaluateMission(run).stars,3);
 run.pickups=0;assert.equal(evaluateMission(run).stars,2);
 run.finished=false;assert.equal(evaluateMission(run).stars,0);
 run.finished=true;run.dead=true;assert.equal(evaluateMission(run).stars,0);
});
test('high scores and medals never regress or cross mission boundaries',()=>{
 const a=recordMission({},'neon','pilot',900,2),b=recordMission(a,'neon','pilot',500,1);
 assert.deepEqual(getRecord(b,'neon','pilot'),{best:900,stars:2});
 const c=recordMission(b,'rift','ace',1400,3);
 assert.equal(getRecord(c,'rift','ace').stars,3);
 assert.equal(getRecord(c,'siege','pilot').best,0);
 assert.equal(Object.keys(a).length,1);
});
