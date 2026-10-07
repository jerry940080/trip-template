/* 離線快取（2026-10-05）
   - 網頁本身：先試網路（3 秒沒回應或斷線就用快取），有網路時一定拿到最新版，離線也打得開。
   - 圖示、說明檔：先用快取。
   - 維基百科照片、Google 字型：抓過一次就存起來；網頁開啟時也會把所有照片網址送來預存（warm）。
   - YouTube 影片不快取（太大，也無法離線播放）。
   改了這支檔案要把 V 的版本號加一，舊快取才會被清掉。
   網頁的 fetch 加 cache:'no-cache'，否則 GitHub Pages 的 10 分鐘 HTTP 快取會讓使用者一直看到舊版。 */
const V='trip-v1'  // 每個行程換一個名字（同網域的快取會互相清掉），改這支檔案就把數字加一, PAGE='./', CORE=['./','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const isMedia=u=>/(^|\.)upload\.wikimedia\.org$/.test(u.hostname)||/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
const isWikiApi=u=>/wikipedia\.org$/.test(u.hostname)&&u.pathname.endsWith('/api.php');
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms));}
async function pageFirstNetwork(req){
  const c=await caches.open(V);
  // cache:'no-cache'：一定向伺服器確認有沒有新版（GitHub Pages 會讓瀏覽器自己快取 10 分鐘，不加這個會拿到舊版）
  try{const r=await Promise.race([fetch(req,{cache:'no-cache'}),timeout(3000)]);if(r&&r.ok){c.put(PAGE,r.clone());return r;}throw new Error('bad');}
  catch(err){return (await c.match(PAGE))||(await c.match(req,{ignoreSearch:true}))||Response.error();}
}
async function cacheFirst(req){
  const c=await caches.open(V),hit=await c.match(req,{ignoreVary:true});if(hit)return hit;
  try{const r=await fetch(req);if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r;}catch(err){return Response.error();}
}
async function networkFirst(req){
  const c=await caches.open(V);
  try{const r=await Promise.race([fetch(req),timeout(4000)]);if(r&&r.ok)c.put(req,r.clone());return r;}
  catch(err){return (await c.match(req))||Response.error();}
}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(req.mode==='navigate'&&u.origin===location.origin){e.respondWith(pageFirstNetwork(req));return;}
  if(u.origin===location.origin){e.respondWith(cacheFirst(req));return;}
  if(isWikiApi(u)){e.respondWith(networkFirst(req));return;}
  if(isMedia(u)){e.respondWith(cacheFirst(req));return;}
});
/* 網頁送來照片網址清單：逐一抓下來存好，之後離線也看得到 */
self.addEventListener('message',e=>{
  const d=e.data||{};if(d.type!=='warm'||!Array.isArray(d.urls))return;
  e.waitUntil(caches.open(V).then(async c=>{for(const url of d.urls.slice(0,200)){try{if(await c.match(url))continue;const r=await fetch(url,{mode:'no-cors'});if(r&&(r.ok||r.type==='opaque'))await c.put(url,r);}catch(err){}}}));
});
