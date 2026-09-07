(function(w){'use strict';
var C=w.VIOLIN_AI_CURRICULUM=w.VIOLIN_AI_CURRICULUM||{};
C.VERSION=C.VERSION||'1.0';
C.registry=C.registry||{};
C.register=C.register||function(name,adapter){if(name&&adapter)C.registry[name]=adapter};
C.get=C.get||function(name){return C.registry[name]||null};
var KEY='VIOLIN_AI_CURRICULUM_SELECTION_V2';
function read(){try{var x=JSON.parse(w.localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return{}}}
function write(x){w.localStorage.setItem(KEY,JSON.stringify(x));return x}
function studentKey(studentId){return String(studentId==null?'':studentId)}
function select(payload){payload=payload||{};var x=read(),sid=studentKey(payload.studentId);if(!sid)return null;x[sid]=Object.assign({},payload,{studentId:sid,items:Array.isArray(payload.items)?payload.items:[],updatedAt:new Date().toISOString()});write(x);return x[sid]}
function getSelection(studentId,kind,curriculum){var x=read()[studentKey(studentId)];if(!x)return null;if(kind&&x.kind!==kind)return null;if(curriculum&&x.curriculum!==curriculum)return null;return x}
function clear(studentId,kind){var x=read(),sid=studentKey(studentId);if(x[sid]&&(!kind||x[sid].kind===kind)){delete x[sid];write(x)}}
function list(curriculum,level,term){var a=C.get(curriculum);return a&&typeof a.list==='function'?a.list(level,term):[]}
function normalize(curriculum,item,meta){var a=C.get(curriculum);return a&&typeof a.normalize==='function'?a.normalize(item,meta||{}):(C.normalize?C.normalize(item,Object.assign({},meta,{curriculum:curriculum})):item)}
C.controller={version:'1.0',list:list,normalize:normalize,select:select,getSelection:getSelection,clear:clear,selectionKey:KEY};
w.VIOLIN_AI_CURRICULUM=C;
})(window);