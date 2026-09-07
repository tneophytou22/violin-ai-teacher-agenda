(function(w){'use strict';
/* V13 Curriculum Controller
   Single authority for curriculum selections and the homework collection.
   Lesson selections are per curriculum; homework is an append-only queue per student.
*/
var C=w.VIOLIN_AI_CURRICULUM=w.VIOLIN_AI_CURRICULUM||{};
C.VERSION='1.2'; C.registry=C.registry||{};
C.register=function(name,adapter){if(name&&adapter)C.registry[name]=adapter};
C.get=function(name){return C.registry[name]||null};
var KEY='VIOLIN_AI_CURRICULUM_SELECTION_V2';
var HOME='VIOLIN_AI_HOMEWORK_QUEUE_V1';
function read(){try{var x=JSON.parse(w.localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return{}}}
function write(x){w.localStorage.setItem(KEY,JSON.stringify(x));return x}
function readHome(){try{var x=JSON.parse(w.localStorage.getItem(HOME)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return{}}}
function writeHome(x){w.localStorage.setItem(HOME,JSON.stringify(x));return x}
function sid(v){return String(v==null?'':v)}
function isNew(x){return x&&x.lesson&&x.homework&&typeof x.lesson==='object'&&typeof x.homework==='object'}
function normalizeItem(x,c,meta){x=x||{};return {
 id:x.id||null,curriculum:x.curriculum||c||'unknown',category:x.category||'General',title:x.title||x.name||'Selected item',
 level:x.level??meta?.level??null,term:x.term??meta?.term??null,requirements:x.requirements||{},objective:x.objective,mastery:x.mastery,source:x.source||meta?.source||'curriculum'
}}
function itemKey(x){return [x.curriculum||'',x.id||'',x.title||''].join('|').toLowerCase()}
function select(p){
 p=p||{};var id=sid(p.studentId);if(!id)return null;var x=read(),b=isNew(x[id])?x[id]:{lesson:{},homework:{}};
 var k=p.kind==='homework'?'homework':'lesson',c=p.curriculum||'scales';
 var payload=Object.assign({},p,{studentId:id,kind:k,curriculum:c,items:Array.isArray(p.items)?p.items.map(function(i){return normalizeItem(i,c,p)}):[],updatedAt:new Date().toISOString()});
 if(k==='homework'){
   var old=b.homework[c];
   var merged=(old&&Array.isArray(old.items)?old.items:[]).concat(payload.items);
   var seen={}; payload.items=merged.map(function(i){return normalizeItem(i,c,p)}).filter(function(i){var k2=itemKey(i);if(seen[k2])return false;seen[k2]=1;return true});
 }
 b[k][c]=payload;x[id]=b;write(x);
 if(k==='homework') addHomework({studentId:id,studentName:p.studentName,level:p.level,term:p.term,items:payload.items,source:'curriculum-controller'});
 return payload;
}
function getSelection(id,k,c){var v=read()[sid(id)];if(!v)return null;k=k==='homework'?'homework':'lesson';c=c||'scales';if(isNew(v))return v[k]&&v[k][c]||null;if(v.kind===k&&(!c||v.curriculum===c))return v;return null}
function clear(id,k,c){var x=read(),v=x[sid(id)];if(!v)return;if(isNew(v)){k=k==='homework'?'homework':'lesson';c=c||'scales';if(v[k])delete v[k][c];if(!Object.keys(v.lesson).length&&!Object.keys(v.homework).length)delete x[sid(id)]}else if(!k||v.kind===k)delete x[sid(id]);write(x)}
function list(c,l,t){var a=C.get(c);return a&&typeof a.list==='function'?a.list(l,t):[]}
function normalize(c,item,meta){var a=C.get(c);return a&&typeof a.normalize==='function'?a.normalize(item,meta||{}):(C.normalize?C.normalize(item,Object.assign({},meta,{curriculum:c})):item)}
function addHomework(p){
 p=p||{};var id=sid(p.studentId);if(!id)return null;var db=readHome(),old=db[id]||{};
 var incoming=Array.isArray(p.items)?p.items.map(function(i){return normalizeItem(i,i&&i.curriculum||p.curriculum||'unknown',p)}):[];
 var merged=(Array.isArray(old.items)?old.items:[]).concat(incoming),seen={};
 var items=merged.filter(function(i){var k=itemKey(i);if(seen[k])return false;seen[k]=1;return true});
 var rec={studentId:id,studentName:p.studentName||old.studentName||'Student',level:p.level??old.level??1,term:p.term??old.term??1,items:items,updatedAt:new Date().toISOString()};
 db[id]=rec;writeHome(db);return rec;
}
function getHomework(id){return readHome()[sid(id)]||null}
function removeHomework(id,itemKeyValue){var db=readHome(),rec=db[sid(id)];if(!rec)return null;rec.items=(rec.items||[]).filter(function(i){return itemKey(i)!==String(itemKeyValue)});rec.updatedAt=new Date().toISOString();db[sid(id)]=rec;writeHome(db);return rec}
function clearHomework(id){var db=readHome();delete db[sid(id)];writeHome(db);var x=read(),v=x[sid(id)];if(v&&isNew(v)){v.homework={};x[sid(id)]=v;write(x)}return true}
C.controller={version:'1.2',list:list,normalize:normalize,select:select,getSelection:getSelection,clear:clear,selectionKey:KEY,homeworkKey:HOME,addHomework:addHomework,getHomework:getHomework,removeHomework:removeHomework,clearHomework:clearHomework};
w.VIOLIN_AI_CURRICULUM=C;
})(window);