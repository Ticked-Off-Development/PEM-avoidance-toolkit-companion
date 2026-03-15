import { describe, it, expect, beforeEach } from 'vitest';
import { dbGet, dbSet, dbExportAll, dbImportAll, migrateData } from '../../src/db.js';

beforeEach(() => {
  indexedDB = new IDBFactory();
});

describe('dbExportAll', () => {
  it('returns empty object when store is empty', async () => {
    const result = await dbExportAll();
    expect(result).toEqual({});
  });

  it('exports all stored key-value pairs', async () => {
    await dbSet('key1', { a: 1 });
    await dbSet('key2', { b: 2 });
    await dbSet('key3', 'hello');
    const result = await dbExportAll();
    expect(result).toEqual({
      key1: { a: 1 },
      key2: { b: 2 },
      key3: 'hello',
    });
  });

  it('exports complex nested app data', async () => {
    const appData = {
      days: [
        { id: 'day-2024-01-15', date: '2024-01-15', physical: 3, crash: true },
        { id: 'day-2024-01-16', date: '2024-01-16', physical: 5, crash: false },
      ],
      plan: { causes: ['Overdoing it'], barriers: [], strategies: ['Pacing'] },
      onboarded: true,
      theme: 'dark',
    };
    await dbSet('appdata', appData);
    const result = await dbExportAll();
    expect(result.appdata).toEqual(appData);
  });

  it('does not mutate the stored data', async () => {
    const original = { foo: [1, 2, 3] };
    await dbSet('test', original);
    const exported = await dbExportAll();
    exported.test.foo.push(4);
    const fresh = await dbGet('test');
    expect(fresh.foo).toEqual([1, 2, 3]);
  });
});

describe('dbImportAll', () => {
  it('imports key-value pairs that can be read back', async () => {
    await dbImportAll({
      alpha: { val: 'a' },
      beta: { val: 'b' },
    });
    const a = await dbGet('alpha');
    const b = await dbGet('beta');
    expect(a).toEqual({ val: 'a' });
    expect(b).toEqual({ val: 'b' });
  });

  it('overwrites existing keys during import', async () => {
    await dbSet('mykey', 'old value');
    await dbImportAll({ mykey: 'new value' });
    const result = await dbGet('mykey');
    expect(result).toBe('new value');
  });

  it('preserves keys not included in the import', async () => {
    await dbSet('existing', 'keep me');
    await dbImportAll({ newkey: 'added' });
    const existing = await dbGet('existing');
    const newkey = await dbGet('newkey');
    expect(existing).toBe('keep me');
    expect(newkey).toBe('added');
  });

  it('handles empty import object', async () => {
    await dbSet('before', 42);
    await dbImportAll({});
    const result = await dbGet('before');
    expect(result).toBe(42);
  });

  it('round-trips with dbExportAll', async () => {
    const data = {
      appdata: {
        days: [{ id: 'day-1', date: '2024-01-01', physical: 5 }],
        plan: { causes: ['A'], barriers: ['B'], strategies: ['C'] },
        onboarded: true,
        theme: 'light',
      },
    };
    await dbImportAll(data);
    const exported = await dbExportAll();
    expect(exported).toEqual(data);
  });

  it('imports multiple keys in a single transaction', async () => {
    const manyKeys = {};
    for (let i = 0; i < 20; i++) {
      manyKeys[`key-${i}`] = { index: i };
    }
    await dbImportAll(manyKeys);
    for (let i = 0; i < 20; i++) {
      const val = await dbGet(`key-${i}`);
      expect(val).toEqual({ index: i });
    }
  });
});

describe('migrateData - override flag backfill', () => {
  it('sets overrideActivity true when overall_activity has a value', () => {
    const stored = {
      days: [{ date: '2024-01-01', overall_activity: '5' }],
    };
    const result = migrateData(stored);
    expect(result.days[0].overrideActivity).toBe(true);
  });

  it('sets overrideActivity false when overall_activity is empty', () => {
    const stored = {
      days: [{ date: '2024-01-01', overall_activity: '' }],
    };
    const result = migrateData(stored);
    expect(result.days[0].overrideActivity).toBe(false);
  });

  it('sets overrideActivity false when overall_activity is null', () => {
    const stored = {
      days: [{ date: '2024-01-01', overall_activity: null }],
    };
    const result = migrateData(stored);
    expect(result.days[0].overrideActivity).toBe(false);
  });

  it('sets overrideSymptom true when any symptom period is filled', () => {
    const stored = {
      days: [{ date: '2024-01-01', overall_symptom: { am: '4', mid: '', pm: '' } }],
    };
    const result = migrateData(stored);
    expect(result.days[0].overrideSymptom).toBe(true);
  });

  it('sets overrideSymptom false when all symptom periods are empty', () => {
    const stored = {
      days: [{ date: '2024-01-01', overall_symptom: { am: '', mid: '', pm: '' } }],
    };
    const result = migrateData(stored);
    expect(result.days[0].overrideSymptom).toBe(false);
  });

  it('sets overrideSymptom false when overall_symptom is missing', () => {
    const stored = {
      days: [{ date: '2024-01-01' }],
    };
    const result = migrateData(stored);
    expect(result.days[0].overrideSymptom).toBe(false);
  });

  it('preserves existing override flags and does not re-infer', () => {
    const stored = {
      schemaVersion: 1,
      days: [{
        date: '2024-01-01',
        overall_activity: '5',
        overrideActivity: false,
        overrideSymptom: true,
      }],
    };
    const result = migrateData(stored);
    expect(result.days[0].overrideActivity).toBe(false);
    expect(result.days[0].overrideSymptom).toBe(true);
  });

  it('backfills entryMode and override flags together', () => {
    const stored = {
      days: [{
        date: '2024-01-01',
        overall_activity: '7',
        overall_symptom: { am: '3', mid: '5', pm: '4' },
      }],
    };
    const result = migrateData(stored);
    expect(result.days[0].entryMode).toBe('full');
    expect(result.days[0].overrideActivity).toBe(true);
    expect(result.days[0].overrideSymptom).toBe(true);
    expect(result.schemaVersion).toBe(2);
  });
});
