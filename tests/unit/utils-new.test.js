import { describe, it, expect } from 'vitest';
import {
  generateCSV,
  generateExportText,
  computeCorrelations,
  computeCrashRisk,
  getLast30Dates,
  emptyDay,
  avgField,
} from '../../src/utils.js';
import { migrateData, DATA_SCHEMA_VERSION } from '../../src/db.js';

// --- Helper: create a day with specific values ---
function makeDay(date, overrides = {}) {
  return {
    ...emptyDay(date),
    ...overrides,
    date,
    id: `day-${date}`,
  };
}

// --- generateCSV ---

describe('generateCSV', () => {
  it('returns a header row when given empty days array', () => {
    const csv = generateCSV([]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Date');
    expect(lines[0]).toContain('Physical');
    expect(lines[0]).toContain('Crash');
    expect(lines[0]).toContain('Comments');
  });

  it('includes all expected column headers', () => {
    const csv = generateCSV([]);
    const headers = csv.split('\n')[0].split(',');
    expect(headers).toHaveLength(28);
    expect(headers[0]).toBe('Date');
    expect(headers[1]).toBe('Entry Mode');
    expect(headers[6]).toBe('Unrefreshing Sleep');
    expect(headers[26]).toBe('Crash');
    expect(headers[27]).toBe('Comments');
  });

  it('generates one data row per day', () => {
    const days = [
      makeDay('2024-01-15', { physical: '3', mental: '4', overall_activity: '5' }),
      makeDay('2024-01-16', { physical: '6', mental: '2', overall_activity: '4' }),
    ];
    const lines = generateCSV(days).split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it('maps unrefreshing_sleep correctly', () => {
    const days = [
      makeDay('2024-01-15', { unrefreshing_sleep: true }),
      makeDay('2024-01-16', { unrefreshing_sleep: false }),
      makeDay('2024-01-17', { unrefreshing_sleep: null }),
    ];
    const lines = generateCSV(days).split('\n');
    // sleep is column index 6 (Date, Entry Mode, Physical, Mental, Emotional, Overall Activity, Unrefreshing Sleep)
    expect(lines[1].split(',')[6]).toBe('Yes');
    expect(lines[2].split(',')[6]).toBe('No');
    expect(lines[3].split(',')[6]).toBe('');
  });

  it('maps crash field correctly', () => {
    const days = [
      makeDay('2024-01-15', { crash: true }),
      makeDay('2024-01-16', { crash: false }),
      makeDay('2024-01-17', { crash: null }),
    ];
    const lines = generateCSV(days).split('\n');
    // crash is column index 26 (shifted +1 for Entry Mode column)
    expect(lines[1].split(',')[26]).toBe('Yes');
    expect(lines[2].split(',')[26]).toBe('No');
    expect(lines[3].split(',')[26]).toBe('');
  });

  it('includes symptom AM/Mid/PM values', () => {
    const days = [
      makeDay('2024-01-15', {
        fatigue: { am: '3', mid: '5', pm: '7' },
        pain: { am: '1', mid: '2', pm: '3' },
      }),
    ];
    const csv = generateCSV(days);
    const row = csv.split('\n')[1];
    // fatigue AM=3, Mid=5, PM=7 are columns 6,7,8
    expect(row).toContain(',3,5,7,');
  });

  it('escapes commas in comments', () => {
    const days = [makeDay('2024-01-15', { comments: 'felt bad, very tired' })];
    const csv = generateCSV(days);
    expect(csv).toContain('"felt bad, very tired"');
  });

  it('escapes double quotes in comments', () => {
    const days = [makeDay('2024-01-15', { comments: 'said "no more"' })];
    const csv = generateCSV(days);
    expect(csv).toContain('"said ""no more"""');
  });

  it('escapes newlines in comments', () => {
    const days = [makeDay('2024-01-15', { comments: 'line1\nline2' })];
    const csv = generateCSV(days);
    expect(csv).toContain('"line1\nline2"');
  });

  it('handles empty/missing symptom fields gracefully', () => {
    const days = [makeDay('2024-01-15')];
    const csv = generateCSV(days);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    // Should not throw, empty fields become empty strings
  });
});

// --- computeCorrelations ---

describe('computeCorrelations', () => {
  // Generate N days with linearly correlated physical and fatigue
  function makeDaysWithCorrelation(n) {
    return Array.from({ length: n }, (_, i) => makeDay(
      `2024-01-${String(i + 1).padStart(2, '0')}`,
      {
        physical: String(i + 1),
        mental: String(10 - i),
        emotional: String(Math.round(Math.random() * 10)),
        overall_activity: String(i + 1),
        fatigue: { am: String(i + 1), mid: String(i + 1), pm: String(i + 1) },
        pain: { am: String(i), mid: String(i), pm: String(i) },
        brain_fog: { am: String(Math.round(i / 2)), mid: String(Math.round(i / 2)), pm: String(Math.round(i / 2)) },
        overall_symptom: { am: String(i + 1), mid: String(i + 1), pm: String(i + 1) },
      }
    ));
  }

  it('returns labels and matrix', () => {
    const days = makeDaysWithCorrelation(10);
    const result = computeCorrelations(days);
    expect(result).toHaveProperty('labels');
    expect(result).toHaveProperty('matrix');
    expect(result.labels).toHaveLength(9);
    expect(result.matrix).toHaveLength(9);
  });

  it('diagonal values are always 1', () => {
    const days = makeDaysWithCorrelation(10);
    const { matrix } = computeCorrelations(days);
    for (let i = 0; i < matrix.length; i++) {
      expect(matrix[i][i]).toBe(1);
    }
  });

  it('matrix is symmetric', () => {
    const days = makeDaysWithCorrelation(10);
    const { matrix } = computeCorrelations(days);
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix.length; j++) {
        if (matrix[i][j] !== null && matrix[j][i] !== null) {
          expect(matrix[i][j]).toBeCloseTo(matrix[j][i], 10);
        }
      }
    }
  });

  it('detects perfect positive correlation', () => {
    // physical and fatigue both increase linearly with i
    const days = makeDaysWithCorrelation(10);
    const { labels, matrix } = computeCorrelations(days);
    const physIdx = labels.indexOf('Physical');
    const fatIdx = labels.indexOf('Fatigue');
    expect(matrix[physIdx][fatIdx]).toBeCloseTo(1.0, 5);
  });

  it('detects perfect negative correlation', () => {
    // physical increases, mental decreases
    const days = makeDaysWithCorrelation(10);
    const { labels, matrix } = computeCorrelations(days);
    const physIdx = labels.indexOf('Physical');
    const mentIdx = labels.indexOf('Mental');
    expect(matrix[physIdx][mentIdx]).toBeCloseTo(-1.0, 5);
  });

  it('returns null correlations when fewer than 5 valid pairs', () => {
    const days = Array.from({ length: 3 }, (_, i) => makeDay(
      `2024-01-${String(i + 1).padStart(2, '0')}`,
      { physical: String(i), mental: String(i) }
    ));
    const { matrix } = computeCorrelations(days);
    // With only 3 data points, off-diagonal should be null
    expect(matrix[0][1]).toBeNull();
  });

  it('handles days with mixed null fields', () => {
    const days = Array.from({ length: 10 }, (_, i) => makeDay(
      `2024-01-${String(i + 1).padStart(2, '0')}`,
      {
        physical: i % 2 === 0 ? String(i) : '', // half missing
        mental: String(i),
        overall_activity: String(i),
        fatigue: { am: String(i), mid: String(i), pm: String(i) },
        pain: { am: '', mid: '', pm: '' },
        brain_fog: { am: '', mid: '', pm: '' },
        overall_symptom: { am: String(i), mid: String(i), pm: String(i) },
      }
    ));
    const result = computeCorrelations(days);
    expect(result).toHaveProperty('matrix');
    // Physical has only 5 valid values, should still compute
  });

  it('returns 0 for constant fields', () => {
    const days = Array.from({ length: 10 }, (_, i) => makeDay(
      `2024-01-${String(i + 1).padStart(2, '0')}`,
      {
        physical: '5', // constant
        mental: String(i),
        emotional: String(i),
        overall_activity: String(i),
        fatigue: { am: '5', mid: '5', pm: '5' }, // constant
        pain: { am: String(i), mid: String(i), pm: String(i) },
        brain_fog: { am: String(i), mid: String(i), pm: String(i) },
        overall_symptom: { am: String(i), mid: String(i), pm: String(i) },
      }
    ));
    const { labels, matrix } = computeCorrelations(days);
    const physIdx = labels.indexOf('Physical');
    const mentIdx = labels.indexOf('Mental');
    // Constant vs varying should be 0
    expect(matrix[physIdx][mentIdx]).toBe(0);
  });
});

// --- computeCrashRisk ---

describe('computeCrashRisk', () => {
  it('returns null when fewer than 7 days', () => {
    const days = Array.from({ length: 5 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, { overall_activity: '3' })
    );
    expect(computeCrashRisk(days)).toBeNull();
  });

  it('returns null when fewer than 5 non-crash days with activity', () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, { crash: true, overall_activity: '8' })
    );
    expect(computeCrashRisk(days)).toBeNull();
  });

  it('returns null when recent days have no activity logged', () => {
    const days = Array.from({ length: 10 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, {
        overall_activity: i < 7 ? '4' : '', // last 3 have no activity
      })
    );
    expect(computeCrashRisk(days)).toBeNull();
  });

  it('returns atRisk=false when recent activity is within normal range', () => {
    // All days at activity level 4 — recent avg = 4, ceiling = mean + std = 4 + 0 = 4
    // Actually with constant values std=0, ceiling=4.0, recentAvg=4.0, 4 > 4 is false
    const days = Array.from({ length: 10 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, { overall_activity: '4' })
    );
    const result = computeCrashRisk(days);
    expect(result).not.toBeNull();
    expect(result.atRisk).toBe(false);
    expect(result.mean).toBe('4.0');
    expect(result.recentAvg).toBe('4.0');
  });

  it('returns atRisk=true when recent activity exceeds ceiling', () => {
    // First 7 days at activity 3, last 3 days at activity 9
    // Non-crash mean ≈ (3*7 + 9*3)/10 = 4.8, std will be moderate
    // Recent avg = 9, well above ceiling
    const days = Array.from({ length: 10 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, {
        overall_activity: i < 7 ? '3' : '9',
      })
    );
    const result = computeCrashRisk(days);
    expect(result).not.toBeNull();
    expect(result.atRisk).toBe(true);
    expect(Number(result.recentAvg)).toBe(9.0);
  });

  it('excludes crash days from baseline calculation', () => {
    // 5 non-crash days at 3, 2 crash days at 10, last 3 non-crash at 3
    const days = [
      makeDay('2024-01-01', { overall_activity: '3' }),
      makeDay('2024-01-02', { overall_activity: '3' }),
      makeDay('2024-01-03', { overall_activity: '3' }),
      makeDay('2024-01-04', { overall_activity: '10', crash: true }),
      makeDay('2024-01-05', { overall_activity: '10', crash: true }),
      makeDay('2024-01-06', { overall_activity: '3' }),
      makeDay('2024-01-07', { overall_activity: '3' }),
      makeDay('2024-01-08', { overall_activity: '3' }),
      makeDay('2024-01-09', { overall_activity: '3' }),
      makeDay('2024-01-10', { overall_activity: '3' }),
    ];
    const result = computeCrashRisk(days);
    expect(result).not.toBeNull();
    // Mean of non-crash days should be 3.0
    expect(result.mean).toBe('3.0');
    expect(result.atRisk).toBe(false);
  });

  it('returns ceiling, recentAvg, mean as string numbers', () => {
    const days = Array.from({ length: 10 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, { overall_activity: String(i + 1) })
    );
    const result = computeCrashRisk(days);
    expect(result).not.toBeNull();
    expect(typeof result.ceiling).toBe('string');
    expect(typeof result.recentAvg).toBe('string');
    expect(typeof result.mean).toBe('string');
    expect(Number(result.ceiling)).toBeGreaterThan(0);
  });
});

