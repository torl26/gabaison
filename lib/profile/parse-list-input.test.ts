import { describe, expect, it } from 'vitest';
import {
  MAX_SKILLS,
  MAX_SKILL_LENGTH,
  MAX_TOPICS,
  formatSkillsInput,
  formatTopicsInput,
  parseSkillsInput,
  parseTopicsInput,
} from './parse-list-input';

describe('parseSkillsInput', () => {
  it('splits on both ASCII and Japanese commas and trims each tag', () => {
    expect(parseSkillsInput(' React , TypeScript、 Python ')).toEqual([
      'React',
      'TypeScript',
      'Python',
    ]);
  });

  it('drops empty entries and duplicates', () => {
    expect(parseSkillsInput('React,,React, ,Go')).toEqual(['React', 'Go']);
  });

  it('caps the number of tags', () => {
    const input = Array.from({ length: MAX_SKILLS + 5 }, (_, i) => `tag${i}`).join(',');
    expect(parseSkillsInput(input)).toHaveLength(MAX_SKILLS);
  });

  it('truncates a tag that exceeds the per-tag limit', () => {
    const [tag] = parseSkillsInput('a'.repeat(MAX_SKILL_LENGTH + 10));
    expect(tag).toHaveLength(MAX_SKILL_LENGTH);
  });

  it('returns an empty array for blank input', () => {
    expect(parseSkillsInput('   ')).toEqual([]);
  });
});

describe('parseTopicsInput', () => {
  it('splits on newlines, keeping commas inside a topic', () => {
    expect(parseTopicsInput('ES添削\r\nポートフォリオ, レビュー\n')).toEqual([
      'ES添削',
      'ポートフォリオ, レビュー',
    ]);
  });

  it('caps the number of topics', () => {
    const input = Array.from({ length: MAX_TOPICS + 3 }, (_, i) => `topic${i}`).join('\n');
    expect(parseTopicsInput(input)).toHaveLength(MAX_TOPICS);
  });
});

describe('formatting round-trips', () => {
  it('re-parses formatted skills unchanged', () => {
    const skills = ['React', 'TypeScript'];
    expect(parseSkillsInput(formatSkillsInput(skills))).toEqual(skills);
  });

  it('re-parses formatted topics unchanged', () => {
    const topics = ['ES添削', '面接対策'];
    expect(parseTopicsInput(formatTopicsInput(topics))).toEqual(topics);
  });
});
