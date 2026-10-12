
/**
 * RELI / ART SYSTEM 03
 * Procedural Canvas2D rendering. No textures, downloads or third-party libraries.
 * All simulation and collision data remain owned by engine.js.
 */
export const PALETTES=Object.freeze({
 neon:{accent:'#76fff0',edge:'#30a5d1',danger:'#ff557e',accent2:'#947fff',sky:'#060b1b',fog:'#103451'},
 siege:{accent:'#ffca87',edge:'#ed846b',danger:'#ff516a',accent2:'#75d8ff',sky:'#120b1b',fog:'#51263b'},
 rift:{accent:'#dbaaff',edge:'#9472fa',danger:'#ff5b92',accent2:'#8cfaff',sky:'#09091f',fog:'#30285c'}
});
const palette=id=>PALETTES[id]||PALETTES.neon,TAU=Math.PI*2;
const hash=n=>{const v=Math.sin(n*127.17+78.233)*43758.5453;return v-Math.floor(v);};
function poly(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c,x,y,xx,yy,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function aura(c,x,y,r,color,a=.15){c.save();c.globalAlpha=a;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function hex(c,r){c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2;c[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}c.closePath();}
export function paintCraft(c,x,y,size=1,bank=0,t=0,phased=false,low=false,mission='neon',hero=false){
 const p=palette(mission);c.save();c.translate(x,y);c.rotate(bank);c.scale(size,size);
 if(!low){aura(c,0,5,hero?105:60,p.accent,hero?.3:.2);aura(c,0,6,44,p.accent2,.13);}
 if(phased){c.strokeStyle=p.accent;c.globalAlpha=.65;c.lineWidth=2;for(const rad of [48,61]){c.beginPath();c.arc(0,0,rad+Math.sin(t*16)*3,0,TAU);c.stroke();}c.globalAlpha=1;}
 // Engines and two independently glowing exhaust plumes
 for(const side of [-1,1]){const ex=side*12,flame=40+Math.sin(t*38+side)*7;
  if(!low)aura(c,ex,33,32,p.accent,.23);
  poly(c,[[ex-4,20],[ex+4,20],[ex+3,37],[ex,flame+14],[ex-3,37]],'#ffc898');
  poly(c,[[ex-2,24],[ex+2,24],[ex,flame+5]],p.accent);
 }
 // Fighter silhouette, plating and split swept wings
 poly(c,[[0,-39],[9,-23],[14,-5],[34,12],[41,29],[25,25],[15,18],[10,33],[-10,33],[-15,18],[-25,25],[-41,29],[-34,12],[-14,-5],[-9,-23]],'#071525',p.edge,1.7);
 for(const side of [-1,1]){
  c.save();c.scale(side,1);
  poly(c,[[11,-4],[34,19],[27,17],[11,10]],'#2e5674','#81bfcd',.7);
  poly(c,[[8,12],[38,26],[38,29],[20,25],[9,19]],'#11233c',p.accent,1);
  poly(c,[[10,18],[16,21],[15,29],[10,29]],'#4f829e');
  line(c,23,25,38,29,p.accent,2.5);c.restore();
 }
 poly(c,[[0,-39],[7,-23],[12,12],[7,30],[0,35],[-7,30],[-12,12],[-7,-23]],'#5b86a5','#ccf4ff',1.2);
 poly(c,[[0,-32],[4,-18],[5,-3],[0,12],[-5,-3],[-4,-18]],'#06132c',p.accent,1.5);
 poly(c,[[0,-26],[3,-13],[0,-7],[-3,-13]],p.accent);
 poly(c,[[-9,13],[-6,27],[-2,30],[-3,10]],'#11283b');poly(c,[[9,13],[6,27],[2,30],[3,10]],'#11283b');
 if(!low)aura(c,0,-17,13,p.accent,.35);
 c.restore();
}
function nebula(c,w,h,t,p,low){const sky=c.createLinearGradient(0,0,w,h);sky.addColorStop(0,p.sky);sky.addColorStop(.5,'#061125');sky.addColorStop(1,'#070b19');c.fillStyle=sky;c.fillRect(0,0,w,h);
 const x=w*(.65+.07*Math.sin(t*.045)),y=h*.25;const g=c.createRadialGradient(x,y,0,x,y,Math.max(w,h)*.76);g.addColorStop(0,p.fog);g.addColorStop(.65,'#101c39');g.addColorStop(1,'transparent');c.globalAlpha=.75;c.fillStyle=g;c.fillRect(0,0,w,h);c.globalAlpha=1;
 if(!low){aura(c,w*.18,h*.38,w*.42,p.accent2,.07);aura(c,w*.91,h*.65,w*.34,p.accent,.055);}
}
function starfield(c,t,playing,p,low=false){const speed=playing?156:21;for(let i=0;i<(low?65:130);i++){const z=.22+hash(i+18)*.78,x=hash(i*4.7)*600,y=(hash(i*3.1+7)*800+t*speed*z)%800;c.globalAlpha=.11+z*.43;c.strokeStyle=i%9===0?p.accent:'#b5d7ef';c.lineWidth=z>.8?1.5:.7;line(c,x,y,x,y+z*(playing?11:3),c.strokeStyle,c.lineWidth);}c.globalAlpha=1;}

/**
 * Three distinct worlds, not just three color filters.
 * Environmental shapes live behind the combat plane and are never collidable.
 * Their contrast is deliberately lower than projectiles and the player craft.
 */
function missionEnvironment(c,t,mission,playing,low){
 const flow=t*(playing?1:.22);c.save();
 if(mission==='neon'){
  // Megastructure skyline in far distance: luminous slit windows, twin towers.
  const horizon=190,drift=flow*5;
  c.fillStyle='#081d31a8';
  for(let i=0;i<24;i++){
   const x=i*31-15,w=21+(i%4)*3,h=25+hash(i+17)*115;
   c.fillRect(x,horizon-h,w,h);
   c.fillStyle=i%5===0?'#1249646b':'#15405770';
   c.fillRect(x+2,horizon-h+5,w-4,5);
   c.fillStyle='#081d31a8';
   for(let j=0;j<Math.floor(h/15);j++){
    if(hash(i*21+j)>.46){
     c.globalAlpha=.15+.16*Math.sin(t*.7+i+j)**2;
     c.fillStyle='#79ffed';c.fillRect(x+4+(j%3)*5,horizon-h+11+j*13,2,5);
    }
   }
   c.globalAlpha=1;c.fillStyle='#081d31a8';
  }
  for(const [x,h] of [[95,131],[510,145]]){
   c.fillStyle='#0b2940';c.fillRect(x-8,horizon-h,16,h);
   line(c,x,horizon-h-34,x,horizon-h,'#347891',1.4);
   c.fillStyle='#76fff1';c.globalAlpha=.45+.25*Math.sin(t*2+x);c.fillRect(x-2,horizon-h-38,4,5);c.globalAlpha=1;
  }
  c.globalAlpha=.1;line(c,0,horizon,600,horizon,'#76fff1',1);c.globalAlpha=1;
 } else if(mission==='siege'){
  // Thermal star, layered debris and luminous orbital wreckage.
  if(!low){aura(c,455,154,215,'#fb985d',.13);aura(c,451,153,105,'#ffc77b',.12);}
  c.save();c.translate(454,154);c.strokeStyle='#f9b17b';c.globalAlpha=.2;c.lineWidth=1.8;
  for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,68+i*25,22+i*10,-.32,t*.04+i*.8,t*.04+Math.PI*1.5+i*.8);c.stroke();}
  c.restore();
  for(let i=0;i<(low?13:28);i++){
   const x=(hash(i*13+6)*660-25 +flow*(i%3+1)*4)%660;
   const y=((hash(i+54)*420+flow*(9+i%4))%480)-45;
   const a=.08+hash(i+9)*.23;
   c.save();c.translate(x,y);c.rotate(t*.18+i);c.globalAlpha=a;
   poly(c,[[-7,-3],[0,-9],[9,-3],[5,7],[-4,6]],i%4===0?'#ff9368':'#bc6875');
   if(!low&&i%5===0){line(c,-10,0,-34,10,'#ff9261',1);}
   c.restore();
  }
  c.globalAlpha=.1;line(c,30,180,560,120,'#ffb77e',2);c.globalAlpha=1;
 } else if(mission==='rift'){
  // Dim unstable singularity and curved spatial distortion markers.
  const cx=308,cy=195,spin=t*.04;
  if(!low){aura(c,cx,cy,200,'#b27cf5',.12);aura(c,cx,cy,115,'#544da5',.16);}
  c.save();c.translate(cx,cy);c.globalAlpha=.22;c.lineWidth=1.4;
  for(let i=0;i<6;i++){
   c.strokeStyle=i%2?'#a7a5fa':'#83e9ff';c.beginPath();
   c.ellipse(0,0,52+i*19,17+i*10,-.45+(i%2)*.2,spin*(i%2?-1:1)+i*.5,spin*(i%2?-1:1)+i*.5+Math.PI*1.4);c.stroke();
  }
  for(let i=0;i<36;i++){const angle=i*TAU/36+spin,dist=72+(i%7)*14;
   c.globalAlpha=.10+.12*hash(i+20);line(c,Math.cos(angle)*dist,Math.sin(angle)*dist*.64,Math.cos(angle)*(dist+12),Math.sin(angle)*(dist+12)*.64,'#b6afff',1);
  }
  c.restore();
 }
 c.restore();
}

