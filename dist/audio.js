import {BEAT,TOTAL_BEATS,phaseAt} from './engine.js';
// Original procedural track: 144 BPM, 120 seconds. The audio clock owns gameplay.
export class Soundtrack{
 constructor(){this.ctx=null;this.timer=null;this.next=0;this.origin=0;this.muted=false;}
 async start(mission='neon'){this.stop();this.mission=['neon','siege','rift'].includes(mission)?mission:'neon';const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Web Audio unavailable');this.ctx=new AC();await this.ctx.resume();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.48;const compressor=this.ctx.createDynamicsCompressor();this.master.connect(compressor);compressor.connect(this.ctx.destination);this.origin=this.ctx.currentTime+.12;this.next=0;this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.schedule();this.timer=setInterval(()=>this.schedule(),25);}
 get time(){return this.ctx?Math.max(0,this.ctx.currentTime-this.origin):0;}
 tone(at,freq,duration,type,volume,endFreq){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,at+duration);g.gain.setValueAtTime(.001,at);g.gain.linearRampToValueAtTime(volume,at+.008);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(this.master);o.start(at);o.stop(at+duration+.02);}
 hiss(at,duration,volume,cutoff){const s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=this.noise;f.type='highpass';f.frequency.value=cutoff;g.gain.setValueAtTime(volume,at);g.gain.exponentialRampToValueAtTime(.001,at+duration);s.connect(f);f.connect(g);g.connect(this.master);s.start(at);s.stop(at+duration);}
 schedule(){if(!this.ctx||this.ctx.state!=='running')return;while(this.next< TOTAL_BEATS*4&&this.origin+this.next*BEAT/4<this.ctx.currentTime+.18){const s=this.next++,beat=s/4,t=this.origin+beat*BEAT,p=phaseAt(beat),quarter=s%4===0;const bar=Math.floor(beat/4);const progressions={neon:[110,87.307,130.813,97.999],siege:[82.407,98,73.416,110],rift:[92.499,87.307,65.406,82.407]};const root=progressions[this.mission||'neon'][Math.floor(bar/4)%4];
  if(quarter){this.tone(t,125,.16,'sine',p.power>=2?.65:.4,40);if(beat%4===1||beat%4===3)this.hiss(t,.13,.22,1300);}
  if(s%2===0)this.hiss(t,.045,.06,7000);
  if(p.power===1&&s%2===0)this.hiss(t,.08,.04+(beat-32)/640,2200);
  if(p.power>=2){if(s%2===0){this.tone(t,root*(s%8===6?2:1),.13,'sawtooth',.10);this.tone(t,root/2,.18,'sine',.24);}const notes=this.mission==='rift'?[0,3,7,12,10,7,5,3]:this.mission==='siege'?[0,7,10,12,15,12,7,3]:[0,7,12,15,12,7,3,7];this.tone(t,root*4*Math.pow(2,notes[s%8]/12),.09,'triangle',.10);if(p.power>=3&&s%8===7)this.hiss(t,.075,.08,6000);}
  else if(s%4===0){this.tone(t,root*2,.34,'triangle',.15);if(s%8===0)this.tone(t,root*4*Math.pow(2,7/12),.5,'sine',.06);}
 }}
 effect(type){if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime;if(type==='near'){this.tone(t,880,.07,'sine',.16);this.tone(t+.05,1320,.1,'sine',.12);}else if(type==='dash')this.hiss(t,.2,.16,1500);else this.hiss(t,.25,.38,180);}
 mute(){this.muted=!this.muted;if(this.ctx&&this.master)this.master.gain.setTargetAtTime(this.muted?0:.48,this.ctx.currentTime,.03);return this.muted;}
 async pause(){if(this.ctx)await this.ctx.suspend();}
 async resume(){if(this.ctx)await this.ctx.resume();}
 stop(){clearInterval(this.timer);this.timer=null;if(this.ctx){this.ctx.close().catch(()=>{});this.ctx=null;}}
}
