import { useState, useRef } from 'react';
import { formatDate, activityColor, symptomColor, calcOverallActivity, calcOverallSymptom, hasGranularData } from './utils.js';
import { SectionLabel, ScoreInput, SymptomRow, AutoScoreInput, AutoSymptomRow, BtnP, BtnS, s } from './components.jsx';

function trapFocus(e, containerRef) {
  if (e.key !== 'Tab' || !containerRef.current) return;
  const focusable = containerRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}


function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 8 }}>
      {options.map(opt => (
        <button key={String(opt.v)} role="radio" aria-checked={value === opt.v} aria-label={opt.l}
          onClick={() => onChange(opt.v)} style={{
            flex: 1, borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600,
            minHeight: 44, cursor: 'pointer', border: '1px solid', fontFamily: 'var(--font)',
            background: value === opt.v ? opt.bg : 'var(--card)',
            color: value === opt.v ? opt.fg : 'var(--tx-m)',
            borderColor: value === opt.v ? opt.border : 'var(--border)',
          }}>{opt.l}</button>
      ))}
    </div>
  );
}

export default function DayEditor({ day, onSave, onCancel, onDelete }) {
  const modalRef = useRef(null);
  const [form, setForm] = useState(() => {
    const clone = JSON.parse(JSON.stringify(day));
    // Restore properties that JSON stringify removes (undefined → missing)
    if (!clone.other_symptom) clone.other_symptom = { name: '', am: '', mid: '', pm: '' };
    if (!clone.nausea_gi) clone.nausea_gi = { am: '', mid: '', pm: '' };
    // Defensive fallbacks (migration in db.js normally guarantees these exist)
    clone.overrideActivity = clone.overrideActivity ?? false;
    clone.overrideSymptom = clone.overrideSymptom ?? false;
    if (!clone.entryMode) clone.entryMode = 'full';
    return clone;
  });
  const [modeAnnounce, setModeAnnounce] = useState('');
  const [showComments, setShowComments] = useState(form.entryMode === 'quick' && form.comments !== '');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setN = (k, sub, v) => setForm(f => ({ ...f, [k]: { ...f[k], [sub]: v } }));

  const isQuick = form.entryMode === 'quick';

  const computedActivity = calcOverallActivity(form);
  const computedSymptomAm = calcOverallSymptom(form, 'am');
  const computedSymptomMid = calcOverallSymptom(form, 'mid');
  const computedSymptomPm = calcOverallSymptom(form, 'pm');

  const round1 = v => v !== null ? String(Math.round(v * 10) / 10) : '';

  const switchMode = (newMode) => {
    if (newMode === form.entryMode) return;
    if (newMode === 'quick' && hasGranularData(form)) {
      if (!window.confirm('Switching to Quick Log will hide detailed fields. Your existing data is preserved and will reappear if you switch back to Full Log.')) return;
    }
    setForm(f => ({ ...f, entryMode: newMode }));
    const label = newMode === 'quick' ? 'Switched to Quick Log mode' : 'Switched to Full Log mode';
    setModeAnnounce(label);
    setTimeout(() => setModeAnnounce(''), 2000);
  };

  const handleSave = () => {
    const out = { ...form };
    if (isQuick) {
      out.entryMode = 'quick';
      out.overrideActivity = true;
      out.overrideSymptom = true;
    } else {
      out.entryMode = 'full';
      if (!out.overrideActivity && computedActivity !== null) {
        out.overall_activity = round1(computedActivity);
      }
      if (!out.overrideSymptom) {
        out.overall_symptom = {
          am: round1(computedSymptomAm),
          mid: round1(computedSymptomMid),
          pm: round1(computedSymptomPm),
        };
      }
    }
    onSave(out);
  };

  return (
    <div ref={modalRef} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onCancel} onKeyDown={e => { if (e.key === 'Escape') onCancel(); trapFocus(e, modalRef); }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 520, maxHeight: '92dvh', overflowY: 'auto', padding: '22px 20px 36px', WebkitOverflowScrolling: 'touch' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{formatDate(form.date)}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnS onClick={onCancel}>Cancel</BtnS>
            <BtnP onClick={handleSave}>Save</BtnP>
          </div>
        </div>

        {/* Mode Selector */}
        <div role="radiogroup" aria-label="Entry mode" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { mode: 'quick', label: 'Quick Log' },
            { mode: 'full', label: 'Full Log' },
          ].map(opt => {
            const active = form.entryMode === opt.mode;
            const Btn = active ? BtnP : BtnS;
            return (
              <Btn key={opt.mode} role="radio" aria-checked={active}
                onClick={() => switchMode(opt.mode)}
                style={{ flex: 1, textAlign: 'center' }}>
                {opt.label}
              </Btn>
            );
          })}
        </div>

        {/* Screen reader announcement for mode switch */}
        <div role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
          {modeAnnounce}
        </div>

        {isQuick ? (
          /* ========== QUICK LOG MODE ========== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <SectionLabel>Overall Activity (0-10)</SectionLabel>
              <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 10 }}>0 = very low/negligible &middot; 10 = activity when fully healthy</div>
              <ScoreInput label="Overall Activity" value={form.overall_activity}
                onChange={v => setForm(f => ({ ...f, overall_activity: v, overrideActivity: true }))}
                colorFn={activityColor} highlight />
            </div>

            <div>
              <SectionLabel>Overall Symptoms (0-10)</SectionLabel>
              <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 10 }}>0 = no symptoms &middot; 10 = worst experienced &middot; Single end-of-day score</div>
              <ScoreInput label="Overall Symptoms" value={form.overall_symptom?.am || ''}
                onChange={v => setForm(f => ({ ...f, overrideSymptom: true, overall_symptom: { am: v, mid: '', pm: '' } }))}
                colorFn={symptomColor} highlight />
            </div>

            <div>
              <SectionLabel>Crash?</SectionLabel>
              <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 8 }}>A significant set-back in daily function</div>
              <ToggleGroup label="Crash today" options={[
                { v: true, l: 'Yes \u2014 Crash', bg: 'var(--red-d)', fg: 'var(--red)', border: 'rgba(248,113,113,0.3)' },
                { v: false, l: 'No', bg: 'var(--grn-d)', fg: 'var(--grn)', border: 'rgba(74,222,128,0.3)' },
              ]} value={form.crash} onChange={v => set('crash', v)} />
            </div>

            <div>
              <SectionLabel>Sleep</SectionLabel>
              <ToggleGroup label="Sleep quality" options={[
                { v: false, l: 'Refreshing', bg: 'var(--grn-d)', fg: 'var(--grn)', border: 'rgba(74,222,128,0.3)' },
                { v: true, l: 'Unrefreshing', bg: 'var(--pur-d)', fg: 'var(--pur)', border: 'rgba(192,132,252,0.3)' },
              ]} value={form.unrefreshing_sleep} onChange={v => set('unrefreshing_sleep', v)} />
            </div>

            <div>
              <button onClick={() => setShowComments(!showComments)}
                aria-expanded={showComments} aria-controls="quick-comments"
                style={{
                  background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
                  fontSize: 12, color: 'var(--tx-m)', fontFamily: 'var(--font)', fontWeight: 600,
                }}>
                {showComments ? '\u25BE' : '\u25B8'} Comments (optional)
              </button>
              {showComments && (
                <textarea id="quick-comments" value={form.comments} maxLength={500}
                  onChange={e => set('comments', e.target.value)}
                  rows={2} placeholder="A few words about the day\u2026"
                  aria-label="Comments (optional)"
                  style={{ ...s.input, resize: 'vertical', fontFamily: 'var(--font)', marginTop: 6 }} />
              )}
            </div>
          </div>
        ) : (
          /* ========== FULL LOG MODE ========== */
          <>
            <SectionLabel>Activity Levels (0-10)</SectionLabel>
            <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 10 }}>0 = very low/negligible &middot; 10 = activity when fully healthy</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <ScoreInput label="Physical" value={form.physical} onChange={v => set('physical', v)} colorFn={activityColor} />
              <ScoreInput label="Mental" value={form.mental} onChange={v => set('mental', v)} colorFn={activityColor} />
              <ScoreInput label="Emotional" value={form.emotional} onChange={v => set('emotional', v)} colorFn={activityColor} />
              <AutoScoreInput label="Overall Activity &#9733;" computedValue={computedActivity} value={form.overall_activity} isOverride={form.overrideActivity}
                onOverride={v => setForm(f => ({ ...f, overrideActivity: true, overall_activity: v }))}
                onReset={() => setForm(f => ({ ...f, overrideActivity: false, overall_activity: '' }))}
                colorFn={activityColor} />
            </div>

            <SectionLabel>Unrefreshing Sleep?</SectionLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(opt => (
                <button key={String(opt.v)} onClick={() => set('unrefreshing_sleep', opt.v)} style={{
                  borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, minHeight: 44, cursor: 'pointer',
                  border: '1px solid',
                  background: form.unrefreshing_sleep === opt.v ? (opt.v ? 'var(--red-d)' : 'var(--grn-d)') : 'var(--card)',
                  color: form.unrefreshing_sleep === opt.v ? (opt.v ? 'var(--red)' : 'var(--grn)') : 'var(--tx-m)',
                  borderColor: form.unrefreshing_sleep === opt.v ? (opt.v ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)') : 'var(--border)',
                  fontFamily: 'var(--font)',
                }}>{opt.l}</button>
              ))}
            </div>

            <SectionLabel>Symptoms (0-10, AM / Midday / PM)</SectionLabel>
            <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 10 }}>0 = no symptom &middot; 10 = worst experienced</div>
            <SymptomRow label="Fatigue" data={form.fatigue} onChange={(sub, v) => setN('fatigue', sub, v)} />
            <SymptomRow label="Pain" data={form.pain} onChange={(sub, v) => setN('pain', sub, v)} />
            <SymptomRow label="Nausea / GI" data={form.nausea_gi} onChange={(sub, v) => setN('nausea_gi', sub, v)} />
            <SymptomRow label="Brain Fog" data={form.brain_fog} onChange={(sub, v) => setN('brain_fog', sub, v)} />

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--tx-m)', marginBottom: 4 }}>Other symptom name:</div>
              <input value={form.other_symptom.name} onChange={e => setN('other_symptom', 'name', e.target.value)}
                placeholder="e.g. dizziness, anxiety&hellip;" style={{ ...s.input, fontSize: 13 }} />
            </div>
            {form.other_symptom.name && (
              <SymptomRow label={form.other_symptom.name} data={form.other_symptom} onChange={(sub, v) => setN('other_symptom', sub, v)} />
            )}

            <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--acc-d)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
              <AutoSymptomRow label="Overall Symptom &#9733;" computedData={{ am: computedSymptomAm, mid: computedSymptomMid, pm: computedSymptomPm }}
                data={form.overall_symptom} isOverride={form.overrideSymptom}
                onOverride={(sub, v) => setForm(f => ({ ...f, overrideSymptom: true, overall_symptom: { ...f.overall_symptom, [sub]: v } }))}
                onReset={() => setForm(f => ({ ...f, overrideSymptom: false, overall_symptom: { am: '', mid: '', pm: '' } }))} />
            </div>

            <SectionLabel>Crash?</SectionLabel>
            <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 8 }}>A significant set-back in daily function</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: true, l: 'Yes \u2014 Crash' }, { v: false, l: 'No' }].map(opt => (
                <button key={String(opt.v)} onClick={() => set('crash', opt.v)} style={{
                  borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, minHeight: 44, cursor: 'pointer',
                  border: '1px solid', fontFamily: 'var(--font)',
                  background: form.crash === opt.v ? (opt.v ? 'var(--red-d)' : 'var(--grn-d)') : 'var(--card)',
                  color: form.crash === opt.v ? (opt.v ? 'var(--red)' : 'var(--grn)') : 'var(--tx-m)',
                  borderColor: form.crash === opt.v ? (opt.v ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)') : 'var(--border)',
                }}>{opt.l}</button>
              ))}
            </div>

            <SectionLabel>Comments</SectionLabel>
            <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 6 }}>Brief reminder, e.g. &quot;Shopping for 3 hours&quot;</div>
            <textarea value={form.comments} maxLength={500} onChange={e => set('comments', e.target.value)}
              rows={3} placeholder="A few words about the day&hellip;"
              aria-label="Comments about the day"
              style={{ ...s.input, resize: 'vertical', fontFamily: 'var(--font)' }} />
          </>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <BtnS onClick={onCancel}>Cancel</BtnS>
          <BtnP onClick={handleSave}>Save</BtnP>
        </div>

        {onDelete && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button onClick={() => {
              if (window.confirm('Delete this day entry? This cannot be undone.')) onDelete(form.date);
            }} aria-label="Delete this day entry" style={{
              width: '100%', background: 'var(--red-d)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', minHeight: 44,
            }}>Delete This Entry</button>
          </div>
        )}
      </div>
    </div>
  );
}
