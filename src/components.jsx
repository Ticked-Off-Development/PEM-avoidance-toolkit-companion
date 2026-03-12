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
    <section style={{ ...s.card, ...extra }}>
      {title && <div style={s.cardTitle}>{title}</div>}
      {children}
    </section>
  );
}

export function SectionLabel({ children }) {
  return <div style={s.sectionLabel}>{children}</div>;
}

export function BtnP({ children, onClick, style: extra, ...rest }) {
  return <button style={{ ...s.btnP, ...extra }} onClick={onClick} {...rest}>{children}</button>;
}

export function BtnS({ children, onClick, style: extra, ...rest }) {
  return <button style={{ ...s.btnS, ...extra }} onClick={onClick} {...rest}>{children}</button>;
}

export function Input(props) {
  return <input style={{ ...s.input, ...props.style }} {...props} />;
}

export function CrashBadge() {
  return (
    <span role="status" style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', background: 'var(--red-d)', padding: '3px 10px', borderRadius: 6 }}>
      CRASH
    </span>
  );
}

export function DaySummary({ day, compact }) {
  const avg = (f) => { const v = avgField(f); return v !== null ? v.toFixed(1) : '—'; };
  const metrics = [
    { l: 'Activity', v: day.overall_activity != null && day.overall_activity !== '' ? day.overall_activity : '—', c: activityColor },
    { l: 'Fatigue', v: avg(day.fatigue), c: symptomColor },
    { l: 'Pain', v: avg(day.pain), c: symptomColor },
    { l: 'Brain Fog', v: avg(day.brain_fog), c: symptomColor },
    { l: 'Symptom', v: avg(day.overall_symptom), c: symptomColor },
  ];

  return (
    <div style={{ display: 'flex', gap: compact ? 6 : 8, flexWrap: 'wrap' }} role="group" aria-label="Day metrics">
      {metrics.map(m => (
        <div key={m.l} style={{ background: 'var(--bg)', borderRadius: 8, padding: compact ? '4px 8px' : '8px 12px', textAlign: 'center', minWidth: compact ? 52 : 58, flex: 1 }} aria-label={`${m.l}: ${m.v}`}>
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
    <div role="group" aria-label={`${label} score`} style={{ background: highlight ? 'var(--acc-d)' : 'var(--bg)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${highlight ? 'rgba(96,165,250,0.2)' : 'var(--border)'}` }}>
      <div style={{ fontSize: 11, color: highlight ? 'var(--acc)' : 'var(--tx-m)', marginBottom: 6, fontWeight: highlight ? 600 : 400 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} role="radiogroup" aria-label={`${label} score selector`}>
        {[...Array(11)].map((_, i) => {
          const sel = String(i) === String(value);
          return (
            <button key={i} onClick={() => onChange(String(i))} role="radio" aria-checked={sel} aria-label={`${i}`} style={{
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(42,51,64,0.3)' }} role="group" aria-label={`${label} symptom scores`}>
      <div style={{ width: 85, fontSize: 13, color: highlight ? 'var(--acc)' : 'var(--tx-m)', fontWeight: highlight ? 600 : 500, flexShrink: 0 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flex: 1 }}>
        {['am', 'mid', 'pm'].map((p, idx) => (
          <div key={p} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--tx-d)', marginBottom: 4 }}>{['AM', 'Mid', 'PM'][idx]}</div>
            <input
              type="number" min="0" max="10" placeholder="—"
              value={data[p]}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') { onChange(p, val); return; }
                const n = Number(val);
                if (!isNaN(n) && n >= 0 && n <= 10) onChange(p, val);
              }}
              aria-label={`${label} ${['AM', 'Midday', 'PM'][idx]} score`}
              style={{ ...s.input, textAlign: 'center', padding: '8px 4px', fontSize: 14, fontWeight: 600, color: symptomColor(data[p]), minHeight: 40 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCalc(v) {
  return v !== null ? (Math.round(v * 10) / 10).toFixed(1) : null;
}

function ResetLink({ onClick }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} aria-label="Reset to calculated average" style={{
      background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--org)',
      cursor: 'pointer', fontFamily: 'var(--font)', textDecoration: 'underline', fontWeight: 600,
    }}>reset</button>
  );
}

export function AutoScoreInput({ label, computedValue, value, isOverride, onOverride, onReset, colorFn }) {
  const display = formatCalc(computedValue);

  if (isOverride) {
    return (
      <div role="group" aria-label={`${label} score`} style={{ background: 'var(--acc-d)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(96,165,250,0.2)' }}>
        <div style={{ fontSize: 11, color: 'var(--acc)', marginBottom: 6, fontWeight: 600 }}>
          <span>{label} <span style={{ color: 'var(--org)' }}>*</span></span>{' '}<ResetLink onClick={onReset} />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} role="radiogroup" aria-label={`${label} score selector`}>
          {[...Array(11)].map((_, i) => {
            const sel = String(i) === String(value);
            return (
              <button key={i} onClick={() => onOverride(String(i))} role="radio" aria-checked={sel} aria-label={`${i}`} style={{
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

  return (
    <div role="group" aria-label={`${label} score (auto-calculated)`} onClick={() => { if (display !== null) onOverride(String(Math.round(computedValue))); }}
      style={{ background: 'var(--acc-d)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(96,165,250,0.2)', cursor: display !== null ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 11, color: 'var(--acc)', marginBottom: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        {label} <span style={{ fontSize: 9, color: 'var(--tx-d)', fontWeight: 400 }}>avg</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 36, borderRadius: 6, background: 'rgba(96,165,250,0.08)' }}>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: display !== null ? colorFn(display) : 'var(--tx-d)' }}>
          {display !== null ? display : '—'}
        </span>
      </div>
      {display !== null && <div style={{ fontSize: 13, color: 'var(--tx-d)', marginTop: 4, textAlign: 'center', cursor: 'pointer', padding: '2px 0' }}>tap to override</div>}
    </div>
  );
}

export function AutoSymptomRow({ label, computedData, data, isOverride, onOverride, onReset }) {
  if (isOverride) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(42,51,64,0.3)' }} role="group" aria-label={`${label} symptom scores`}>
        <div style={{ width: 85, fontSize: 13, color: 'var(--acc)', fontWeight: 600, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span>{label}</span>
          <span><span style={{ color: 'var(--org)' }}>*</span> <ResetLink onClick={onReset} /></span>
        </div>
        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
          {['am', 'mid', 'pm'].map((p, idx) => {
            const raw = data[p];
            const safeVal = (raw === '' || raw == null || (!isNaN(Number(raw)) && String(raw).trim() !== '')) ? (raw ?? '') : '';
            return (
            <div key={p} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--tx-d)', marginBottom: 4 }}>{['AM', 'Mid', 'PM'][idx]}</div>
              <input
                type="number" min="0" max="10" placeholder="—"
                value={safeVal}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') { onOverride(p, val); return; }
                  const n = Number(val);
                  if (!isNaN(n) && n >= 0 && n <= 10) onOverride(p, val);
                }}
                aria-label={`${label} ${['AM', 'Midday', 'PM'][idx]} score`}
                style={{ ...s.input, textAlign: 'center', padding: '8px 4px', fontSize: 14, fontWeight: 600, color: symptomColor(data[p]), minHeight: 40 }}
              />
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  const hasAnyComputed = computedData.am !== null || computedData.mid !== null || computedData.pm !== null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(42,51,64,0.3)', cursor: hasAnyComputed ? 'pointer' : 'default' }}
      role="group" aria-label={`${label} symptom scores (auto-calculated)`}
      onClick={() => {
        if (hasAnyComputed) {
          const initAm = formatCalc(computedData.am) || '';
          const initMid = formatCalc(computedData.mid) || '';
          const initPm = formatCalc(computedData.pm) || '';
          onOverride('am', initAm);
          onOverride('mid', initMid);
          onOverride('pm', initPm);
        }
      }}>
      <div style={{ width: 85, fontSize: 13, color: 'var(--acc)', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        {label} <span style={{ fontSize: 9, color: 'var(--tx-d)', fontWeight: 400 }}>avg</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flex: 1, flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['am', 'mid', 'pm'].map((p, idx) => {
            const display = formatCalc(computedData[p]);
            return (
              <div key={p} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--tx-d)', marginBottom: 4 }}>{['AM', 'Mid', 'PM'][idx]}</div>
                <div style={{
                  ...s.input, textAlign: 'center', padding: '8px 4px', fontSize: 14, fontWeight: 600, minHeight: 40,
                  color: display !== null ? symptomColor(display) : 'var(--tx-d)',
                  background: 'rgba(96,165,250,0.08)', borderStyle: 'dashed',
                }}>
                  {display !== null ? display : '—'}
                </div>
              </div>
            );
          })}
        </div>
        {hasAnyComputed && <div style={{ fontSize: 13, color: 'var(--tx-d)', textAlign: 'center', cursor: 'pointer', padding: '2px 0' }}>tap to override</div>}
      </div>
    </div>
  );
}

export function Sparkline({ data, color, height = 48 }) {
  if (!data || data.length < 2) return null;
  const clean = data.filter(v => !isNaN(v));
  if (clean.length < 2) return null;
  const w = 460;
  const min = Math.min(...clean), max = Math.max(...clean), range = max - min || 1;
  const points = clean.map((v, i) => `${(i / (clean.length - 1)) * w},${height - ((v - min) / range) * (height - 6) - 3}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }} role="img" aria-label="Trend chart">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function StatBox({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--card)', borderRadius: 12, padding: '14px 10px', border: '1px solid var(--border)', textAlign: 'center' }} aria-label={`${label}: ${value}`}>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--mono)', color }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--tx-m)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export { s };