// --- getLast30Dates ---

describe('getLast30Dates', () => {
  it('returns exactly 30 dates', () => {
    const dates = getLast30Dates();
    expect(dates).toHaveLength(30);
  });

  it('returns dates in YYYY-MM-DD format', () => {
    const dates = getLast30Dates();
    dates.forEach(d => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('ends with today', () => {
    const dates = getLast30Dates();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    expect(dates[29]).toBe(today);
  });

  it('starts 29 days ago', () => {
    const dates = getLast30Dates();
    const d = new Date();
    d.setDate(d.getDate() - 29);
    const expected = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    expect(dates[0]).toBe(expected);
  });

  it('dates are in ascending chronological order', () => {
    const dates = getLast30Dates();
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] > dates[i - 1]).toBe(true);
    }
  });

  it('has consecutive dates with no gaps', () => {
    const dates = getLast30Dates();
    for (let i = 1; i < dates.length; i++) {
      // Advance previous date by 1 day using local time to avoid DST drift
      const prev = new Date(dates[i - 1] + 'T12:00:00');
      prev.setDate(prev.getDate() + 1);
      const expected = `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}-${String(prev.getDate()).padStart(2,'0')}`;
      expect(dates[i]).toBe(expected);
    }
  });
});

// --- Quick Log: entryMode data model ---

