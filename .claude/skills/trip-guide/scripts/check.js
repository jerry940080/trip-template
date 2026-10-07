// 旅遊懶人包總檢查：資料完整性＋座標是否落海＋桌機/手機零錯誤＋無橫向溢出。
// 用法：node check.js <index.html 路徑> [截圖資料夾]
// 需要 Playwright（雲端環境已裝）。找不到 chromium 時設 CHROME=/path/to/chrome。
const path=require('path'),fs=require('fs');
let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright/index.js');}
const FILE=path.resolve(process.argv[2]||'index.html'),OUT=process.argv[3];
const exe=process.env.CHROME||['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell','/opt/pw-browsers/chromium'].find(f=>fs.existsSync(f));
let bad=0;const warn=m=>console.log('  ⚠ '+m),fail=m=>{bad++;console.log('  ✗ '+m);};
(async()=>{
 const b=await pw.chromium.launch(exe?{executablePath:exe}:{});
 // ── 桌機 ──
 const dc=await b.newContext({viewport:{width:1280,height:900}});const d=await dc.newPage();const derr=[];d.on('pageerror',e=>derr.push(e.message));
 await d.goto('file://'+FILE);await d.waitForTimeout(2500);
 console.log('■ 資料完整性');
 const r=await d.evaluate(()=>{const o={miss:[],water:[],info:{}};
  const has=(n)=>{try{return eval('typeof '+n)!=='undefined';}catch(e){return false;}};
  const inPoly=(x,y,ring)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;};
  const onLand=ll=>LAND.some(rg=>inPoly(ll[1],ll[0],rg));
  const chkStops=(S,tag)=>Object.entries(S||{}).forEach(([n,arr])=>arr.forEach(s=>{
    if(s.card&&!CARDS[s.card])o.miss.push(`${tag} Day${n}「${s.n}」card:${s.card} 不在 CARDS`);
    if(s.at&&!P[s.at])o.miss.push(`${tag} Day${n}「${s.n}」at:${s.at} 不在 P`);
    (s.ol||[]).forEach(l=>l.slice(0,2).forEach(k=>{if(!P[k])o.miss.push(`${tag} Day${n}「${s.n}」ol 的 ${k} 不在 P`);}));
    (s.go||[]).forEach(g=>{if(g.to&&!P[g.to])o.miss.push(`${tag} Day${n}「${s.n}」go.to:${g.to} 不在 P`);});}));
  if(has('STOPS'))chkStops(STOPS,'STOPS');if(has('RAIN_STOPS'))chkStops(RAIN_STOPS,'RAIN_STOPS');
  DAYS.forEach(dd=>{(dd.cards||[]).forEach(k=>{if(!CARDS[k])o.miss.push(`DAYS[${dd.n}].cards ${k} 不在 CARDS`);});
    ((dd.map||{}).pts||[]).forEach(k=>{if(!P[k])o.miss.push(`DAYS[${dd.n}].map.pts ${k} 不在 P`);});});
  o.info.geoOnly=Object.keys(P).filter(k=>!NAMES[k]&&!k.startsWith('rs_'));  // 只當路線幾何點用的座標，正常
  const walk=(nodes)=>(nodes||[]).forEach(nd=>{(nd.keys||[]).forEach(k=>{if(!CARDS[k])o.miss.push(`樹「${nd.name}」的 ${k} 不在 CARDS`);});walk(nd.kids);});
  if(has('SPOT_TREE'))walk(SPOT_TREE);if(has('FOOD_TREE'))walk(FOOD_TREE);
  // 有卡片的地點是否都放進景點樹（沒放就不會出現在手機景點頁）
  if(has('SPOT_TREE')){const inTree=new Set();const w2=ns=>(ns||[]).forEach(nd=>{(nd.keys||[]).forEach(k=>inTree.add(k));w2(nd.kids);});w2(SPOT_TREE);if(has('FOOD_TREE'))w2(FOOD_TREE);
    o.info.notInTree=Object.keys(CARDS).filter(k=>!inTree.has(k));}
  Object.entries(P).forEach(([k,ll])=>{if(!k.startsWith('rs_')&&!onLand(ll))o.water.push(`${k} ${(NAMES[k]||[k])[0]} [${ll}]`);});
  if(has('RESTO'))RESTO.list.forEach(x=>{if(x.ll&&!onLand(x.ll))o.water.push(`RESTO ${x.n} [${x.ll}]`);});
  o.info.counts=`P ${Object.keys(P).length}・CARDS ${Object.keys(CARDS).length}・DAYS ${DAYS.length}・照片卡 ${Object.keys(IMG).length}`;
  o.info.noPhoto=Object.keys(CARDS).filter(k=>!IMG[k]);
  o.info.noVideo=Object.keys(CARDS).filter(k=>!(CARDS[k].video||[]).length);
  return o;});
 console.log('  '+r.info.counts);
 r.miss.forEach(fail);
 r.water.forEach(m=>warn('落在水面（座標可能錯，或 LAND 太粗）：'+m));
 if(r.info.notInTree&&r.info.notInTree.length)warn('沒放進 SPOT_TREE／FOOD_TREE（手機景點頁看不到）：'+r.info.notInTree.join(', '));
 if(r.info.geoOnly.length)console.log('  只有座標沒有名稱（路線幾何點）：'+r.info.geoOnly.join(', '));
 console.log('  沒照片：'+(r.info.noPhoto.join(', ')||'無'));
 console.log('  沒影片：'+(r.info.noVideo.join(', ')||'無'));
 console.log('■ 桌機 1280');
 const dov=await d.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(dov>1)fail('橫向溢出 '+dov+'px');
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await d.screenshot({path:OUT+'/desk_top.png'});}
 derr.forEach(e=>fail('桌機錯誤：'+e));if(!derr.length&&dov<=1)console.log('  ✓ 無錯誤、無溢出');
 // ── 手機 App ──
 console.log('■ 手機 390');
 const mc=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const m=await mc.newPage();const merr=[];m.on('pageerror',e=>merr.push(e.message));
 await m.goto('file://'+FILE);await m.waitForTimeout(2500);
 for(const t of ['home','plan','map','pack','info']){await m.evaluate(t=>go(t),t);await m.waitForTimeout(400);
   if(t==='plan'||t==='map'){const n=await m.evaluate(()=>DAYS.length);for(let i=0;i<n;i++){await m.evaluate(i=>setDay(i),i);await m.waitForTimeout(t==='map'?600:200);
     if(OUT&&t==='map')await m.screenshot({path:`${OUT}/m_map_d${i+1}.png`});}}
   if(t==='info'){const segs=await m.$$eval('#maSeg [data-seg]',a=>a.map(x=>x.dataset.seg));for(const s of segs){await m.locator(`#maSeg [data-seg="${s}"]`).tap();await m.waitForTimeout(400);
     const ov=await m.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>1)fail(`資訊›${s} 橫向溢出 ${ov}px`);if(OUT)await m.screenshot({path:`${OUT}/m_info_${s}.png`});}}
   else if(OUT)await m.screenshot({path:`${OUT}/m_${t}.png`});}
 merr.forEach(e=>fail('手機錯誤：'+e));if(!merr.length)console.log('  ✓ 五個分頁、每一天都無錯誤');
 await b.close();console.log(bad?`\n✗ ${bad} 個問題`:'\n✓ 全部通過');process.exit(bad?1:0);
})();
