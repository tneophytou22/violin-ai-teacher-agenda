const CACHE='violin-ai-v13-dev-1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(async r=>{
      const ct=r.headers.get('content-type')||'';
      if(!ct.includes('text/html')) return r;
      const text=await r.text();
      if(!text.includes('ai-v13.js')){
        const injected=text.replace('</body>','<script src="ai-v13.js?v=1"></script></body>');
        return new Response(injected,{status:r.status,statusText:r.statusText,headers:r.headers});
      }
      return new Response(text,{status:r.status,statusText:r.statusText,headers:r.headers});
    }).catch(()=>caches.match(e.request)));
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
