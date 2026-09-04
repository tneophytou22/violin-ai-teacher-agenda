/* VIOLIN AI Teacher Agenda — V13 Step 1
   Additive override only. V12 already stores /20 scores per student item.
   This module improves the analysis without replacing the V12 UI or data model. */
(function(){
  'use strict';
  const KEY='VIOLIN_AI_AGENDA_V10';
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return null}}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function analyse(s){
    const items=(s && window.__v13Data && window.__v13Data.repertoire || []).filter(x=>x.studentId===s.id);
    const scores=items.map(x=>({x,score:Number(s.assessments?.[x.category+':'+x.id]||0)})).filter(o=>o.score>0);
    const weak=scores.filter(o=>o.score<13).sort((a,b)=>a.score-b.score).slice(0,4);
    const strong=scores.filter(o=>o.score>=17).sort((a,b)=>b.score-a.score).slice(0,3);
    const byCat={};scores.forEach(o=>{byCat[o.x.category]??=[];byCat[o.x.category].push(o.score)});
    const catAvg=Object.entries(byCat).map(([k,v])=>({k,avg:v.reduce((a,b)=>a+b,0)/v.length})).sort((a,b)=>a.avg-b.avg);
    const lines=[];
    if(weak.length){
      lines.push('<p><b>🎯 Priority items</b></p><ol style="margin:4px 0 10px 20px">'+weak.map(o=>`<li><b>${esc(o.x.title)}</b> — ${o.score}/20 <span class="small">(${esc(o.x.category)})</span></li>`).join('')+'</ol>');
      lines.push('<p><b>Suggested next steps</b></p><ul style="margin:4px 0 10px 20px">'+weak.map(o=>{
        if(o.x.category==='Scales')return `<li>Use <b>${esc(o.x.title)}</b> slowly for intonation, even tone and consistent bow.</li>`;
        if(o.x.category==='Études')return `<li>Isolate the hardest passage of <b>${esc(o.x.title)}</b> and practise it in short repetitions.</li>`;
        if(o.x.category==='Technical Studies')return `<li>Give <b>${esc(o.x.title)}</b> a focused technique block before repertoire.</li>`;
        return `<li>Break <b>${esc(o.x.title)}</b> into small sections and target the lowest-scoring passage first.</li>`;
      }).join('')+'</ul>');
    }
    if(catAvg.length)lines.push('<p><b>Category picture</b></p><div class="small">'+catAvg.slice(0,5).map(x=>`${esc(x.k)}: <b>${x.avg.toFixed(1)}/20</b>`).join(' · ')+'</div>');
    if(strong.length)lines.push('<p style="margin-top:8px"><b>🌟 Keep developing</b>: '+strong.map(o=>esc(o.x.title)).join(', ')+'</p>');
    if(!scores.length)return '<div class="notice">Βάλε τουλάχιστον έναν βαθμό /20 δίπλα σε ένα αντικείμενο του σημερινού μαθήματος. Μετά πάτησε ξανά <b>Violin AI Suggestions</b>.</div>';
    return `<div class="todaybox"><b>🤖 Violin AI — Student Analysis</b><div class="small" style="margin-top:4px">Level ${esc(s.level)} · Based on ${scores.length} rated item${scores.length===1?'':'s'}.</div>${lines.join('')}</div>`;
  }
  function override(){
    const d=read(); if(!d||!Array.isArray(d.students))return;
    window.__v13Data=d;
    window.showAISuggestions=function(sid){
      const fresh=read(); const s=fresh?.students?.find(x=>x.id===sid);
      if(!s)return;
      window.__v13Data=fresh;
      const msg=analyse(s);
      const existing=[...document.querySelectorAll('.ai-box')].find(x=>x.textContent.includes('QUICK LESSON ASSESSMENT'));
      if(existing){let out=existing.querySelector('.v13-analysis-result');if(!out){out=document.createElement('div');out.className='v13-analysis-result';existing.appendChild(out)}out.innerHTML=msg;out.scrollIntoView({behavior:'smooth',block:'nearest'});return;}
      alert('Violin AI analysis is ready, but the assessment panel was not found.');
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',override);else override();
})();
