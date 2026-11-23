import type { LessonProgress } from '@/components/progress/progress-context';

/**
Milestones of completed lessons, each with its own badge.
*/
export const lessonMilestones = [1, 10, 50, 100] as const;

/**
Courses with a badge of their own, earned by completing every lesson of
one of their editions. The badge shows the course logo.
*/
export const courseBadgeTopics = ['abap'] as const;

export type BadgeId =
  | 'supporter'
  | `lessons-${(typeof lessonMilestones)[number]}`
  | 'course'
  | `course-${(typeof courseBadgeTopics)[number]}`;

export interface Badge {
  id: BadgeId;
  earned: boolean;
  /**
  Number of completed lessons, for the lesson milestones.
  */
  count?: number;
  /**
  Courses completed in full, as "Course · version", for the course badge.
  */
  courses?: string[];
}

/**
 * Works out every badge from the visitor's progress. Lesson badges count
 * completed lessons of courses that still exist; the course badge needs
 * every lesson of one course version. `lessonTitles` is keyed by
 * `course/version/lesson`, `courseTitles` by topic.
 */
export function computeBadges({
  progress,
  isSupporter,
  lessonTitles,
  courseTitles,
}: {
  progress: LessonProgress[];
  isSupporter: boolean;
  lessonTitles: Record<string, string>;
  courseTitles: Record<string, string>;
}): { badges: Badge[]; completedLessons: number } {
  const completed = new Set(
    progress
      .filter((row) => row.completed_at)
      .map((row) => `${row.course}/${row.version}/${row.lesson}`)
      .filter((key) => Object.hasOwn(lessonTitles, key))
  );

  // Lessons of each course version, by `course/version`.
  const versions = new Map<string, string[]>();
  for (const key of Object.keys(lessonTitles)) {
    const version = key.split('/').slice(0, 2).join('/');
    versions.set(version, [...(versions.get(version) ?? []), key]);
  }
  const finished: string[] = [];
  const finishedTopics = new Set<string>();
  for (const [version, keys] of versions) {
    if (keys.some((key) => !completed.has(key))) {
      continue;
    }

    const [course = '', name = ''] = version.split('/', 2);
    finished.push(`${courseTitles[course] ?? course} · ${name}`);
    finishedTopics.add(course);
  }

  return {
    badges: [
      { id: 'supporter', earned: isSupporter },
      ...lessonMilestones.map((count) => ({
        id: `lessons-${count}` as const,
        earned: completed.size >= count,
        count,
      })),
      { id: 'course', earned: finished.length > 0, courses: finished },
      ...courseBadgeTopics.map((topic) => ({
        id: `course-${topic}` as const,
        earned: finishedTopics.has(topic),
      })),
    ],
    completedLessons: completed.size,
  };
}
