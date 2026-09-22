const fs = require('fs');
const path = require('path');
const http = require('http');
const {spawn} = require('child_process');
const out = __dirname;
const root = path.resolve(out, '../dist');
const delay = ms => new Promise(r => setTimeout(r, ms));
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
  const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml'};
  fs.readFile(file, (err, data) => {if(err) res.writeHead(404).end(); else {res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(data);}});
});
let chrome, ws;
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${path.join(out, '.chrome-profile')}`,'about:blank'], {windowsHide:true, stdio:['ignore','ignore','pipe']});
  const endpoint = await new Promise((resolve,reject) => {
    let log = '';
    const timer = setTimeout(() => reject(Error('Chrome startup timed out: '+log)), 20000);
    chrome.on('error', reject);
    chrome.stderr.on('data', data => {log += data; const m = log.match(/DevTools listening on (ws:\/\/[^\s]+)/); if(m) {clearTimeout(timer);resolve(m[1]);}});
  });
  const base = endpoint.replace('ws://','http://').split('/devtools/')[0];
  const targets = await (await fetch(base+'/json/list')).json();
  ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0; const pending = new Map();
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id); m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1.5,mobile:false});
  await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
  for(let i=0;i<100;i++){if(await evaluate('document.readyState === "complete"'))break;await delay(200);}
  await evaluate(`(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));})()`);
  await evaluate(`document.querySelector('#visualizations').scrollIntoView()`);
  await delay(3000);
  await evaluate('window.scrollTo(0,0)');
  await delay(500);
  const state=await evaluate(`({images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),pointcloud:document.querySelector('#pointcloudPointCount')?.textContent})`);
  const sections=['overview','statistics','composition','protocol','benchmark','visualizations','resources'];
  const pages=[];
  for(let i=0;i<sections.length;i++){
    const section=sections[i];
    const rect=await evaluate(`(()=>{const e=document.getElementById('${section}');const r=e.getBoundingClientRect();return {x:0,y:${i===0?'0':'r.top+scrollY'},width:1440,height:${i===0?'r.bottom+scrollY':'r.height'}};})()`);
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...rect,scale:1}});
    const name=`${String(i+1).padStart(2,'0')}-${section}.png`;
    fs.writeFileSync(path.join(out,name),Buffer.from(shot.data,'base64'));
    pages.push({name,...rect});
    console.log('Exported '+name);
  }
  if (process.argv.includes('--images-only')) {
    if (state.images.length) throw Error('Some images failed to load: '+state.images.join(', '));
    fs.writeFileSync(path.join(out,'export-report.json'),JSON.stringify({state,pages},null,2));
    console.log('Images complete. '+JSON.stringify(state));
    return;
  }
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>StrawberryHarvest-RGBD — Presentation</title><style>@page{size:A3 portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#fff}.page{width:277mm;height:399mm;display:flex;align-items:center;justify-content:center;break-after:page}.page:last-child{break-after:auto}img{max-width:100%;max-height:100%;object-fit:contain}</style></head><body>${pages.map(p=>`<div class="page"><img src="data:image/png;base64,${fs.readFileSync(path.join(out,p.name)).toString('base64')}"></div>`).join('')}</body></html>`;
  fs.writeFileSync(path.join(out,'presentation.html'),html);
  await send('Page.navigate',{url:'file:///'+path.join(out,'presentation.html').replace(/\\/g,'/')});
  await delay(1000);
  await evaluate(`Promise.all([...document.images].map(i=>i.decode()))`);
  const pdf=await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  fs.writeFileSync(path.join(out,'StrawberryHarvest-RGBD-presentation.pdf'),Buffer.from(pdf.data,'base64'));
  fs.writeFileSync(path.join(out,'export-report.json'),JSON.stringify({state,pages},null,2));
  console.log('PDF complete. '+JSON.stringify(state));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{ws?.close();chrome?.kill();server.close();});
