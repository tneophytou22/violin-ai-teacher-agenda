(function(){'use strict';
var root=document.getElementById('app');
function text(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function low(v){return text(v).toLowerCase()}
function arr(v){return !v?[]:(Array.isArray(v)?v:[v])}
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function students(){var x=read('VIOLIN_AI_AGENDA_V10');return x&&Array.isArray(x.students)?x.students:[]}
function lessonStudent(d){var p=new URLSearchParams(d.defaultView.location.search),sid=p.get('studentId'),ss=students();return sid?ss.find(function(s){return String(s.id??s.studentId??s.uid??'')===String(sid)}):null}
function curriculum(d){var w=d.defaultView;for(var i=0;i<8&&w;i++){if(w.VIOLIN_SCALE_CURRICULUM_V1)return w.VIOLIN_SCALE_CURRICULUM_V1;w=w.parent}return null}
function term(d,s){var c=curriculum(d),l=+(s&&s.level)||1,t=+(s&&s.term)||1;if(!c)return null;try{return typeof c.getTerm==='function'?c.getTerm(l,t):(c[l]&&c[l][t])||null}catch(e){return null}}
function categoryKey(cat){var c=low(cat);if(c.indexOf('minor')>=0)return 'minor';if(c.indexOf('arpeggio')>=0)return 'arpeggios';if(c.indexOf('dominant')>=0)return 'dominant7';if(c.indexOf('diminished')>=0)return 'diminished7';if(c.indexOf('chromatic')>=0)return 'chromatic';if(c.indexOf('double')>=0)return 'doubleStops';if(c.indexOf('one string')>=0)return 'oneString';return 'major'}
function octaveFromString(v){var m=text(v).match(/\b(\d+(?:\s*[–-]\s*\d+)?)\s*octaves?\b/i);return m?m[1].replace(/\s*/g,'')+' octave'+(m[1].indexOf('–')>=0||m[1].indexOf('-')>=0||m[1]!=='1'?'s':''):null}
function requirements(d,title,cat){var t=term(d,lessonStudent(d));if(!t)return null;var key=categoryKey(cat),vals=arr(t[key]);var nt=low(title),match=null;for(var i=0;i<vals.length;i++){if(low(vals[i])===nt){match=text(vals[i]);break}}
var octave=octaveFromString(match);if(!octave){for(var j=0;j<vals.length;j++){var o=octaveFromString(vals[j]);if(o&&low(vals[j]).indexOf('all '+key.replace('major','major'))>=0){octave=o;break}}}
if(!octave){for(var k=0;k<vals.length;k++){var o2=octaveFromString(vals[k]);if(o2&&/^(all|complete|up to)/i.test(text(vals[k]))){octave=o2;break}}}
return {octaves:octave||'Not specified in curriculum',tempo:t.tempo||'—',bowing:arr(t.bowing),articulation:arr(t.articulation),rhythm:arr(t.rhythm),accents:arr(t.accents),dynamics:arr(t.dynamics),positions:t.positions||'—',objective:t.objective||'—',mastery:t.mastery||'—'} }
function selected(){var p=read('VIOLIN_AI_LESSON_SELECTION_V1');return p&&Array.isArray(p.items)?p.items:[]}
function find(title,cat){var a=selected(),nt=low(title),nc=low(cat);return a.find(function(x){return low(x.title||x.name)===nt&&(!nc||low(x.cat||x.category)===nc)})||a.find(function(x){return low(x.title||x.name)===nt})||null}
function details(d){var rows=[...d.querySelectorAll('#plan .selectrow')];rows.forEach(function(row){var src=low(row.querySelector('.source')?.textContent||'');if(src.indexOf('scales')<0)return;var title=text(row.querySelector('.grow b')?.textContent||'');if(!title)return;var x=find(title,'');if(!x)return;var cat=x.cat||x.category||'Major Scales',r=requirements(d,title,cat);if(!r)return;var box=row.querySelector('.v13-scale-requirements-v2');if(!box){box=d.createElement('div');box.className='v13-scale-requirements-v2';box.style.cssText='margin:8px 0 2px 0;padding:10px 12px;border:1px solid #e4dcff;border-radius:10px;background:#f7f4ff;font-size:11px;line-height:1.55;color:#526174';row.appendChild(box)}
function list(v){return arr(v).length?text(arr(v).join(' · ')):'—'}
box.innerHTML='<strong style="color:#24344c">Scale requirements</strong><br>'+'<b>Octaves:</b> '+text(r.octaves)+'<br>'+'<b>Tempo:</b> '+text(r.tempo)+'<br>'+'<b>Bowing:</b> '+list(r.bowing)+'<br>'+'<b>Articulation:</b> '+list(r.articulation)+'<br>'+'<b>Rhythmic groups:</b> '+list(r.rhythm)+'<br>'+'<b>Accents:</b> '+list(r.accents)+'<br>'+'<b>Dynamics:</b> '+list(r.dynamics)+'<br>'+'<b>Positions:</b> '+text(r.positions)+'<br>'+'<b>Objective:</b> '+text(r.objective)+'<br>'+'<b>Mastery:</b> '+text(r.mastery);})}
function run(d){try{if(!d||!d.body)return;var h=text(d.querySelector('h1')?.textContent);if(low(h).indexOf('lesson')<0)return;details(d)}catch(e){}}
function walk(d){run(d);try{[...d.querySelectorAll('iframe')].forEach(function(f){walk(f.contentDocument)})}catch(e){}}
if(root){root.addEventListener('load',function(){setTimeout(function(){walk(root.contentDocument)},150)});setInterval(function(){try{walk(root.contentDocument)}catch(e){}},700)}
})();