import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createRun,step,DURATION} from '../dist/engine.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(join(root,path),'utf8');
test('all browser element bindings have matching HTML ids',()=>{
 const script=read('dist/game.js'),html=read('dist/index.html');
 const ids=[...script.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
 assert.ok(ids.length>30);
 for(const id of new Set(ids))assert.ok(new RegExp(`id=["']${id}["']`).test(html),`Missing id: ${id}`);
 for(const id of ['mission','missionInfo','missionName','missionNumber','missionTitle','start','dash'])assert.ok(html.includes(`id="${id}"`));
});
test('browser modules exist, resolve their imports and have valid syntax',()=>{
 for(const name of ['game','audio','engine','missions','visuals']){
  const path=join(root,'dist',`${name}.js`);assert.ok(existsSync(path));
  const checked=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
  assert.equal(checked.status,0,`${name}.js: ${checked.stderr}`);
  for(const match of read(`dist/${name}.js`).matchAll(/from ['"](\.\/.+?)['"]/g))
   assert.ok(existsSync(join(root,'dist',match[1])),`Import ${match[1]} missing`);
 }
});
test('all three missions run to completion without leaks or non-finite scores',()=>{
 for(const mission of ['neon','siege','rift']){
  const run=createRun(mission),events=[];run.invulnerable=Infinity;
  for(let i=1;i<=DURATION*60+1;i++){
   const time=Math.min(DURATION,i/60);
   step(run,time,1/60,{x:0,y:0},type=>events.push(type));
   assert.ok(Number.isFinite(run.score),mission+' has invalid score');
   assert.ok(run.hazards.length<100,mission+' leaked active hazards');
   if(run.finished)break;
  }
  assert.equal(run.finished,true,`${mission} cannot finish`);
  assert.ok(run.next>0);assert.ok(events.includes('complete'));
  if(mission==='rift')assert.equal(events.filter(e=>e==='boss').length,3);
 }
});
test('touch target moves continuously and pickups cannot be collected twice',()=>{
 const run=createRun('neon');run.chart=[];
 step(run,.01,.01,{target:{x:550,y:150}});
 assert.ok(Math.hypot(run.player.x-300,run.player.y-650)<=3.55+1e-8);
 const x=run.player.x,y=run.player.y;
 run.hazards=[{type:'pickup',x,y,px:x,py:y,r:16,vx:0,vy:0,age:0}];
 const called=[];step(run,.02,.01,{},(type,msg)=>called.push([type,msg]));
 assert.equal(run.pickups,1);assert.ok(run.score>650);assert.equal(called[0][0],'pickup');
 step(run,.03,.01);assert.equal(run.pickups,1);
});

test('PWA manifest and offline cache list all shipped ES modules',()=>{
 const html=read('dist/index.html'),manifest=JSON.parse(read('dist/manifest.webmanifest')),serviceWorker=read('dist/sw.js');
 assert.ok(html.includes('rel="manifest"'));assert.equal(manifest.display,'standalone');
 assert.ok(manifest.icons.some(icon=>existsSync(join(root,'dist',icon.src))));
 for(const asset of ['game.js','engine.js','missions.js','audio.js','progression.js','index.html','style.css','visuals.js','visual-upgrade.css','manifest.webmanifest','icon.svg'])assert.ok(serviceWorker.includes(`'./${asset}'`),`Offline cache missing ${asset}`);
 const checked=spawnSync(process.execPath,['--check',join(root,'dist','sw.js')],{encoding:'utf8'});
 assert.equal(checked.status,0,checked.stderr);
});
