import {getSnapshots,putSnapshot,getSetting,setSetting} from './db.js';
import {MODULES,parseWorkbook,buildPropertyModels,aggregateModels,metricsForHistory,formatDateEs,fmtInt,fmtPct} from './data.js';

const PAGE_SIZE=12;
const APP={
  snapshots:[],
  currentSnapshot:null,
  models:[],
  selectedProperty:null,
  filter:'all',
  search:'',
  page:1,
  historyMode:'network',
  chart:null,
  directoryHandle:null,
};

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];

const els={
  cutoffDate:$('#cutoffDate'),historyCount:$('#historyCount'),sourceStatus:$('#sourceStatus'),lastUpdate:$('#lastUpdate'),
  refreshFolderBtn:$('#refreshFolderBtn'),linkFolderBtn:$('#linkFolderBtn'),importBtn:$('#importBtn'),fileInput:$('#fileInput'),
  propertySelect:$('#propertySelect'),globalProperties:$('#globalProperties'),globalUnits:$('#globalUnits'),globalActive:$('#globalActive'),globalAdoption:$('#globalAdoption'),
  kpiGeneral:$('#kpiGeneral'),kpiGeneralSub:$('#kpiGeneralSub'),kpiActive:$('#kpiActive'),kpiTotalUnits:$('#kpiTotalUnits'),kpiAdoption:$('#kpiAdoption'),adoptionProgress:$('#adoptionProgress'),
  kpiInactive:$('#kpiInactive'),kpiLogin:$('#kpiLogin'),kpiLoginSub:$('#kpiLoginSub'),kpiAccess:$('#kpiAccess'),kpiAccessSub:$('#kpiAccessSub'),kpiAccessBreakdown:$('#kpiAccessBreakdown'),
  moduleUsageList:$('#moduleUsageList'),averageModules:$('#averageModules'),averageModulesNote:$('#averageModulesNote'),
  historyScopeLabel:$('#historyScopeLabel'),trendChart:$('#trendChart'),chartEmpty:$('#chartEmpty'),historyTableBody:$('#historyTableBody'),
  detailSub:$('#detailSub'),searchInput:$('#searchInput'),detailTableBody:$('#detailTableBody'),pagerInfo:$('#pagerInfo'),pagerCurrent:$('#pagerCurrent'),prevPage:$('#prevPage'),nextPage:$('#nextPage'),
  toast:$('#toast'),busy:$('#busy'),busyText:$('#busyText'),
};

function showBusy(text='Procesando archivos…'){
  els.busyText.textContent=text;
  els.busy.hidden=false;
}
function hideBusy(){ els.busy.hidden=true; }
function toast(message,type='default'){
  els.toast.textContent=message;
  els.toast.className=`toast show ${type==='error'?'error':type==='success'?'success':''}`.trim();
  clearTimeout(toast._timer);
  toast._timer=setTimeout(()=>els.toast.className='toast',5200);
}

function sortSnapshots(){
  APP.snapshots.sort((a,b)=>a.cutDate.localeCompare(b.cutDate));
  APP.currentSnapshot=APP.snapshots.at(-1) || null;
}

function currentProperty(){
  return APP.models.find(p=>p.name===APP.selectedProperty) || APP.models[0] || null;
}

function renderSourceState(){
  const linked=Boolean(APP.directoryHandle);
  els.sourceStatus.textContent=linked?'SharePoint vinculado':'SharePoint sin vincular';
  els.sourceStatus.classList.toggle('linked',linked);
  els.historyCount.textContent=APP.snapshots.length?`${APP.snapshots.length} corte${APP.snapshots.length===1?'':'s'}`:'—';
  els.cutoffDate.textContent=APP.currentSnapshot?formatDateEs(APP.currentSnapshot.cutDate):'—';
}

