/* V13 CURRICULUM HUB — LEVEL DETECTION BRIDGE V1
   Safe compatibility shim for the existing V2 renderer.
   It does not alter curriculum/state data. It only supplies the exact LEVEL
   heading boundary that V2 expects when the four-card grid lives under a hero.
*/
(function(){
'use strict';
var frame=document.getElementById('app');
if(!frame)return;
function text(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function findGrid(doc){
  var grids=doc.querySelectorAll('.grid');
  for(var i=0;i<grids.length;i++){
    var cards=grids[i].children;if(cards.length!==4)continue;
    var names=[];
    for(var j=0;j<cards.length;j++){var h=cards[j].querySelector('h3');names.push(text(h&&h.textContent).toLowerCase())}
    if(names.indexOf('pieces')!==-1&&names.indexOf('scales')!==-1&&names.indexOf('études')!==-1&&names.indexOf('techniques')!==-1)return grids[i];
  }
  return null;
}
function level(doc){
  var els=doc.querySelectorAll('h1,h2,h3,h4,.title,.hero');
  for(var i=0;i<els.length;i++){var m=text(els[i].textContent).match(/\bLEVEL\s*(\d{1,2})\b/i);if(m)return +m[1]}
  return null;
}
function run(){try{var doc=frame.contentDocument;if(!doc||!doc.body)return;var grid=findGrid(doc);if(!grid)return;var n=level(doc);if(n==null)return;var p=grid.parentElement;if(!p)return;var bridge=p.querySelector(':scope > .v13-level-detection-bridge');if(!bridge){bridge=doc.createElement('h1');bridge.className='v13-level-detection-bridge';bridge.setAttribute('aria-hidden','true');bridge.style.cssText='position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;border:0!important;padding:0!important;margin:0!important';p.insertBefore(bridge,p.firstChild)}bridge.textContent='LEVEL '+n}catch(e){}}
frame.addEventListener('load',function(){setTimeout(run,100);setTimeout(run,500);setTimeout(run,1200)});
setInterval(run,700);
run();
})();
