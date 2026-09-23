const DB_NAME = 'domonow-usabilidad';
const DB_VERSION = 2;
const SNAPSHOT_STORE = 'snapshots';
const SETTINGS_STORE = 'settings';

function openDb(){
  return new Promise((resolve,reject)=>{
    const request = indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if(!db.objectStoreNames.contains(SNAPSHOT_STORE)){
        db.createObjectStore(SNAPSHOT_STORE,{keyPath:'id'});
      }
      if(!db.objectStoreNames.contains(SETTINGS_STORE)){
        db.createObjectStore(SETTINGS_STORE,{keyPath:'key'});
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txRequest(store,mode,operation){
  return openDb().then(db=>new Promise((resolve,reject)=>{
    const tx = db.transaction(store,mode);
    const objectStore = tx.objectStore(store);
    const request = operation(objectStore);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  }));
}

export function putSnapshot(snapshot){
  return txRequest(SNAPSHOT_STORE,'readwrite',store=>store.put(snapshot));
}

export function getSnapshots(){
  return txRequest(SNAPSHOT_STORE,'readonly',store=>store.getAll());
}

export function clearSnapshots(){
  return txRequest(SNAPSHOT_STORE,'readwrite',store=>store.clear());
}

export function setSetting(key,value){
  return txRequest(SETTINGS_STORE,'readwrite',store=>store.put({key,value}));
}

export async function getSetting(key){
  const result = await txRequest(SETTINGS_STORE,'readonly',store=>store.get(key));
  return result?.value ?? null;
}
