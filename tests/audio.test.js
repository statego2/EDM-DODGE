import test from 'node:test';
import assert from 'node:assert/strict';
import {Soundtrack} from '../dist/audio.js';
const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
class FakeContext{
 constructor(){this.currentTime=0;this.sampleRate=100;this.state='suspended';this.destination={};this.starts=[];}
 createGain(){return{gain:param(),connect(){}};}createDynamicsCompressor(){return{connect(){}};}createBiquadFilter(){return{frequency:param(),connect(){}};}
 createOscillator(){return{frequency:param(),connect(){},start:t=>this.starts.push(t),stop(){}};}createBufferSource(){return{connect(){},start:t=>this.starts.push(t),stop(){}};}createBuffer(){return{getChannelData:()=>new Float32Array(100)};}
 async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}
}
test('audio shares one clock, suspends cleanly, and closes on restart/exit',async()=>{globalThis.window={AudioContext:FakeContext};const s=new Soundtrack();assert.equal(s.mute(),true);try{await s.start();const first=s.ctx;assert.equal(s.master.gain.value,0);assert.equal(s.time,0);first.currentTime=2.12;assert.ok(Math.abs(s.time-2)<1e-8);await s.pause();assert.equal(first.state,'suspended');const next=s.next;s.schedule();assert.equal(s.next,next);await s.resume();assert.equal(first.state,'running');s.schedule();assert.ok(s.next>next);assert.ok(first.starts.every(t=>t<first.currentTime+.18));await s.start();assert.equal(first.state,'closed');assert.equal(s.next,1);s.stop();assert.equal(s.ctx,null);assert.equal(s.timer,null);}finally{s.stop();delete globalThis.window;}});
