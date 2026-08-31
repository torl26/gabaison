import { describe, expect, it } from 'vitest';
import { buildChatMessages } from './get-chat';

const CURRENT_USER_ID = 'user-1';

const messages = [
  {
    id: 'msg-1',
    match_id: 'match-1',
    sender_id: CURRENT_USER_ID,
    content: 'こんにちは',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'msg-2',
    match_id: 'match-1',
    sender_id: 'mentor-1',
    content: 'よろしくお願いします',
    created_at: '2026-08-01T00:01:00Z',
  },
];

const participantNames = {
  [CURRENT_USER_ID]: '自分',
  'mentor-1': 'タロウ',
};

describe('buildChatMessages', () => {
  it('resolves the sender name for each message', () => {
    const result = buildChatMessages(messages, participantNames, CURRENT_USER_ID);

    expect(result[0].senderName).toBe('自分');
    expect(result[1].senderName).toBe('タロウ');
  });

  it('marks whether the current user sent each message', () => {
    const result = buildChatMessages(messages, participantNames, CURRENT_USER_ID);

    expect(result[0].isOwn).toBe(true);
    expect(result[1].isOwn).toBe(false);
  });

  it('carries through id, content, and createdAt', () => {
    const result = buildChatMessages(messages, participantNames, CURRENT_USER_ID);

    expect(result[0]).toMatchObject({
      id: 'msg-1',
      content: 'こんにちは',
      createdAt: '2026-08-01T00:00:00Z',
    });
  });

  it('falls back to a placeholder name for an unknown sender', () => {
    const result = buildChatMessages(
      [
        {
          id: 'msg-3',
          match_id: 'match-1',
          sender_id: 'unknown-user',
          content: 'hi',
          created_at: '2026-08-01T00:02:00Z',
        },
      ],
      participantNames,
      CURRENT_USER_ID
    );

    expect(result[0].senderName).toBe('不明なユーザー');
  });
});
