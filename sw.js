const CACHE='bordo-campo-offline-v5';
const ASSETS=['./','./index.html','./style.css?v=5','./app.js?v=5','./report.js?v=5','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{await cache.addAll(ASSETS);await self.skipWaiting()}))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('bordo-campo-offline-')&&name!==CACHE)await caches.delete(name);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(event.request.mode==='navigate'){
      // Prefer current HTML online; keep the installed copy for loss of signal.
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
      try{const response=await fetch(event.request,{cache:'no-store',signal:controller.signal});if(response.ok)return response;throw Error('Page unavailable')}
      catch(error){const fallback=await cache.match('./index.html');if(fallback)return fallback;throw error}
      finally{clearTimeout(timer)}
    }
    return (await cache.match(event.request))||fetch(event.request);
  })());
});
