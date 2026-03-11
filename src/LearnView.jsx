import { useState } from 'react';
import { Card } from './components.jsx';

const SECTIONS = [
  { id: 'what', t: 'What is PEM?', c: 'Post-Exertional Malaise (PEM) is the worsening of symptoms after physical, cognitive, or emotional exertion. It is one of the defining criteria of ME/CFS diagnosis. Crashes can be delayed by hours or even days after the triggering activity, making it difficult to identify what caused them.' },
  { id: 'pem-vs', t: 'PEM vs Similar Conditions', c: null, rich: true },
  { id: 'pacing', t: 'Pacing — The Key Strategy', c: 'Experts consider pacing to be the single most important strategy for reducing PEM crashes. The goal is to remain as active as your limited energy allows while taking proactive steps to avoid reaching your personal overexertion point. Set your constraints BEFORE you begin an activity. Use timers. Stop immediately when you sense warning signs. Don’t try to push through when you feel sick or tired.' },
  { id: 'tracking', t: 'Why Track?', c: 'Patients who track their activities and symptoms find it easier to determine what might be causing crashes and which strategies help reduce them. Rate physical, mental, and emotional activity levels (0-10) and key symptoms (fatigue, pain, nausea/GI, brain fog) at three times each day (AM, midday, PM). Track crashes and brief comments. Look for patterns over weeks — crashes can be delayed 3-5 days from the triggering activity.' },
  { id: 'quick-vs-full', t: 'Quick Log vs Full Log', c: 'This app offers two logging modes. Full Log captures detailed data \u2014 physical, mental, and emotional activity levels plus granular symptom tracking (fatigue, pain, nausea/GI, brain fog) at three times of day. This gives the richest data for spotting patterns. Quick Log captures just an overall activity score, an overall symptom score, crash status, and an optional note \u2014 perfect for low-energy days when detailed tracking feels like too much. You can switch between modes using the toggle at the top of the entry form. Both modes contribute to your trends and patterns.' },
  { id: 'support', t: 'Building a Support Team', c: 'Share your crash avoidance plan with the people in your life who can help. Your support team can assist with tracking, pattern recognition, meal preparation, errands, and emotional encouragement. Help them understand ME/CFS — it’s an invisible illness. Don’t depend on just one person; maintain the strength of your support community.' },
  { id: 'steps', t: 'The 4 Steps', c: '1) Find your causes and barriers — what triggers PEM and what stops you from avoiding it. 2) Pick your strategies — choose approaches to overcome your barriers. 3) Share with your support team — implement your plan to the best of your ability. 4) Track your progress — understand how activities and strategies correlate with symptoms.' },
  { id: 'tips', t: 'Key Tips', c: 'Schedule rest even if you don’t think you need it. Plan rest before AND after big activities. Reduce, simplify, and delegate. Eat regular, healthy meals and stay hydrated. Create a good sleep environment. Be kind to yourself — sometimes crashes happen involuntarily and it’s not your fault. Stressing out is mental exertion that can trigger PEM.' },
];

function PemVsSection() {
  const items = [
    { name: 'PEM (Post-Exertional Malaise)', color: 'var(--acc)', bg: 'var(--acc-d)',
      points: [
        'Delayed onset: symptoms appear 12\u201372 hours after exertion',
        'Disproportionate to the level of effort',
        'Lasts days to weeks, not hours',
        'Does NOT improve with repeated exposure or "pushing through"',
        'Affects multiple systems: cognitive, physical, immune',
      ] },
    { name: 'Dysautonomia (e.g. POTS)', color: 'var(--pur)', bg: 'var(--pur-d)',
      points: [
        'Autonomic nervous system dysfunction',
        'Symptoms are positional/cardiovascular and typically immediate (dizziness, rapid heart rate on standing)',
        'Can coexist with ME/CFS but is a separate mechanism',
        'Management focuses on hydration, salt, compression, and gradual position changes',
      ] },
    { name: 'MCAS (Mast Cell Activation Syndrome)', color: 'var(--org)', bg: 'var(--yel-d)',
      points: [
        'Immune/allergic reactions with identifiable triggers (foods, chemicals, temperature, stress)',
        'Symptoms include flushing, hives, GI distress, and are often immediate',
        'Can overlap with ME/CFS and worsen PEM',
        'Managed by identifying and avoiding triggers, antihistamines, mast cell stabilisers',
      ] },
    { name: 'Fibromyalgia', color: 'var(--yel)', bg: 'var(--yel-d)',
      points: [
        'Chronic widespread pain with tender points',
        'Exercise generally helps over time (graded exercise therapy can be appropriate)',
        'Unlike PEM, symptoms typically do not dramatically worsen days after exertion',
        'Can coexist with ME/CFS \u2014 distinguish which condition is driving symptoms',
      ] },
    { name: 'DOMS (Delayed Onset Muscle Soreness)', color: 'var(--grn)', bg: 'var(--grn-d)',
      points: [
        'Normal post-exercise soreness from muscle micro-tears',
        'Peaks 24\u201372 hours post-exercise, then resolves',
        'Improves with continued exercise (adaptation)',
        'PEM is systemic (not just muscles), can last weeks, and worsens with repeated exertion',
      ] },
  ];
  const tipStyle = { fontSize: 13, color: 'var(--tx-m)', lineHeight: 1.6, margin: 0, padding: 0, listStyle: 'none' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 14, color: 'var(--tx-m)', lineHeight: 1.7, margin: 0 }}>
        PEM is distinct from other conditions that may cause fatigue or pain after activity. Understanding the differences helps you and your support team respond correctly.
      </p>
      {items.map(item => (
        <div key={item.name} style={{ background: item.bg, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.name}</div>
          <ul style={tipStyle}>
            {item.points.map((p, i) => (
              <li key={i} style={{ marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>{'\u2022'}</span>{p}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p style={{ fontSize: 13, color: 'var(--acc)', lineHeight: 1.6, margin: '4px 0 0', fontWeight: 500 }}>
        Use the crash logging and pre-crash lookback features in this app to help identify your PEM triggers.
      </p>
    </div>
  );
}

function renderRichSection(id) {
  if (id === 'pem-vs') return <PemVsSection />;
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
                {sec.rich ? renderRichSection(sec.id) : (
                  <p style={{ fontSize: 14, color: 'var(--tx-m)', lineHeight: 1.7, margin: 0 }}>{sec.c}</p>
                )}
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
          <p style={{ margin: '0 0 6px' }}>Developed by <span style={{ fontWeight: 600, color: 'var(--tx)' }}>TickedOffCodess</span> with the help of <span style={{ fontWeight: 600, color: 'var(--tx)' }}>Claude</span>.</p>
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
