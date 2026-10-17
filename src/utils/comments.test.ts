import { describe, expect, test } from 'bun:test';
import { supportsCommentSection } from './comments';

describe('supportsCommentSection', () => {
  test('supports blog, about, and projects content collections', () => {
    expect(supportsCommentSection('blog')).toBe(true);
    expect(supportsCommentSection('about')).toBe(true);
    expect(supportsCommentSection('projects')).toBe(true);
  });

  test('does not enable comments for other or missing collections', () => {
    expect(supportsCommentSection('media')).toBe(false);
    expect(supportsCommentSection(undefined)).toBe(false);
  });
});