describe('Quick Log - emptyDay entryMode', () => {
  it('emptyDay includes entryMode: "full" by default', () => {
    const day = emptyDay('2024-01-15');
    expect(day.entryMode).toBe('full');
  });

  it('makeDay preserves entryMode when set to quick', () => {
    const day = makeDay('2024-01-15', { entryMode: 'quick' });
    expect(day.entryMode).toBe('quick');
  });

  it('Quick Log entry has null individual dimensions and only overall fields', () => {
    const day = makeDay('2024-01-15', {
      entryMode: 'quick',
      overall_activity: '5',
      overrideActivity: true,
      overall_symptom: { am: '6', mid: '', pm: '' },
      overrideSymptom: true,
      crash: false,
      unrefreshing_sleep: true,
      // physical, mental, emotional remain empty from emptyDay
    });
    expect(day.entryMode).toBe('quick');
    expect(day.overall_activity).toBe('5');
    expect(day.overall_symptom.am).toBe('6');
    expect(day.overall_symptom.mid).toBe('');
    expect(day.overall_symptom.pm).toBe('');
    expect(day.physical).toBe('');
    expect(day.mental).toBe('');
    expect(day.emotional).toBe('');
  });
});

// --- Quick Log: CSV export ---

describe('Quick Log - generateCSV with entryMode', () => {
  it('includes Entry Mode column header', () => {
    const csv = generateCSV([]);
    const headers = csv.split('\n')[0].split(',');
    expect(headers).toContain('Entry Mode');
    expect(headers).toHaveLength(28);
  });

  it('Quick Log rows have "quick" in Entry Mode column', () => {
    const days = [makeDay('2024-01-15', {
      entryMode: 'quick',
      overall_activity: '5',
      overall_symptom: { am: '6', mid: '', pm: '' },
      crash: false,
      unrefreshing_sleep: true,
    })];
    const csv = generateCSV(days);
    const row = csv.split('\n')[1].split(',');
    // Entry Mode is column index 1 (after Date)
    expect(row[1]).toBe('quick');
  });

  it('Full Log rows have "full" in Entry Mode column', () => {
    const days = [makeDay('2024-01-15', { entryMode: 'full', physical: '3' })];
    const csv = generateCSV(days);
    const row = csv.split('\n')[1].split(',');
    expect(row[1]).toBe('full');
  });

  it('legacy entries without entryMode default to "full" in CSV', () => {
    const day = makeDay('2024-01-15', { physical: '3' });
    delete day.entryMode;
    const csv = generateCSV([day]);
    const row = csv.split('\n')[1].split(',');
    expect(row[1]).toBe('full');
  });

  it('Quick Log rows have empty cells for individual dimensions', () => {
    const days = [makeDay('2024-01-15', {
      entryMode: 'quick',
      overall_activity: '5',
      overall_symptom: { am: '6', mid: '', pm: '' },
    })];
    const csv = generateCSV(days);
    const row = csv.split('\n')[1].split(',');
    // Physical is column index 2 (Date, Entry Mode, Physical)
    expect(row[2]).toBe('');
    expect(row[3]).toBe('');
    expect(row[4]).toBe('');
  });
});

