const MONTHS_ES = {
  ene:1,enero:1,feb:2,febrero:2,mar:3,marzo:3,abr:4,abril:4,may:5,mayo:5,jun:6,junio:6,
  jul:7,julio:7,ago:8,agosto:8,sep:9,sept:9,septiembre:9,oct:10,octubre:10,nov:11,noviembre:11,dic:12,diciembre:12,
};

export const MODULES = [
  {key:'access',label:'Accesos total'},
  {key:'requests',label:'Solicitudes'},
  {key:'reservations',label:'Reservas'},
  {key:'alerts',label:'Alertas'},
  {key:'packages',label:'Paquetería'},
];

const HEADER_ALIASES = {
  property:['property_name','property name','propiedad','copropiedad','property'],
  unit:['lugar','apartamento','apto','unidad','inmueble','residencia'],
  accessPorter:['accesos (porteros)','accesos porteros','accesos porteria','accesos portería','accesos guardas'],
  accessUser:['accesos (usuarios)','accesos usuarios','accesos usuario','accesos residentes'],
  requests:['solicitudes','solicitud','pqr','pqrs'],
  reservations:['reservas','reserva','zonas comunes','reservas zonas comunes'],
  alerts:['alertas','alerta','boton de panico','botón de pánico'],
  packages:['paqueteria unicos','paquetería únicos','paqueteria únicos','paquetería unicos','paquetes unicos','paquetes únicos','paqueteria','paquetería'],
  logins:['inicio de sesion unicos','inicio de sesión únicos','inicio de sesión unicos','inicio de sesion únicos','inicios de sesion unicos','inicios de sesión únicos','inicio sesion unico','inicio sesión único','login unico','logins unicos'],
};

function stripAccents(value){
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

export function normalizeText(value){
  return stripAccents(value)
    .toLowerCase()
    .replace(/[_-]+/g,' ')
    .replace(/[()]/g,m=>` ${m} `)
    .replace(/\s+/g,' ')
    .trim();
}

function normalizedAlias(alias){ return normalizeText(alias); }

function findHeaderIndex(headers,aliases){
  const normalized = headers.map(normalizeText);
  for(const alias of aliases){
    const idx = normalized.indexOf(normalizedAlias(alias));
    if(idx>=0) return idx;
  }
  return -1;
}

function n(value){
  if(value==null || value==='') return 0;
  if(typeof value==='number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value).replace(',','.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCandidateSheets(workbook){
  const candidates=[];
  workbook.SheetNames.forEach(name=>{
    const rows=window.XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:null,raw:true});
    if(!rows.length) return;
    const headers=rows[0]||[];
    const property=findHeaderIndex(headers,HEADER_ALIASES.property);
    const unit=findHeaderIndex(headers,HEADER_ALIASES.unit);
    if(property<0 || unit<0) return;
    const idx={
      property,unit,
      accessPorter:findHeaderIndex(headers,HEADER_ALIASES.accessPorter),
      accessUser:findHeaderIndex(headers,HEADER_ALIASES.accessUser),
      requests:findHeaderIndex(headers,HEADER_ALIASES.requests),
      reservations:findHeaderIndex(headers,HEADER_ALIASES.reservations),
      alerts:findHeaderIndex(headers,HEADER_ALIASES.alerts),
      packages:findHeaderIndex(headers,HEADER_ALIASES.packages),
      logins:findHeaderIndex(headers,HEADER_ALIASES.logins),
    };
    let score=0;
    for(let r=1;r<rows.length;r++){
      const row=rows[r]||[];
      ['accessPorter','accessUser','requests','reservations','alerts','packages','logins'].forEach(k=>{
        if(idx[k]>=0) score+=Math.max(0,n(row[idx[k]]));
      });
    }
    candidates.push({name,rows,idx,score});
  });
  return candidates.sort((a,b)=>b.score-a.score);
}

function extractOfficialTotals(workbook,propertyNames){
  const totals={};
  const normalizedProps=new Map(propertyNames.map(p=>[normalizeText(p),p]));
  for(const sheetName of workbook.SheetNames){
    const rows=window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{header:1,defval:null,raw:true});
    if(!rows.length) continue;
    const headers=rows[0]||[];
    const totalCol=findHeaderIndex(headers,['cantidad de aptos','cantidad apartamentos','total apartamentos','cantidad de apartamentos','total aptos','unidades','cantidad unidades']);
    if(totalCol<0) continue;
    let nameCol=findHeaderIndex(headers,['property_name','property name','copropiedad','propiedad','nombre','nombre propiedad']);
    if(nameCol<0) nameCol=0;
    for(let r=1;r<rows.length;r++){
      const row=rows[r]||[];
      const rawName=row[nameCol];
      const rawTotal=row[totalCol];
      if(rawName==null || rawTotal==null) continue;
      const total=n(rawTotal);
      if(total<=0) continue;
      const sourceName=String(rawName).trim();
      const match=normalizedProps.get(normalizeText(sourceName));
      totals[match || sourceName]=total;
    }
  }
  return totals;
}

