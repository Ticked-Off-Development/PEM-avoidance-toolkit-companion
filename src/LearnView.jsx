import { useState } from 'react';
import { Card } from './components.jsx';

const PEM_DETAIL_CONTENT = [
  { type: 'p', text: 'Post-Exertional Malaise is characterized by a delayed onset (typically 12\u201372 hours after exertion) of symptom worsening, with recovery time disproportionate to the activity that triggered it. Unlike normal tiredness, PEM can be triggered by minimal physical, cognitive, or emotional effort.' },
  { type: 'heading', text: 'How PEM differs from similar conditions' },
  { type: 'dt', term: 'Dysautonomia', text: 'Autonomic symptoms (heart rate, blood pressure, temperature regulation) occur during or immediately after exertion, not with a delayed onset. PEM involves systemic symptom worsening that appears hours to days later.' },
  { type: 'dt', term: 'Mast Cell Activation Syndrome (MCAS)', text: 'Flares are triggered by specific exposures (foods, chemicals, temperature changes), not by exertion level. Symptoms include histamine-mediated reactions (flushing, hives, GI distress) rather than the systemic post-exertional pattern of PEM.' },
  { type: 'dt', term: 'Fibromyalgia', text: 'Activity can worsen pain, but this typically occurs during or shortly after the activity without the characteristic delayed onset of PEM. Fibromyalgia pain is primarily musculoskeletal rather than systemic.' },
  { type: 'dt', term: 'Delayed Onset Muscle Soreness (DOMS)', text: 'Predictable muscular soreness 24\u201372 hours after unaccustomed exercise. DOMS is localized to exercised muscles and resolves within days. PEM is systemic, can be triggered by cognitive or emotional effort, and recovery is disproportionately prolonged.' },
  { type: 'heading', text: 'Why this matters for tracking' },
  { type: 'p', text: 'This app\u2019s crash logging and pre-crash lookback features are designed to capture the delayed nature of PEM. By tracking activity levels alongside symptoms over time, you can identify the exertion patterns that precede your crashes \u2014 even when the delay makes the connection hard to see.' },
];

const QUICK_VS_FULL_CONTENT = [
  { type: 'p', text: 'This app offers two logging modes. You can switch between them at any time \u2014 your data is always preserved.' },
  { type: 'heading', text: 'Quick Log' },
  { type: 'p', text: 'Four fields: overall activity, overall symptoms, crash, and sleep quality. Designed for days when you have very little energy for tracking. Takes about 30 seconds. Use this when detailed logging would itself become exertion.' },
  { type: 'heading', text: 'Full Log' },
  { type: 'p', text: 'Captures physical, mental, and emotional activity separately, plus individual symptom scores (fatigue, pain, nausea/GI, brain fog) at three time periods (AM, midday, PM). Provides richer data for pattern analysis and correlations.' },
  { type: 'heading', text: 'Which should I use?' },
  { type: 'p', text: 'Consistency matters more than detail. A Quick Log entry every day is more useful than a Full Log entry once a week. On better days, Full Log gives deeper insight into what triggers your crashes. On harder days, Quick Log keeps your streak going without adding to your exertion. The crash risk indicator and trend analysis work with both modes.' },
  { type: 'heading', text: 'A note on symptom scores' },
  { type: 'p', text: 'Quick Log\u2019s overall symptom score is a single end-of-day rating: "how were my symptoms today overall." Full Log\u2019s overall symptom is computed from three time-period observations. These measure slightly different things, but for crash pattern detection and trend analysis, both are effective.' },
];

const SECTIONS = [
  { id: 'what', t: 'What is PEM?', c: 'Post-Exertional Malaise (PEM) is the worsening of symptoms after physical, cognitive, or emotional exertion. It is one of the defining criteria of ME/CFS diagnosis. Crashes can be delayed by hours or even days after the triggering activity, making it difficult to identify what caused them.' },
  { id: 'pem-detail', t: 'Understanding PEM: How It Differs', c: PEM_DETAIL_CONTENT },
  { id: 'pacing', t: 'Pacing \u2014 The Key Strategy', c: 'Experts consider pacing to be the single most important strategy for reducing PEM crashes. The goal is to remain as active as your limited energy allows while taking proactive steps to avoid reaching your personal overexertion point. Set your constraints BEFORE you begin an activity. Use timers. Stop immediately when you sense warning signs. Don\u2019t try to push through when you feel sick or tired.' },
  { id: 'tracking', t: 'Why Track?', c: 'Patients who track their activities and symptoms find it easier to determine what might be causing crashes and which strategies help reduce them. Rate physical, mental, and emotional activity levels (0-10) and key symptoms (fatigue, pain, nausea/GI, brain fog) at three times each day (AM, midday, PM). Track crashes and brief comments. Look for patterns over weeks \u2014 crashes can be delayed 3-5 days from the triggering activity.' },
  { id: 'quick-vs-full', t: 'Quick Log vs Full Log', c: QUICK_VS_FULL_CONTENT },
  { id: 'support', t: 'Building a Support Team', c: 'Share your crash avoidance plan with the people in your life who can help. Your support team can assist with tracking, pattern recognition, meal preparation, errands, and emotional encouragement. Help them understand ME/CFS \u2014 it\u2019s an invisible illness. Don\u2019t depend on just one person; maintain the strength of your support community.' },
  { id: 'steps', t: 'The 4 Steps', c: '1) Find your causes and barriers \u2014 what triggers PEM and what stops you from avoiding it. 2) Pick your strategies \u2014 choose approaches to overcome your barriers. 3) Share with your support team \u2014 implement your plan to the best of your ability. 4) Track your progress \u2014 understand how activities and strategies correlate with symptoms.' },
  { id: 'tips', t: 'Key Tips', c: 'Schedule rest even if you don\u2019t think you need it. Plan rest before AND after big activities. Reduce, simplify, and delegate. Eat regular, healthy meals and stay hydrated. Create a good sleep environment. Be kind to yourself \u2014 sometimes crashes happen involuntarily and it\u2019s not your fault. Stressing out is mental exertion that can trigger PEM.' },
];

