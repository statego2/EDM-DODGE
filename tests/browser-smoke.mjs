// Headless Chrome integration test using the DevTools protocol; no npm dependencies.
import {createServer} from 'node:http';
import {readFile,mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,extname} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';

const root=resolve(import.meta.dirname,'../dist'),screenshots=resolve(import.meta.dirname,'../visual-screenshots');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname==='/'?'/index.html':new URL(req.url,'http://127.0.0.1').pathname));
  if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  const bytes=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404).end('not found');}
});
const until=async(fn,timeout=14000)=>{const start=Date.now();while(Date.now()-start<timeout){try{const v=await fn();if(v)return v;}catch{}await sleep(140);}throw Error('Browser timed out');};
function connect(url){return new Promise((resolve,reject)=>{
 const ws=new WebSocket(url),pending=new Map(),exceptions=[];let sequence=0;
 ws.addEventListener('error',reject);
 ws.addEventListener('open',()=>resolve({
  exceptions,
  send(method,params={}){return new Promise((yes,no)=>{const id=++sequence;pending.set(id,{yes,no});ws.send(JSON.stringify({id,method,params}));});},
  close(){ws.close();}
 }));
 ws.addEventListener('message',event=>{const msg=JSON.parse(event.data);
  if(msg.id&&pending.has(msg.id)){const promise=pending.get(msg.id);pending.delete(msg.id);msg.error?promise.no(Error(msg.error.message)):promise.yes(msg.result);}
  if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params.exceptionDetails.text||'Runtime exception');
 });
});}
async function main(){
 await new Promise(ok=>server.listen(4173,'127.0.0.1',ok));
 await mkdir(screenshots,{recursive:true});
 const exe=process.env.CHROME_BIN||(spawnSync('which',['google-chrome'],{encoding:'utf8'}).stdout.trim()||'chromium');
 const profile=await mkdtemp(join(tmpdir(),'reli-chrome-'));
 const chrome=spawn(exe,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--autoplay-policy=no-user-gesture-required','--remote-allow-origins=*','--remote-debugging-port=9223','--window-size=1440,900',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
 let page;
 try{
  await until(async()=>{const r=await fetch('http://127.0.0.1:9223/json/version');return r.ok;});
  const target=await fetch('http://127.0.0.1:9223/json/new?http://127.0.0.1:4173/',{method:'PUT'}).then(r=>r.json());
  page=await connect(target.webSocketDebuggerUrl);
  await page.send('Page.enable');await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  async function evalJS(expression){const data=await page.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(data.exceptionDetails)throw Error(data.exceptionDetails.text);return data.result.value;}
  async function shot(name){const data=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(screenshots,name+'.png'),Buffer.from(data.data,'base64'));}
  await until(()=>evalJS("document.querySelector('#game')?.width>0 && document.querySelector('#missionGoals')?.textContent.includes('3 STARS')"));
  await sleep(600);await shot('menu-desktop');
  const results=[];
  for(const mission of ['neon','siege','rift']){
   await evalJS(`(()=>{let m=document.querySelector('#mission');m.value='${mission}';m.dispatchEvent(new Event('change'));document.querySelector('#start').click();return true})()`);
   await until(()=>evalJS("!document.querySelector('#hud').hidden"));
   await sleep(1200);
   const status=await evalJS("({score:Number(document.querySelector('#score').textContent),width:document.querySelector('#game').width,mission:document.querySelector('#missionName').textContent})");
   if(!(status.width>=300&&status.score>0))throw Error('Flight failed: '+JSON.stringify(status));
   results.push(status);await shot('game-'+mission);
   await evalJS("(()=>{document.querySelector('#pause').click();document.querySelector('#exit').click();return true})()");
   await until(()=>evalJS("!document.querySelector('#menu').hidden"));
  }
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await sleep(700);await shot('menu-mobile');
  if(page.exceptions.length)throw Error('Uncaught browser errors: '+page.exceptions.join('; '));
  console.log(JSON.stringify({ok:true,results,screenshots}));
 }finally{page?.close();chrome.kill();server.close();}
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