function corridor(c,t,playing,p,low){
 const horizon=102,offset=t*(playing?170:26),W=600,H=800;
 c.save();c.beginPath();c.rect(0,0,W,H);c.clip();
 const fill=c.createLinearGradient(0,horizon,0,H);fill.addColorStop(0,'#081b3100');fill.addColorStop(1,'#081f3930');c.fillStyle=fill;c.fillRect(0,horizon,W,H-horizon);
 for(let i=-4;i<=4;i++)line(c,300+i*13,horizon,300+i*125,H,p.edge,i===-4||i===4?1.2:.55);
 for(let i=0;i<24;i++){const u=(i/24+offset/1450)%1,d=u*u,y=horizon+d*(H-horizon);c.globalAlpha=.035+d*.17;line(c,0,y,W,y,p.edge,.8+d);}
 c.globalAlpha=1;for(const x of [33,567]){
  line(c,x,horizon,x,H,p.edge,1);
  for(let i=0;i<15;i++){const y=(i*119+offset*.7)%(H+25);c.fillStyle=i%3===0?p.accent:p.edge;c.globalAlpha=i%3===0?.63:.18;c.fillRect(x-2,y,4,i%3===0?14:3);}
 }
 c.globalAlpha=.28;c.strokeStyle=p.accent2;c.lineWidth=1;const spin=t*.06;
 for(let i=0;i<3;i++){c.beginPath();c.arc(300,163,41+i*40,spin+i*.5,spin+2.8+i*.5);c.stroke();}
 c.restore();c.globalAlpha=1;
 if(playing&&!low){const pulse=1-t/(60/144)%1;c.globalAlpha=Math.pow(pulse,7)*.1;c.beginPath();c.arc(300,305,65+(1-pulse)*270,0,TAU);c.strokeStyle=p.accent;c.lineWidth=2;c.stroke();c.globalAlpha=1;}
}

