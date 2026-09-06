(function(){'use strict';
function txt(x){return String(x==null?'':x).replace(/\s+/g,' ').trim()}
function norm(x){return txt(x).toLowerCase()}
function arr(x){return !x?[]:(Array.isArray(x)?x:[x])}
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})}
function getStudent(){try{var a=JSON.parse(localStorage.getItem('VIOLIN_AI_AGENDA_V10')||'{}');return (a.students||[]).find(function(s){return s})||null}catch(e){return null}}
function render(){try{
 var outer=document.getElementById('app');if(!outer||!outer.contentDocument)return;
 var fixed=outer.contentWindow, inner=fixed.document.getElementById('app');if(!inner||!inner.contentDocument)return;
 var d=inner.contentDocument, card=d.getElementById('v13fixscale');if(!card)return;
 var data=fixed.VIOLIN_SCALE_CURRICULUM_V1||window.VIOLIN_SCALE_CURRICULUM_V1;if(!data)return;
 var s=getStudent(), level=Number(s&&(s.level??s.currentLevel??s.grade))||1, term=Number(s&&(s.term??s.currentTerm))||1;
 var c=typeof data.getTerm==='function'?data.getTerm(level,term):data[level]&&data[level][term];if(!c)return;
 var map={'Major Scales':'major','Minor Scales':'minor','Tonic Arpeggios':'arpeggios','Dominant 7th':'dominant7','Diminished 7th':'diminished7','Chromatic Scales':'chromatic','Double Stops':'doubleStops','One-String Scales':'oneString'};
 card.querySelectorAll('.v13fixpick').forEach(function(p){
   if(p.querySelector('.v13-picker-details'))return;
   var title=txt(p.querySelector('b')&&p.querySelector('b').textContent), cat=txt(p.querySelector('small')&&p.querySelector('small').textContent), key=map[cat];if(!key)return;
   var vals=arr(c[key]), match=vals.find(function(v){return norm(v)===norm(title)})||title;
   var octave=(String(match).match(/(?:—|-|–)\s*([^—\-–]*?\b\d+\s*octaves?\b)/i)||[])[1];
   if(!octave){var om=String(title).match(/(\d+(?:\s*[–-]\s*\d+)?\s*octaves?)/i);octave=om?om[1]:''}
   var lines=[];lines.push('<div><b>Octaves:</b> '+esc(octave||'Not specified in curriculum')+'</div>');
   if(c.tempo)lines.push('<div><b>Tempo:</b> '+esc(c.tempo)+'</div>');
   if(arr(c.bowing).length)lines.push('<div><b>1. Bowing:</b> '+esc(arr(c.bowing).join(' · '))+'</div>');
   if(arr(c.articulation).length)lines.push('<div><b>2. Articulation:</b> '+esc(arr(c.articulation).join(' · '))+'</div>');
   if(arr(c.rhythm).length)lines.push('<div><b>3. Rhythmic groups:</b> '+esc(arr(c.rhythm).join(' · '))+'</div>');
   if(arr(c.accents).length)lines.push('<div><b>4. Accents:</b> '+esc(arr(c.accents).join(' · '))+'</div>');
   if(arr(c.dynamics).length)lines.push('<div><b>5. Dynamics:</b> '+esc(arr(c.dynamics).join(' · '))+'</div>');
   if(c.positions)lines.push('<div><b>6. Positions:</b> '+esc(c.positions)+'</div>');
   if(c.objective)lines.push('<div><b>7. Objective:</b> '+esc(c.objective)+'</div>');
   if(c.mastery)lines.push('<div><b>8. Mastery:</b> '+esc(c.mastery)+'</div>');
   var box=d.createElement('div');box.className='v13-picker-details';box.style.cssText='margin:7px 0 2px 30px;padding:9px 11px;border-left:3px solid #cfc2ff;background:#faf8ff;border-radius:8px;font-size:11px;line-height:1.55;color:#526174';box.innerHTML=lines.join('');p.querySelector('span').appendChild(box);
 });
 }catch(e){console.log('V13 picker details',e)}}
function run(){render();setTimeout(render,300)}
window.addEventListener('load',function(){setTimeout(run,500);setTimeout(run,1500);setTimeout(run,3000)});setInterval(render,1000);
})();