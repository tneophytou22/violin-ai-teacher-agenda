const DAY_INDEX = Object.freeze({
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
});

const DAY_LABELS = Object.freeze({
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
});

export const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = value => {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [year, month, day] = String(value).split('-').map(Number);
  if (![year, month, day].every(Number.isInteger)) throw new Error('Invalid agenda date');
  return new Date(year, month - 1, day);
};

export function getMonday(date = new Date()) {
  const result = parseLocalDate(date);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

export function getWeekDates(date = new Date()) {
  const monday = getMonday(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return localDateString(day);
  });
}

export function buildTeacherAgenda({ students = [], termsByStudent = {}, lessonsByTerm = {}, date = new Date() } = {}) {
  const weekDates = getWeekDates(date);
  const weekSet = new Set(weekDates);
  const entries = [];

  for (const student of students) {
    const schedule = Array.isArray(student.lessonSchedule) && student.lessonSchedule.length
      ? student.lessonSchedule
      : (student.lessonDay && student.lessonTime ? [{ day: student.lessonDay, time: student.lessonTime }] : []);

    const terms = termsByStudent[student.id] ?? [];
    const lessons = terms.flatMap(term => lessonsByTerm[term.id] ?? []);

    for (const slot of schedule) {
      const dayIndex = DAY_INDEX[slot.day];
      if (dayIndex === undefined) continue;
      const dateString = weekDates[dayIndex];
      if (!weekSet.has(dateString)) continue;

      const lesson = lessons.find(candidate => candidate.date === dateString) ?? null;
      const term = lesson
        ? terms.find(candidate => candidate.id === lesson.termId) ?? null
        : terms.find(candidate => dateString >= String(candidate.startDate ?? '') && dateString <= String(candidate.endDate ?? '')) ?? null;

      entries.push({
        id: `${student.id}:${dateString}:${slot.time}`,
        studentId: student.id,
        studentName: student.name,
        date: dateString,
        day: slot.day,
        dayLabel: DAY_LABELS[slot.day],
        time: slot.time,
        lessonId: lesson?.id ?? null,
        termId: term?.id ?? null,
        level: term?.level ?? null,
        termNumber: term?.termNumber ?? null,
        status: lesson ? 'RECORDED' : 'SCHEDULED',
        attendance: lesson?.attendance ?? null,
      });
    }
  }

  entries.sort((a, b) =>
    a.date.localeCompare(b.date)
    || a.time.localeCompare(b.time)
    || a.studentName.localeCompare(b.studentName)
  );

  return {
    weekStart: weekDates[0],
    weekEnd: weekDates[6],
    today: localDateString(date),
    days: weekDates.map(dateString => ({
      date: dateString,
      entries: entries.filter(entry => entry.date === dateString),
    })),
    entries,
  };
}

export class TeacherAgendaService {
  constructor({ studentService, termService, lessonService }) {
    this.students = studentService;
    this.terms = termService;
    this.lessons = lessonService;
  }

  async loadWeek(date = new Date()) {
    const students = await this.students.list();
    const termsByStudent = {};
    const lessonsByTerm = {};

    for (const student of students) {
      const terms = await this.terms.listForStudent(student.id);
      termsByStudent[student.id] = terms;
      for (const term of terms) {
        lessonsByTerm[term.id] = await this.lessons.listForTerm(term.id);
      }
    }

    return buildTeacherAgenda({ students, termsByStudent, lessonsByTerm, date });
  }
}
