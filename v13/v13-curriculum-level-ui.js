(function(){'use strict';
/* V13: Technique Exercise card + explicit Scales-tab visibility bridge. */
var root=document.getElementById('app');
function txt(x){return String(x||'').replace(/\s+/g,' ').trim()}
function inject(doc){
  if(!doc||!doc.body)return;
  if(!doc.getElementById('v13-tech-ex-css')){var s=doc.createElement('style');s.id='v13-tech-ex-css';s.textContent='.v13-tech-ex-card{background:#fff;border:1px solid #e6e9ef;border-radius:18px;padding:16px;box-shadow:0 7px 24px #14233d0d;min-height:120px}.v13-tech-ex-card h3{margin:0 0 10px;font-size:18px}.v13-tech-ex-card .v13-tech-ex-sub{font-size:12px;font-weight:700;color:#687487;line-height:1.45}.v13-tech-ex-card .v13-tech-ex-badge{display:inline-block;margin-top:12px;padding:5px 9px;border-radius:99px;background:#edf0f5;color:#526174;font-size:11px;font-weight:800}@media(max-width:700px){.v13-tech-ex-card{min-height:0}}';doc.head.appendChild(s)}
  var levelHead=[...doc.querySelectorAll('h1,h2')].find(function(h){return /^Level\s+\d+$/i.test(txt(h.textContent))});if(!levelHead)return;
  var technique=[...doc.querySelectorAll('.card,.section')].find(function(x){var h=x.querySelector('h3,h2');return h&&/^🎻?\s*Techniques?$/i.test(txt(h.textContent))});if(!technique)return;
  var parent=technique.parentElement;if(!parent||parent.querySelector('#v13-tech-ex-card'))return;
  var card=doc.createElement('div');card.id='v13-tech-ex-card';card.className='v13-tech-ex-card';card.innerHTML='<h3>🎯 Technique Exercises</h3><div class="v13-tech-ex-sub">Exercises for focused technical development, organised separately from the Technical Curriculum.</div><span class="v13-tech-ex-badge">Exercise Library</span>';parent.appendChild(card);
}
function bindScaleTab(doc){
  if(!doc||!doc.body||doc.documentElement.dataset.v13ScaleTabBound==='1')return;
  var buttons=[...doc.querySelectorAll('.tabs button')];
  if(!buttons.length)return;
  var scaleBtn=buttons.find(function(b){return /^\s*SCALES\s*$/i.test(txt(b.textContent))});
  if(!scaleBtn)return;
  doc.documentElement.dataset.v13ScaleTabBound='1';
  buttons.forEach(function(b){b.addEventListener('click',function(){
    var isScale=b===scaleBtn;
    buttons.forEach(function(x){if(x===scaleBtn){if(isScale)x.classList.add('active');else x.classList.remove('active')}});
    setTimeout(function(){
      if(isScale)scaleBtn.classList.add('active');
      else scaleBtn.classList.remove('active');
      var card=doc.getElementById('v13fixscale');
      if(card)card.style.display=isScale?'':'none';
    },0);
  },true)});
  var observer=new MutationObserver(function(){
    var card=doc.getElementById('v13fixscale');
    if(card&&!scaleBtn.classList.contains('active'))card.style.display='none';
  });
  observer.observe(scaleBtn,{attributes:true,attributeFilter:['class','aria-current','aria-selected','data-active']});
}
function walk(doc){try{inject(doc);bindScaleTab(doc);[...doc.querySelectorAll('iframe')].forEach(function(f){try{walk(f.contentDocument)}catch(e){}})}catch(e){}}
function run(){try{walk(root&&root.contentDocument)}catch(e){}}
if(root){root.addEventListener('load',function(){setTimeout(run,100);setTimeout(run,500);setTimeout(run,1200);setTimeout(run,2500)});setInterval(run,600);run()}
})();