function renderPropertySelector(){
  els.propertySelect.innerHTML='';
  if(!APP.models.length){
    const o=document.createElement('option');
    o.textContent='Sin datos cargados';
    o.value='';
    els.propertySelect.append(o);
    els.propertySelect.disabled=true;
    els.searchInput.disabled=true;
    return;
  }
  els.propertySelect.disabled=false;
  els.searchInput.disabled=false;
  for(const model of APP.models){
    const option=document.createElement('option');
    option.value=model.name;
    option.textContent=`${model.name} · ${fmtInt(model.active)}/${fmtInt(model.totalUnits)} aptos`;
    els.propertySelect.append(option);
  }
  if(!APP.selectedProperty || !APP.models.some(p=>p.name===APP.selectedProperty)) APP.selectedProperty=APP.models[0].name;
  els.propertySelect.value=APP.selectedProperty;
}

function renderGlobal(){
  if(!APP.models.length){
    ['globalProperties','globalUnits','globalActive','globalAdoption'].forEach(k=>els[k].textContent='–');
    return;
  }
  const global=aggregateModels(APP.models);
  els.globalProperties.textContent=fmtInt(APP.models.length);
  els.globalUnits.textContent=fmtInt(global.totalUnits);
  els.globalActive.textContent=fmtInt(global.active);
  els.globalAdoption.textContent=fmtPct(global.adoptionPct);
}

function renderKpis(prop){
  if(!prop){
    els.kpiGeneral.textContent='–%'; els.kpiGeneralSub.textContent='— apartamentos usando la plataforma';
    els.kpiActive.textContent='–'; els.kpiTotalUnits.textContent='–'; els.kpiAdoption.textContent='–%'; els.adoptionProgress.style.width='0%';
    els.kpiInactive.textContent='–'; els.kpiLogin.textContent='–'; els.kpiLoginSub.textContent='de – apartamentos (–%) iniciaron sesión';
    els.kpiAccess.textContent='–'; els.kpiAccessSub.textContent='de – apartamentos (–%) — avance combinado de Accesos (Portería + Usuario)'; els.kpiAccessBreakdown.textContent='Portería: – (–%) · Usuario: – (–%)';
    return;
  }
  els.kpiGeneral.textContent=fmtPct(prop.adoptionPct);
  els.kpiGeneralSub.textContent=`${fmtInt(prop.active)} de ${fmtInt(prop.totalUnits)} apartamentos usando la plataforma`;
  els.kpiActive.textContent=fmtInt(prop.active);
  els.kpiTotalUnits.textContent=fmtInt(prop.totalUnits);
  els.kpiAdoption.textContent=fmtPct(prop.adoptionPct);
  els.adoptionProgress.style.width=`${Math.max(0,Math.min(100,prop.adoptionPct))}%`;
  els.kpiInactive.textContent=fmtInt(prop.inactive);
  els.kpiLogin.textContent=fmtInt(prop.loggedIn);
  els.kpiLoginSub.textContent=`de ${fmtInt(prop.totalUnits)} apartamentos (${fmtPct(prop.loginPct)}) iniciaron sesión`;
  els.kpiAccess.textContent=fmtInt(prop.access);
  els.kpiAccessSub.textContent=`de ${fmtInt(prop.totalUnits)} apartamentos (${fmtPct(prop.accessPct)}) — avance combinado de Accesos (Portería + Usuario)`;
  els.kpiAccessBreakdown.textContent=`Portería: ${fmtInt(prop.porter)} (${fmtPct(prop.porterPct)}) · Usuario: ${fmtInt(prop.user)} (${fmtPct(prop.userPct)})`;
}

