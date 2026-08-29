let menu=null;const STORAGE_KEY='messcal_reviewed_menu_v1';const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],meals=['breakfast','lunch','snacks','dinner'],months=['January','February','March','April','May','June','July','August','September','October','November','December'],pretty={breakfast:'Breakfast',lunch:'Lunch',snacks:'Snacks',dinner:'Dinner'},$=id=>document.getElementById(id);$('month').innerHTML=months.map(m=>`<option>${m}</option>`).join('');
async function api(url,opt){const r=await fetch(url,opt),j=await r.json();if(!r.ok)throw Error(j.error||'Request failed');return j}
function setGoogleConnectedUI(connected){const badge=$('googleBadge');if(badge)badge.textContent=connected?'Google connected':'Google not connected';if($('googleStatus')&&!connected)$('googleStatus').textContent='Google Calendar is not connected.'}
async function config(){try{const c=await api('/api/config');$('aiBadge').textContent=c.aiConfigured?'AI extraction ready':'AI key optional';setGoogleConnectedUI(c.googleConnected);if(c.googleConnected)$('googleStatus').textContent='✓ Google Calendar connected.'}catch{}}
config();
$('sample').onclick=async()=>{try{menu=await api('/api/sample');openWorkspace();$('status').textContent=''}catch(e){$('status').textContent=e.message}};
$('file').onchange=e=>e.target.files[0]&&extract(e.target.files[0]);const drop=$('drop');['dragenter','dragover'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.remove('drag')}));drop.addEventListener('drop',e=>e.dataTransfer.files[0]&&extract(e.dataTransfer.files[0]));
function formatElapsed(ms){const s=Math.max(0,ms/1000);return s<60?`${s.toFixed(1)} sec`:`${Math.floor(s/60)}m ${Math.floor(s%60)}s`}
function setUploadLoading(on,fileName=''){const drop=$('drop'),sample=$('sample');if(on){drop.classList.add('loading');drop.querySelector('.uploadmark').innerHTML='<span class="spinner"></span>';drop.querySelector('strong').textContent='Analyzing your menu…';drop.querySelector('span').textContent=fileName||'Reading your PDF';drop.querySelector('small').textContent='This can take a little while for scanned or complex menus.';if(sample)sample.disabled=true}else{drop.classList.remove('loading');drop.querySelector('.uploadmark').textContent='↑';drop.querySelector('strong').textContent='Drop your menu here';drop.querySelector('span').textContent='or click to browse your PDF';drop.querySelector('small').textContent='PDF · up to 4 MB';if(sample)sample.disabled=false}}
function setStatusLoader(started){const status=$('status');const timer=setInterval(()=>{const elapsed=Date.now()-started;const sec=Math.floor(elapsed/1000);let stage=sec<2?'Uploading PDF…':sec<5?'Reading menu layout…':sec<10?'Extracting meals and timings…':'Still analyzing carefully — almost there…';status.innerHTML=`<div class="status-loader"><span class="spinner"></span><span><b>${stage}</b><small>${formatElapsed(elapsed)} elapsed</small></span></div>`},180);return timer}
async function extract(f){const started=Date.now();setUploadLoading(true,f.name);const timer=setStatusLoader(started);const fd=new FormData();fd.append('menu',f);try{menu=await api('/api/extract',{method:'POST',body:fd});clearInterval(timer);$('status').innerHTML=`<div class="status-success">✓ Menu analyzed in ${formatElapsed(Date.now()-started)}.</div>`;openWorkspace();setTimeout(()=>{$('status').textContent=''},1200)}catch(e){clearInterval(timer);$('status').innerHTML=`<div class="status-error">Error: ${esc(e.message)}</div>`}finally{setUploadLoading(false)}}
function saveMenu(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(menu))}catch(e){}}
function loadMenu(){try{const x=localStorage.getItem(STORAGE_KEY);return x?JSON.parse(x):null}catch(e){return null}}
function openWorkspace(){$('upload').hidden=true;$('workspace').hidden=false;$('month').value=menu.month||'August';$('year').value=menu.year||2026;renderReview();renderCalendar();saveMenu();renderFoodSearch('')}
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
const breakfastStaples=new Set(['tea','coffee','milk','bread','butter','jam']);
function displayItems(meal,items){const list=Array.isArray(items)?items:[];if(meal!=='breakfast')return list;return list.map(x=>String(x).split(',').map(v=>v.trim()).filter(v=>!breakfastStaples.has(v.toLowerCase())).join(', ').trim()).filter(Boolean)}
function renderReview(){let flags=menu.flaggedCells||[];$('warning').innerHTML=flags.length?flags.map(f=>`<div class="warn">⚠️ ${esc(f.reason||'Please verify this section.')}</div>`).join(''):'';let h='<thead><tr><th>Day</th>'+meals.map(m=>`<th>${pretty[m]}<br><small>${menu.mealTimings?.[m]?.start||''}–${menu.mealTimings?.[m]?.end||''}</small></th>`).join('')+'</tr></thead><tbody>';for(const d of days){h+=`<tr><td class=day>${d}</td>`;for(const m of meals)h+=`<td><div class=cell contenteditable=true data-d=${d} data-m=${m}>${esc((menu.days?.[d]?.[m]||[]).join('\n'))}</div></td>`;h+='</tr>'}$('tbl').innerHTML=h;document.querySelectorAll('.cell').forEach(c=>c.addEventListener('input',()=>{menu.days[c.dataset.d][c.dataset.m]=c.innerText.split(/\n+/).map(x=>x.trim()).filter(Boolean);renderFoodSearch($('foodSearchInput')?.value||'')}))}
function sync(){document.querySelectorAll('.cell').forEach(c=>menu.days[c.dataset.d][c.dataset.m]=c.innerText.split(/\n+/).map(x=>x.trim()).filter(Boolean));menu.month=$('month').value;menu.year=+$('year').value;saveMenu();renderFoodSearch($('foodSearchInput')?.value||'')}
$('preview').onclick=()=>{sync();renderCalendar();document.querySelector('.previewhead').scrollIntoView({behavior:'smooth',block:'start'})};$('month').onchange=()=>{if(menu){sync();renderCalendar()}};$('year').oninput=()=>{if(menu){sync();renderCalendar()}};
function renderCalendar(){if(!menu)return;const mi=months.indexOf(menu.month),last=new Date(menu.year,mi+1,0).getDate(),first=new Date(menu.year,mi,1).getDay();let h='<div class=grid>'+days.map(d=>`<div class=dow>${d.slice(0,3).toUpperCase()}</div>`).join('');for(let i=0;i<first;i++)h+='<div></div>';for(let n=1;n<=last;n++){const d=days[new Date(menu.year,mi,n).getDay()];h+=`<div><div class=date-num>${n} · ${d.slice(0,3)}</div>`;for(const m of meals){const it=displayItems(m,menu.days?.[d]?.[m]||[]);if(it.length)h+=`<div class=chip><b>${pretty[m]}</b>${esc(it.join(', '))}</div>`}h+='</div>'}h+='</div>';$('calendar').innerHTML=h}
function renderFoodSearch(query){const box=$('foodSearchResults');if(!box||!menu)return;const q=String(query||'').trim().toLowerCase();if(!q){box.innerHTML='<div class="search-empty">Type a dish above to find when it is served.</div>';return}const results=[];const mi=months.indexOf(menu.month);for(let n=1;n<=new Date(menu.year,mi+1,0).getDate();n++){const d=days[new Date(menu.year,mi,n).getDay()];for(const m of meals){const items=menu.days?.[d]?.[m]||[];const matched=items.filter(x=>String(x).toLowerCase().includes(q));if(matched.length)results.push({date:n,day:d,meal:pretty[m],items:matched})}}if(!results.length){box.innerHTML=`<div class="search-empty">No meals found for “${esc(query)}”.</div>`;return}box.innerHTML=results.map(r=>`<div class="search-result"><div><strong>${r.date} ${menu.month} · ${r.day}</strong><small> · ${r.meal}</small></div><div class="food">${esc(r.items.join(', '))}</div></div>`).join('')}
$('foodSearchInput')?.addEventListener('input',e=>renderFoodSearch(e.target.value));
$('ics').onclick=async()=>{try{sync();const r=await fetch('/api/ics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(menu)});if(!r.ok)throw Error((await r.json()).error);const blob=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${menu.month}-${menu.year}-mess-menu.ics`;a.click()}catch(e){alert(e.message)}};
$('connect').addEventListener('click',()=>{sync();saveMenu();});
function syncProgressMarkup(msg,started){
  const elapsed=Date.now()-started;
  const done=Number(msg.done||0),total=Math.max(1,Number(msg.total||0));
  const changed=Number(msg.created||0)+Number(msg.updated||0)+Number(msg.skipped||0);
  const rate=done>0?done/Math.max(elapsed/1000,.25):0;
  const remaining=Math.max(0,total-done);
  const eta=rate>0?remaining/rate:0;
  const pct=Math.min(100,Math.round((done/total)*100));
  return `<div class="sync-loader sync-progress"><span class="spinner"></span><span><b>${esc(msg.phase||'Syncing Google Calendar…')}</b><small>${done} / ${total} meals processed (${pct}%) · ${msg.created||0} new · ${msg.updated||0} updated · ${msg.skipped||0} already up to date</small><small>${formatElapsed(elapsed)} elapsed${rate?\` · ETA ${formatElapsed(eta*1000)}\`:''}</small><div class="sync-bar"><i style="width:${pct}%"></i></div></span></div>`;
}
async function importMenuWithProgress(){
  sync();
  const status=$('googleStatus'),button=$('import'),started=Date.now();
  button.disabled=true;button.textContent='Syncing…';
  status.innerHTML=syncProgressMarkup({phase:'Starting secure Google Calendar sync…',done:0,total:1,created:0,updated:0,skipped:0},started);

  let finalMessage=null;
  const handleMessage=msg=>{
    if(msg.type==='error')throw Error(msg.error||'Google Calendar import failed.');
    if(msg.type==='retry'){
      status.innerHTML=`<div class="sync-loader sync-progress"><span class="spinner"></span><span><b>Google is temporarily slowing this sync</b><small>${msg.done||0} / ${msg.total||0} meals already processed · waiting about ${msg.waitSeconds}s, then continuing automatically…</small></span></div>`;
      return;
    }
    if(msg.type==='progress'){
      status.innerHTML=syncProgressMarkup(msg,started);
      return;
    }
    if(msg.type==='done'){
      finalMessage=msg;
      status.innerHTML=`<div class="status-success">✓ ${msg.count} meals processed in ${formatElapsed(msg.elapsedMs||Date.now()-started)} — ${msg.created} new, ${msg.updated} updated, ${msg.skipped||0} already up to date.</div>`;
    }
  };

  try{
    const response=await fetch('/api/google/import',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/x-ndjson'},body:JSON.stringify(menu)});
    if(!response.ok){
      let data;try{data=await response.json()}catch{}
      throw Error(data?.error||'Google Calendar import failed.');
    }

    // Read every chunk and also parse the final buffered tail. The old code could
    // miss the final "done" message when the stream ended without another newline.
    const reader=response.body?.getReader();
    if(!reader)throw Error('Your browser could not start the live sync stream.');
    const decoder=new TextDecoder();
    let buffer='';
    const consumeLine=line=>{
      const trimmed=line.trim();
      if(!trimmed)return;
      handleMessage(JSON.parse(trimmed));
    };

    while(true){
      const {done,value}=await reader.read();
      if(value){
        buffer+=decoder.decode(value,{stream:!done});
        const lines=buffer.split('\n');
        buffer=lines.pop()||'';
        for(const line of lines)consumeLine(line);
      }
      if(done)break;
    }
    buffer+=decoder.decode();
    consumeLine(buffer);

    if(!finalMessage)throw Error('The connection ended before MessCal received the final confirmation. Please check your Google Calendar and retry if needed.');
    $('googleBadge').textContent='Google connected';
  }catch(e){
    status.innerHTML=`<div class="status-error">Sync paused: ${esc(e.message)}</div>`;
  }finally{
    button.disabled=false;button.textContent='Import reviewed menu';
  }
}
$('import').onclick=importMenuWithProgress;
$('reset').onclick=()=>{localStorage.removeItem(STORAGE_KEY);location.href='/'};
if(new URLSearchParams(location.search).get('google')==='connected'){const saved=loadMenu();history.replaceState({},'','/');if(saved){menu=saved;openWorkspace();$('googleStatus').textContent='✓ Google connected. Adding your reviewed menu to Google Calendar…';setTimeout(()=>importMenuWithProgress(),350)}else{$('googleStatus').textContent='Google connected, but no reviewed menu was saved. Upload/review your menu first.';config()}}else{const saved=loadMenu();if(saved){menu=saved;openWorkspace()}}
const removeBtn=document.getElementById("removeEvents"),disconnectBtn=document.getElementById("disconnectGoogle"),manageStatus=document.getElementById("manageStatus");
async function jsonResponse(r){const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw Error(text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()||`Request failed (${r.status})`)}if(!r.ok)throw Error(data.error||`Request failed (${r.status})`);return data}
if(removeBtn)removeBtn.onclick=async()=>{if(!confirm("Remove all MessCal events from your Google Calendar?\n\nOnly events created by MessCal will be removed."))return;removeBtn.disabled=true;manageStatus.textContent="Removing MessCal events…";try{const r=await fetch("/api/google/remove-events",{method:"POST",headers:{"Accept":"application/json"}}),d=await jsonResponse(r);manageStatus.textContent=d.calendarRemoved?"✓ Mess Menu calendar and all MessCal events removed.":`✓ Removed ${d.removed||0} MessCal event(s).`}catch(e){manageStatus.textContent="Error: "+e.message}finally{removeBtn.disabled=false}};
if(disconnectBtn)disconnectBtn.onclick=async()=>{if(!confirm("Disconnect Google Calendar from MessCal?\n\nThis stops MessCal from using your Google authorization. It does not delete your calendar events."))return;disconnectBtn.disabled=true;manageStatus.textContent="Disconnecting…";try{const r=await fetch("/api/google/disconnect",{method:"POST",headers:{"Accept":"application/json"}});await jsonResponse(r);setGoogleConnectedUI(false);manageStatus.textContent="✓ Google Calendar disconnected."}catch(e){manageStatus.textContent="Error: "+e.message}finally{disconnectBtn.disabled=false}};
