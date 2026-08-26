import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema } from './auth';

describe('signupSchema', () => {
  it('accepts a valid signup payload', () => {
    const result = signupSchema.safeParse({
      email: 'student@example.com',
      password: 'password123',
      role: 'student',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      role: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({
      email: 'student@example.com',
      password: 'short',
      role: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a role outside student/mentor', () => {
    const result = signupSchema.safeParse({
      email: 'student@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'student@example.com',
      password: 'anything',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'student@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