function renderContent(c) {
  if (typeof c === 'string') {
    return <p style={{ fontSize: 14, color: 'var(--tx-m)', lineHeight: 1.7, margin: 0 }}>{c}</p>;
  }
  if (Array.isArray(c)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {c.map((block, i) => {
          if (block.type === 'p') {
            return <p key={i} style={{ fontSize: 14, color: 'var(--tx-m)', lineHeight: 1.7, margin: 0 }}>{block.text}</p>;
          }
          if (block.type === 'heading') {
            return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', marginTop: 4 }}>{block.text}</div>;
          }
          if (block.type === 'dt') {
            return (
              <div key={i} style={{ paddingLeft: 12, borderLeft: '3px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--acc)', marginBottom: 2 }}>{block.term}</div>
                <div style={{ fontSize: 13, color: 'var(--tx-m)', lineHeight: 1.6 }}>{block.text}</div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }
  return null;
}

export default function LearnView() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Learn</div>
      <div style={{ fontSize: 12, color: 'var(--tx-d)', lineHeight: 1.6, marginBottom: 8 }}>
        Reference material from the Open Medicine Foundation&rsquo;s PEM Avoidance Toolkit, developed by Jeff Hewitt, Sarah Hewitt, Dana Beltramo Hewitt, Dr. Bonilla, and Dr. Montoya with input from ME/CFS patients.
      </div>

      {SECTIONS.map(sec => {
        const isOpen = open === sec.id;
        return (
          <div key={sec.id}>
            <button onClick={() => setOpen(isOpen ? null : sec.id)} aria-expanded={isOpen} aria-label={sec.t} style={{
              width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: isOpen ? '12px 12px 0 0' : 12, padding: '16px 18px',
              textAlign: 'left', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', fontSize: 15, fontWeight: 600, color: 'var(--tx)',
              minHeight: 52, cursor: 'pointer', fontFamily: 'var(--font)',
              marginBottom: isOpen ? 0 : 0,
            }}>
              {sec.t}
              <span style={{ color: 'var(--tx-d)' }}>{isOpen ? '\u25BE' : '\u25B8'}</span>
            </button>
            {isOpen && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 12px 12px', padding: '16px 18px',
              }}>
                {renderContent(sec.c)}
              </div>
            )}
          </div>
        );
      })}

      <Card style={{ textAlign: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--tx-d)', lineHeight: 1.6 }}>
          Full toolkit available at<br />
          <a href="https://omf.ngo/pem-avoidance-toolkit" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--acc)', fontWeight: 500, textDecoration: 'none' }}>
            omf.ngo/pem-avoidance-toolkit
          </a>
        </div>
      </Card>

      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Privacy & Your Data</div>
        <div style={{ fontSize: 13, color: 'var(--tx-m)', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 8px' }}>Your privacy is important. This app is designed to keep your health data entirely under your control.</p>
          <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
            <li>All data is stored locally on your device using your browser's built-in storage (IndexedDB).</li>
            <li>No data is ever sent to any server.</li>
            <li>There are no analytics, tracking, or cookies.</li>
            <li>No account or sign-up is required.</li>
            <li>Exporting data (copy to clipboard) is entirely user-initiated — nothing is shared unless you choose to.</li>
            <li>Deleting the app or clearing your browser data removes all stored data permanently.</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>About</div>
        <div style={{ fontSize: 13, color: 'var(--tx-m)', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 6px' }}>Developed by <a href="https://tickedoffcodess.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--acc)', textDecoration: 'none' }}>TickedOffCodess</a> with the help of <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--acc)', textDecoration: 'none' }}>Claude</a>.</p>
          <p style={{ margin: 0 }}>Based on the Open Medicine Foundation PEM Avoidance Toolkit.</p>
        </div>
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Contact</div>
        <div style={{ fontSize: 13, color: 'var(--tx-m)', lineHeight: 1.7 }}>
          <a href="mailto:dev@tickedoffcodess.com" style={{ color: 'var(--acc)', fontWeight: 500, textDecoration: 'none' }}>dev@tickedoffcodess.com</a>
        </div>
      </div>
    </div>
  );
}
