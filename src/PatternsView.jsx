import { avgField, activityColor, symptomColor } from './utils.js';
import { Card, Sparkline, StatBox } from './components.jsx';

export default function PatternsView({ data }) {
  const days = data.days;
  const last14 = days.slice(-14);
  const last30 = days.slice(-30);
  const crashDays = last30.filter(d => d.crash === true);
  const nonCrash = last30.filter(d => d.crash !== true && d.overall_activity);

  const av = (arr, fn) => {
    const vals = arr.map(fn).filter(v => v !== null && !isNaN(v));
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '\u2014';
  };

  const comps = [
    ['Overall Activity', d => d.overall_activity ? +d.overall_activity : null],
    ['Physical', d => d.physical ? +d.physical : null],
    ['Mental', d => d.mental ? +d.mental : null],
    ['Emotional', d => d.emotional ? +d.emotional : null],
    ['Fatigue', d => avgField(d.fatigue)],
    ['Pain', d => avgField(d.pain)],
    ['Brain Fog', d => avgField(d.brain_fog)],
    ['Overall Symptom', d => avgField(d.overall_symptom)],
  ];

  const preCrash = [];
  crashDays.forEach(cd => {
    for (let o = 1; o <= 5; o++) {
      const d = new Date(cd.date + 'T12:00:00');
      d.setDate(d.getDate() - o);
      const s = d.toISOString().split('T')[0];
      const found = days.find(x => x.date === s);
      if (found) preCrash.push({ day: found, off: o });
    }
  });

  const symTrend = last30.map(d => avgField(d.overall_symptom)).filter(v => v !== null);
  const actTrend = last30.map(d => d.overall_activity ? Number(d.overall_activity) : null).filter(v => v !== null);
  const badSleep = last14.filter(d => d.unrefreshing_sleep === true).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Pattern Analysis</div>

      {days.length < 3 && (
        <Card><div style={{ fontSize: 13, color: 'var(--tx-m)', padding: 8, textAlign: 'center' }}>
          Log at least 3 days to see patterns. The toolkit recommends tracking for several weeks.
        </div></Card>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
        <StatBox label="Crashes (30d)" value={crashDays.length} color={crashDays.length > 3 ? 'var(--red)' : crashDays.length > 1 ? 'var(--yel)' : 'var(--grn)'} />
        <StatBox label="Bad Sleep (14d)" value={badSleep} color={badSleep > 5 ? 'var(--red)' : badSleep > 2 ? 'var(--yel)' : 'var(--grn)'} />
        <StatBox label="Days Tracked" value={days.length} color="var(--acc)" />
      </div>

      {symTrend.length > 2 && (
        <Card title="Overall Symptom Trend"><Sparkline data={symTrend} color="var(--org)" /></Card>
      )}
      {actTrend.length > 2 && (
        <Card title="Overall Activity Trend"><Sparkline data={actTrend} color="var(--acc)" /></Card>
      )}

      {crashDays.length > 0 && nonCrash.length > 0 && (
        <Card title="Crash vs Non-Crash Days (Averages)">
          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--tx-d)', padding: '0 4px', marginBottom: 4 }}>
            <span style={{ flex: 1 }}>Metric</span>
            <span style={{ width: 55, textAlign: 'right', color: 'var(--red)' }}>Crash</span>
            <span style={{ width: 55, textAlign: 'right', color: 'var(--grn)' }}>OK</span>
          </div>
          {comps.map(([label, fn]) => (
            <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13, padding: '6px 4px', borderBottom: '1px solid rgba(42,51,64,0.2)', alignItems: 'center' }}>
              <span style={{ flex: 1, color: 'var(--tx-m)' }}>{label}</span>
              <span style={{ width: 55, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--red)', fontWeight: 600 }}>{av(crashDays, fn)}</span>
              <span style={{ width: 55, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--grn)', fontWeight: 600 }}>{av(nonCrash, fn)}</span>
            </div>
          ))}
        </Card>
      )}

      {preCrash.length > 0 && (
        <Card title="Days Before Crashes \u2014 Activity">
          <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 10 }}>
            Crashes can be delayed 1-5 days. This shows activity before each crash.
          </div>
          {[1, 2, 3, 4, 5].map(o => {
            const matching = preCrash.filter(p => p.off === o);
            if (!matching.length) return null;
            const a = av(matching.map(p => p.day), d => d.overall_activity ? +d.overall_activity : null);
            return (
              <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                <span style={{ width: 80, fontSize: 12, color: 'var(--tx-m)' }}>{o} day{o > 1 ? 's' : ''} before</span>
                <div style={{ flex: 1, height: 20, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(+a / 10) * 100}%`, background: activityColor(a), borderRadius: 5, opacity: 0.6 }} />
                </div>
                <span style={{ width: 35, textAlign: 'right', fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 600, color: activityColor(a) }}>{a}</span>
              </div>
            );
          })}
        </Card>
      )}

      {days.length >= 7 && (() => {
        const afterBad = [], afterGood = [];
        days.forEach((d, i) => {
          if (i + 1 < days.length) {
            const next = days[i + 1];
            const ns = avgField(next.overall_symptom);
            if (ns !== null) {
              if (d.unrefreshing_sleep === true) afterBad.push(ns);
              else if (d.unrefreshing_sleep === false) afterGood.push(ns);
            }
          }
        });
        if (afterBad.length === 0 && afterGood.length === 0) return null;
        const avgB = afterBad.length > 0 ? (afterBad.reduce((a, b) => a + b, 0) / afterBad.length).toFixed(1) : '\u2014';
        const avgG = afterGood.length > 0 ? (afterGood.reduce((a, b) => a + b, 0) / afterGood.length).toFixed(1) : '\u2014';

        return (
          <Card title="Unrefreshing Sleep & Next-Day Symptoms">
            <div style={{ display: 'flex', gap: 16 }}>
              {[[avgB, 'After unrefreshing sleep', afterBad.length, 'var(--red)'], [avgG, 'After refreshing sleep', afterGood.length, 'var(--grn)']].map(([val, lbl, cnt, col]) => (
                <div key={lbl} style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: col }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'var(--tx-d)', marginTop: 3 }}>{lbl}</div>
                  <div style={{ fontSize: 9, color: 'var(--tx-d)' }}>({cnt} days)</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