// --- Quick Log: text export ---

describe('Quick Log - generateExportText with entryMode', () => {
  it('includes Mode column in text export header', () => {
    const text = generateExportText([], { causes: [], barriers: [], strategies: [] });
    expect(text).toContain('Mode');
  });

  it('shows quick mode in text export for quick entries', () => {
    const days = [makeDay('2024-01-15', {
      entryMode: 'quick',
      overall_activity: '5',
      overall_symptom: { am: '6', mid: '', pm: '' },
      crash: false,
      unrefreshing_sleep: false,
    })];
    const text = generateExportText(days, { causes: [], barriers: [], strategies: [] });
    expect(text).toContain('quick');
  });
});

// --- Quick Log: statistical calculations with null fields ---

describe('Quick Log - computeCorrelations with null dimensions', () => {
  it('handles Quick Log entries with null individual dimensions', () => {
    // Mix of quick and full entries
    const days = [
      // 5 full entries
      ...Array.from({ length: 5 }, (_, i) => makeDay(
        `2024-01-${String(i + 1).padStart(2, '0')}`,
        {
          entryMode: 'full',
          physical: String(i + 1),
          mental: String(i + 2),
          emotional: String(i),
          overall_activity: String(i + 1),
          fatigue: { am: String(i + 1), mid: String(i + 1), pm: String(i + 1) },
          overall_symptom: { am: String(i + 1), mid: String(i + 1), pm: String(i + 1) },
        }
      )),
      // 5 quick entries (no individual dimensions)
      ...Array.from({ length: 5 }, (_, i) => makeDay(
        `2024-01-${String(i + 6).padStart(2, '0')}`,
        {
          entryMode: 'quick',
          overall_activity: String(i + 3),
          overall_symptom: { am: String(i + 3), mid: '', pm: '' },
        }
      )),
    ];
    const result = computeCorrelations(days);
    expect(result).toHaveProperty('labels');
    expect(result).toHaveProperty('matrix');
    // Physical only has 5 valid entries, so correlations involving it should still compute
    const physIdx = result.labels.indexOf('Physical');
    expect(physIdx).toBeGreaterThanOrEqual(0);
  });
});

