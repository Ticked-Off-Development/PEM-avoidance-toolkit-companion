import { describe, it, expect } from 'vitest';
import {
  getDateStr,
  formatDate,
  getWeekStart,
  activityColor,
  symptomColor,
  avgField,
  emptyDay,
  generateExportText,
  calcOverallActivity,
  calcOverallSymptom,
} from '../../src/utils.js';

describe('getDateStr', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const result = getDateStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    expect(result).toBe(today);
  });

  it('returns yesterday when offset is -1', () => {
    const result = getDateStr(-1);
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const expected = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    expect(result).toBe(expected);
  });

  it('returns tomorrow when offset is 1', () => {
    const result = getDateStr(1);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const expected = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    expect(result).toBe(expected);
  });
});

describe('formatDate', () => {
  it('formats a date string to a readable format', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('handles month boundaries', () => {
    const result = formatDate('2024-02-01');
    expect(result).toContain('Feb');
    expect(result).toContain('1');
  });
});

describe('getWeekStart', () => {
  it('returns Monday for a Wednesday date', () => {
    // 2024-01-17 is a Wednesday
    const result = getWeekStart('2024-01-17');
    expect(result).toBe('2024-01-15');
  });

  it('returns the previous Monday for a Sunday', () => {
    // 2024-01-21 is a Sunday
    const result = getWeekStart('2024-01-21');
    expect(result).toBe('2024-01-15');
  });

  it('returns the same date for a Monday', () => {
    // 2024-01-15 is a Monday
    const result = getWeekStart('2024-01-15');
    expect(result).toBe('2024-01-15');
  });
});

describe('activityColor', () => {
  it('returns green for values 0-3', () => {
    expect(activityColor(0)).toBe('var(--grn)');
    expect(activityColor(3)).toBe('var(--grn)');
  });

  it('returns yellow for values 4-5', () => {
    expect(activityColor(4)).toBe('var(--yel)');
    expect(activityColor(5)).toBe('var(--yel)');
  });

  it('returns orange for values 6-7', () => {
    expect(activityColor(6)).toBe('var(--org)');
    expect(activityColor(7)).toBe('var(--org)');
  });

  it('returns red for values 8-10', () => {
    expect(activityColor(8)).toBe('var(--red)');
    expect(activityColor(10)).toBe('var(--red)');
  });

  it('returns dim color for null/undefined', () => {
    expect(activityColor(null)).toBe('var(--tx-d)');
    expect(activityColor(undefined)).toBe('var(--tx-d)');
  });
});

describe('symptomColor', () => {
  it('returns green for values 0-2', () => {
    expect(symptomColor(0)).toBe('var(--grn)');
    expect(symptomColor(2)).toBe('var(--grn)');
  });

  it('returns yellow for values 3-4', () => {
    expect(symptomColor(3)).toBe('var(--yel)');
    expect(symptomColor(4)).toBe('var(--yel)');
  });

  it('returns orange for values 5-6', () => {
    expect(symptomColor(5)).toBe('var(--org)');
    expect(symptomColor(6)).toBe('var(--org)');
  });

  it('returns red for values 7-10', () => {
    expect(symptomColor(7)).toBe('var(--red)');
    expect(symptomColor(10)).toBe('var(--red)');
  });

  it('returns dim color for null/undefined', () => {
    expect(symptomColor(null)).toBe('var(--tx-d)');
    expect(symptomColor(undefined)).toBe('var(--tx-d)');
  });
});

describe('avgField', () => {
  it('computes average of am, mid, pm values', () => {
    expect(avgField({ am: '2', mid: '4', pm: '6' })).toBe(4);
  });

  it('ignores empty string values', () => {
    expect(avgField({ am: '3', mid: '', pm: '5' })).toBe(4);
  });

  it('returns null when all values are empty', () => {
    expect(avgField({ am: '', mid: '', pm: '' })).toBeNull();
  });

  it('returns null when input is null', () => {
    expect(avgField(null)).toBeNull();
  });

  it('returns null when input is undefined', () => {
    expect(avgField(undefined)).toBeNull();
  });
});

describe('emptyDay', () => {
  it('creates a day with the correct date', () => {
    const day = emptyDay('2024-01-15');
    expect(day.date).toBe('2024-01-15');
  });

  it('has the correct id format', () => {
    const day = emptyDay('2024-01-15');
    expect(day.id).toBe('day-2024-01-15');
  });

  it('has empty activity fields', () => {
    const day = emptyDay('2024-01-15');
    expect(day.physical).toBe('');
    expect(day.mental).toBe('');
    expect(day.emotional).toBe('');
    expect(day.overall_activity).toBe('');
  });

  it('has nested symptom objects with am/mid/pm keys', () => {
    const day = emptyDay('2024-01-15');
    for (const field of ['fatigue', 'pain', 'nausea_gi', 'brain_fog', 'overall_symptom']) {
      expect(day[field]).toHaveProperty('am', '');
      expect(day[field]).toHaveProperty('mid', '');
      expect(day[field]).toHaveProperty('pm', '');
    }
  });

  it('has null crash and unrefreshing_sleep', () => {
    const day = emptyDay('2024-01-15');
    expect(day.crash).toBeNull();
    expect(day.unrefreshing_sleep).toBeNull();
  });

  it('has false override flags', () => {
    const day = emptyDay('2024-01-15');
    expect(day.overrideActivity).toBe(false);
    expect(day.overrideSymptom).toBe(false);
  });
});

describe('generateExportText', () => {
  it('includes the header title', () => {
    const text = generateExportText([], { causes: [], barriers: [], strategies: [] });
    expect(text).toContain('PEM AVOIDANCE TOOLKIT - TRACKING DATA');
  });

  it('includes tracking data header', () => {
    const text = generateExportText([], { causes: [], barriers: [], strategies: [] });
    expect(text).toContain('=== TRACKING DATA ===');
  });

  it('includes day data rows', () => {
    const days = [{
      date: '2024-01-15',
      overall_activity: 5,
      overall_symptom: { am: '3', mid: '4', pm: '5' },
      unrefreshing_sleep: true,
      crash: true,
      comments: 'Bad day',
    }];
    const text = generateExportText(days, { causes: [], barriers: [], strategies: [] });
    expect(text).toContain('2024-01-15');
    expect(text).toContain('Bad day');
  });

  it('includes plan sections when present', () => {
    const plan = {
      causes: ['Overdoing it'],
      barriers: ['Work pressure'],
      strategies: ['Pacing'],
    };
    const text = generateExportText([], plan);
    expect(text).toContain('=== MY CRASH AVOIDANCE PLAN ===');
    expect(text).toContain('CAUSES:');
    expect(text).toContain('Overdoing it');
    expect(text).toContain('BARRIERS:');
    expect(text).toContain('Work pressure');
    expect(text).toContain('STRATEGIES:');
    expect(text).toContain('Pacing');
  });

  it('omits plan section when plan is empty', () => {
    const text = generateExportText([], { causes: [], barriers: [], strategies: [] });
    expect(text).not.toContain('=== MY CRASH AVOIDANCE PLAN ===');
  });
});

describe('calcOverallActivity', () => {
  it('returns the average of physical, mental, emotional', () => {
    expect(calcOverallActivity({ physical: '2', mental: '4', emotional: '6' })).toBe(4);
  });

  it('ignores empty string values', () => {
    expect(calcOverallActivity({ physical: '3', mental: '', emotional: '5' })).toBe(4);
  });

  it('returns null when all values are empty', () => {
    expect(calcOverallActivity({ physical: '', mental: '', emotional: '' })).toBeNull();
  });

  it('handles string number values', () => {
    expect(calcOverallActivity({ physical: '10', mental: '0', emotional: '5' })).toBe(5);
  });

  it('returns the value when only one field is filled', () => {
    expect(calcOverallActivity({ physical: '7', mental: '', emotional: '' })).toBe(7);
  });

  it('ignores null and undefined values', () => {
    expect(calcOverallActivity({ physical: null, mental: undefined, emotional: '6' })).toBe(6);
  });
});

describe('calcOverallSymptom', () => {
  const baseForm = {
    fatigue: { am: '2', mid: '4', pm: '6' },
    pain: { am: '4', mid: '6', pm: '8' },
    nausea_gi: { am: '1', mid: '3', pm: '5' },
    brain_fog: { am: '3', mid: '5', pm: '7' },
    other_symptom: { name: '', am: '', mid: '', pm: '' },
  };

  it('averages symptom fields for am period', () => {
    expect(calcOverallSymptom(baseForm, 'am')).toBe(2.5);
  });

  it('averages symptom fields for mid period', () => {
    expect(calcOverallSymptom(baseForm, 'mid')).toBe(4.5);
  });

  it('averages symptom fields for pm period', () => {
    expect(calcOverallSymptom(baseForm, 'pm')).toBe(6.5);
  });

  it('includes other_symptom when name is non-empty', () => {
    const form = {
      ...baseForm,
      other_symptom: { name: 'dizziness', am: '10', mid: '10', pm: '10' },
    };
    expect(calcOverallSymptom(form, 'am')).toBe(4);
  });

  it('excludes other_symptom when name is empty', () => {
    const form = {
      ...baseForm,
      other_symptom: { name: '', am: '10', mid: '10', pm: '10' },
    };
    expect(calcOverallSymptom(form, 'am')).toBe(2.5);
  });

  it('ignores empty string values', () => {
    const form = {
      fatigue: { am: '4', mid: '', pm: '' },
      pain: { am: '', mid: '', pm: '' },
      nausea_gi: { am: '6', mid: '', pm: '' },
      brain_fog: { am: '', mid: '', pm: '' },
      other_symptom: { name: '', am: '', mid: '', pm: '' },
    };
    expect(calcOverallSymptom(form, 'am')).toBe(5);
  });

  it('returns null when all values for a period are empty', () => {
    const form = {
      fatigue: { am: '', mid: '', pm: '' },
      pain: { am: '', mid: '', pm: '' },
      nausea_gi: { am: '', mid: '', pm: '' },
      brain_fog: { am: '', mid: '', pm: '' },
      other_symptom: { name: '', am: '', mid: '', pm: '' },
    };
    expect(calcOverallSymptom(form, 'am')).toBeNull();
  });
});
