import { activityColor, symptomColor, avgField } from './utils.js';

const s = {
  card: { background: 'var(--card)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border)', marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: 600, color: 'var(--tx-m)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: 600, color: 'var(--tx-m)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '20px 0 10px' },
  btnP: { background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, minHeight: 44, cursor: 'pointer', fontFamily: 'var(--font)' },
  btnS: { background: 'var(--card)', color: 'var(--tx-m)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', fontSize: 14, minHeight: 44, cursor: 'pointer', fontFamily: 'var(--font)' },
  input: { width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--tx)', fontSize: 15, outline: 'none', minHeight: 44, boxSizing: 'border-box', fontFamily: 'var(--mono)' },
};

export function Card({ title, children, style: extra }) {
  return (
    <div style={{ ...s.card, ...extra }}>
      {title && <div style={s.cardTitle}>{title}</div>}
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return <div style={s.sectionLabel}>{children}</div>;
}

export function BtnP({ children, onClick, style: extra }) {
  return <button style={{ ...s.btnP, ...extra }} onClick={onClick}>{children}</button>;
}

export function BtnS({ children, onClick, style: extra }) {
  return <button style={{ ...s.btnS, ...extra }} onClick={onClick}>{children}</button>;
}

export function Input(props) {
  return <input style={{ ...s.input, ...props.style }} {...props} />;
}

export function CrashBadge() {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', background: 'var(--red-d)', padding: '3px 10px', borderRadius: 6 }}>
      CRASH
    </span>
  );
}

export function DaySummary({ day, compact }) {
  const avg = (f) => { const v = avgField(f); return v !== null ? v.toFixed(1) : '\u2014'; };
  const metrics = [
    { l: 'Activity', v: day.overall_activity || '\u2014', c: activityColor },
    { l: 'Fatigue', v: avg(day.fatigue), c: symptomColor },
    { l: 'Pain', v: avg(day.pain), c: symptomColor },
    { l: 'Brain Fog', v: avg(day.brain_fog), c: symptomColor },
    { l: 'Symptom', v: avg(day.overall_symptom), c: symptomColor },
  ];

  return (
    <div style={{ display: 'flex', gap: compact ? 6 : 8, flexWrap: 'wrap' }}>
      {metrics.map(m => (
        <div key={m.l} style={{ background: 'var(--bg)', borderRadius: 8, padding: compact ? '4px 8px' : '8px 12px', textAlign: 'center', minWidth: compact ? 52 : 58, flex: 1 }}>
          <div style={{ fontSize: compact ? 13 : 17, fontWeight: 700, fontFamily: 'var(--mono)', color: m.c(m.v) }}>{m.v}</div>
          <div style={{ fontSize: 9, color: 'var(--tx-d)', marginTop: 2 }}>{m.l}</div>
        </div>
      ))}
      {day.unrefreshing_sleep === true && (
        <div style={{ background: 'var(--pur-d)', borderRadius: 8, padding: compact ? '4px 8px' : '6px 10px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--pur)', fontWeight: 600 }}>Unrefreshing sleep</span>
        </div>
      )}
    </div>
  );
}

export function ScoreInput({ label, value, onChange, colorFn, highlight }) {
  return (
    <div style={{ background: highlight ? 'var(--acc-d)' : 'var(--bg)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${highlight ? 'rgba(96,165,250,0.2)' : 'var(--border)'}` }}>
      <div style={{ fontSize: 11, color: highlight ? 'var(--acc)' : 'var(--tx-m)', marginBottom: 6, fontWeight: highlight ? 600 : 400 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {[...Array(11)].map((_, i) => {
          const sel = String(i) === String(value);
          return (
            <button key={i} onClick={() => onChange(String(i))} style={{
              width: 30, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)',
              background: sel ? colorFn(i) : 'var(--card)',
              color: sel ? '#000' : 'var(--tx-d)',
              minHeight: 36, transition: 'all 0.15s',
            }}>{i}</button>
          );
        })}
      </div>
    </div>
  );
}

export function SymptomRow({ label, data, onChange, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(42,51,64,0.3)' }}>
      <div style={{ width: 85, fontSize: 13, color: highlight ? 'var(--acc)' : 'var(--tx-m)', fontWeight: highlight ? 600 : 500, flexShrink: 0 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flex: 1 }}>
        {['am', 'mid', 'pm'].map((p, idx) => (
          <div key={p} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--tx-d)', marginBottom: 4 }}>{['AM', 'Mid', 'PM'][idx]}</div>
            <input
              type="number" min="0" max="10" placeholder="\u2014"
              value={data[p]}
              onChange={(e) => onChange(p, e.target.value)}
              style={{ ...s.input, textAlign: 'center', padding: '8px 4px', fontSize: 14, fontWeight: 600, color: symptomColor(data[p]), minHeight: 40 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ data, color, height = 48 }) {
  if (!data || data.length < 2) return null;
  const w = 460;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 6) - 3}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function StatBox({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--card)', borderRadius: 12, padding: '14px 10px', border: '1px solid var(--border)', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--mono)', color }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--tx-m)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export { s };
