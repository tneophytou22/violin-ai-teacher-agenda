import { createTeacherAgendaApp, registerV1Curricula } from '../../index.js?v=173041';
import { ensureDemoData } from './seed-demo.js';

registerV1Curricula();

const root = document.querySelector('#app');
if (!root) throw new Error('Teacher Agenda demo root not found');

const app = createTeacherAgendaApp({ root, dbName: 'violin-ai-teacher-agenda-v15-ui-fix-1' });
await ensureDemoData(app.repository);
await app.shell.start();

window.violinAiTeacherAgenda = app;
