/* V13 CURRICULUM HUB RUNTIME V2
   Canonical Level-page renderer.
   The iframe owns the actual Level page. This runtime replaces only the
   legacy level(n) renderer after the iframe is loaded; it does not alter
   students, lesson, homework, or curriculum data.

   LOCKED UI:
   Curriculum Hub -> Levels 1-10 -> selected Level ->
   Repertoire | Scales | Études | Technical Exercises | Technique
   Global Technical Domains live only inside Technique.
   Scales Curriculum lives only inside Hub > Scales.
   No Add to Lesson / Add to Homework controls on this page.
*/
(function(){
'use strict';
var frame=document.getElementById('app');
if(!frame)return;
var installedWindow=null;
var ORIGINAL_LEVEL=null;

var MODULES=[
 {key:'repertoire',icon:'🎼',title:'REPERTOIRE',sub:'Repertoire Curriculum'},
 {key:'scales',icon:'🎵',title:'SCALES',sub:'Scales Curriculum'},
 {key:'etudes',icon:'📚',title:'ÉTUDES',sub:'Études Curriculum'},
 {key:'technical-exercises',icon:'🏋️',title:'TECHNICAL EXERCISES',sub:'Technical Exercises Curriculum'},
 {key:'technique',icon:'🧩',title:'TECHNIQUE',sub:'Technique Curriculum'}
];

var DOMAINS=[
 {icon:'🖐️',title:'LEFT HAND',items:['1st position','Finger placement','Finger independence','Finger release','Finger lift','Finger patterns','Finger strength','Extensions','Frame','Chromatic fingering','Shifting preparation','Shifting','Position changes','High positions','Trills','Vibrato','Double stops','Harmonics','Fingered octaves','Tenths','Advanced left-hand coordination']},
 {icon:'👍',title:'THUMB',items:['Thumb relaxation','Thumb position','Thumb mobility','Thumb release','Thumb during shifting','Thumb–hand coordination','Thumb in high positions','Thumb during double stops','Thumb/hand unity']},
 {icon:'🎻',title:'RIGHT HAND / BOW',items:['Bow hold','Relaxed bow hand','Thumb flexibility','Finger flexibility','Straight bow','Bow angle','Bow contact point','Bow speed','Bow weight','Sounding point','Bow distribution','Elbow levels','String crossings','Bow changes','Rapid string crossings','Tone production']},
 {icon:'🎯',title:'STROKES & ARTICULATION',items:['Détaché','Legato','Simple hooked bow','Martelé','Accented détaché','Advanced hooked bow','Collé','Spiccato','Flying strokes','Sautillé','Advanced mixed bow strokes']}
];

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function cw(){try{return frame.contentWindow}catch(e){return null}}
function doc(){try{return frame.contentDocument||cw().document}catch(e){return null}}
function curriculum(){try{return cw().curriculum||null}catch(e){return null}}
function scales(){try{return window.VIOLIN_SCALE_CURRICULUM_V1||null}catch(e){return null}}
function levelData(n){var c=curriculum();return c&&c[n]?c[n]:{p:[],s:[],e:[],t:[]}}
function scaleTerm(level,term){var d=scales();return d&&d[level]&&d[level][term]?d[level][term]:null}
function arr(v){return Array.isArray(v)?v:(v==null||v===''?[]:[v])}

function installStyles(d){
 if(d.getElementById('v13-curriculum-hub-v2-style'))return;
 var s=d.createElement('style');s.id='v13-curriculum-hub-v2-style';
 s.textContent=''
 +'.v13-hub-v2{margin:0 0 18px;padding:18px;border:1px solid #e1e5ec;border-radius:22px;background:linear-gradient(135deg,#fff,#f8f6ff);box-shadow:0 10px 28px rgba(20,35,61,.07)}'
 +'.v13-hub-v2-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.v13-hub-v2-head h2{margin:0;color:#24344c;font-size:23px}.v13-hub-v2-head span{font-size:11px;font-weight:800;color:#7451d9}'
 +'.v13-hub-v2-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.v13-hub-v2-tab{border:1px solid #e0e4eb;border-radius:15px;background:#fff;padding:12px 10px;text-align:left;cursor:pointer;min-height:76px;box-shadow:0 5px 15px rgba(20,35,61,.05);font:inherit;color:#24344c}.v13-hub-v2-tab.active{background:#7451d9;color:#fff;border-color:#7451d9}.v13-hub-v2-tab .icon{display:block;font-size:19px;margin-bottom:4px}.v13-hub-v2-tab strong{display:block;font-size:12px}.v13-hub-v2-tab small{display:block;margin-top:3px;font-size:10px;opacity:.75;font-weight:700}'
 +'.v13-hub-v2-body{margin-top:14px}.v13-hub-v2-empty{border:1px dashed #d6dce5;border-radius:15px;padding:24px;text-align:center;background:#fbfcfe;color:#6f7887}.v13-hub-v2-empty strong{display:block;color:#24344c;font-size:16px;margin-bottom:6px}'
 +'.v13-hub-v2-scales{border:1px solid #e4e7ed;border-radius:17px;background:#fff;padding:15px}.v13-hub-v2-scales-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.v13-hub-v2-scales-title{font-size:19px;font-weight:800;color:#24344c}.v13-hub-v2-terms{display:flex;gap:6px}.v13-hub-v2-term{border:1px solid #dfe3ea;background:#f4f6f9;color:#465268;border-radius:10px;padding:8px 13px;font-weight:800;cursor:pointer}.v13-hub-v2-term.active{background:#7451d9;color:#fff;border-color:#7451d9}.v13-hub-v2-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v13-hub-v2-group{border:1px solid #e7e9ef;border-radius:14px;padding:12px;background:#fbfcfe}.v13-hub-v2-group h4{margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#6d7686}.v13-hub-v2-items{display:flex;flex-wrap:wrap;gap:6px}.v13-hub-v2-item{padding:6px 9px;border-radius:999px;background:#eef1f5;color:#344258;font-size:11px;font-weight:700}.v13-hub-v2-meta{margin-top:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v13-hub-v2-meta>div{border:1px solid #e7e9ef;border-radius:11px;padding:9px;background:#fff}.v13-hub-v2-meta b{display:block;font-size:10px;color:#7a8494;text-transform:uppercase;margin-bottom:3px}.v13-hub-v2-meta span{font-size:12px;font-weight:700;color:#344258}'
 +'.v13-hub-v2-tech{border:1px solid #e4e7ed;border-radius:17px;background:#fff;padding:15px}.v13-hub-v2-tech-title{font-size:19px;font-weight:800;color:#24344c}.v13-hub-v2-tech-sub{font-size:12px;color:#6f7887;margin:4px 0 13px}.v13-hub-v2-domain-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v13-hub-v2-domain{border:1px solid #e7e9ef;border-radius:15px;background:#fbfcfe;overflow:hidden}.v13-hub-v2-domain button{width:100%;border:0;background:transparent;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;font:inherit;color:#24344c;font-weight:800;cursor:pointer}.v13-hub-v2-domain .left{display:flex;align-items:center;gap:7px}.v13-hub-v2-chevron{transition:transform .18s ease}.v13-hub-v2-domain.open .v13-hub-v2-chevron{transform:rotate(90deg)}.v13-hub-v2-domain-body{display:none;padding:0 14px 14px}.v13-hub-v2-domain.open .v13-hub-v2-domain-body{display:block}.v13-hub-v2-domain-list{display:flex;flex-wrap:wrap;gap:6px}.v13-hub-v2-domain-list span{padding:6px 9px;border-radius:999px;background:#eef1f5;color:#465268;font-size:11px;font-weight:700}'
 +'@media(max-width:1050px){.v13-hub-v2-nav{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.v13-hub-v2-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.v13-hub-v2-head,.v13-hub-v2-scales-head{align-items:flex-start;flex-direction:column}.v13-hub-v2-groups,.v13-hub-v2-meta,.v13-hub-v2-domain-grid{grid-template-columns:1fr}}';
 d.head.appendChild(s);
}

function scaleContent(d,body,level,term){
 var c=scaleTerm(level,term);
 if(!c){body.innerHTML='<div class="v13-hub-v2-empty"><strong>🎵 SCALES · TERM '+term+'</strong><span>No Scales Curriculum is defined for Level '+level+' · Term '+term+' yet.</span></div>';return}
 var groups=[['Major',c.major],['Minor',c.minor],['Arpeggios',c.arpeggios],['Dominant 7th',c.dominant7],['Diminished 7th',c.diminished7],['Chromatic',c.chromatic],['Double Stops',c.doubleStops],['One String',c.oneString]];
 var html='<div class="v13-hub-v2-groups">';
 groups.forEach(function(g){var a=arr(g[1]);if(!a.length)return;html+='<div class="v13-hub-v2-group"><h4>'+esc(g[0])+'</h4><div class="v13-hub-v2-items">'+a.map(function(x){return '<span class="v13-hub-v2-item">'+esc(x)+'</span>'}).join('')+'</div></div>'});
 html+='</div><div class="v13-hub-v2-meta">';
 [['Positions',c.positions],['Bowing',arr(c.bowing).join(' · ')],['Articulation',arr(c.articulation).join(' · ')],['Rhythm',arr(c.rhythm).join(' · ')],['Accents',arr(c.accents).join(' · ')],['Dynamics / Tempo',arr(c.dynamics).concat(c.tempo||[]).join(' · ')||'—']].forEach(function(x){html+='<div><b>'+esc(x[0])+'</b><span>'+esc(x[1]||'—')+'</span></div>'});
 html+='</div>';body.innerHTML=html;
}

function techniqueContent(body,level){
 var html='<div class="v13-hub-v2-tech"><div class="v13-hub-v2-tech-title">🧭 GLOBAL TECHNICAL DOMAINS · LEVEL '+level+'</div><div class="v13-hub-v2-tech-sub">Ο συνολικός τεχνικός χάρτης του curriculum — μέσα στο TECHNIQUE.</div><div class="v13-hub-v2-domain-grid">';
 DOMAINS.forEach(function(g){html+='<section class="v13-hub-v2-domain"><button type="button"><span class="left"><span>'+g.icon+'</span><span>'+esc(g.title)+'</span></span><span class="v13-hub-v2-chevron">›</span></button><div class="v13-hub-v2-domain-body"><div class="v13-hub-v2-domain-list">'+g.items.map(function(x){return '<span>'+esc(x)+'</span>'}).join('')+'</div></div></section>'});
 html+='</div></div>';body.innerHTML=html;
 body.querySelectorAll('.v13-hub-v2-domain button').forEach(function(b){b.addEventListener('click',function(){b.parentNode.classList.toggle('open')})});
}

function activate(hub,key,level,d){
 var body=hub.querySelector('.v13-hub-v2-body');
 hub.querySelectorAll('.v13-hub-v2-tab').forEach(function(b){b.classList.toggle('active',b.dataset.module===key)});
 if(key==='scales'){
  body.innerHTML='<div class="v13-hub-v2-scales"><div class="v13-hub-v2-scales-head"><div class="v13-hub-v2-scales-title">🎵 SCALES CURRICULUM · LEVEL '+level+'</div><div class="v13-hub-v2-terms"><button type="button" class="v13-hub-v2-term active" data-term="1">TERM 1</button><button type="button" class="v13-hub-v2-term" data-term="2">TERM 2</button></div></div><div class="v13-hub-v2-scale-content"></div></div>';
  var content=body.querySelector('.v13-hub-v2-scale-content');
  function paint(t){scaleContent(d,content,level,t);body.querySelectorAll('.v13-hub-v2-term').forEach(function(b){b.classList.toggle('active',b.dataset.term===String(t))})}
  body.querySelectorAll('.v13-hub-v2-term').forEach(function(b){b.addEventListener('click',function(){paint(+b.dataset.term)})});paint(1);
 } else if(key==='technique') techniqueContent(body,level);
 else if(key==='repertoire'){
  var c=levelData(level);body.innerHTML='<div class="v13-hub-v2-groups">'+[['Pieces',c.p],['Repertoire',c.p]].slice(0,1).map(function(g){return '<div class="v13-hub-v2-group"><h4>'+esc(g[0])+'</h4><div class="v13-hub-v2-items">'+arr(g[1]).map(function(x){return '<span class="v13-hub-v2-item">'+esc(x)+'</span>'}).join('')+'</div></div>'}).join('')+'</div>';
 } else if(key==='etudes'){
  var e=levelData(level).e;body.innerHTML='<div class="v13-hub-v2-groups"><div class="v13-hub-v2-group"><h4>Études</h4><div class="v13-hub-v2-items">'+arr(e).map(function(x){return '<span class="v13-hub-v2-item">'+esc(x)+'</span>'}).join('')+'</div></div></div>';
 } else if(key==='technical-exercises'){
  var t=levelData(level).t;body.innerHTML='<div class="v13-hub-v2-groups"><div class="v13-hub-v2-group"><h4>Technical Exercises</h4><div class="v13-hub-v2-items">'+arr(t).map(function(x){return '<span class="v13-hub-v2-item">'+esc(x)+'</span>'}).join('')+'</div></div></div>';
 }
}

function renderLevel(n){
 var d=doc(),w=cw();if(!d||!w)return;
 installStyles(d);
 var wrap=d.querySelector('.wrap')||d.body;
 var old=d.getElementById('v13-curriculum-hub-v2');if(old)old.remove();
 /* Remove only the legacy level summary generated by index.html. */
 d.querySelectorAll('.wrap>.grid').forEach(function(g){
   var cards=g.children||[];
   if(cards.length===4){g.style.display='none';g.setAttribute('data-v13-legacy-level-grid','1')}
 });
 var title=d.querySelector('.wrap>.title');
 var hub=d.createElement('section');hub.id='v13-curriculum-hub-v2';hub.className='v13-hub-v2';
 hub.innerHTML='<div class="v13-hub-v2-head"><h2>🧭 CURRICULUM HUB · LEVEL '+n+'</h2><span>5 CURRICULUM MODULES</span></div><div class="v13-hub-v2-nav">'+MODULES.map(function(m){return '<button type="button" class="v13-hub-v2-tab" data-module="'+m.key+'"><span class="icon">'+m.icon+'</span><strong>'+esc(m.title)+'</strong><small>'+esc(m.sub)+'</small></button>'}).join('')+'</div><div class="v13-hub-v2-body"></div>';
 if(title&&title.nextElementSibling)wrap.insertBefore(hub,title.nextElementSibling);else wrap.appendChild(hub);
 hub.querySelectorAll('.v13-hub-v2-tab').forEach(function(b){b.addEventListener('click',function(){activate(hub,b.dataset.module,n,d)})});
 activate(hub,'scales',n,d);
}

function install(){
 var w=cw();if(!w)return;
 if(installedWindow!==w){
   installedWindow=w;
   try{ORIGINAL_LEVEL=w.level}catch(e){ORIGINAL_LEVEL=null}
   /* Override only the Level-detail renderer. The rest of the V10 app remains untouched. */
   w.level=function(n){renderLevel(+n)};
 }
}
function onload(){setTimeout(install,0);setTimeout(install,100);setTimeout(install,500);}
frame.addEventListener('load',onload);
if(frame.contentDocument)install();
setInterval(install,1000);
})();
