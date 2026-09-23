import { StorageService } from '../services/storage-service.js';
import { StudentService } from '../services/student-service.js';
import { TermService } from '../services/term-service.js';
import { TeacherTermService } from '../services/teacher-term-service.js';
import { StudentIntelligenceService } from '../services/student-intelligence-service.js';
import { WeeklyProgrammeService } from '../services/weekly-programme-service.js';
import { LessonService } from '../services/lesson-service.js';
import { LessonProgrammeService } from '../services/lesson-programme-service.js';
import { HomeworkService } from '../services/homework-service.js';
import { ScaleMasteryService } from '../services/scale-mastery-service.js';
import { TeacherAgendaViewModel } from './teacher-agenda-view-model.js';
import { TeacherAgendaController } from './teacher-agenda-controller.js';
import { TeacherAgendaShell } from './teacher-agenda-shell.js';

export function createTeacherAgendaApp({ root, dbName, repository } = {}) {
  if (!root) throw new Error('Teacher Agenda app requires a root element');

  const storage = repository ? null : new StorageService({ dbName });
  const repo = repository ?? storage.getRepository();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const scaleMasteryService = new ScaleMasteryService(repo);
  const studentIntelligenceService = new StudentIntelligenceService({
    studentService, termService, weeklyProgrammeService, lessonService, homeworkService, teacherTermService, repository: repo,
  });
  const controller = new TeacherAgendaController(new TeacherAgendaViewModel({
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService, scaleMasteryService,
    studentIntelligenceService,
  }));
  const shell = new TeacherAgendaShell({ controller, root });
  return { storage, repository: repo, controller, shell };
}
