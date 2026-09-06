/*
 * VIOLIN AI — State Core V1
 * Phase 2A: canonical state facade / migration adapter.
 */
(function (global) {
  'use strict';
  const KEYS = Object.freeze({
    AGENDA:'VIOLIN_AI_AGENDA_V10', CURRENT_SELECTION:'VIOLIN_AI_CURRENT_SELECTION_V1',
    LESSONS:'VIOLIN_AI_LESSONS_V1', HOMEWORK:'VIOLIN_AI_HOMEWORK_V1',
    LESSON_SELECTION:'VIOLIN_AI_LESSON_SELECTION_V1', LESSON_PLAN:'VIOLIN_AI_LESSON_PLAN_V1',
    STUDENT_SCALE_SELECTION_PREFIX:'VIOLIN_AI_SCALE_SELECTION_STUDENT_V1_'
  });
  const storage={
    read(key,fallback){try{const raw=global.localStorage.getItem(key);return raw==null?fallback:JSON.parse(raw)}catch(_){return fallback}},
    write(key,value){global.localStorage.setItem(key,JSON.stringify(value));return value},
    remove(key){global.localStorage.removeItem(key)}
  };
  function studentKey(studentId){if(!studentId)throw new Error('State: studentId is required');return KEYS.STUDENT_SCALE_SELECTION_PREFIX+String(studentId)}
  function agenda(){return storage.read(KEYS.AGENDA,{students:[]})}
  function students(){const data=agenda();return Array.isArray(data)?data:(Array.isArray(data.students)?data.students:[])}
  function findStudent(studentId){return students().find(s=>String(s.id??s.studentId)===String(studentId))||null}
  const State={
    VERSION:'1.0.0', KEYS,
    students:{get:id=>findStudent(id),getAll:()=>students()},
    scales:{
      getSelected:studentId=>storage.read(studentKey(studentId),[]),
      setSelected(studentId,scales){if(!Array.isArray(scales))throw new TypeError('State.scales.setSelected expects an array');return storage.write(studentKey(studentId),scales)},
      clearSelected(studentId){storage.remove(studentKey(studentId));return []},
      getCurrentSelection:()=>storage.read(KEYS.CURRENT_SELECTION,null),
      setCurrentSelection:selection=>storage.write(KEYS.CURRENT_SELECTION,selection),
      clearCurrentSelection:()=>{storage.remove(KEYS.CURRENT_SELECTION)}
    },
    lesson:{
      get(studentId){const data=storage.read(KEYS.LESSONS,[]);if(!studentId)return data;return Array.isArray(data)?data.filter(x=>String(x.studentId)===String(studentId)):data},
      save(studentId,lesson){if(!studentId)throw new Error('State.lesson.save: studentId is required');const data=storage.read(KEYS.LESSONS,[]),list=Array.isArray(data)?data.slice():[],record=Object.assign({},lesson,{studentId});const i=list.findIndex(x=>x.id&&record.id&&String(x.id)===String(record.id));if(i>=0)list[i]=record;else list.push(record);storage.write(KEYS.LESSONS,list);return record},
      getSelection(studentId){const selection=storage.read(KEYS.LESSON_SELECTION,null);if(!selection)return [];if(selection.studentId!=null&&String(selection.studentId)!==String(studentId))return [];return Array.isArray(selection.items)?selection.items:(Array.isArray(selection)?selection:[])}
    },
    homework:{
      get(studentId){const data=storage.read(KEYS.HOMEWORK,[]);if(!studentId||!Array.isArray(data))return data;return data.filter(x=>String(x.studentId)===String(studentId))},
      save(studentId,homework){if(!studentId)throw new Error('State.homework.save: studentId is required');const data=storage.read(KEYS.HOMEWORK,[]),list=Array.isArray(data)?data.slice():[],record=Object.assign({},homework,{studentId});const i=list.findIndex(x=>x.id&&record.id&&String(x.id)===String(record.id));if(i>=0)list[i]=record;else list.push(record);storage.write(KEYS.HOMEWORK,list);return record}
    },
    navigation:{get(){const q=new URLSearchParams(global.location.search);return{studentId:q.get('studentId'),page:q.get('page')}}}
  };
  global.ViolinAI=global.ViolinAI||{};global.ViolinAI.State=State;
})(window);
