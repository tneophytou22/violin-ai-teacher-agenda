/* VIOLIN AI Teacher Agenda — V13 Step 1
   Safe additive module: lesson assessment + student-scoped analysis.
   It never replaces the V12 application code or its data store. */
(function(){
  'use strict';
  const KEY='VIOLIN_AI_AGENDA_V10';
  const CATS=[
    ['Technique','Technique'],['Intonation','Intonation'],['Rhythm','Rhythm'],
    ['Bow Control','Bow Control'],['Musicality','Musicality'],
    ['Repertoire','Repertoire'],['Scales & Études','Scales & Études'],['Practice / Preparation','Practice / Preparation']
  ];
  let lastStudentId=null;

  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return null}}
  function write(x){localStorage.setItem(KEY,JSON.stringify(x))}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function studentId(){
    const btns=[...document.querySelectorAll('[onclick]')];
    for(const b of btns){const m=(b.getAttribute('onclick')||'').match(/(?:editStudent|sendStudent|openQuarterlyReport)\(['"]([^'"]+)['"]\)/);if(m)return m[1]}
    return null;
  }
  function current(){const d=read(),id=studentId();return d&&id?{d,id,s:d.students.find(x=>x.id===id)}:null}
  function lowScoreText(score){if(score<=9)return 'Priority';if(score<=13)return 'Needs attention';if(score<=16)return 'Developing';return 'Secure'}
  function ensure(){
    const c=current(); if(!c||!c.s)return;
    if(document.getElementById('v13-assessment'))return;
    const anchor=[...document.querySelectorAll('h3')].find(x=>x.textContent.includes('DAILY PLANNER'));
    if(!anchor)return;
    const host=anchor.closest('.section');
    if(!host)return;
    const card=document.createElement('div');card.id='v13-assessment';card.className='ai-box';
    const latest=c.s.assessments&&c.s.assessments.latest||{};
    card.innerHTML=`<h3>🎯 VIOLIN AI · LESSON ASSESSMENT /20</h3>
      <div class="small" style="margin-bottom:9px">Γρήγορη αξιολόγηση του σημερινού μαθήματος. Οι βαθμοί αποθηκεύονται στον συγκεκριμένο μαθητή.</div>
      <div class="assessment-grid">${CATS.map(([key,label])=>`<div class="assessment-row"><span><b>${label}</b><div class="small" id="v13-state-${key.replace(/[^a-z]/gi,'')}">${latest[key]!=null?lowScoreText(+latest[key]):'Not rated'}</div></span><input class="grade20" data-v13-grade="${key}" type="number" min="0" max="20" step="1" value="${latest[key]!=null?latest[key]:''}" placeholder="/20"></div>`).join('')}</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px"><button class="btn purple" id="v13-save">💾 Save Lesson Assessment</button><button class="btn sky" id="v13-analyze">🤖 Analyze Student</button></div>
      <div id="v13-analysis" style="margin-top:10px"></div>`;
    host.parentNode.insertBefore(card,host);
    card.querySelector('#v13-save').onclick=saveAssessment;
    card.querySelector('#v13-analyze').onclick=analyze;
  }
  function saveAssessment(){
    const c=current();if(!c||!c.s)return;
    c.s.assessments=c.s.assessments||{};
    const scores={};
    document.querySelectorAll('[data-v13-grade]').forEach(i=>{if(i.value!=='')scores[i.dataset.v13Grade]=Math.max(0,Math.min(20,Number(i.value)||0))});
    scores.date=new Date().toISOString();
    c.s.assessments.latest=scores;
    c.s.assessments.history=c.s.assessments.history||[];
    c.s.assessments.history.push(scores);
    if(c.s.assessments.history.length>30)c.s.assessments.history.shift();
    write(c.d);
    document.querySelectorAll('[data-v13-grade]').forEach(i=>{const k=i.dataset.v13Grade,st=document.getElementById('v13-state-'+k.replace(/[^a-z]/gi,''));if(st)st.textContent=i.value===''?'Not rated':lowScoreText(+i.value)});
    const out=document.getElementById('v13-analysis');if(out)out.innerHTML='<div class="notice"><b>✓ Saved.</b> Η αξιολόγηση αποθηκεύτηκε στον μαθητή.</div>';
  }
  function analyze(){
    const c=current();if(!c||!c.s)return;
    const scores={...(c.s.assessments&&c.s.assessments.latest||{})};
    const ranked=Object.entries(scores).filter(([k])=>k!=='date').sort((a,b)=>a[1]-b[1]);
    const weak=ranked.slice(0,3).filter(x=>Number.isFinite(+x[1]));
    const items=(c.d.repertoire||[]).filter(x=>x.studentId===c.s.id);
    const map={'Technique':'Technical Studies','Intonation':'Scales','Scales & Études':'Scales','Repertoire':'Pieces','Bow Control':'Technical Studies'};
    const suggestions=[];
    weak.forEach(([k,v])=>{
      if(k==='Technique'||k==='Bow Control')suggestions.push(`Τεχνική: δώσε προτεραιότητα σε ${items.filter(x=>x.category==='Technical Studies').slice(0,1).map(x=>x.title).join(' / ')||'technical study του Level '+c.s.level}.`);
      else if(k==='Intonation')suggestions.push(`Intonation: ξεκίνα με ${items.filter(x=>x.category==='Scales').slice(0,1).map(x=>x.title).join(' / ')||'scale του Level '+c.s.level} με αργό, ελεγχόμενο τόξο.`);
      else if(k==='Scales & Études')suggestions.push(`Scales/Études: πρόσθεσε σύντομη επανάληψη ${items.filter(x=>x.category==='Études').slice(0,1).map(x=>x.title).join(' / ')||'étude του Level '+c.s.level}.`);
      else if(k==='Repertoire')suggestions.push(`Repertoire: χώρισε το ${items.filter(x=>x.category==='Pieces').slice(0,1).map(x=>x.title).join(' / ')||'τρέχον κομμάτι'} σε μικρά sections και δούλεψε τα δύσκολα σημεία.`);
      else suggestions.push(`${k}: βάλε σύντομο focused block στο επόμενο home practice.`);
    });
    const out=document.getElementById('v13-analysis');
    out.innerHTML=`<div class="todaybox"><b>🤖 Violin AI — σημερινή ανάλυση</b><div class="small" style="margin-top:5px">Level ${esc(c.s.level)} · ${c.s.name}</div>${weak.length?`<ol style="margin:8px 0 0 20px">${weak.map(([k,v])=>`<li><b>${esc(k)}</b> — ${v}/20 (${lowScoreText(+v)})</li>`).join('')}</ol><p style="margin:9px 0 4px"><b>Προτεινόμενη προτεραιότητα:</b></p><ul style="margin:4px 0 0 20px">${suggestions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>Βάλε τουλάχιστον μία βαθμολογία /20 και πάτησε Analyze Student.</p>'}</div>`;
  }
  function watch(){
    const id=studentId();
    if(id!==lastStudentId){lastStudentId=id;setTimeout(ensure,80)}else if(id)setTimeout(ensure,80);
  }
  new MutationObserver(watch).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',watch);setTimeout(watch,250);
})();
