import { useState } from 'react';
import { Card } from './components.jsx';

const PEM_DIFF_CONTENT = [
  { heading: 'PEM Defined', text: 'Post-Exertional Malaise (PEM) is a delayed worsening of symptoms following physical, cognitive, or emotional exertion. Onset typically occurs 12\u201372 hours after the triggering activity, and recovery is disproportionate to the effort involved \u2014 a minor activity can cause days or weeks of setback. PEM is a hallmark feature of ME/CFS and a key diagnostic criterion.' },
  { heading: 'What Sets PEM Apart', text: 'The defining characteristic of PEM is the delay. Many conditions cause symptoms during or immediately after exertion, but PEM\u2019s delayed onset and prolonged, disproportionate recovery distinguish it from other exertion-related responses.' },
  { heading: 'Conditions Often Confused with PEM', list: [
    { term: 'Dysautonomia', desc: 'Symptoms are triggered by positional changes or autonomic dysfunction (e.g. standing, temperature changes) and often appear immediately. The mechanism involves the autonomic nervous system rather than a delayed immune or metabolic response.' },
    { term: 'MCAS (Mast Cell Activation Syndrome)', desc: 'Flares are triggered by specific exposures (foods, chemicals, environmental factors) through distinct mast cell mechanisms. While flares can be delayed, they follow exposure patterns rather than exertion patterns.' },
    { term: 'Fibromyalgia', desc: 'Pain and fatigue worsen with activity but typically lack the delayed-onset crash-and-recovery pattern characteristic of PEM. Symptoms tend to correlate more directly with the activity itself.' },
    { term: 'DOMS (Delayed Onset Muscle Soreness)', desc: 'Muscular soreness appears 24\u201372 hours after unaccustomed exercise and resolves predictably within days. PEM is systemic (not just muscular), can be triggered by minimal exertion, and may persist far longer.' },
  ]},
  { heading: 'Why This Matters', text: 'Distinguishing PEM from other conditions supports more accurate diagnosis, better-targeted treatment decisions, and clearer research data. These conditions are not mutually exclusive \u2014 many people live with more than one \u2014 but understanding which pattern your symptoms follow helps you and your care team make informed choices.' },
  { heading: 'How This App Helps', text: 'Daily logging of activity levels and symptoms reveals whether your symptom patterns show delayed onset relative to exertion. The crash logging feature and pre-crash lookback analysis are specifically designed to surface the timing relationship between activity and symptom worsening, helping you identify whether PEM is part of your picture.' },
];

const SECTIONS = [
  { id: 'pem-diff', t: 'What Is PEM \u2014 And What It Isn\u2019t', rich: PEM_DIFF_CONTENT },
  { id: 'what', t: 'What is PEM?', c: 'Post-Exertional Malaise (PEM) is the worsening of symptoms after physical, cognitive, or emotional exertion. It is one of the defining criteria of ME/CFS diagnosis. Crashes can be delayed by hours or even days after the triggering activity, making it difficult to identify what caused them.' },
  { id: 'pacing', t: 'Pacing — The Key Strategy', c: 'Experts consider pacing to be the single most important strategy for reducing PEM crashes. The goal is to remain as active as your limited energy allows while taking proactive steps to avoid reaching your personal overexertion point. Set your constraints BEFORE you begin an activity. Use timers. Stop immediately when you sense warning signs. Don’t try to push through when you feel sick or tired.' },
  { id: 'tracking', t: 'Why Track?', c: 'Patients who track their activities and symptoms find it easier to determine what might be causing crashes and which strategies help reduce them. Rate physical, mental, and emotional activity levels (0-10) and key symptoms (fatigue, pain, nausea/GI, brain fog) at three times each day (AM, midday, PM). Track crashes and brief comments. Look for patterns over weeks — crashes can be delayed 3-5 days from the triggering activity.' },
  { id: 'support', t: 'Building a Support Team', c: 'Share your crash avoidance plan with the people in your life who can help. Your support team can assist with tracking, pattern recognition, meal preparation, errands, and emotional encouragement. Help them understand ME/CFS — it’s an invisible illness. Don’t depend on just one person; maintain the strength of your support community.' },
  { id: 'steps', t: 'The 4 Steps', c: '1) Find your causes and barriers — what triggers PEM and what stops you from avoiding it. 2) Pick your strategies — choose approaches to overcome your barriers. 3) Share with your support team — implement your plan to the best of your ability. 4) Track your progress — understand how activities and strategies correlate with symptoms.' },
  { id: 'tips', t: 'Key Tips', c: 'Schedule rest even if you don’t think you need it. Plan rest before AND after big activities. Reduce, simplify, and delegate. Eat regular, healthy meals and stay hydrated. Create a good sleep environment. Be kind to yourself — sometimes crashes happen involuntarily and it’s not your fault. Stressing out is mental exertion that can trigger PEM.' },
];

export default function LearnView() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Learn</div>
      <div style={{ fontSize: 12, color: 'var(--tx-d)', lineHeight: 1.6, marginBottom: 8 }}>
        Reference material from the PEM Avoidance Toolkit, developed at Stanford by Jeff Hewitt, Sarah Hewitt, Dana Beltramo Hewitt, Dr. Bonilla, and Dr. Montoya with input from ME/CFS patients. Hosted online by the Open Medicine Foundation.
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
                {sec.rich ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {sec.rich.map((block, bi) => (
                      <div key={bi}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>{block.heading}</div>
                        {block.text && <p style={{ fontSize: 14, color: 'var(--tx-m)', lineHeight: 1.7, margin: 0 }}>{block.text}</p>}
                        {block.list && (
                          <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'none' }}>
                            {block.list.map((item, li) => (
                              <li key={li} style={{ fontSize: 14, color: 'var(--tx-m)', lineHeight: 1.7, marginBottom: 10 }}>
                                <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{item.term}:</span>{' '}{item.desc}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
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
          <p style={{ margin: '0 0 6px' }}>Developed by <a href="https://tickedoffcodess.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--acc)', textDecoration: 'none' }}>TickedOffCodess</a> with the help of <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--acc)', textDecoration: 'none' }}>Claude</a>.</p>
          <p style={{ margin: 0 }}>Based on the PEM Avoidance Toolkit, developed at Stanford and hosted by the Open Medicine Foundation.</p>
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