/**
 * Landscape cockpit telemetry uses the otherwise unused horizontal letterbox.
 * The original portrait combat coordinates/hitboxes are completely unchanged.
 */
function flightInstrumentation(c,w,h,view,t,low,mission){
 const margin=view.x,playRight=w-margin,p=palette(mission);
 if(margin<150)return;
 const leftX=margin*.51,rightX=w-margin*.51,centerY=h*.48;
 const radius=Math.min(116,margin*.31,h*.16);
 c.save();
 // The combat channel has clean boundaries, while peripheral data stays dim.
 c.globalAlpha=.25;
 line(c,margin-1,70,margin-1,h-44,p.accent,1);
 line(c,playRight+1,70,playRight+1,h-44,p.accent,1);
 for(const edge of [margin,playRight]){
  for(let i=0;i<14;i++){const y=140+i*(h-230)/13;line(c,edge+(edge===margin?-11:0),y,edge+(edge===margin?0:11),y,p.accent,1);}
 }
 c.globalAlpha=1;
 c.textAlign='center';
 c.font='700 10px ui-monospace,monospace';
 c.fillStyle=p.accent;c.globalAlpha=.8;c.fillText('TACTICAL // SCAN',leftX,centerY-radius-35);
 c.fillText('BEAT // TELEMETRY',rightX,centerY-radius-35);
 // Live tactical radar rotating with the music, indicating simulation contacts.
 c.strokeStyle=p.accent;c.lineWidth=1;
 for(const f of [.34,.67,1]){
  c.globalAlpha=.11+f*.14;c.beginPath();c.arc(leftX,centerY,radius*f,0,TAU);c.stroke();
 }
 c.globalAlpha=.16;line(c,leftX-radius,centerY,leftX+radius,centerY,p.accent,1);line(c,leftX,centerY-radius,leftX,centerY+radius,p.accent,1);
 const sweep=t*.37;
 c.globalAlpha=.4;line(c,leftX,centerY,leftX+Math.cos(sweep)*radius,centerY+Math.sin(sweep)*radius,p.accent,1.6);
 for(let i=0;i<9;i++){
  const angle=hash(i+3)*TAU,rad=radius*(.15+hash(i+24)*.75),x=leftX+Math.cos(angle)*rad,y=centerY+Math.sin(angle)*rad;
  const pulse=.22+.2*Math.sin(t*2+i);c.globalAlpha=pulse;c.fillStyle=i%3?p.accent:p.danger;c.beginPath();c.arc(x,y,i%3?2:3,0,TAU);c.fill();
 }
 c.globalAlpha=.52;c.fillStyle=p.accent;c.font='700 9px ui-monospace,monospace';c.fillText('AUTO-TRACK // ONLINE',leftX,centerY+radius+26);
 // EDM visualizer: rhythm pulse in the side cockpit, not over the hazards.
 const beat=t/(60/144),energy=Math.pow(1-(beat%1),3);
 for(let i=0;i<27;i++){
  const x=rightX-100+i*(200/26),height=(16+Math.abs(Math.sin(i*.71+t*2.3))*48)*(low?.5:1)+energy*14;
  c.globalAlpha=.15+.3*(Math.abs(Math.sin(i*.42+t*1.2))+.1);
  c.fillStyle=i%5===0?p.accent2:p.accent;c.fillRect(x,centerY-height/2,3.3,height);
 }
 c.globalAlpha=.28;line(c,rightX-111,centerY,rightX+111,centerY,p.accent,1);
 c.fillStyle='#e9fcff';c.font='900 27px ui-monospace,monospace';c.globalAlpha=.75;c.fillText('144',rightX,centerY+radius+20);
 c.font='700 10px ui-monospace,monospace';c.fillStyle=p.accent;c.globalAlpha=.55;c.fillText('BEATS / MIN',rightX,centerY+radius+39);
 // Minor status rails fill the negative space without stealing focus.
 c.globalAlpha=.35;c.font='700 9px ui-monospace,monospace';
 for(const [x,title,value] of [[leftX,'FLIGHT ENVELOPE','VECTOR STABLE'],[rightX,'SYSTEM STATUS','PHASE READY']]){
  c.fillStyle=p.accent;c.fillText(title,x,h*.77);c.fillStyle='#b1c9d9';c.fillText(value,x,h*.77+20);
  line(c,x-84,h*.77+30,x+84,h*.77+30,p.edge,1);
 }
 c.restore();
}

