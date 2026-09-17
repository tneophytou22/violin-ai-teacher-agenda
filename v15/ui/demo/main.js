import { createTeacherAgendaApp, registerV1Curricula } from '../../index.js';

registerV1Curricula();

const root = document.querySelector('#app');
if (!root) throw new Error('Teacher Agenda demo root not found');

const app = createTeacherAgendaApp({ root });
await app.shell.start();

window.violinAiTeacherAgenda = app;
