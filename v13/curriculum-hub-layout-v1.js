/* V13 CURRICULUM HUB — LEVEL MODULE NAVIGATION
   Isolated presentation layer.
   - Converts the canonical Level 4-card curriculum summary into a 5-module Hub.
   - Reuses the existing Scales and Technique presentation layers without changing their data/state.
   - Does not touch Homework, Lesson, Students, selections or curriculum ownership.
   - Other curriculum modules remain explicit placeholders until their user-owned datasets are supplied.
*/
(function(){
'use strict';
var frame=document.getElementById('app');
var MODULES=[
  {key:'repertoire',icon:'🎼',title:'REPERTOIRE',sub:'Repertoire Curriculum'},
  {key:'scales',icon:'🎵',title:'SCALES',sub:'Scales Curriculum'},
  {key:'etudes',icon:'📚',title:'ÉTUDES',sub:'Études Curriculum'},
  {key:'technical-exercises',icon:'🏋️',title:'TECHNICAL EXERCISES',sub:'Technical Exercises Curriculum'},
  {key:'technique',icon:'🧩',title:'TECHNIQUE',sub:'Technique Curriculum'}
];
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function css(doc){
  if(doc.getElementById('v13-curriculum-hub-style'))return;
  var s=doc.createElement('style');s.id='v13-curriculum-hub-style';
  s.textContent=''
  +'.v13-curriculum-hub{margin-top:18px;padding:18px;border:1px solid #e5e8ef;border-radius:22px;background:linear-gradient(135deg,#fff,#f8f6ff);box-shadow:0 10px 28px rgba(20,35,61,.07)}'
  +'.v13-curriculum-hub-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}'
  +'.v13-curriculum-hub-title h2{margin:0;color:#24344c;font-size:22px}.v13-curriculum-hub-title span{font-size:11px;font-weight:800;color:#7451d9}'
  +'.v13-curriculum-hub-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}'
  +'.v13-curriculum-hub-card{border:1px solid #e2e6ed;border-radius:15px;background:#fff;padding:13px 10px;text-align:left;cursor:pointer;min-height:82px;transition:.15s ease;box-shadow:0 5px 15px rgba(20,35,61,.05)}'
  +'.v13-curriculum-hub-card:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(20,35,61,.09)}'
  +'.v13-curriculum-hub-card.active{background:#7451d9;color:#fff;border-color:#7451d9}'
  +'.v13-curriculum-hub-card .icon{font-size:20px;display:block;margin-bottom:5px}.v13-curriculum-hub-card strong{display:block;font-size:12px}.v13-curriculum-hub-card small{display:block;margin-top:3px;font-size:10px;opacity:.72;font-weight:700}'
  +'.v13-curriculum-hub-body{margin-top:14px}.v13-curriculum-module-empty{border:1px dashed #d7dce5;border-radius:15px;padding:25px;text-align:center;background:#fbfcfe;color:#6f7887}'
  +'.v13-curriculum-module-empty strong{display:block;color:#24344c;font-size:16px;margin-bottom:5px}.v13-curriculum-module-empty span{font-size:12px}'
  +'@media(max-width:1000px){.v13-curriculum-hub-nav{grid-template-columns:repeat(3,minmax(0,1fr))}}'
  +'@media(max-width:700px){.v13-curriculum-hub-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.v13-curriculum-hub-title{align-items:flex-start;flex-direction:column}}';
  doc.head.appendChild(s);
}
function findCanonicalGrid(doc){
  var grids=doc.querySelectorAll('.grid');
  for(var i=0;i<grids.length;i++){
    var cards=grids[i].children;if(cards.length!==4)continue;
    var names=[];
    for(var j=0;j<cards.length;j++){var h=cards[j].querySelector('h3');names.push(h?(h.textContent||'').replace(/\s+/g,' ').trim().toLowerCase():'')}
    if(names.indexOf('pieces')!==-1&&names.indexOf('scales')!==-1&&names.indexOf('études')!==-1&&names.indexOf('techniques')!==-1)return grids[i];
  }
  return null;
}
function levelFromGrid(grid){
  var wrap=grid&&grid.parentElement;var heads=wrap?wrap.querySelectorAll('h1,h2'):[];
  for(var i=0;i<heads.length;i++){var t=(heads[i].textContent||'').replace(/\s+/g,' ').trim();var m=t.match(/^LEVEL\s+(\d{1,2})$/i);if(m)return +m[1]}
  return null;
}
function renderModule(doc,panel,key){
  var body=panel.querySelector('.v13-curriculum-hub-body');if(!body)return;
  body.innerHTML='';
  var existing=key==='scales'?doc.getElementById('v13-level-scales-panel'):key==='technique'?doc.getElementById('v13-tech-domains-panel'):null;
  if(existing){body.appendChild(existing);return}
  var m=MODULES.filter(function(x){return x.key===key})[0];
  body.innerHTML='<div class="v13-curriculum-module-empty"><strong>'+esc(m.icon+' '+m.title)+'</strong><span>Your '+esc(m.sub)+' will appear here. This module is ready for your own Level curriculum data.</span></div>';
}
function mount(doc,grid,level){
  var old=doc.getElementById('v13-curriculum-hub');
  if(old&&old.dataset.level===String(level)&&old.dataset.sourceGrid==='1')return;
  if(old)old.remove();
  css(doc);
  var panel=doc.createElement('section');panel.id='v13-curriculum-hub';panel.className='v13-curriculum-hub';panel.dataset.level=String(level);panel.dataset.sourceGrid='1';panel.dataset.active='scales';
  panel.innerHTML='<div class="v13-curriculum-hub-title"><h2>🧭 CURRICULUM HUB · LEVEL '+level+'</h2><span>5 CURRICULUM MODULES</span></div><div class="v13-curriculum-hub-nav">'+MODULES.map(function(m,i){return '<button type="button" class="v13-curriculum-hub-card'+(i===1?' active':'')+'" data-module="'+m.key+'"><span class="icon">'+m.icon+'</span><strong>'+m.title+'</strong><small>'+m.sub+'</small></button>'}).join('')+'</div><div class="v13-curriculum-hub-body"></div>';
  grid.style.display='none';
  grid.parentNode.insertBefore(panel,grid.nextSibling);
  panel.querySelectorAll('.v13-curriculum-hub-card').forEach(function(btn){btn.addEventListener('click',function(){panel.dataset.active=btn.dataset.module;panel.querySelectorAll('.v13-curriculum-hub-card').forEach(function(b){b.classList.toggle('active',b===btn)});renderModule(doc,panel,btn.dataset.module)})});
  renderModule(doc,panel,'scales');
}
function restore(doc){
  var hub=doc.getElementById('v13-curriculum-hub');if(hub)hub.remove();
  var grids=doc.querySelectorAll('.grid');for(var i=0;i<grids.length;i++){if(grids[i].dataset&&grids[i].style.display==='none'){var cards=grids[i].children;if(cards.length===4)grids[i].style.display=''}}
}
function tick(){
  try{var doc=frame.contentDocument;if(!doc||!doc.body)return;var grid=findCanonicalGrid(doc);if(!grid){restore(doc);return}var level=levelFromGrid(grid);if(level==null){restore(doc);return}mount(doc,grid,level)}catch(e){}
}
frame.addEventListener('load',function(){setTimeout(tick,120);setTimeout(tick,600);setTimeout(tick,1400)});
setInterval(tick,1200);
})();