describe('Quick Log - computeCrashRisk with quick entries', () => {
  it('works correctly with Quick Log entries (uses overall_activity)', () => {
    const days = Array.from({ length: 10 }, (_, i) => makeDay(
      `2024-01-${String(i + 1).padStart(2, '0')}`,
      {
        entryMode: 'quick',
        overall_activity: '4',
        overall_symptom: { am: '3', mid: '', pm: '' },
      }
    ));
    const result = computeCrashRisk(days);
    expect(result).not.toBeNull();
    expect(result.atRisk).toBe(false);
    expect(result.mean).toBe('4.0');
  });
});

describe('Quick Log - avgField with single period', () => {
  it('returns the single value when only am is filled', () => {
    expect(avgField({ am: '6', mid: '', pm: '' })).toBe(6);
  });

  it('returns null when all periods are empty', () => {
    expect(avgField({ am: '', mid: '', pm: '' })).toBeNull();
  });
});

// --- Data Migration ---

describe('migrateData', () => {
  it('returns null/undefined input unchanged', () => {
    expect(migrateData(null)).toBeNull();
    expect(migrateData(undefined)).toBeUndefined();
  });

  it('backfills entryMode on legacy day records without it', () => {
    const stored = {
      days: [
        { date: '2024-01-01', physical: '3', mental: '4' },
        { date: '2024-01-02', physical: '5' },
      ],
      plan: { causes: [], barriers: [], strategies: [] },
    };
    const migrated = migrateData(stored);
    expect(migrated.days[0].entryMode).toBe('full');
    expect(migrated.days[1].entryMode).toBe('full');
  });

  it('does not overwrite existing entryMode values', () => {
    const stored = {
      days: [
        { date: '2024-01-01', entryMode: 'quick', overall_activity: '5' },
        { date: '2024-01-02', entryMode: 'full', physical: '3' },
      ],
      plan: { causes: [], barriers: [], strategies: [] },
    };
    const migrated = migrateData(stored);
    expect(migrated.days[0].entryMode).toBe('quick');
    expect(migrated.days[1].entryMode).toBe('full');
  });

  it('sets schemaVersion to current DATA_SCHEMA_VERSION', () => {
    const stored = {
      days: [{ date: '2024-01-01' }],
      plan: { causes: [], barriers: [], strategies: [] },
    };
    const migrated = migrateData(stored);
    expect(migrated.schemaVersion).toBe(DATA_SCHEMA_VERSION);
  });

  it('skips migration if schemaVersion is already current', () => {
    const stored = {
      schemaVersion: DATA_SCHEMA_VERSION,
      days: [
        { date: '2024-01-01' }, // no entryMode — but migration should NOT run
      ],
      plan: { causes: [], barriers: [], strategies: [] },
    };
    const migrated = migrateData(stored);
    // Should be returned as-is (same reference)
    expect(migrated).toBe(stored);
    // entryMode was NOT added since migration was skipped
    expect(migrated.days[0].entryMode).toBeUndefined();
  });

  it('is non-destructive — preserves all existing fields', () => {
    const stored = {
      days: [{
        date: '2024-01-01',
        physical: '3',
        mental: '5',
        emotional: '2',
        overall_activity: '4',
        fatigue: { am: '3', mid: '4', pm: '5' },
        crash: true,
        comments: 'bad day',
      }],
      plan: { causes: ['heat'], barriers: ['work'], strategies: ['rest'] },
      onboarded: true,
      theme: 'light',
      tourCompleted: true,
    };
    const migrated = migrateData(stored);
    expect(migrated.days[0].physical).toBe('3');
    expect(migrated.days[0].mental).toBe('5');
    expect(migrated.days[0].crash).toBe(true);
    expect(migrated.days[0].comments).toBe('bad day');
    expect(migrated.plan.causes).toEqual(['heat']);
    expect(migrated.onboarded).toBe(true);
    expect(migrated.theme).toBe('light');
  });

  it('handles empty days array', () => {
    const stored = {
      days: [],
      plan: { causes: [], barriers: [], strategies: [] },
    };
    const migrated = migrateData(stored);
    expect(migrated.days).toEqual([]);
    expect(migrated.schemaVersion).toBe(DATA_SCHEMA_VERSION);
  });

  it('handles stored data without days array', () => {
    const stored = {
      plan: { causes: [], barriers: [], strategies: [] },
      onboarded: true,
    };
    const migrated = migrateData(stored);
    expect(migrated.schemaVersion).toBe(DATA_SCHEMA_VERSION);
    expect(migrated.plan).toBeDefined();
  });
});