function renderModules(prop){
  els.moduleUsageList.innerHTML='';
  if(!prop){
    els.moduleUsageList.innerHTML='<div class="empty-cell">Sin datos.</div>';
    els.averageModules.textContent='–';
    els.averageModulesNote.textContent='Carga datos para ver la profundidad de uso de la copropiedad.';
    return;
  }
  const percentages=MODULES.map(module=>({module,count:prop.usage[module.key],pct:prop.totalUnits?prop.usage[module.key]/prop.totalUnits*100:0}));
  const max=Math.max(1,...percentages.map(x=>x.pct));
  for(const {module,count,pct} of percentages){
    const row=document.createElement('div');
    row.className='mod-row';
    row.innerHTML=`
      <div class="mod-name">${module.label}</div>
      <div class="mod-bar-track"><div class="mod-bar-fill" style="width:${(pct/max)*100}%"></div></div>
      <div class="mod-count tabular">${fmtPct(pct)} <span>(${fmtInt(count)}/${fmtInt(prop.totalUnits)})</span></div>`;
    els.moduleUsageList.append(row);
  }
  els.averageModules.textContent=prop.averageModules.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2});
  const activePct=prop.totalUnits?prop.active/prop.totalUnits*100:0;
  els.averageModulesNote.textContent=`${fmtInt(prop.active)} apartamentos registran actividad (${fmtPct(activePct)}). La métrica cuenta Accesos como un único módulo aunque exista actividad por portería y usuario.`;
}

function getFilteredItems(prop){
  if(!prop) return [];
  let items=[...prop.items];
  if(APP.filter==='inactive') items=items.filter(i=>!i.active);
  if(APP.filter==='active') items=items.filter(i=>i.active);
  const q=APP.search.trim().toLowerCase();
  if(q) items=items.filter(i=>i.unit.toLowerCase().includes(q));
  return items;
}

function renderDetail(prop){
  const items=getFilteredItems(prop);
  if(!prop){
    els.detailSub.textContent='—';
    els.detailTableBody.innerHTML='<tr><td colspan="4" class="empty-cell">—</td></tr>';
    els.pagerInfo.textContent='—'; els.pagerCurrent.textContent='1'; els.prevPage.disabled=true; els.nextPage.disabled=true;
    return;
  }
  const pages=Math.max(1,Math.ceil(items.length/PAGE_SIZE));
  APP.page=Math.min(APP.page,pages);
  const start=(APP.page-1)*PAGE_SIZE;
  const pageItems=items.slice(start,start+PAGE_SIZE);
  els.detailSub.textContent=`${fmtInt(prop.active)} activos · ${fmtInt(prop.inactive)} inactivos · ${fmtInt(items.length)} coinciden con el filtro actual`;
  els.detailTableBody.innerHTML='';
  if(!pageItems.length){
    els.detailTableBody.innerHTML='<tr><td colspan="4" class="empty-cell">No se encontraron apartamentos con ese criterio.</td></tr>';
  }else{
    for(const item of pageItems){
      const row=document.createElement('tr');
      row.className=item.active?'active-row':'inactive-row';
      const activeModules=MODULES.filter(m=>item.modules[m.key]);
      const pips=MODULES.map(m=>`<span class="pip ${item.modules[m.key]?'on':''}" title="${m.label}"></span>`).join('');
      const tags=activeModules.length?activeModules.map(m=>`<span class="modtag">${m.label}</span>`).join(''):'<span class="modtag empty">Sin uso registrado</span>';
      row.innerHTML=`
        <td class="apto-cell">${escapeHtml(item.unit)}</td>
        <td><span class="status-badge ${item.active?'active':'inactive'}"><span class="dot"></span>${item.active?'Activo':'Inactivo'}</span></td>
        <td class="num"><div class="module-meter"><strong class="tabular">${item.modulesUsed}/5</strong><span class="pip-row">${pips}</span></div></td>
        <td><div class="modtags">${tags}</div></td>`;
      els.detailTableBody.append(row);
    }
  }
  els.pagerCurrent.textContent=`${APP.page} / ${pages}`;
  els.pagerInfo.textContent=items.length?`Mostrando ${start+1}–${Math.min(start+PAGE_SIZE,items.length)} de ${fmtInt(items.length)}`:'Sin resultados';
  els.prevPage.disabled=APP.page<=1;
  els.nextPage.disabled=APP.page>=pages;
}

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
}

