import { useState } from 'react';
import { activityColor, symptomColor } from './utils.js';
import { ScoreInput, SectionLabel, BtnP, s } from './components.jsx';

export default function QuickLogEditor({ form, onSave, onCancel: _onCancel }) {
  const [activity, setActivity] = useState(() => form.overall_activity ?? '');
  const [symptom, setSymptom] = useState(() => {
    const os = form.overall_symptom;
    if (form.entryMode === 'quick' && os && os.am !== '') return os.am;
    return '';
  });
  const [crash, setCrash] = useState(() => form.crash ?? null);
  const [sleep, setSleep] = useState(() => form.unrefreshing_sleep ?? null);
  const [showNote, setShowNote] = useState(() => !!(form.comments));
  const [comments, setComments] = useState(() => form.comments || '');

  const handleSave = () => {
    const out = {
      ...form,
      entryMode: 'quick',
      schemaVersion: 1,
      overall_activity: activity,
      overrideActivity: true,
      // Quick Log stores the single symptom score in all 3 period slots so
      // avgField() returns the correct value without special-casing. See SCHEMA.md.
      overall_symptom: { am: symptom, mid: symptom, pm: symptom },
      overrideSymptom: true,
      crash,
      unrefreshing_sleep: sleep,
      comments,
      // Quick Log doesn't capture per-dimension data. Set to null (not '') to
      // distinguish "not collected" from "collected but empty". applyDefaults()
      // normalizes these to {am:'',mid:'',pm:''} on next load for safe iteration.
      physical: null,
      mental: null,
      emotional: null,
      fatigue: null,
      pain: null,
      nausea_gi: null,
      brain_fog: null,
      other_symptom: null,
    };
    onSave(out);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Overall Activity (0-10)</SectionLabel>
      <div style={{ fontSize: 11, color: 'var(--tx-d)', marginTop: -10, marginBottom: 2 }}>0 = very low/negligible &middot; 10 = activity when fully healthy</div>
      <ScoreInput label="Overall Activity" value={activity} onChange={setActivity} colorFn={activityColor} />

      <SectionLabel>Overall Symptoms (0-10)</SectionLabel>
      <div style={{ fontSize: 11, color: 'var(--tx-d)', marginTop: -10, marginBottom: 2 }}>0 = no symptoms &middot; 10 = worst experienced</div>
      <ScoreInput label="Overall Symptoms" value={symptom} onChange={setSymptom} colorFn={symptomColor} />

      <SectionLabel>Crash?</SectionLabel>
      <div style={{ fontSize: 11, color: 'var(--tx-d)', marginBottom: 2, marginTop: -10 }}>A significant set-back in daily function</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[{ v: true, l: 'Yes \u2014 Crash' }, { v: false, l: 'No' }].map(opt => (
          <button key={String(opt.v)} onClick={() => setCrash(opt.v)} aria-label={opt.l} aria-pressed={crash === opt.v} style={{
            flex: 1, borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, minHeight: 44, cursor: 'pointer',
            border: '1px solid', fontFamily: 'var(--font)',
            background: crash === opt.v ? (opt.v ? 'var(--red-d)' : 'var(--grn-d)') : 'var(--card)',
            color: crash === opt.v ? (opt.v ? 'var(--red)' : 'var(--grn)') : 'var(--tx-m)',
            borderColor: crash === opt.v ? (opt.v ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)') : 'var(--border)',
          }}>{opt.l}</button>
        ))}
      </div>

      <SectionLabel>Sleep</SectionLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        {[{ v: false, l: 'Refreshing', color: 'grn' }, { v: true, l: 'Unrefreshing', color: 'yel' }].map(opt => (
          <button key={String(opt.v)} onClick={() => setSleep(opt.v)} aria-label={opt.l} aria-pressed={sleep === opt.v} style={{
            flex: 1, borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, minHeight: 44, cursor: 'pointer',
            border: '1px solid', fontFamily: 'var(--font)',
            background: sleep === opt.v ? `var(--${opt.color}-d)` : 'var(--card)',
            color: sleep === opt.v ? `var(--${opt.color})` : 'var(--tx-m)',
            borderColor: sleep === opt.v ? (opt.v ? 'rgba(250,204,21,0.3)' : 'rgba(74,222,128,0.3)') : 'var(--border)',
          }}>{opt.l}</button>
        ))}
      </div>

      {!showNote ? (
        <button onClick={() => setShowNote(true)} aria-label="Add a note" style={{
          background: 'none', border: '1px dashed var(--border)', borderRadius: 8,
          padding: '10px 14px', fontSize: 13, color: 'var(--tx-d)', cursor: 'pointer',
          fontFamily: 'var(--font)', minHeight: 44, textAlign: 'left',
        }}>+ Add note</button>
      ) : (
        <>
          <SectionLabel>Note</SectionLabel>
          <textarea value={comments} maxLength={500} onChange={e => setComments(e.target.value)}
            rows={2} placeholder="A few words about the day\u2026"
            aria-label="Comments about the day"
            style={{ ...s.input, resize: 'vertical', fontFamily: 'var(--font)' }} />
        </>
      )}

      <BtnP onClick={handleSave} style={{ width: '100%', marginTop: 4, padding: '14px 20px', fontSize: 15 }}>Save</BtnP>
    </div>
  );
}
