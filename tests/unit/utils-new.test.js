import { describe, it, expect } from 'vitest';
import {
  generateCSV,
  computeCorrelations,
  computeCrashRisk,
  getLast30Dates,
  emptyDay,
  applyDefaults,
  generateExportText,
} from '../../src/utils.js';

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
    expect(headers).toHaveLength(30);
    expect(headers[0]).toBe('Date');
    expect(headers[5]).toBe('Unrefreshing Sleep');
    expect(headers[25]).toBe('Crash');
    expect(headers[26]).toBe('Comments');
    expect(headers[27]).toBe('Entry Mode');
    expect(headers[28]).toBe('Activity Override');
    expect(headers[29]).toBe('Symptom Override');
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
    // sleep is column index 5
    expect(lines[1].split(',')[5]).toBe('Yes');
    expect(lines[2].split(',')[5]).toBe('No');
    expect(lines[3].split(',')[5]).toBe('');
  });

  it('maps crash field correctly', () => {
    const days = [
      makeDay('2024-01-15', { crash: true }),
      makeDay('2024-01-16', { crash: false }),
      makeDay('2024-01-17', { crash: null }),
    ];
    const lines = generateCSV(days).split('\n');
    // crash is column index 25 (shifted by 4 for other_symptom columns)
    expect(lines[1].split(',')[25]).toBe('Yes');
    expect(lines[2].split(',')[25]).toBe('No');
    expect(lines[3].split(',')[25]).toBe('');
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

// --- applyDefaults ---

describe('applyDefaults', () => {
  it('fills missing entryMode with "full"', () => {
    const day = { date: '2024-01-15', id: 'day-2024-01-15' };
    const result = applyDefaults(day);
    expect(result.entryMode).toBe('full');
  });

  it('fills missing schemaVersion with 0', () => {
    const day = { date: '2024-01-15', id: 'day-2024-01-15' };
    const result = applyDefaults(day);
    expect(result.schemaVersion).toBe(0);
  });

  it('preserves existing entryMode', () => {
    const day = { date: '2024-01-15', entryMode: 'quick', schemaVersion: 1 };
    const result = applyDefaults(day);
    expect(result.entryMode).toBe('quick');
    expect(result.schemaVersion).toBe(1);
  });

  it('fills override flags with false', () => {
    const day = { date: '2024-01-15' };
    const result = applyDefaults(day);
    expect(result.overrideActivity).toBe(false);
    expect(result.overrideSymptom).toBe(false);
  });

  it('preserves existing override flags', () => {
    const day = { date: '2024-01-15', overrideActivity: true, overrideSymptom: true };
    const result = applyDefaults(day);
    expect(result.overrideActivity).toBe(true);
    expect(result.overrideSymptom).toBe(true);
  });

  it('fills missing symptom objects', () => {
    const day = { date: '2024-01-15' };
    const result = applyDefaults(day);
    expect(result.fatigue).toEqual({ am: '', mid: '', pm: '' });
    expect(result.pain).toEqual({ am: '', mid: '', pm: '' });
    expect(result.nausea_gi).toEqual({ am: '', mid: '', pm: '' });
    expect(result.brain_fog).toEqual({ am: '', mid: '', pm: '' });
    expect(result.other_symptom).toEqual({ name: '', am: '', mid: '', pm: '' });
    expect(result.overall_symptom).toEqual({ am: '', mid: '', pm: '' });
  });

  it('fills crash and comments with defaults', () => {
    const day = { date: '2024-01-15' };
    const result = applyDefaults(day);
    expect(result.crash).toBeNull();
    expect(result.comments).toBe('');
  });

  it('preserves all existing fields', () => {
    const day = makeDay('2024-01-15', {
      physical: '5', mental: '3', emotional: '7',
      overall_activity: '5', crash: true, comments: 'test',
      entryMode: 'full', schemaVersion: 1,
    });
    const result = applyDefaults(day);
    expect(result.physical).toBe('5');
    expect(result.mental).toBe('3');
    expect(result.crash).toBe(true);
    expect(result.comments).toBe('test');
  });

  it('returns non-objects unchanged', () => {
    expect(applyDefaults(null)).toBeNull();
    expect(applyDefaults(undefined)).toBeUndefined();
  });
});

// --- Quick Log data handling ---

describe('Quick Log entries', () => {
  function makeQuickDay(date, activity, symptom, crash, sleep) {
    return makeDay(date, {
      entryMode: 'quick',
      schemaVersion: 1,
      overall_activity: String(activity),
      overrideActivity: true,
      overall_symptom: { am: String(symptom), mid: String(symptom), pm: String(symptom) },
      overrideSymptom: true,
      crash,
      unrefreshing_sleep: sleep,
      physical: null, mental: null, emotional: null,
      fatigue: null, pain: null, nausea_gi: null, brain_fog: null, other_symptom: null,
    });
  }

  it('CSV includes entryMode column for quick log entries', () => {
    const days = [makeQuickDay('2024-01-15', 4, 6, false, true)];
    const csv = generateCSV(days);
    const row = csv.split('\n')[1].split(',');
    expect(row[27]).toBe('quick');
    expect(row[28]).toBe('Yes'); // overrideActivity
    expect(row[29]).toBe('Yes'); // overrideSymptom
  });

  it('CSV has empty cells for individual dimensions on quick log', () => {
    const days = [makeQuickDay('2024-01-15', 4, 6, false, true)];
    const csv = generateCSV(days);
    const row = csv.split('\n')[1].split(',');
    // Physical, Mental, Emotional (columns 1, 2, 3) should be empty
    expect(row[1]).toBe('');
    expect(row[2]).toBe('');
    expect(row[3]).toBe('');
  });

  it('text export marks quick log entries with [Q]', () => {
    const days = [makeQuickDay('2024-01-15', 4, 6, false, true)];
    const text = generateExportText(days, { causes: [], barriers: [], strategies: [] });
    expect(text).toContain('2024-01-15 [Q]');
  });

  it('computeCorrelations handles null individual dimensions', () => {
    const days = [
      ...Array.from({ length: 5 }, (_, i) => makeDay(
        `2024-01-${String(i + 1).padStart(2, '0')}`,
        { physical: String(i + 1), mental: String(i + 1), overall_activity: String(i + 1),
          fatigue: { am: String(i + 1), mid: String(i + 1), pm: String(i + 1) },
          overall_symptom: { am: String(i + 1), mid: String(i + 1), pm: String(i + 1) },
        }
      )),
      ...Array.from({ length: 5 }, (_, i) => makeQuickDay(
        `2024-01-${String(i + 6).padStart(2, '0')}`, i + 1, i + 1, false, false
      )),
    ];
    const result = computeCorrelations(days);
    expect(result).toHaveProperty('matrix');
    // Physical has only 5 valid values (from full days), should still compute
    const physIdx = result.labels.indexOf('Physical');
    const actIdx = result.labels.indexOf('Activity');
    expect(result.matrix[physIdx][actIdx]).not.toBeNull();
  });

  it('computeCrashRisk works with mixed quick and full entries', () => {
    const days = [
      ...Array.from({ length: 5 }, (_, i) => makeDay(
        `2024-01-${String(i + 1).padStart(2, '0')}`,
        { overall_activity: '3' }
      )),
      ...Array.from({ length: 5 }, (_, i) => makeQuickDay(
        `2024-01-${String(i + 6).padStart(2, '0')}`, 3, 3, false, false
      )),
    ];
    const result = computeCrashRisk(days);
    expect(result).not.toBeNull();
    expect(result.mean).toBe('3.0');
  });
});

// --- Quick Log only dataset (no Full entries) ---

describe('Quick Log only dataset', () => {
  function makeQuickDay(date, activity, symptom, crash, sleep) {
    return makeDay(date, {
      entryMode: 'quick',
      schemaVersion: 1,
      overall_activity: String(activity),
      overrideActivity: true,
      overall_symptom: { am: String(symptom), mid: String(symptom), pm: String(symptom) },
      overrideSymptom: true,
      crash,
      unrefreshing_sleep: sleep,
      physical: null, mental: null, emotional: null,
      fatigue: null, pain: null, nausea_gi: null, brain_fog: null, other_symptom: null,
    });
  }

  it('computeCorrelations works with 100% quick log entries', () => {
    const days = Array.from({ length: 10 }, (_, i) => makeQuickDay(
      `2024-01-${String(i + 1).padStart(2, '0')}`, i + 1, 10 - i, false, i % 2 === 0
    ));
    const result = computeCorrelations(days);
    expect(result).toHaveProperty('matrix');
    // Activity↔Symptom should still compute (both always present)
    const actIdx = result.labels.indexOf('Activity');
    const symIdx = result.labels.indexOf('Symptom');
    expect(result.matrix[actIdx][symIdx]).not.toBeNull();
    // Physical has no valid values — correlation should be null or NaN
    const physIdx = result.labels.indexOf('Physical');
    if (physIdx !== -1) {
      const val = result.matrix[physIdx][actIdx];
      expect(val === null || Number.isNaN(val)).toBe(true);
    }
  });

  it('computeCrashRisk works with 100% quick log entries', () => {
    const days = Array.from({ length: 10 }, (_, i) => makeQuickDay(
      `2024-01-${String(i + 1).padStart(2, '0')}`, 4, 5, false, false
    ));
    const result = computeCrashRisk(days);
    expect(result).not.toBeNull();
    expect(result.mean).toBe('4.0');
  });

  it('generateCSV with 100% quick log entries has all dimension cells empty', () => {
    const days = Array.from({ length: 3 }, (_, i) => makeQuickDay(
      `2024-01-${String(i + 1).padStart(2, '0')}`, 3, 5, false, true
    ));
    const csv = generateCSV(days);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(4); // header + 3 rows
    for (let r = 1; r < lines.length; r++) {
      const row = lines[r].split(',');
      // Physical, Mental, Emotional (columns 1, 2, 3) should be empty
      expect(row[1]).toBe('');
      expect(row[2]).toBe('');
      expect(row[3]).toBe('');
      // entryMode column should be 'quick'
      expect(row[27]).toBe('quick');
    }
  });
});

// --- emptyDay schema version ---

describe('emptyDay schema', () => {
  it('includes entryMode and schemaVersion', () => {
    const day = emptyDay('2024-01-15');
    expect(day.entryMode).toBe('full');
    expect(day.schemaVersion).toBe(1);
  });
});
