import { describe, it, expect, beforeEach } from 'vitest';
import { dbGet, dbSet } from '../../src/db.js';

beforeEach(() => {
  // Clear all IndexedDB databases between tests
  indexedDB = new IDBFactory();
});

describe('dbGet', () => {
  it('returns null for a key that does not exist', async () => {
    const result = await dbGet('nonexistent');
    expect(result).toBeNull();
  });
});

describe('dbSet and dbGet', () => {
  it('round-trips a simple value', async () => {
    await dbSet('testkey', { foo: 'bar' });
    const result = await dbGet('testkey');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('overwrites existing values', async () => {
    await dbSet('key', 'first');
    await dbSet('key', 'second');
    const result = await dbGet('key');
    expect(result).toBe('second');
  });

  it('handles complex nested objects matching app data shape', async () => {
    const appData = {
      days: [
        {
          id: 'day-2024-01-15',
          date: '2024-01-15',
          physical: 3,
          mental: 4,
          emotional: 2,
          overall_activity: 3,
          fatigue: { am: '2', mid: '3', pm: '4' },
          pain: { am: '1', mid: '2', pm: '3' },
          nausea_gi: { am: '', mid: '', pm: '' },
          brain_fog: { am: '2', mid: '3', pm: '2' },
          other_symptom: { name: '', am: '', mid: '', pm: '' },
          overall_symptom: { am: '2', mid: '3', pm: '3' },
          unrefreshing_sleep: true,
          crash: false,
          comments: 'Mild day',
        },
      ],
      plan: { causes: ['Overdoing it'], barriers: [], strategies: ['Pacing'] },
      onboarded: true,
      theme: 'dark',
    };

    await dbSet('appdata', appData);
    const result = await dbGet('appdata');
    expect(result).toEqual(appData);
  });

  it('handles concurrent reads without error', async () => {
    await dbSet('shared', 42);
    const results = await Promise.all([
      dbGet('shared'),
      dbGet('shared'),
      dbGet('shared'),
    ]);
    expect(results).toEqual([42, 42, 42]);
  });
});
