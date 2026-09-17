import { StorageService, StudentService, TermService, TeacherTermService, WeeklyProgrammeService, LessonService, LessonProgrammeService, TeacherAgendaViewModel, TeacherAgendaController } from '../index.js';
import { TeacherAgendaShell } from './teacher-agenda-shell.js';

export function createTeacherAgendaApp({ root, dbName } = {}) {
  if (!root) throw new Error('Teacher Agenda app requires a root element');
  const storage = new StorageService({ dbName });
  const repo = storage.getRepository();
  const controller = new TeacherAgendaController(new TeacherAgendaViewModel({
    studentService: new StudentService(repo),
    termService: new TermService(repo),
    teacherTermService: new TeacherTermService(repo),
    weeklyProgrammeService: new WeeklyProgrammeService(repo),
    lessonService: new LessonService(repo),
    lessonProgrammeService: new LessonProgrammeService(repo),
  }));
  const shell = new TeacherAgendaShell({ controller, root });
  return { storage, controller, shell };
}