function toIsoDate(year,month,day){
  const d=new Date(Date.UTC(year,month-1,day));
  if(d.getUTCFullYear()!==year || d.getUTCMonth()!==month-1 || d.getUTCDate()!==day) return null;
  return `${year.toString().padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export function extractCutDate(fileName,lastModified=Date.now()){
  const base=stripAccents(fileName).toLowerCase();
  let m=base.match(/(?:^|\D)(20\d{2})[._\-\s](0?[1-9]|1[0-2])[._\-\s](0?[1-9]|[12]\d|3[01])(?:\D|$)/);
  if(m) return toIsoDate(Number(m[1]),Number(m[2]),Number(m[3]));
  m=base.match(/(?:^|\D)(0?[1-9]|[12]\d|3[01])[._\-\s](0?[1-9]|1[0-2])[._\-\s](20\d{2})(?:\D|$)/);
  if(m) return toIsoDate(Number(m[3]),Number(m[2]),Number(m[1]));
  m=base.match(/(?:^|\D)(0?[1-9]|[12]\d|3[01])\s+(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep(?:t(?:iembre)?)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)\s+(20\d{2})(?:\D|$)/);
  if(m){
    const month=MONTHS_ES[m[2]] || MONTHS_ES[m[2].slice(0,3)];
    if(month) return toIsoDate(Number(m[3]),month,Number(m[1]));
  }
  return new Date(lastModified).toISOString().slice(0,10);
}

function shouldSkipRow(property,unit){
  return !String(property??'').trim() || !String(unit??'').trim();
}

export function parseWorkbook(workbook,{fileName='archivo.xlsx',lastModified=Date.now()}={}){
  if(!window.XLSX) throw new Error('SheetJS no está disponible.');
  const candidates=getCandidateSheets(workbook);
  if(!candidates.length){
    throw new Error('No se encontró una hoja con columnas equivalentes a property_name y lugar.');
  }
  const best=candidates[0];
  const rows=[];
  const propertyNames=[];
  const seenProps=new Set();

  for(let r=1;r<best.rows.length;r++){
    const row=best.rows[r]||[];
    const property=row[best.idx.property];
    const unit=row[best.idx.unit];
    if(shouldSkipRow(property,unit)) continue;
    const propName=String(property).trim();
    if(!seenProps.has(propName)){
      seenProps.add(propName);
      propertyNames.push(propName);
    }
    rows.push({
      property:propName,
      unit:String(unit).trim(),
      accessPorter:best.idx.accessPorter>=0?n(row[best.idx.accessPorter]):0,
      accessUser:best.idx.accessUser>=0?n(row[best.idx.accessUser]):0,
      requests:best.idx.requests>=0?n(row[best.idx.requests]):0,
      reservations:best.idx.reservations>=0?n(row[best.idx.reservations]):0,
      alerts:best.idx.alerts>=0?n(row[best.idx.alerts]):0,
      packages:best.idx.packages>=0?n(row[best.idx.packages]):0,
      logins:best.idx.logins>=0?n(row[best.idx.logins]):0,
    });
  }

  if(!rows.length) throw new Error('La hoja candidata no contiene filas de apartamentos.');

  const officialTotals=extractOfficialTotals(workbook,propertyNames);
  const cutDate=extractCutDate(fileName,lastModified);
  return {
    id:cutDate,
    cutDate,
    fileName,
    lastModified,
    sourceSheet:best.name,
    candidateSheets:candidates.map(c=>({name:c.name,score:c.score})),
    propertyNames,
    officialTotals,
    rows,
    importedAt:new Date().toISOString(),
  };
}

export function buildPropertyModels(snapshot){
  const grouped=new Map();
  for(const row of snapshot.rows){
    if(!grouped.has(row.property)) grouped.set(row.property,[]);
    grouped.get(row.property).push(row);
  }

  const models=[];
  for(const [name,items] of grouped.entries()){
    const normalizedItems=items.map(item=>{
      const access=item.accessPorter>0 || item.accessUser>0;
      const modules={
        access,
        requests:item.requests>0,
        reservations:item.reservations>0,
        alerts:item.alerts>0,
        packages:item.packages>0,
      };
      const modulesUsed=MODULES.reduce((sum,m)=>sum+(modules[m.key]?1:0),0);
      return {...item,modules,modulesUsed,active:modulesUsed>0,loggedIn:item.logins>0};
    });

    const sourceRows=normalizedItems.length;
    const official=snapshot.officialTotals?.[name];
    const totalUnits=Number.isFinite(official) && official>0 ? official : sourceRows;
    const estimated=!(Number.isFinite(official) && official>0);
    const active=normalizedItems.filter(i=>i.active).length;
    const inactive=Math.max(0,totalUnits-active);
    const loggedIn=normalizedItems.filter(i=>i.loggedIn).length;
    const porter=normalizedItems.filter(i=>i.accessPorter>0).length;
    const user=normalizedItems.filter(i=>i.accessUser>0).length;
    const access=normalizedItems.filter(i=>i.modules.access).length;
    const usage={};
    for(const module of MODULES){
      usage[module.key]=normalizedItems.filter(i=>i.modules[module.key]).length;
    }
    const averageModules=totalUnits>0 ? normalizedItems.reduce((s,i)=>s+i.modulesUsed,0)/totalUnits : 0;

    models.push({
      name,items:normalizedItems,sourceRows,totalUnits,estimated,active,inactive,loggedIn,porter,user,access,usage,averageModules,
      adoptionPct:totalUnits>0?active/totalUnits*100:0,
      loginPct:totalUnits>0?loggedIn/totalUnits*100:0,
      porterPct:totalUnits>0?porter/totalUnits*100:0,
      userPct:totalUnits>0?user/totalUnits*100:0,
      accessPct:totalUnits>0?access/totalUnits*100:0,
    });
  }
  return models.sort((a,b)=>a.name.localeCompare(b.name,'es'));
}

export function aggregateModels(models){
  const totalUnits=models.reduce((s,p)=>s+p.totalUnits,0);
  const active=models.reduce((s,p)=>s+p.active,0);
  const loggedIn=models.reduce((s,p)=>s+p.loggedIn,0);
  const porter=models.reduce((s,p)=>s+p.porter,0);
  const user=models.reduce((s,p)=>s+p.user,0);
  const access=models.reduce((s,p)=>s+p.access,0);
  const usage={};
  for(const module of MODULES){ usage[module.key]=models.reduce((s,p)=>s+p.usage[module.key],0); }
  return {
    name:'Red completa',
    totalUnits,
    active,
    inactive:Math.max(0,totalUnits-active),
    loggedIn,porter,user,access,usage,
    adoptionPct:totalUnits>0?active/totalUnits*100:0,
    loginPct:totalUnits>0?loggedIn/totalUnits*100:0,
    porterPct:totalUnits>0?porter/totalUnits*100:0,
    userPct:totalUnits>0?user/totalUnits*100:0,
    accessPct:totalUnits>0?access/totalUnits*100:0,
    averageModules:totalUnits>0?models.reduce((s,p)=>s+p.averageModules*p.totalUnits,0)/totalUnits:0,
  };
}

export function metricsForHistory(models,propertyName,mode){
  const target=mode==='network' ? aggregateModels(models) : models.find(p=>p.name===propertyName);
  if(!target) return null;
  return {
    totalUnits:target.totalUnits,
    general:target.adoptionPct,
    access:target.accessPct,
    requests:target.totalUnits>0?target.usage.requests/target.totalUnits*100:0,
    reservations:target.totalUnits>0?target.usage.reservations/target.totalUnits*100:0,
    alerts:target.totalUnits>0?target.usage.alerts/target.totalUnits*100:0,
    packages:target.totalUnits>0?target.usage.packages/target.totalUnits*100:0,
  };
}

export function formatDateEs(iso){
  if(!iso) return '—';
  return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`)).replace('.','');
}

export function fmtInt(value){
  return new Intl.NumberFormat('es-CO').format(Math.round(Number(value)||0));
}

export function fmtPct(value){
  const n=Math.round((Number(value)||0)*10)/10;
  return `${n.toLocaleString('es-CO',{minimumFractionDigits:0,maximumFractionDigits:1})}%`;
}
