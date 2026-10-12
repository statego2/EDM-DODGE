/** Local-first progression logic; independent of the DOM and browser storage. */
export const GOALS=Object.freeze({
 neon:Object.freeze({near:8,salvage:1,title:'Flow Training'}),
 siege:Object.freeze({near:14,salvage:2,title:'Crossfire Specialist'}),
 rift:Object.freeze({near:18,salvage:2,title:'Phantom Hunter'})
});
export function missionGoals(id='neon'){return GOALS[id]||GOALS.neon;}
export function evaluateMission(run){
 const goals=missionGoals(run.mission),complete=Boolean(run.finished&&!run.dead);
 const objectives=[
  {label:'Survive the full track',met:complete},
  {label:`${goals.near} near misses`,met:complete&&run.near>=goals.near},
  {label:`${goals.salvage} salvage capsules`,met:complete&&run.pickups>=goals.salvage}
 ];
 return {title:goals.title,stars:objectives.filter(o=>o.met).length,objectives};
}
export function recordMission(previous,mission,difficulty,score,stars){
 const key=`${['neon','siege','rift'].includes(mission)?mission:'neon'}:${['rookie','pilot','ace'].includes(difficulty)?difficulty:'pilot'}`;
 const existing=previous&&typeof previous==='object'&&!Array.isArray(previous)?previous:{};
 const entry=existing[key]||{};
 return {...existing,[key]:{best:Math.max(0,Number(entry.best)||0,Number(score)||0),stars:Math.max(0,Number(entry.stars)||0,Math.min(3,Math.max(0,Number(stars)||0)))}};
}
export function getRecord(records,mission,difficulty){
 const key=`${mission}:${difficulty}`,v=records&&records[key];
 return {best:Math.max(0,Number(v?.best)||0),stars:Math.max(0,Number(v?.stars)||0)};
}
