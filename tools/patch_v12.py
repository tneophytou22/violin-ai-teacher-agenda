from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css = '''\n.school-card{border:2px solid #73b4e5!important;background:linear-gradient(135deg,#f2f8fd,#fff)}\n.private-card{border:2px solid #f2a26f!important;background:linear-gradient(135deg,#fff7f0,#fff)}\n.type-school{background:#dff1ff;color:#174a70}.type-private{background:#ffe7d5;color:#7a3d13}\n.ai-box{background:linear-gradient(135deg,#f4f0ff,#fff);border:1px solid #dfd4ff;border-radius:16px;padding:14px;margin:12px 0}\n.ai-box h3{margin:0 0 8px}.assessment-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px}.assessment-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px;border:1px solid #e7e9ef;border-radius:10px;background:#fff}.grade20{width:70px!important;font-weight:800;text-align:center}.viber-input{min-width:180px}\n'''
if '.school-card{' not in s:
    s = s.replace('</style>', css + '</style>', 1)

old = '''</div><label>Teacher notes</label><textarea id="notes" rows="4"></textarea>'''
new = '''<div><label>Viber number</label><input id="viber" class="viber-input" type="tel" placeholder="e.g. +357..." autocomplete="tel"><div class="small">Used only for the Viber homework link.</div></div></div><label>Teacher notes</label><textarea id="notes" rows="4"></textarea>'''
if old in s:
    s = s.replace(old, new, 1)

s = s.replace('notes:notes.value,daily:{},quarterlyReports:[]', 'notes:notes.value,viber:(document.getElementById(\'viber\')?.value||\'\').trim(),daily:{},quarterlyReports:[],assessments:{}}', 1)

start, end = s.index('function students(){'), s.index('function deleteStudent', s.index('function students(){'))
newfunc = '''function students(){shell(`<div class="title"><h2>👥 Students</h2><button class="btn mint" onclick="newStudent()">＋ Create Student</button></div><div class="grid">${data.students.map(s=>`<div class="card ${s.type==='Private'?'private-card':'school-card'}"><div class="itemhead"><div><h3>🎻 ${esc(s.name)}</h3><span class="pill ${s.type==='Private'?'type-private':'type-school'}">${esc(s.type)}</span><span class="pill">Level ${s.level}</span></div><button class="btn danger" onclick="deleteStudent('${s.id}')">🗑</button></div><p>${s.days.map((d,i)=>`${d} ${s.times[i]||''}`).join(' · ')}</p>${s.viber?`<div class="small">💬 Viber: ${esc(s.viber)}</div>`:''}<button class="btn purple" onclick="openStudent('${s.id}')">Open Daily Planner</button></div>`).join('')||'<div class="card empty">No students yet.</div>'}</div>`)}
'''
s = s[:start] + newfunc + s[end:]

start, end = s.index('function editStudent(id){'), s.index('function openQuarterlyReport', s.index('function editStudent(id){'))
newfunc = '''function editStudent(id){let s=data.students.find(x=>x.id===id);if(!s)return;let n=prompt('Student name:',s.name);if(n!==null&&n.trim())s.name=n.trim();let l=prompt('Level 1–10:',s.level);if(l!==null&&+l>=1&&+l<=10)s.level=+l;let v=prompt('Viber number:',s.viber||'');if(v!==null)s.viber=v.trim();let type=prompt('Type: Μουσικό Σχολείο or Private:',s.type||'Μουσικό Σχολείο');if(type!==null&&(type==='Private'||type==='Μουσικό Σχολείο')){s.type=type;s.lessonDuration=type==='Private'?30:40}save();student()}
'''
s = s[:start] + newfunc + s[end:]

