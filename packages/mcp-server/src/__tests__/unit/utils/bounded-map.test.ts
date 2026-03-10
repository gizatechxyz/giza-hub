import { describe, test, expect, afterEach } from 'bun:test';
import { BoundedMap } from '../../../utils/bounded-map.js';

const originalDateNow = Date.now;
afterEach(() => {
  Date.now = originalDateNow;
});

describe('BoundedMap', () => {
  test('accepts entries up to max size', () => {
    const map = new BoundedMap<string, number>(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    expect(map.size).toBe(3);
  });

  test('throws when full', () => {
    const map = new BoundedMap<string, number>(2);
    map.set('a', 1);
    map.set('b', 2);
    expect(() => map.set('c', 3)).toThrow('Storage capacity exceeded');
  });

  test('sweeps expired entries before rejecting', () => {
    const now = originalDateNow();
    Date.now = () => now;
    const map = new BoundedMap<string, number>(2, 1000);
    map.set('a', 1);
    map.set('b', 2);
    Date.now = () => now + 1001;
    // Should not throw because expired entries are swept
    map.set('c', 3);
    expect(map.size).toBe(1);
    expect(map.get('c')).toBe(3);
  });

  test('get returns undefined for expired entries', () => {
    const now = originalDateNow();
    Date.now = () => now;
    const map = new BoundedMap<string, number>(10, 1000);
    map.set('a', 1);
    Date.now = () => now + 1001;
    expect(map.get('a')).toBeUndefined();
  });

  test('allows overwriting existing keys without capacity check', () => {
    const map = new BoundedMap<string, number>(2);
    map.set('a', 1);
    map.set('b', 2);
    map.set('a', 10); // overwrite - should not throw
    expect(map.get('a')).toBe(10);
  });

  test('has returns false for expired entries', () => {
    const now = originalDateNow();
    Date.now = () => now;
    const map = new BoundedMap<string, number>(10, 1000);
    map.set('a', 1);
    expect(map.has('a')).toBe(true);
    Date.now = () => now + 1001;
    expect(map.has('a')).toBe(false);
  });

  test('delete removes entry', () => {
    const map = new BoundedMap<string, number>(10);
    map.set('a', 1);
    expect(map.delete('a')).toBe(true);
    expect(map.get('a')).toBeUndefined();
    expect(map.size).toBe(0);
  });

  test('clear removes all entries', () => {
    const map = new BoundedMap<string, number>(10);
    map.set('a', 1);
    map.set('b', 2);
    map.clear();
    expect(map.size).toBe(0);
  });
});
