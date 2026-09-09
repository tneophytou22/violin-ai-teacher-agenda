(function(w){'use strict';
/* V13 Curriculum Controller — one canonical selection store for all curricula.
   { studentId: { lesson: {scales: payload,...}, homework: {scales: payload,...} } }
   Legacy single-record V2 entries remain readable. */
var C=w.VIOLIN_AI_CURRICULUM=w.VIOLIN_AI_CURRICULUM||{};
C.VERSION='1.2'; C.registry=C.registry||{};
C.register=function(name,adapter){if(name&&adapter)C.registry[name]=adapter};
C.get=function(name){return C.registry[name]||null};
var KEY='VIOLIN_AI_CURRICULUM_SELECTION_V2';
function read(){try{var x=JSON.parse(w.localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return{}}}
function write(x){w.localStorage.setItem(KEY,JSON.stringify(x));return x}
function sid(v){return String(v==null?'':v)}
function isNew(x){return x&&x.lesson&&x.homework&&typeof x.lesson==='object'&&typeof x.homework==='object'}
function select(p){p=p||{};var id=sid(p.studentId);if(!id)return null;var x=read(),b=isNew(x[id])?x[id]:{lesson:{},homework:{}};var k=p.kind==='homework'?'homework':'lesson',c=p.curriculum||'scales';b[k][c]=Object.assign({},p,{studentId:id,kind:k,curriculum:c,items:Array.isArray(p.items)?p.items:[],updatedAt:new Date().toISOString()});x[id]=b;write(x);return b[k][c]}
function getSelection(id,k,c){var v=read()[sid(id)];if(!v)return null;k=k==='homework'?'homework':'lesson';c=c||'scales';if(isNew(v))return v[k]&&v[k][c]||null;if(v.kind===k&&(!c||v.curriculum===c))return v;return null}
function clear(id,k,c){var x=read(),v=x[sid(id)];if(!v)return;if(isNew(v)){k=k==='homework'?'homework':'lesson';c=c||'scales';if(v[k])delete v[k][c];if(!Object.keys(v.lesson).length&&!Object.keys(v.homework).length)delete x[sid(id)]}else if(!k||v.kind===k)delete x[sid(id)];write(x)}
function list(c,l,t){var a=C.get(c);return a&&typeof a.list==='function'?a.list(l,t):[]}
function normalize(c,item,meta){var a=C.get(c);return a&&typeof a.normalize==='function'?a.normalize(item,meta||{}):(C.normalize?C.normalize(item,Object.assign({},meta,{curriculum:c})):item)}
/* Homework API — canonical facade over the same V2 selection store.
   No parallel homework queue is created. */
function addHomework(p){p=Object.assign({},p||{},{kind:'homework'});return select(p)}
function getHomework(id,c){return getSelection(id,'homework',c||'scales')}
function itemKey(x){return [x&&x.curriculum||'',x&&x.id||'',x&&x.title||x&&x.name||''].join('|').toLowerCase()}
function removeHomework(id,key,c){var cur=getHomework(id,c||'scales');if(!cur||!Array.isArray(cur.items))return null;var target=String(key||'').toLowerCase();var items=cur.items.filter(function(x){return itemKey(x)!==target});if(items.length===cur.items.length)return cur;if(!items.length){clear(id,'homework',c||cur.curriculum||'scales');return null}return select(Object.assign({},cur,{kind:'homework',items:items}))}
C.controller={version:'1.2',list:list,normalize:normalize,select:select,getSelection:getSelection,clear:clear,addHomework:addHomework,getHomework:getHomework,removeHomework:removeHomework,selectionKey:KEY};
w.VIOLIN_AI_CURRICULUM=C;
})(window);