start, end = s.index('function openQuarterlyReport(id){'), s.index('function exportQuarterlyReport', s.index('function openQuarterlyReport(id){'))
newfunc = '''function aiQuarterlySuggestion(s){let a=s.assessments||{};let vals=Object.entries(a).map(([k,v])=>({k,v:+v})).filter(x=>Number.isFinite(x.v));let fallback=['Technique','Intonation','Rhythm','Bow Control','Musicality','Repertoire','Scales & Études','Practice / Preparation'];let scores=fallback.map(k=>({k,v:vals.find(x=>x.k===k)?.v??14}));let low=[...scores].sort((a,b)=>a.v-b.v).slice(0,3);let high=[...scores].sort((a,b)=>b.v-a.v).slice(0,4);return {strengths:high.map(x=>`${x.k} (${x.v}/20)`),focus:low.map(x=>`${x.k} (${x.v}/20)`),next:`Στο επόμενο τρίμηνο θα συνεχίσουμε να ενισχύουμε ${low.map(x=>x.k).join(', ')} με στοχευμένη καθημερινή μελέτη, ενώ θα διατηρήσουμε την καλή δουλειά στα ${high.map(x=>x.k).join(', ')}.`}}
function openQuarterlyReport(id){let s=data.students.find(x=>x.id===id);if(!s)return;let last=(s.quarterlyReports||[]).slice(-1)[0]||{};let term=prompt('Quarter / Term (e.g. 1st Term):',last.term||'');if(term===null)return;let ai=aiQuarterlySuggestion(s);let overall=prompt('Overall grade — enter 0 to 20:',last.overall??'');if(overall===null)return;overall=Math.max(0,Math.min(20,+overall||0));let categories=['Technique','Intonation','Rhythm','Bow Control','Musicality','Repertoire','Scales & Études','Practice / Preparation'];let grades={};for(let c of categories){let current=last.grades?.[c]??s.assessments?.[c]??14;let g=prompt(c+' grade (0–20):',current);if(g===null)return;grades[c]=Math.max(0,Math.min(20,+g||0))}let strengths=prompt('3–4 points of progress (encouraging and positive):',last.strengths?.join('\\n')||ai.strengths.map(x=>'• '+x).join('\\n'));if(strengths===null)return;let focus=prompt('3–4 points to pay attention to:',last.focus?.join('\\n')||ai.focus.map(x=>'• '+x).join('\\n'));if(focus===null)return;let goals=prompt('What we plan for the next term:',last.goals||ai.next);if(goals===null)return;let summary=prompt('Short polite teacher message to the student / parent:',last.summary||`Θερμά συγχαρητήρια για την προσπάθεια αυτού του τριμήνου. Υπάρχει σαφής πρόοδος και με σταθερή, ποιοτική μελέτη μπορούμε να κάνουμε το επόμενο βήμα με ακόμη μεγαλύτερη αυτοπεποίθηση.`);if(summary===null)return;s.quarterlyReports??=[];s.quarterlyReports.push({date:new Date().toLocaleDateString(),term,overall,grades,strengths:strengths.split(/\\n+/).map(x=>x.trim()).filter(Boolean),focus:focus.split(/\\n+/).map(x=>x.trim()).filter(Boolean),summary,goals});save();student()}
'''
s = s[:start] + newfunc + s[end:]

helper = '''function lessonAssessmentCard(s,items){let a=s.assessments||{};let all=items.filter(x=>x.title);return `<section class="section ai-box"><h3>🤖 QUICK LESSON ASSESSMENT · /20</h3><p class="small">Βάλε έναν γρήγορο βαθμό δίπλα σε κάθε αντικείμενο που δουλέψατε σήμερα. Οι βαθμοί αποθηκεύονται στον μαθητή και χρησιμοποιούνται από το Violin AI για προτάσεις και το Quarterly Progress.</p><div class="assessment-grid">${all.map(x=>`<div class="assessment-row"><span><b>${esc(x.title)}</b><br><small>${esc(x.category)}</small></span><input class="grade20" type="number" min="0" max="20" value="${a[x.category+':'+x.id]??''}" placeholder="/20" onchange="setItemAssessment('${s.id}','${x.id}',this.value)"></div>`).join('')||'<div class="empty">Add repertoire, scales, études or technique for this student first.</div>'}</div><div style="margin-top:10px"><button class="btn purple" onclick="showAISuggestions('${s.id}')">✨ Violin AI Suggestions</button></div></section>`}
function setItemAssessment(sid,itemId,value){let s=data.students.find(x=>x.id===sid),x=data.repertoire.find(r=>r.id===itemId);if(!s||!x)return;s.assessments??={};s.assessments[x.category+':'+x.id]=Math.max(0,Math.min(20,+value||0));save()}
function showAISuggestions(sid){let s=data.students.find(x=>x.id===sid);if(!s)return;let items=data.repertoire.filter(x=>x.studentId===sid);let scored=items.map(x=>({x,score:+(s.assessments?.[x.category+':'+x.id]??0)})).filter(o=>o.score>0);let weak=scored.filter(o=>o.score<13).sort((a,b)=>a.score-b.score).slice(0,3);let strong=scored.filter(o=>o.score>=17).slice(0,3);let c=curriculum[s.level]||{s:[],e:[],t:[],p:[]};let msg=`🤖 VIOLIN AI — ${s.name}\\n\\nLevel ${s.level}\\n\\n🎯 Focus now:\\n${(weak.length?weak.map(o=>`• ${o.x.title} — ${o.score}/20`).join('\\n'):'• Δεν υπάρχουν ακόμη αρκετοί βαθμοί — συνέχισε την καταγραφή στα μαθήματα.')}\\n\\n💪 Keep strong:\\n${(strong.length?strong.map(o=>`• ${o.x.title} — ${o.score}/20`).join('\\n'):'• Συνέχισε να αξιολογείς τα βασικά αντικείμενα.')}\\n\\n✨ Suggested next work:\\n• ${c.t.slice(0,2).join('\\n• ')}\\n• ${c.s.slice(0,1).join('\\n• ')}\\n• ${c.e.slice(0,1).join('\\n• ')}\\n\\nΤο AI λειτουργεί ως βοηθός οργάνωσης: οι τελικές παιδαγωγικές αποφάσεις παραμένουν στον καθηγητή.`;alert(msg)}
'''
if 'function lessonAssessmentCard(' not in s:
    s=s.replace('function student(){',helper+'function student(){',1)