export function paintWorld(c,w,h,view,t,playing=false,low=false,mission='neon'){
 const p=palette(mission);nebula(c,w,h,t,p,low);c.save();c.translate(view.x,view.y);c.scale(view.scale,view.scale);starfield(c,t,playing,p,low);missionEnvironment(c,t,mission,playing,low);corridor(c,t,playing,p,low);
 c.fillStyle=p.accent;c.globalAlpha=.39;c.font='9px ui-monospace,monospace';c.fillText('RELI / SECTOR 07',23,138);
 c.fillText('ALT 08.450 / VIRTUAL AIRSPACE',24,715);c.textAlign='right';c.fillText('VECTOR '+String(Math.floor(t*19)%360).padStart(3,'0'),577,715);c.textAlign='left';
 for(let i=0;i<8;i++){const y=186+i*64;line(c,14,y,24,y,p.accent,.9);line(c,576,y,586,y,p.accent,.9);}
 c.globalAlpha=1;c.restore();if(playing)flightInstrumentation(c,w,h,view,t,low,mission);else paintHero(c,w,h,t,low,mission);
}
export function paintHero(c,w,h,t,low,mission){
 const p=palette(mission),x=w*(w>720?.78:.81),y=h*.50,sz=Math.max(.43,Math.min(1.23,w/900,h/730));c.save();c.translate(x,y);c.scale(sz,sz);
 if(!low){aura(c,0,0,265,p.accent,.20);aura(c,110,-70,140,p.accent2,.11);}
 c.globalAlpha=.31;c.strokeStyle=p.edge;c.lineWidth=1.5;
 for(let i=0;i<4;i++){c.beginPath();c.arc(0,0,115+i*45,t*.025-i*.5,t*.025+2.8+i*.5);c.stroke();}
 for(let i=0;i<54;i++){const a=i*TAU/54,r=208;c.globalAlpha=i%6===0?.7:.2;line(c,Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+(i%6===0?20:7)),Math.sin(a)*(r+(i%6===0?20:7)),p.accent,i%6===0?1.5:.7);}
 c.globalAlpha=1;paintCraft(c,0,0,3.2,-.12+Math.sin(t*.8)*.02,t,false,low,mission,true);
 c.textAlign='center';c.fillStyle=p.accent;c.globalAlpha=.7;c.font='bold 11px ui-monospace,monospace';c.fillText('R E L I   /   X - 0 1',0,213);c.globalAlpha=.46;c.font='10px ui-monospace,monospace';c.fillText('EXPERIMENTAL INTERCEPTOR',0,230);c.restore();
}
function missile(c,h,p,low){c.translate(h.x,h.y);c.rotate(-Math.atan2(h.vx||0,h.vy||1));const homing=h.type==='homing',color=homing?'#ffc27b':p.danger;
 if(!low)aura(c,0,0,41,color,.20);
 poly(c,[[-6,-12],[-8,-17],[-4,-17],[0,-27],[4,-17],[8,-17],[6,-12],[6,10],[0,16],[-6,10]],'#2c2137',color,1.6);
 poly(c,[[-3,-12],[0,-22],[3,-12],[3,6],[0,12],[-3,6]],color);
 poly(c,[[-5,6],[-13,13],[-5,10]],'#ec8f9d');poly(c,[[5,6],[13,13],[5,10]],'#ec8f9d');
 poly(c,[[-3,-24],[0,-40-Math.sin(h.age*30)*5],[3,-24]],'#ffd49a');
 if(homing){c.strokeStyle=color;c.globalAlpha=.5;c.beginPath();c.arc(0,0,20,0,TAU);c.stroke();}
}
function mine(c,h,low){c.translate(h.x,h.y);c.rotate(h.age*.6);if(!low)aura(c,0,0,39,'#ffb778',.2);
 c.strokeStyle='#ffad68';c.lineWidth=2;c.beginPath();c.arc(0,0,17,0,TAU);c.stroke();
 for(let i=0;i<8;i++){c.rotate(TAU/8);poly(c,[[14,-4],[28,0],[14,4]],'#72404b','#ffcd96',1);}
 hex(c,10);c.fillStyle='#372739';c.fill();c.strokeStyle='#ffcd96';c.stroke();c.fillStyle='#ffe9bd';c.fillRect(-3,-3,6,6);
}
function drone(c,h,p,low){c.translate(h.x,h.y);c.rotate(Math.sin(h.age*2)*.14);if(!low)aura(c,0,0,36,p.accent2,.19);
 poly(c,[[0,-22],[10,-9],[24,-6],[24,6],[10,10],[0,22],[-10,10],[-24,6],[-24,-6],[-10,-9]],'#211f42',p.accent2,1.5);
 poly(c,[[-19,0],[-5,-8],[0,0],[-5,8]],'#63538f');poly(c,[[19,0],[5,-8],[0,0],[5,8]],'#63538f');
 hex(c,8);c.fillStyle=p.accent2;c.fill();c.fillStyle='#fff';c.fillRect(-2,-2,4,4);
}
function carrier(c,h,p,low){c.translate(h.x,h.y);c.rotate(Math.sin(h.age)*.08);if(!low)aura(c,0,0,92,'#bb8aff',.25);
 c.strokeStyle='#cc9aff';c.lineWidth=2;c.beginPath();c.arc(0,0,52,h.age*.4,h.age*.4+4);c.stroke();
 poly(c,[[0,-42],[35,-28],[48,16],[29,35],[0,22],[-29,35],[-48,16],[-35,-28]],'#17132f','#b88bea',2);
 poly(c,[[0,-28],[21,-8],[27,14],[0,31],[-27,14],[-21,-8]],'#4a326f','#e5b9ff',1.5);
 poly(c,[[0,-19],[15,0],[0,19],[-15,0]],'#c68aff','#fff4ff',1.3);c.fillStyle='#fff';c.fillRect(-4,-4,8,8);
 for(const dx of [-32,32]){c.fillStyle='#edb5ff';c.fillRect(dx-3,10,6,12);}
}
function gate(c,h,p,low){
 const l=Math.max(0,h.gap-h.half),r=Math.min(600,h.gap+h.half);
 for(const [start,end,inner] of [[0,l,l],[r,600,r]]){if(end<=start)continue;
 const g=c.createLinearGradient(0,h.y-16,0,h.y+18);g.addColorStop(0,'#a73c57');g.addColorStop(.5,'#371c38');g.addColorStop(1,'#0a1124');
 c.fillStyle=g;c.fillRect(start,h.y-17,end-start,34);c.strokeStyle=p.danger;c.lineWidth=2;c.strokeRect(start,h.y-17,end-start,34);
 for(let x=start+9;x<end-8;x+=25)poly(c,[[x,h.y+5],[x+7,h.y-4],[x+14,h.y+5]],'#e95b79');
 line(c,inner,h.y-29,inner,h.y+29,p.accent,3);if(!low)aura(c,inner,h.y,32,p.danger,.24);
 }
 c.globalAlpha=.25;c.setLineDash([7,9]);line(c,l,h.y,r,h.y,p.accent,1);c.setLineDash([]);c.globalAlpha=1;
}
function laser(c,h,p,low){const active=h.age>=h.warn,w=h.w||22;c.save();c.globalAlpha=active?1:.32+.18*Math.sin(h.age*26);
 c.fillStyle=active?'#ff325c25':'#ff325c14';c.fillRect(h.x-w/2-12,113,w+24,687);
 c.fillStyle=active?'#fb436b':'#fe739345';c.fillRect(h.x-w/2,113,w,687);
 if(active){c.fillStyle='#fff2f3';c.fillRect(h.x-2,113,4,687);if(!low)aura(c,h.x,430,58,p.danger,.22);}
 c.setLineDash(active?[]:[8,8]);line(c,h.x-w/2-5,113,h.x-w/2-5,800,p.danger,1);line(c,h.x+w/2+5,113,h.x+w/2+5,800,p.danger,1);c.setLineDash([]);
 c.textAlign='center';c.fillStyle=p.danger;c.font='bold 16px monospace';c.fillText('!',h.x,152);c.restore();
}
function salvage(c,h,low){c.translate(h.x,h.y);c.rotate(h.age*1.5);if(!low)aura(c,0,0,51,'#88ffc2',.29);
 c.strokeStyle='#8effc8';c.lineWidth=2;c.beginPath();c.arc(0,0,19,0,TAU);c.stroke();
 poly(c,[[0,-12],[11,0],[0,12],[-11,0]],'#32bb96','#f4fffc',1.2);
 c.rotate(-h.age*1.5);c.fillStyle='#fff';c.font='bold 15px monospace';c.textAlign='center';c.fillText('+',0,5);
}
export function paintHazards(c,hazards,low=false,mission='neon'){const p=palette(mission);for(const h of hazards){c.save();switch(h.type){
 case 'gate':gate(c,h,p,low);break;case 'laser':laser(c,h,p,low);break;case 'pickup':salvage(c,h,low);break;
 case 'boss':carrier(c,h,p,low);break;case 'mine':mine(c,h,low);break;case 'drone':drone(c,h,p,low);break;default:missile(c,h,p,low);
 }c.restore();}}