function buildHistoryRows(){
  return APP.snapshots.map(snapshot=>{
    const models=buildPropertyModels(snapshot);
    const metrics=metricsForHistory(models,APP.selectedProperty,APP.historyMode);
    return {snapshot,metrics};
  }).filter(x=>x.metrics);
}

function renderHistory(){
  const rows=buildHistoryRows();
  els.historyScopeLabel.textContent=APP.historyMode==='network'?'Red completa':(APP.selectedProperty || 'Copropiedad seleccionada');

  els.historyTableBody.innerHTML='';
  if(!rows.length){
    els.historyTableBody.innerHTML='<tr><td colspan="8" class="empty-cell">Sin cortes históricos cargados.</td></tr>';
  }else{
    const chronological=rows.map((row,i)=>({...row,delta:i===0?null:row.metrics.general-rows[i-1].metrics.general}));
    for(const row of [...chronological].reverse()){
      const tr=document.createElement('tr');
      const d=row.delta;
      const deltaHtml=d==null?'—':`<span class="${d>0.05?'delta-up':d<-0.05?'delta-down':'delta-flat'}">${d>0?'+':''}${d.toLocaleString('es-CO',{maximumFractionDigits:1})} pts</span>`;
      tr.innerHTML=`
        <td>${formatDateEs(row.snapshot.cutDate)}</td>
        <td class="num tabular">${fmtPct(row.metrics.general)}</td>
        <td class="num tabular">${fmtPct(row.metrics.access)}</td>
        <td class="num tabular">${fmtPct(row.metrics.requests)}</td>
        <td class="num tabular">${fmtPct(row.metrics.reservations)}</td>
        <td class="num tabular">${fmtPct(row.metrics.alerts)}</td>
        <td class="num tabular">${fmtPct(row.metrics.packages)}</td>
        <td class="num tabular">${deltaHtml}</td>`;
      els.historyTableBody.append(tr);
    }
  }
  renderChart(rows);
}