needle='<div class="notice"><b>Lesson:</b> ${lessonDuration(s)} min with teacher &nbsp; · &nbsp; <b>Recommended home practice:</b> <span class="practice-target">${target} min+</span>. These are separate time budgets.</div><div class="planner">'
replacement='<div class="notice"><b>Lesson:</b> ${lessonDuration(s)} min with teacher &nbsp; · &nbsp; <b>Recommended home practice:</b> <span class="practice-target">${target} min+</span>. These are separate time budgets.</div>${lessonAssessmentCard(s,items)}<div class="planner">'
if needle in s:
    s=s.replace(needle,replacement,1)

old="function sendViber(id){let h=data.homework.find(x=>x.id===id);if(h)location.href='viber://forward?text='+encodeURIComponent(formatViberHomework(h))}"
new="function sendViber(id){let h=data.homework.find(x=>x.id===id);if(!h)return;let s=data.students.find(x=>x.id===h.studentId);let text=encodeURIComponent(formatViberHomework(h));let phone=(s?.viber||'').replace(/[^0-9+]/g,'');if(phone){location.href='viber://chat?number='+encodeURIComponent(phone)+'&text='+text}else{location.href='viber://forward?text='+text}}"
if old in s:s=s.replace(old,new,1)

old="text=`VIOLIN AI — QUARTERLY PROGRESS PROTOCOL\\n\\nStudent: ${s.name}\\nLevel: ${s.level}\\nSchool: ${s.type}\\nTerm: ${r.term}\\nOverall grade: ${r.overall}\\nDate: ${r.date}\\n\\nASSESSMENT\\n`+Object.entries(r.grades||{}).map(([k,v])=>`${k}: ${v}`).join('\\n')+`\\n\\nPROGRESS\\n${r.summary}\\n\\nNEXT TERM GOALS\\n${r.goals||''}`"
new="text=`VIOLIN AI — QUARTERLY PROGRESS PROTOCOL\\n\\nStudent: ${s.name}\\nLevel: ${s.level}\\nSchool: ${s.type}\\nTerm: ${r.term}\\nOverall grade: ${r.overall}/20\\nDate: ${r.date}\\n\\nASSESSMENT /20\\n`+Object.entries(r.grades||{}).map(([k,v])=>`${k}: ${v}/20`).join('\\n')+`\\n\\nPOINTS OF PROGRESS\\n${(r.strengths||[]).join('\\n')}\\n\\nPOINTS TO PAY ATTENTION TO\\n${(r.focus||[]).join('\\n')}\\n\\nTEACHER MESSAGE\\n${r.summary}\\n\\nNEXT TERM GOALS\\n${r.goals||''}`"
if old in s:s=s.replace(old,new,1)

s=s.replace('JSON.stringify({version:10,data}','JSON.stringify({version:12,data}',1)
s=s.replace('JSON.stringify({version:10,savedAt','JSON.stringify({version:12,savedAt',1)

p.write_text(s,encoding='utf-8')
print('V12 patch applied')
