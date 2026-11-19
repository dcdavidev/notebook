/**
 * Sample content for the overview page.
 * Replace it with real data when the courses and notes exist.
 */

export type CourseStatus = 'Published' | 'In progress' | 'Planned';

export interface Course {
  id: string;
  title: string;
  topic: string;
  lessons: number;
  status: CourseStatus;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const courses: Course[] = [
  {
    id: 'git',
    title: 'Git from Zero',
    topic: 'Tools',
    lessons: 12,
    status: 'Published',
    level: 'Beginner',
  },
  {
    id: 'typescript',
    title: 'TypeScript Essentials',
    topic: 'Languages',
    lessons: 18,
    status: 'In progress',
    level: 'Intermediate',
  },
  {
    id: 'react',
    title: 'React Server Components',
    topic: 'Frameworks',
    lessons: 9,
    status: 'In progress',
    level: 'Advanced',
  },
  {
    id: 'linux',
    title: 'Linux Command Line',
    topic: 'Tools',
    lessons: 15,
    status: 'Published',
    level: 'Beginner',
  },
  {
    id: 'sql',
    title: 'SQL for Developers',
    topic: 'Databases',
    lessons: 10,
    status: 'Planned',
    level: 'Intermediate',
  },
];

/**
Notes published per month.
*/
export const notesPerMonth = [
  { month: 'Jun', notes: 4 },
  { month: 'Jul', notes: 7 },
  { month: 'Aug', notes: 3 },
  { month: 'Sep', notes: 9 },
  { month: 'Oct', notes: 12 },
  { month: 'Nov', notes: 8 },
];

export const goals = {
  /**
  Share of the yearly study plan completed.
  */
  yearly: 32,
  courses: 43,
  notes: 80,
};

export const tips = [
  'Write a short summary after every lesson: it doubles what you remember.',
  'Download the study notes as PDF to read them offline.',
];
