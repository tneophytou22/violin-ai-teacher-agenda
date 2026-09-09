/* V13 CURRICULUM HUB V3 — SAFE ADDITIVE LEVEL SHELL
   - Uses the canonical Level hero as the page boundary.
   - Hides only the original 4-card summary on a confirmed Level detail page.
   - Leaves Global Technical Domains and the existing Level Scales display intact.
   - SCALES is a read-only mirror of the shared Scales Curriculum data.
   - No Homework/Lesson/Student state is read or written.
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
function txt(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function levelFromHero(doc){
 var h=doc.querySelector('.hero h1');
 var m=txt(h&&h.textContent).match(/^LEVEL\s+(\d{1,2})$/i);
 if(m)return +m[1];
 var heads=doc.querySelectorAll('h1,h2');
 for(var i=0;i<heads.length;i++){m=txt(heads[i].textContent).match(/^LEVEL\s+(\d{1,2})$/i);if(m)return +m[1]}
 return null;
}
function findSummaryGrid(doc){
 var grids=doc.querySelectorAll('.grid');
 for(var i=0;i<grids.length;i++){
  var cards=grids[i].children;if(cards.length!==4)continue;
  var names=[];
  for(var j=0;j<cards.length;j++){
   var h=cards[j].querySelector('h3');names.push(txt(h&&h.textContent).toLowerCase());
  }
  if(names.indexOf('pieces')>=0&&names.indexOf('scales')>=0&&names.indexOf('études')>=0&&names.indexOf('techniques')>=0)return grids[i];
 }
 return null;
}
function scaleData(doc){try{return doc.defaultView&&doc.defaultView.parent&&doc.defaultView.parent.VIOLIN_SCALE_CURRICULUM_V1?doc.defaultView.parent.VIOLIN_SCALE_CURRICULUM_V1:null}catch(e){return null}}
function css(doc){
 if(doc.getElementById('v13-curriculum-hub-v3-style'))return;
 var s=doc.createElement('style');s.id='v13-curriculum-hub-v3-style';
 s.textContent=''
 +'.v13-hub-v3{margin:0 0 18px;padding:18px;border:1px solid #e1e5ec;border-radius:22px;background:linear-gradient(135deg,#fff,#f8f6ff);box-shadow:0 10px 28px rgba(20,35,61,.07)}'
 +'.v13-hub-v3-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.v13-hub-v3-head h2{margin:0;color:#24344c;font-size:23px}.v13-hub-v3-head span{font-size:11px;font-weight:800;color:#7451d9}'
 +'.v13-hub-v3-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.v13-hub-v3-tab{border:1px solid #e0e4eb;border-radius:15px;background:#fff;padding:12px 10px;text-align:left;cursor:pointer;min-height:76px;box-shadow:0 5px 15px rgba(20,35,61,.05);font:inherit;color:#24344c}.v13-hub-v3-tab:hover{transform:translateY(-1px)}.v13-hub-v3-tab.active{background:#7451d9;color:#fff;border-color:#7451d9}.v13-hub-v3-tab .icon{display:block;font-size:19px;margin-bottom:4px}.v13-hub-v3-tab strong{display:block;font-size:12px}.v13-hub-v3-tab small{display:block;margin-top:3px;font-size:10px;opacity:.75;font-weight:700}'
 +'.v13-hub-v3-body{margin-top:14px}.v13-hub-v3-empty{border:1px dashed #d6dce5;border-radius:15px;padding:22px;text-align:center;background:#fbfcfe;color:#6f7887}.v13-hub-v3-empty strong{display:block;color:#24344c;font-size:16px;margin-bottom:5px}'
 +'.v13-hub-v3-scales{border:1px solid #e4e7ed;border-radius:17px;background:#fff;padding:15px}.v13-hub-v3-scales-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.v13-hub-v3-scales-title{font-size:19px;font-weight:800;color:#24344c}.v13-hub-v3-terms{display:flex;gap:6px}.v13-hub-v3-term{border:1px solid #dfe3ea;background:#f4f6f9;color:#465268;border-radius:10px;padding:8px 13px;font-weight:800;cursor:pointer}.v13-hub-v3-term.active{background:#7451d9;color:#fff;border-color:#7451d9}.v13-hub-v3-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v13-hub-v3-group{border:1px solid #e7e9ef;border-radius:14px;padding:12px;background:#fbfcfe}.v13-hub-v3-group h4{margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#6d7686}.v13-hub-v3-items{display:flex;flex-wrap:wrap;gap:6px}.v13-hub-v3-item{padding:6px 9px;border-radius:999px;background:#eef1f5;color:#344258;font-size:11px;font-weight:700}.v13-hub-v3-meta{margin-top:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v13-hub-v3-meta>div{border:1px solid #e7e9ef;border-radius:11px;padding:9px;background:#fff}.v13-hub-v3-meta b{display:block;font-size:10px;color:#7a8494;text-transform:uppercase;margin-bottom:3px}.v13-hub-v3-meta span{font-size:12px;font-weight:700;color:#344258}'
 +'@media(max-width:1050px){.v13-hub-v3-nav{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.v13-hub-v3-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.v13-hub-v3-head,.v13-hub-v3-scales-head{align-items:flex-start;flex-direction:column}.v13-hub-v3-groups,.v13-hub-v3-meta{grid-template-columns:1fr}}';
 doc.head.appendChild(s);
}
function arr(v){return Array.isArray(v)?v:(v==null||v===''?[]:[v])}
function renderScales(doc,body,level,term){
 var d=scaleData(doc),c=d&&d[level]&&d[level][term];
 if(!c){body.innerHTML='<div class="v13-hub-v3-empty">No Scales Curriculum is defined for Level '+level+' · Term '+term+' yet.</div>';return;}
 var groups=[['Major',c.major],['Minor',c.minor],['Arpeggios',c.arpeggios],['Dominant 7th',c.dominant7],['Diminished 7th',c.diminished7],['Chromatic',c.chromatic],['Double Stops',c.doubleStops],['One String',c.oneString]];
 var html='<div class="v13-hub-v3-groups">';
 groups.forEach(function(g){var a=arr(g[1]);if(!a.length)return;html+='<div class="v13-hub-v3-group"><h4>'+esc(g[0])+'</h4><div class="v13-hub-v3-items">'+a.map(function(x){return '<span class="v13-hub-v3-item">'+esc(x)+'</span>'}).join('')+'</div></div>'});
 html+='</div><div class="v13-hub-v3-meta">';
 [['Positions',c.positions],['Bowing',arr(c.bowing).join(' · ')],['Articulation',arr(c.articulation).join(' · ')],['Rhythm',arr(c.rhythm).join(' · ')],['Accents',arr(c.accents).join(' · ')],['Dynamics / Tempo',arr(c.dynamics).concat(c.tempo||[]).join(' · ')||'—']].forEach(function(x){html+='<div><b>'+esc(x[0])+'</b><span>'+esc(x[1]||'—')+'</span></div>'});
 html+='</div>';body.innerHTML=html;
}
function renderPlaceholder(body,m,level){body.innerHTML='<div class="v13-hub-v3-empty"><strong>'+esc(m.icon+' '+m.title)+'</strong><span>Your own '+esc(m.sub)+' for Level '+level+' will appear here. No external curriculum is inserted.</span></div>'}
function renderModule(hub,key,level,doc){
 var body=hub.querySelector('.v13-hub-v3-body');if(!body)return;
 if(key==='scales'){
  body.innerHTML='<div class="v13-hub-v3-scales"><div class="v13-hub-v3-scales-head"><div class="v13-hub-v3-scales-title">🎵 SCALES CURRICULUM · LEVEL '+level+'</div><div class="v13-hub-v3-terms"><button type="button" class="v13-hub-v3-term active" data-term="1">TERM 1</button><button type="button" class="v13-hub-v3-term" data-term="2">TERM 2</button></div></div><div class="v13-hub-v3-scale-content"></div></div>';
  var content=body.querySelector('.v13-hub-v3-scale-content');
  function paint(term){renderScales(doc,content,level,term);body.querySelectorAll('.v13-hub-v3-term').forEach(function(b){b.classList.toggle('active',b.dataset.term===String(term))})}
  body.querySelectorAll('.v13-hub-v3-term').forEach(function(b){b.addEventListener('click',function(){paint(+b.dataset.term)})});paint(1);return;
 }
 renderPlaceholder(body,MODULES.filter(function(x){return x.key===key})[0],level);
}
function mount(doc,grid,level){
 css(doc);
 var hub=doc.getElementById('v13-curriculum-hub-v3');
 if(!hub){
  hub=doc.createElement('section');hub.id='v13-curriculum-hub-v3';hub.className='v13-hub-v3';hub.dataset.level=String(level);
  hub.innerHTML='<div class="v13-hub-v3-head"><h2>🧭 CURRICULUM HUB · LEVEL '+level+'</h2><span>5 CURRICULUM MODULES</span></div><div class="v13-hub-v3-nav">'+MODULES.map(function(m,i){return '<button type="button" class="v13-hub-v3-tab'+(i===1?' active':'')+'" data-module="'+m.key+'"><span class="icon">'+m.icon+'</span><strong>'+esc(m.title)+'</strong><small>'+esc(m.sub)+'</small></button>'}).join('')+'</div><div class="v13-hub-v3-body"></div>';
  grid.parentNode.insertBefore(hub,grid);
  hub.querySelectorAll('.v13-hub-v3-tab').forEach(function(btn){btn.addEventListener('click',function(){hub.querySelectorAll('.v13-hub-v3-tab').forEach(function(b){b.classList.toggle('active',b===btn)});renderModule(hub,btn.dataset.module,level,doc)})});
 }
 if(grid.dataset.v13HubV3Hidden!=='1'){grid.dataset.v13HubV3Hidden='1';grid.style.display='none'}
 var active=hub.querySelector('.v13-hub-v3-tab.active');
 if(active&&hub.querySelector('.v13-hub-v3-body').childElementCount===0)renderModule(hub,active.dataset.module,level,doc);
}
function restore(doc){var hub=doc.getElementById('v13-curriculum-hub-v3');if(hub)hub.remove();var grids=doc.querySelectorAll('.grid');for(var i=0;i<grids.length;i++){if(grids[i].dataset&&grids[i].dataset.v13HubV3Hidden==='1'){grids[i].style.display='';delete grids[i].dataset.v13HubV3Hidden}}}
function tick(){try{var doc=frame.contentDocument;if(!doc||!doc.body)return;var level=levelFromHero(doc),grid=findSummaryGrid(doc);if(level==null||!grid){restore(doc);return}mount(doc,grid,level)}catch(e){console.error('[V13 Curriculum Hub V3]',e)}}
frame.addEventListener('load',function(){setTimeout(tick,100);setTimeout(tick,400);setTimeout(tick,1000)});
setInterval(tick,1000);tick();
})();
