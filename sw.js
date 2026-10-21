const CACHE='bordo-campo-offline-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./report.js','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('bordo-campo-offline-')&&name!==CACHE)await caches.delete(name);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(event.request.mode==='navigate')return (await cache.match('./index.html'))||fetch(event.request);
    return (await cache.match(event.request))||fetch(event.request);
  })());
});
