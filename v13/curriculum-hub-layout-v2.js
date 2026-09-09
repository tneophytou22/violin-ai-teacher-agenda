/* V13 CURRICULUM HUB V2 — SAFE LEVEL CURRICULUM SHELL
   Presentation-only layer for the Technique > Level pages.

   Design rules:
   - The existing 4-card level summary remains untouched in the DOM and is only
     hidden after the canonical Level summary is positively recognised.
   - No Homework, Lesson, Student or selection state is read or written.
   - Scales are read through the existing shared curriculum adapter.
   - Future user-owned curricula can be supplied through
     window.VIOLIN_AI_USER_CURRICULA_V1 without changing this renderer.
   - Rendering is signature-guarded; no unrestricted MutationObserver loop.
*/
(function(){
'use strict';

var frame=document.getElementById('app');
if(!frame)return;

var MODULES=[
  {key:'repertoire',icon:'🎼',title:'REPERTOIRE',sub:'Repertoire Curriculum'},
  {key:'scales',icon:'🎵',title:'SCALES',sub:'Scales Curriculum'},
  {key:'etudes',icon:'📚',title:'ÉTUDES',sub:'Études Curriculum'},
  {key:'technical-exercises',icon:'🏋️',title:'TECHNICAL EXERCISES',sub:'Technical Exercises Curriculum'},
  {key:'technique',icon:'🧩',title:'TECHNIQUE',sub:'Technique Curriculum'}
];

var lastSignature='';

function txt(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function escAttr(v){return esc(v)}
function norm(v){return txt(v).toLowerCase()}

function injectCss(doc){
  if(doc.getElementById('v13-curriculum-hub-v2-style'))return;
  var s=doc.createElement('style');
  s.id='v13-curriculum-hub-v2-style';
  s.textContent=''
  +'.v13-curriculum-hub-v2{margin-top:18px;padding:18px;border:1px solid #e1e5ec;border-radius:22px;background:linear-gradient(135deg,#fff,#f8f6ff);box-shadow:0 10px 28px rgba(20,35,61,.07)}'
  +'.v13-ch2-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}'
  +'.v13-ch2-head h2{margin:0;color:#24344c;font-size:23px}'
  +'.v13-ch2-head span{font-size:11px;font-weight:800;color:#7451d9;letter-spacing:.03em}'
  +'.v13-ch2-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}'
  +'.v13-ch2-tab{border:1px solid #e0e4eb;border-radius:15px;background:#fff;padding:12px 10px;text-align:left;cursor:pointer;min-height:76px;box-shadow:0 5px 15px rgba(20,35,61,.05);font:inherit;color:#24344c}'
  +'.v13-ch2-tab:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(20,35,61,.09)}'
  +'.v13-ch2-tab.active{background:#7451d9;color:#fff;border-color:#7451d9}'
  +'.v13-ch2-tab .icon{display:block;font-size:19px;margin-bottom:4px}.v13-ch2-tab strong{display:block;font-size:12px}.v13-ch2-tab small{display:block;margin-top:3px;font-size:10px;opacity:.75;font-weight:700}'
  +'.v13-ch2-body{margin-top:14px}'
  +'.v13-ch2-empty{border:1px dashed #d6dce5;border-radius:15px;padding:24px;text-align:center;background:#fbfcfe;color:#6f7887}'
  +'.v13-ch2-empty strong{display:block;color:#24344c;font-size:16px;margin-bottom:5px}.v13-ch2-empty span{font-size:12px}'
  +'.v13-ch2-scales{border:1px solid #e4e7ed;border-radius:17px;background:#fff;padding:15px}'
  +'.v13-ch2-scales-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}'
  +'.v13-ch2-scales-title{font-size:19px;font-weight:800;color:#24344c}'
  +'.v13-ch2-term-tabs{display:flex;gap:6px}.v13-ch2-term{border:1px solid #dfe3ea;background:#f4f6f9;color:#465268;border-radius:10px;padding:8px 13px;font-weight:800;cursor:pointer}.v13-ch2-term.active{background:#7451d9;color:#fff;border-color:#7451d9}'
  +'.v13-ch2-scale-group{border:1px solid #e6e9ef;border-radius:14px;padding:12px;margin-top:10px;background:#fbfcfe}'
  +'.v13-ch2-scale-group h4{margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#6d7686;letter-spacing:.04em}'
  +'.v13-ch2-scale-item{border:1px solid #e5e8ee;border-radius:12px;background:#fff;padding:10px 11px;margin-top:7px}'
  +'.v13-ch2-scale-name{font-weight:800;font-size:13px;color:#24344c;margin-bottom:7px}'
  +'.v13-ch2-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.v13-ch2-meta div{font-size:11px;line-height:1.4;color:#526174}.v13-ch2-meta b{color:#344258}'
  +'.v13-ch2-scale-empty{text-align:center;color:#7a8494;padding:18px;border:1px dashed #d8dde6;border-radius:13px}'
  +'@media(max-width:1050px){.v13-ch2-nav{grid-template-columns:repeat(3,minmax(0,1fr))}}'
  +'@media(max-width:700px){.v13-ch2-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.v13-ch2-head,.v13-ch2-scales-head{align-items:flex-start;flex-direction:column}.v13-ch2-meta{grid-template-columns:1fr}}';
  doc.head.appendChild(s);
}

/* The Level detail page has a canonical four-card summary. We use the exact
   four labels only as a compatibility boundary; no broad body-text matching. */
function findCanonicalLevelGrid(doc){
  var grids=doc.querySelectorAll('.grid');
  for(var i=0;i<grids.length;i++){
    var cards=grids[i].children;
    if(cards.length!==4)continue;
    var names=[];
    for(var j=0;j<cards.length;j++){
      var h=cards[j].querySelector('h3');
      names.push(norm(h&&h.textContent));
    }
    if(names.indexOf('pieces')!==-1 && names.indexOf('scales')!==-1 && names.indexOf('études')!==-1 && names.indexOf('techniques')!==-1){
      return grids[i];
    }
  }
  return null;
}

function getLevel(grid){
  var parent=grid&&grid.parentElement;
  if(!parent)return null;
  var headings=parent.querySelectorAll(':scope > h1,:scope > h2');
  for(var i=0;i<headings.length;i++){
    var m=txt(headings[i].textContent).match(/^LEVEL\s+(\d{1,2})$/i);
    if(m)return +m[1];
  }
  return null;
}

function getScaleAdapter(doc){
  try{
    var w=doc.defaultView;
    if(w&&w.VIOLIN_AI_CURRICULUM&&typeof w.VIOLIN_AI_CURRICULUM.get==='function'){
      return w.VIOLIN_AI_CURRICULUM.get('scales');
    }
    if(w&&w.parent&&w.parent.VIOLIN_AI_CURRICULUM&&typeof w.parent.VIOLIN_AI_CURRICULUM.get==='function'){
      return w.parent.VIOLIN_AI_CURRICULUM.get('scales');
    }
  }catch(e){}
  return null;
}

function getUserModuleData(doc,key,level,term){
  try{
    var w=doc.defaultView&&doc.defaultView.parent?doc.defaultView.parent:doc.defaultView;
    var db=w&&w.VIOLIN_AI_USER_CURRICULA_V1;
    if(!db)return null;
    var module=db[key];
    if(!module)return null;
    if(typeof module.get==='function')return module.get(level,term);
    if(module.levels&&module.levels[level])module=module.levels[level];
    if(module&&module[level])module=module[level];
    if(module&&module[term])return module[term];
    return module||null;
  }catch(e){return null}
}

function asArray(v){
  if(v==null||v==='')return [];
  return Array.isArray(v)?v:[v];
}

function requirementFields(item){
  var r=item&&item.requirements||{};
  return [
    ['Octaves',r.octaves],
    ['Positions',r.positions],
    ['Bowing',r.bowing],
    ['Articulation',r.articulation],
    ['Rhythm',r.rhythmicGroups||r.rhythm],
    ['Accents',r.accents],
    ['Dynamics',r.dynamics],
    ['Tempo',r.tempo],
    ['Objective',item&&item.objective],
    ['Mastery',item&&item.mastery]
  ].filter(function(x){return x[1]!==undefined&&x[1]!==null&&x[1]!==''&&( !Array.isArray(x[1]) || x[1].length)});
}

function valueText(v){return Array.isArray(v)?v.join(' · '):typeof v==='object'?(v.value||v.name||v.label||JSON.stringify(v)):String(v)}

function renderScales(doc,body,level,term){
  var adapter=getScaleAdapter(doc);
  var items=[];
  try{items=adapter&&typeof adapter.list==='function'?adapter.list(level,term):[]}catch(e){items=[]}
  var groups={};
  items.forEach(function(x){var k=x.category||'Scales';(groups[k]||(groups[k]=[])).push(x)});
  var keys=Object.keys(groups);
  if(!keys.length){
    body.innerHTML='<div class="v13-ch2-scale-empty">No Scales Curriculum is defined for Level '+level+' · Term '+term+' yet.</div>';
    return;
  }
  var html='';
  keys.forEach(function(k){
    html+='<div class="v13-ch2-scale-group"><h4>'+esc(k)+'</h4>';
    groups[k].forEach(function(item){
      html+='<div class="v13-ch2-scale-item"><div class="v13-ch2-scale-name">'+esc(item.title)+'</div>';
      var fields=requirementFields(item);
      if(fields.length){
        html+='<div class="v13-ch2-meta">'+fields.map(function(f){return '<div><b>'+esc(f[0])+':</b> '+esc(valueText(f[1]))+'</div>'}).join('')+'</div>';
      }
      html+='</div>';
    });
    html+='</div>';
  });
  body.innerHTML=html;
}

function renderUserModule(doc,body,key,level){
  var data=getUserModuleData(doc,key,level,1);
  if(data==null){
    var m=MODULES.filter(function(x){return x.key===key})[0];
    body.innerHTML='<div class="v13-ch2-empty"><strong>'+esc(m.icon+' '+m.title)+'</strong><span>Your own '+esc(m.sub)+' for Level '+level+' will appear here when its curriculum data is supplied.</span></div>';
    return;
  }
  var arr=Array.isArray(data)?data:(data.items||data.curriculum||[]);
  if(!Array.isArray(arr)||!arr.length){
    var mm=MODULES.filter(function(x){return x.key===key})[0];
    body.innerHTML='<div class="v13-ch2-empty"><strong>'+esc(mm.icon+' '+mm.title)+'</strong><span>No curriculum items have been entered for Level '+level+' yet.</span></div>';
    return;
  }
  body.innerHTML='<div class="v13-ch2-scale-group">'+arr.map(function(x){
    var title=typeof x==='string'?x:(x.title||x.name||'Curriculum item');
    return '<div class="v13-ch2-scale-item"><div class="v13-ch2-scale-name">'+esc(title)+'</div></div>';
  }).join('')+'</div>';
}

function renderModule(doc,panel,key,level){
  var body=panel.querySelector('.v13-ch2-body');
  if(!body)return;
  if(key==='scales'){
    body.innerHTML='<div class="v13-ch2-scales"><div class="v13-ch2-scales-head"><div class="v13-ch2-scales-title">🎵 SCALES CURRICULUM · LEVEL '+level+'</div><div class="v13-ch2-term-tabs"><button type="button" class="v13-ch2-term active" data-term="1">TERM 1</button><button type="button" class="v13-ch2-term" data-term="2">TERM 2</button></div></div><div class="v13-ch2-scale-content"></div></div>';
    var content=body.querySelector('.v13-ch2-scale-content');
    function paint(term){
      renderScales(doc,content,level,term);
      body.querySelectorAll('.v13-ch2-term').forEach(function(b){b.classList.toggle('active',b.dataset.term===String(term))});
    }
    body.querySelectorAll('.v13-ch2-term').forEach(function(b){b.addEventListener('click',function(){paint(+b.dataset.term)})});
    paint(1);
    return;
  }
  renderUserModule(doc,body,key,level);
}

function mount(doc,grid,level){
  var signature='level:'+level;
  var old=doc.getElementById('v13-curriculum-hub-v2');
  if(old&&old.dataset.signature===signature){
    lastSignature=signature;
    return;
  }
  if(old)old.remove();
  injectCss(doc);
  var panel=doc.createElement('section');
  panel.id='v13-curriculum-hub-v2';
  panel.className='v13-curriculum-hub-v2';
  panel.dataset.signature=signature;
  panel.innerHTML='<div class="v13-ch2-head"><h2>🧭 CURRICULUM HUB · LEVEL '+level+'</h2><span>5 CURRICULUM MODULES</span></div><div class="v13-ch2-nav">'+MODULES.map(function(m,i){return '<button type="button" class="v13-ch2-tab'+(i===1?' active':'')+'" data-module="'+escAttr(m.key)+'"><span class="icon">'+m.icon+'</span><strong>'+esc(m.title)+'</strong><small>'+esc(m.sub)+'</small></button>'}).join('')+'</div><div class="v13-ch2-body"></div>';
  grid.style.display='none';
  grid.parentNode.insertBefore(panel,grid.nextSibling);
  panel.querySelectorAll('.v13-ch2-tab').forEach(function(btn){
    btn.addEventListener('click',function(){
      panel.querySelectorAll('.v13-ch2-tab').forEach(function(b){b.classList.toggle('active',b===btn)});
      renderModule(doc,panel,btn.dataset.module,level);
    });
  });
  renderModule(doc,panel,'scales',level);
  lastSignature=signature;
}

function restore(doc){
  var hub=doc.getElementById('v13-curriculum-hub-v2');
  if(hub)hub.remove();
  var grids=doc.querySelectorAll('.grid');
  for(var i=0;i<grids.length;i++){
    if(grids[i].dataset&&grids[i].dataset.v13HubHidden==='1'){
      grids[i].style.display='';
      delete grids[i].dataset.v13HubHidden;
    }
  }
  lastSignature='';
}

function tick(){
  try{
    var doc=frame.contentDocument;
    if(!doc||!doc.body)return;
    var grid=findCanonicalLevelGrid(doc);
    if(!grid){restore(doc);return}
    var level=getLevel(grid);
    if(level==null){restore(doc);return}
    if(grid.dataset.v13HubHidden!=='1')grid.dataset.v13HubHidden='1';
    mount(doc,grid,level);
  }catch(e){}
}

frame.addEventListener('load',function(){
  lastSignature='';
  setTimeout(tick,80);setTimeout(tick,300);setTimeout(tick,800);setTimeout(tick,1500);
});

/* Controlled polling only checks the canonical Level summary. It does not
   observe the entire DOM and it never re-renders when the level/signature is unchanged. */
setInterval(function(){tick()},1000);
tick();
})();
