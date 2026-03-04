import { useState, useEffect, useCallback } from 'react';
import { dbGet, dbSet } from './db.js';
import { emptyDay, generateExportText } from './utils.js';
import TrackView from './TrackView.jsx';
import PatternsView from './PatternsView.jsx';
import PlanView from './PlanView.jsx';
import LearnView from './LearnView.jsx';
import DayEditor from './DayEditor.jsx';

const DB_KEY = 'appdata';

function defaultData() {
  return { days: [], plan: { causes: [], barriers: [], strategies: [] } };
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('track');
  const [editDate, setEditDate] = useState(null);
  const [onboarded, setOnboarded] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [exportOpen, setExportOpen] = useState(false);

  // Load from IndexedDB
  useEffect(() => {
    dbGet(DB_KEY).then(stored => {
      if (stored) {
        setData({ days: stored.days || [], plan: stored.plan || defaultData().plan });
        setOnboarded(stored.onboarded || false);
        setTheme(stored.theme || 'dark');
      } else {
        setData(defaultData());
      }
      setLoading(false);
    });
  }, []);

  // Save to IndexedDB
  const save = useCallback((newData, newOnboarded, newTheme) => {
    dbSet(DB_KEY, { days: newData.days, plan: newData.plan, onboarded: newOnboarded, theme: newTheme });
  }, []);

  useEffect(() => {
    if (data && !loading) save(data, onboarded, theme);
  }, [data, onboarded, theme, loading, save]);

  const updateDay = useCallback((day) => {
    setData(prev => {
      const days = [...prev.days];
      const idx = days.findIndex(d => d.date === day.date);
      if (idx >= 0) days[idx] = day;
      else days.push(day);
      days.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, days };
    });
  }, []);

  const updatePlan = useCallback((plan) => {
    setData(prev => ({ ...prev, plan }));
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Apply theme class
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light' : '';
  }, [theme]);

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--tx-m)', fontSize: 16 }}>Loading&hellip;</div>
      </div>
    );
  }

  // Onboarding
  if (!onboarded) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', overflowY: 'auto' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>{'\u26A1'}</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>PEM Avoidance Toolkit</div>
        <div style={{ fontSize: 15, color: 'var(--tx-m)', lineHeight: 1.7, marginBottom: 32, maxWidth: 380 }}>
          Track your activities and symptoms to identify crash triggers and build your personalized avoidance plan. Based on the Open Medicine Foundation framework.
        </div>
        <div style={{ textAlign: 'left', marginBottom: 32, maxWidth: 380, width: '100%' }}>
          {[
            'Rate physical, mental, and emotional activity (0-10) each day',
            'Score key symptoms morning, midday, and evening',
            'Mark crash days and add brief comments',
            'Review patterns to identify your personal triggers',
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--acc-d)', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)' }}>{i + 1}</div>
              <div style={{ fontSize: 14, color: 'var(--tx-m)', lineHeight: 1.5, paddingTop: 3 }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: 'var(--tx-d)', marginBottom: 24, maxWidth: 380 }}>
          All your data stays on this device. Nothing is sent to any server.
        </div>
        <button onClick={() => setOnboarded(true)} style={{
          background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 12,
          padding: '16px 48px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
        }}>Get Started</button>
      </div>
    );
  }

  const tabs = [
    { id: 'track', l: 'Track', i: '\uD83D\uDCCB' },
    { id: 'patterns', l: 'Patterns', i: '\uD83D\uDCCA' },
    { id: 'plan', l: 'Plan', i: '\uD83D\uDEE1\uFE0F' },
    { id: 'learn', l: 'Learn', i: '\uD83D\uDCD6' },
  ];

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', minHeight: '100dvh', position: 'relative', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--surface), var(--bg))', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--teal), var(--acc))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', flexShrink: 0 }}>{'\u26A1'}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>PEM Avoidance Toolkit</h1>
            <div style={{ fontSize: 11, color: 'var(--tx-d)', marginTop: 2 }}>Open Medicine Foundation framework</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={toggleTheme} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--tx-m)', cursor: 'pointer', fontFamily: 'var(--font)', minHeight: 32 }}>
              {theme === 'dark' ? '\u2600 Light' : '\uD83C\uDF19 Dark'}
            </button>
            <button onClick={() => setExportOpen(true)} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--tx-m)', cursor: 'pointer', fontFamily: 'var(--font)', minHeight: 32 }}>
              {'\uD83D\uDCE4'} Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 0' }}>
        {tab === 'track' && <TrackView data={data} onEditDay={setEditDate} />}
        {tab === 'patterns' && <PatternsView data={data} />}
        {tab === 'plan' && <PlanView plan={data.plan} onUpdate={updatePlan} />}
        {tab === 'learn' && <LearnView />}
      </div>

      {/* Day Editor */}
      {editDate && (
        <DayEditor
          day={data.days.find(d => d.date === editDate) || emptyDay(editDate)}
          onSave={(day) => { updateDay(day); setEditDate(null); }}
          onCancel={() => setEditDate(null)}
        />
      )}

      {/* Export Modal */}
      {exportOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setExportOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '80dvh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Export Data</span>
              <button onClick={() => setExportOpen(false)} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: 'var(--tx-m)', cursor: 'pointer', fontFamily: 'var(--font)' }}>Close</button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx-m)', marginBottom: 12 }}>
              Share this with your doctor or support team.
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, maxHeight: 300, overflowY: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx-m)', lineHeight: 1.6, whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>
              {generateExportText(data.days, data.plan)}
            </div>
            <button onClick={() => {
              navigator.clipboard.writeText(generateExportText(data.days, data.plan)).then(() => alert('Copied to clipboard!'));
            }} style={{ width: '100%', marginTop: 12, background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520, background: 'var(--surface)',
        borderTop: '1px solid var(--border)', display: 'flex',
        padding: '8px 0 calc(12px + env(safe-area-inset-bottom, 0))', zIndex: 100,
      }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            flex: 1, background: 'none', border: 'none', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 0', color: tab === tb.id ? 'var(--acc)' : 'var(--tx-d)',
            transition: 'color 0.2s', minHeight: 48, cursor: 'pointer', fontFamily: 'var(--font)',
          }}>
            <span style={{ fontSize: 18 }}>{tb.i}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{tb.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
