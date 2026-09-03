export const MAX_SKILLS = 20;
export const MAX_SKILL_LENGTH = 30;
export const MAX_TOPICS = 5;
export const MAX_TOPIC_LENGTH = 100;

function parseList(
  value: string,
  separator: RegExp,
  maxItems: number,
  maxLength: number
): string[] {
  const seen = new Set<string>();

  for (const raw of value.split(separator)) {
    const item = raw.trim().slice(0, maxLength);
    if (item && !seen.has(item)) {
      seen.add(item);
    }
    if (seen.size >= maxItems) {
      break;
    }
  }

  return [...seen];
}

/** Skills come from a single-line input: "React, TypeScript、Python" */
export function parseSkillsInput(value: string): string[] {
  return parseList(value, /[,、]/, MAX_SKILLS, MAX_SKILL_LENGTH);
}

/** Topics come from a textarea, one per line. */
export function parseTopicsInput(value: string): string[] {
  return parseList(value, /\r?\n/, MAX_TOPICS, MAX_TOPIC_LENGTH);
}

export function formatSkillsInput(skills: string[]): string {
  return skills.join(', ');
}

export function formatTopicsInput(topics: string[]): string {
  return topics.join('\n');
}
