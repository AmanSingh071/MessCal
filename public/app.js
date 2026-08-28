let menu=null;const STORAGE_KEY='messcal_reviewed_menu_v1';const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],meals=['breakfast','lunch','snacks','dinner'],months=['January','February','March','April','May','June','July','August','September','October','November','December'],pretty={breakfast:'Breakfast',lunch:'Lunch',snacks:'Snacks',dinner:'Dinner'},$=id=>document.getElementById(id);$('month').innerHTML=months.map(m=>`<option>${m}</option>`).join('');
async function api(url,opt){const r=await fetch(url,opt),j=await r.json();if(!r.ok)throw Error(j.error||'Request failed');return j}
function setGoogleConnectedUI(connected){
  const badge=$('googleBadge');
  if(badge) badge.textContent=connected?'Google connected':'Google not connected';
  if($('googleStatus') && !connected) $('googleStatus').textContent='Google Calendar is not connected.';
}
async function config(){try{const c=await api('/api/config');$('aiBadge').textContent=c.aiConfigured?'AI extraction ready':'AI key optional';setGoogleConnectedUI(c.googleConnected);if(c.googleConnected)$('googleStatus').textContent='✓ Google Calendar connected.'}catch{}}
config();
$('sample').onclick=async()=>{try{menu=await api('/api/sample');openWorkspace();$('status').textContent=''}catch(e){$('status').textContent=e.message}};
$('file').onchange=e=>e.target.files[0]&&extract(e.target.files[0]);const drop=$('drop');['dragenter','dragover'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.remove('drag')}));drop.addEventListener('drop',e=>e.dataTransfer.files[0]&&extract(e.dataTransfer.files[0]));
async function extract(f){$('status').textContent='Analyzing your menu…';const fd=new FormData();fd.append('menu',f);try{menu=await api('/api/extract',{method:'POST',body:fd});openWorkspace();$('status').textContent=''}catch(e){$('status').textContent=e.message}}
function saveMenu(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(menu))}catch(e){}}
function loadMenu(){try{const x=localStorage.getItem(STORAGE_KEY);return x?JSON.parse(x):null}catch(e){return null}}
function openWorkspace(){$('upload').hidden=true;$('workspace').hidden=false;$('month').value=menu.month||'August';$('year').value=menu.year||2026;renderReview();renderCalendar();saveMenu()}
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function renderReview(){let flags=menu.flaggedCells||[];$('warning').innerHTML=flags.length?flags.map(f=>`<div class="warn">⚠️ ${esc(f.reason||'Please verify this section.')}</div>`).join(''):'';let h='<thead><tr><th>Day</th>'+meals.map(m=>`<th>${pretty[m]}<br><small>${menu.mealTimings?.[m]?.start||''}–${menu.mealTimings?.[m]?.end||''}</small></th>`).join('')+'</tr></thead><tbody>';for(const d of days){h+=`<tr><td class=day>${d}</td>`;for(const m of meals)h+=`<td><div class=cell contenteditable=true data-d=${d} data-m=${m}>${esc((menu.days?.[d]?.[m]||[]).join('\n'))}</div></td>`;h+='</tr>'}$('tbl').innerHTML=h;document.querySelectorAll('.cell').forEach(c=>c.addEventListener('input',()=>{menu.days[c.dataset.d][c.dataset.m]=c.innerText.split(/\n+/).map(x=>x.trim()).filter(Boolean)}))}
function sync(){document.querySelectorAll('.cell').forEach(c=>menu.days[c.dataset.d][c.dataset.m]=c.innerText.split(/\n+/).map(x=>x.trim()).filter(Boolean));menu.month=$('month').value;menu.year=+$('year').value;saveMenu()}
$('preview').onclick=()=>{sync();renderCalendar();document.querySelector('.previewhead').scrollIntoView({behavior:'smooth',block:'start'})};$('month').onchange=()=>{if(menu){sync();renderCalendar()}};$('year').oninput=()=>{if(menu){sync();renderCalendar()}};
function renderCalendar(){if(!menu)return;const mi=months.indexOf(menu.month),last=new Date(menu.year,mi+1,0).getDate(),first=new Date(menu.year,mi,1).getDay();let h='<div class=grid>'+days.map(d=>`<div class=dow>${d.slice(0,3).toUpperCase()}</div>`).join('');for(let i=0;i<first;i++)h+='<div></div>';for(let n=1;n<=last;n++){const d=days[new Date(menu.year,mi,n).getDay()];h+=`<div><div class=date-num>${n} · ${d.slice(0,3)}</div>`;for(const m of meals){const it=menu.days?.[d]?.[m]||[];if(it.length)h+=`<div class=chip><b>${pretty[m]}</b>${esc(it.slice(0,3).join(', '))}${it.length>3?'…':''}</div>`}h+='</div>'}h+='</div>';$('calendar').innerHTML=h}
$('ics').onclick=async()=>{try{sync();const r=await fetch('/api/ics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(menu)});if(!r.ok)throw Error((await r.json()).error);const blob=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${menu.month}-${menu.year}-mess-menu.ics`;a.click()}catch(e){alert(e.message)}};
$('connect').addEventListener('click',()=>{sync();saveMenu();});
$('import').onclick=async()=>{try{sync();$('googleStatus').textContent='Syncing your menu…';const j=await api('/api/google/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(menu)});$('googleStatus').textContent=`✓ ${j.count} meals synced (${j.created} new, ${j.updated} updated).`;$('googleBadge').textContent='Google connected'}catch(e){$('googleStatus').textContent='Error: '+e.message}};
$('reset').onclick=()=>{localStorage.removeItem(STORAGE_KEY);location.href='/'};
if(new URLSearchParams(location.search).get('google')==='connected'){
  const saved=loadMenu();
  history.replaceState({},'', '/');
  if(saved){
    menu=saved;
    openWorkspace();
    $('googleStatus').textContent='✓ Google connected. Adding your reviewed menu to Google Calendar…';
    setTimeout(async()=>{
      try{
        const j=await api('/api/google/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(menu)});
        $('googleStatus').textContent=`✓ ${j.count} meals are now in your Google Calendar (${j.created} new, ${j.updated} updated). Open the Google Calendar app on your phone and make sure the “Mess Menu” calendar is visible.`;
        $('googleBadge').textContent='Google connected';
      }catch(e){$('googleStatus').textContent='Google connected, but import failed: '+e.message+' — click “Import reviewed menu” to retry.';}
    },250);
  }else{
    $('googleStatus').textContent='Google connected, but no reviewed menu was saved. Upload/review your menu first.';
    config();
  }
} else { const saved=loadMenu(); if(saved){menu=saved;openWorkspace();} }

const removeBtn=document.getElementById("removeEvents");
const disconnectBtn=document.getElementById("disconnectGoogle");
const manageStatus=document.getElementById("manageStatus");

async function jsonResponse(r){
  const text=await r.text();
  let data;
  try{ data=JSON.parse(text); }
  catch{ throw Error(text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()||`Request failed (${r.status})`); }
  if(!r.ok) throw Error(data.error||`Request failed (${r.status})`);
  return data;
}

if(removeBtn) removeBtn.onclick=async()=>{
  if(!confirm("Remove all MessCal events from your Google Calendar?\n\nOnly events created by MessCal will be removed.")) return;
  removeBtn.disabled=true;
  manageStatus.textContent="Removing MessCal events…";
  try{
    const r=await fetch("/api/google/remove-events",{method:"POST",headers:{"Accept":"application/json"}});
    const d=await jsonResponse(r);
    manageStatus.textContent=d.calendarRemoved
      ? "✓ Mess Menu calendar and all MessCal events removed."
      : `✓ Removed ${d.removed||0} MessCal event(s).`;
  }catch(e){
    manageStatus.textContent="Error: "+e.message;
  }finally{
    removeBtn.disabled=false;
  }
};

if(disconnectBtn) disconnectBtn.onclick=async()=>{
  if(!confirm("Disconnect Google Calendar from MessCal?\n\nThis stops MessCal from using your Google authorization. It does not delete your calendar events.")) return;
  disconnectBtn.disabled=true;
  manageStatus.textContent="Disconnecting…";
  try{
    const r=await fetch("/api/google/disconnect",{method:"POST",headers:{"Accept":"application/json"}});
    await jsonResponse(r);
    setGoogleConnectedUI(false);
    manageStatus.textContent="✓ Google Calendar disconnected.";
  }catch(e){
    manageStatus.textContent="Error: "+e.message;
  }finally{
    disconnectBtn.disabled=false;
  }
};