function renderChart(rows){
  const hasEnough=rows.length>=2;
  els.chartEmpty.classList.toggle('hidden',hasEnough);
  if(APP.chart){ APP.chart.destroy(); APP.chart=null; }
  if(!hasEnough || !window.Chart) return;
  const labels=rows.map(r=>formatDateEs(r.snapshot.cutDate));
  const css=getComputedStyle(document.documentElement);
  const colors={
    access:css.getPropertyValue('--purple-600').trim(),
    requests:css.getPropertyValue('--gold-600').trim(),
    reservations:css.getPropertyValue('--green-600').trim(),
    alerts:css.getPropertyValue('--red-600').trim(),
    packages:css.getPropertyValue('--purple-300').trim(),
  };
  const definitions=[
    ['access','Accesos total'],['requests','Solicitudes'],['reservations','Reservas'],['alerts','Alertas'],['packages','Paquetería'],
  ];
  const datasets=definitions.map(([key,label])=>({
    label,
    data:rows.map(r=>Number(r.metrics[key].toFixed(2))),
    borderColor:colors[key],
    backgroundColor:colors[key],
    borderWidth:2.2,
    pointRadius:3,
    pointHoverRadius:5,
    tension:.28,
    fill:false,
  }));
  APP.chart=new window.Chart(els.trendChart.getContext('2d'),{
    type:'line',
    data:{labels,datasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:8,boxHeight:8,font:{family:'Inter',size:11},color:'#6C6379'}},
        tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${fmtPct(ctx.parsed.y)}`}},
      },
      scales:{
        y:{beginAtZero:true,suggestedMax:100,ticks:{callback:v=>`${v}%`,color:'#6C6379',font:{family:'Inter',size:10}},grid:{color:'rgba(231,222,245,.72)'}},
        x:{ticks:{color:'#6C6379',font:{family:'Inter',size:10}},grid:{display:false}},
      },
    },
  });
}

function renderAll(){
  renderSourceState();
  renderPropertySelector();
  renderGlobal();
  const prop=currentProperty();
  renderKpis(prop);
  renderModules(prop);
  renderDetail(prop);
  renderHistory();
}

async function hydrate(){
  try{
    APP.snapshots=await getSnapshots();
    APP.directoryHandle=await getSetting('directoryHandle');
    const lastUpdate=await getSetting('lastUpdate');
    els.lastUpdate.textContent=lastUpdate?new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(lastUpdate)):'—';
    sortSnapshots();
    if(APP.currentSnapshot){
      APP.models=buildPropertyModels(APP.currentSnapshot);
      APP.selectedProperty=APP.models[0]?.name || null;
    }
    renderAll();
  }catch(err){
    console.error(err);
    toast('No fue posible cargar el histórico local del navegador.','error');
    renderAll();
  }
}

async function waitForLibraries(){
  const started=Date.now();
  while((!window.XLSX || !window.Chart) && Date.now()-started<12000){
    await new Promise(r=>setTimeout(r,80));
  }
  if(!window.XLSX) throw new Error('No se pudo cargar la librería para leer Excel.');
}

async function importFiles(files,{quiet=false}={}){
  await waitForXlsx();
  const accepted=[...files].filter(f=>/\.(xlsx|xls|csv)$/i.test(f.name));
  if(!accepted.length) throw new Error('No hay archivos Excel o CSV compatibles.');
  showBusy(`Procesando ${accepted.length} archivo${accepted.length===1?'':'s'}…`);
  const errors=[];
  let imported=0;
  try{
    for(const file of accepted){
      try{
        const buffer=await file.arrayBuffer();
        const workbook=window.XLSX.read(buffer,{type:'array',cellDates:true});
        const snapshot=parseWorkbook(workbook,{fileName:file.name,lastModified:file.lastModified});
        await putSnapshot(snapshot);
        imported++;
      }catch(err){
        errors.push(`${file.name}: ${err.message}`);
      }
    }
    APP.snapshots=await getSnapshots();
    sortSnapshots();
    if(APP.currentSnapshot){
      const keep=APP.selectedProperty;
      APP.models=buildPropertyModels(APP.currentSnapshot);
      APP.selectedProperty=APP.models.some(p=>p.name===keep)?keep:(APP.models[0]?.name||null);
    }
    const now=new Date().toISOString();
    await setSetting('lastUpdate',now);
    els.lastUpdate.textContent=new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(now));
    APP.page=1;
    renderAll();
    if(!quiet){
      if(imported) toast(`${imported} archivo${imported===1?'':'s'} procesado${imported===1?'':'s'}. Histórico: ${APP.snapshots.length} corte${APP.snapshots.length===1?'':'s'}.`,'success');
      if(errors.length) toast(`Algunos archivos no se pudieron procesar: ${errors.slice(0,2).join(' | ')}`,'error');
    }
    return {imported,errors};
  }finally{hideBusy();}
}

async function ensureReadPermission(handle){
  if(!handle) return false;
  if(!handle.queryPermission || !handle.requestPermission) return true;
  const options={mode:'read'};
  if(await handle.queryPermission(options)==='granted') return true;
  return await handle.requestPermission(options)==='granted';
}

async function collectSpreadsheetFiles(directoryHandle){
  const files=[];
  async function walk(handle,path=''){
    for await(const [name,entry] of handle.entries()){
      if(entry.kind==='file' && /\.(xlsx|xls|csv)$/i.test(name)){
        const file=await entry.getFile();
        files.push(file);
      }else if(entry.kind==='directory' && !name.startsWith('.')){
        await walk(entry,`${path}${name}/`);
      }
    }
  }
  await walk(directoryHandle);
  const preferred=files.filter(f=>/base\s*datos\s*domonow/i.test(f.name));
  return preferred.length?preferred:files;
}

async function linkFolder(){
  if(!('showDirectoryPicker' in window)){
    toast('Este navegador no permite vincular carpetas. Usa Chrome o Edge, o utiliza Importar para seleccionar los archivos.','error');
    return;
  }
  try{
    const handle=await window.showDirectoryPicker({mode:'read'});
    APP.directoryHandle=handle;
    await setSetting('directoryHandle',handle);
    renderSourceState();
    await refreshFolder();
  }catch(err){
    if(err?.name!=='AbortError'){
      console.error(err);
      toast(`No se pudo vincular la carpeta: ${err.message}`,'error');
    }
  }
}

async function refreshFolder(){
  if(!APP.directoryHandle){
    await linkFolder();
    return;
  }
  try{
    const allowed=await ensureReadPermission(APP.directoryHandle);
    if(!allowed){ toast('Debes conceder permiso de lectura a la carpeta vinculada.','error'); return; }
    showBusy('Leyendo carpeta sincronizada de SharePoint…');
    const files=await collectSpreadsheetFiles(APP.directoryHandle);
    hideBusy();
    if(!files.length){ toast('No se encontraron archivos .xlsx, .xls o .csv en la carpeta vinculada.','error'); return; }
    const {imported,errors}=await importFiles(files,{quiet:true});
    if(imported) toast(`Actualización completada: ${imported} archivo${imported===1?'':'s'} leído${imported===1?'':'s'}; ${APP.snapshots.length} corte${APP.snapshots.length===1?'':'s'} conservado${APP.snapshots.length===1?'':'s'}.`,'success');
    if(errors.length) toast(`Se omitieron ${errors.length} archivo${errors.length===1?'':'s'} por estructura incompatible. Revisa la consola para el detalle.`,'error');
    if(errors.length) console.warn('Archivos omitidos:',errors);
  }catch(err){
    hideBusy();
    console.error(err);
    toast(`No fue posible actualizar desde la carpeta: ${err.message}`,'error');
  }
}

els.linkFolderBtn.addEventListener('click',linkFolder);
els.refreshFolderBtn.addEventListener('click',refreshFolder);
els.importBtn.addEventListener('click',()=>els.fileInput.click());
els.fileInput.addEventListener('change',async e=>{
  try{ if(e.target.files?.length) await importFiles(e.target.files); }
  catch(err){ toast(err.message,'error'); }
  e.target.value='';
});
els.propertySelect.addEventListener('change',e=>{
  APP.selectedProperty=e.target.value;
  APP.page=1;
  renderKpis(currentProperty());
  renderModules(currentProperty());
  renderDetail(currentProperty());
  renderHistory();
});
els.searchInput.addEventListener('input',e=>{APP.search=e.target.value;APP.page=1;renderDetail(currentProperty());});
$$('.toggle-btn').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.toggle-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  APP.filter=btn.dataset.filter;
  APP.page=1;
  renderDetail(currentProperty());
}));
$$('.view-toggle-btn').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.view-toggle-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  APP.historyMode=btn.dataset.historyMode;
  renderHistory();
}));
els.prevPage.addEventListener('click',()=>{if(APP.page>1){APP.page--;renderDetail(currentProperty());}});
els.nextPage.addEventListener('click',()=>{APP.page++;renderDetail(currentProperty());});

hydrate();

// Las librerías externas cargan de forma asíncrona para que el tablero no bloquee
// su interfaz si un CDN tarda. Cuando Chart.js esté disponible, re-renderizamos.
let chartWaits = 0;
const chartReadyTimer = window.setInterval(() => {
  chartWaits += 1;
  if (window.Chart) {
    window.clearInterval(chartReadyTimer);
    if (APP.snapshots.length) renderHistory();
  } else if (chartWaits >= 80) {
    window.clearInterval(chartReadyTimer);
  }
}, 100);
