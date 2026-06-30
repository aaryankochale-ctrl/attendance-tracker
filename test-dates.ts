import { generateLectureDates } from './src/data.ts';

const sub = {
  startDate: '2026-08-05',
  scheduleDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  totalLectures: 10
};

console.log(generateLectureDates(sub));