export function paintSpeedTrails(c,player,t,low=false,mission='neon'){if(low)return;const p=palette(mission);c.save();c.globalAlpha=.29;for(let i=0;i<3;i++){const y=player.y+32+i*17;line(c,player.x-10-i*2,y,player.x-12-i*3,y+18+i*12,p.accent,1.3);line(c,player.x+10+i*2,y,player.x+12+i*3,y+18+i*12,p.accent,1.3);}c.restore();}
export function paintScreenGrade(c,w,h,low=false,mission='neon'){const p=palette(mission);c.save();const v=c.createRadialGradient(w*.5,h*.44,Math.min(w,h)*.18,w*.5,h*.46,Math.max(w,h)*.73);v.addColorStop(0,'#00000000');v.addColorStop(1,'#030819b9');c.fillStyle=v;c.fillRect(0,0,w,h);
 c.globalAlpha=.15;for(const [x,y,xx,yy] of [[16,16,1,1],[w-16,16,-1,1],[16,h-16,1,-1],[w-16,h-16,-1,-1]]){line(c,x,y,x+xx*22,y,p.accent,1);line(c,x,y,x,y+yy*22,p.accent,1);}
 if(!low){c.globalAlpha=.025;c.fillStyle='#fff';for(let y=0;y<h;y+=5)c.fillRect(0,y,w,1);}c.restore();}
