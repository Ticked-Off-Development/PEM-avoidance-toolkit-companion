export function getDateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export function formatDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}

export function getWeekStart(s) {
  const d = new Date(s + 'T12:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split('T')[0];
}

export function activityColor(v) {
  const n = Number(v);
  if (!v && v !== 0) return 'var(--tx-d)';
  if (n <= 3) return 'var(--grn)';
  if (n <= 5) return 'var(--yel)';
  if (n <= 7) return 'var(--org)';
  return 'var(--red)';
}

export function symptomColor(v) {
  const n = Number(v);
  if (!v && v !== 0) return 'var(--tx-d)';
  if (n <= 2) return 'var(--grn)';
  if (n <= 4) return 'var(--yel)';
  if (n <= 6) return 'var(--org)';
  return 'var(--red)';
}

export function avgField(f) {
  if (!f) return null;
  const vals = [f.am, f.mid, f.pm]
    .filter(x => x !== '' && x !== undefined)
    .map(Number)
    .filter(x => !isNaN(x));
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

export function emptyDay(date) {
  return {
    id: `day-${date}`,
    date,
    physical: '', mental: '', emotional: '', overall_activity: '',
    unrefreshing_sleep: null,
    fatigue: { am: '', mid: '', pm: '' },
    pain: { am: '', mid: '', pm: '' },
    nausea_gi: { am: '', mid: '', pm: '' },
    brain_fog: { am: '', mid: '', pm: '' },
    other_symptom: { name: '', am: '', mid: '', pm: '' },
    overall_symptom: { am: '', mid: '', pm: '' },
    crash: null,
    comments: '',
  };
}

export function generateExportText(days, plan) {
  const lines = [
    'PEM AVOIDANCE TOOLKIT - TRACKING DATA',
    'Based on Open Medicine Foundation framework',
    'Generated: ' + new Date().toLocaleDateString(),
    '', '',
  ];

  if (plan.causes.length || plan.barriers.length || plan.strategies.length) {
    lines.push('=== MY CRASH AVOIDANCE PLAN ===', '');
    if (plan.causes.length) {
      lines.push('CAUSES:');
      plan.causes.forEach(c => lines.push('  - ' + c));
      lines.push('');
    }
    if (plan.barriers.length) {
      lines.push('BARRIERS:');
      plan.barriers.forEach(b => lines.push('  - ' + b));
      lines.push('');
    }
    if (plan.strategies.length) {
      lines.push('STRATEGIES:');
      plan.strategies.forEach(s => lines.push('  - ' + s));
      lines.push('');
    }
  }

  lines.push('=== TRACKING DATA ===', '');
  lines.push('Date       | Activity | Symptom | Sleep     | Crash | Comments');
  lines.push('-'.repeat(75));
  days.forEach(d => {
    const sym = avgField(d.overall_symptom);
    const symStr = sym !== null ? sym.toFixed(1).padEnd(7) : '  -    ';
    const slp = d.unrefreshing_sleep === true ? 'Unrefresh' : d.unrefreshing_sleep === false ? 'OK       ' : '  -      ';
    const crash = d.crash ? 'YES  ' : '  -  ';
    const act = d.overall_activity ? String(d.overall_activity).padEnd(8) : '  -     ';
    lines.push(`${d.date} | ${act} | ${symStr} | ${slp} | ${crash} | ${d.comments || ''}`);
  });

  return lines.join('\n');
}
