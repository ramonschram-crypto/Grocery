import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import PreferencesModal from '../components/PreferencesModal';

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Ontbijt', icon: '🍳' },
  { key: 'lunch', label: 'Lunch', icon: '🥗' },
  { key: 'dinner', label: 'Diner', icon: '🍽️' },
  { key: 'household', label: 'Huishoud', icon: '🧹' },
];

export default function PlanScreen() {
  const {
    selectedDays, setSelectedDays,
    selectedMealTypes, setSelectedMealTypes,
    generatePlan, loading, error,
    profile,
  } = useApp();

  const [showPrefs, setShowPrefs] = useState(false);

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleMealType = (type) => {
    setSelectedMealTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const canGenerate = selectedDays.length > 0 && selectedMealTypes.length > 0 && !loading;

  const restrictionCount = (profile.restrictions || []).length;
  const fixedMealCount = (profile.fixedMeals || []).length;

  return (
    <>
      <div className="screen">
        <div className="screen-header" style={{ paddingTop: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 6 }}>Weekplanner</p>
          <h1 className="screen-title">Plan je week</h1>
          <p className="screen-subtitle">Kies je dagen en maaltijdtypes</p>
        </div>

        {error && (
          <div className="error-toast">{error}</div>
        )}

        {/* Days */}
        <div className="section" style={{ marginTop: 20 }}>
          <p className="section-label">Dagen</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DAYS.map(day => (
              <button
                key={day}
                className={`chip${selectedDays.includes(day) ? ' selected' : ''}`}
                onClick={() => toggleDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Meal types */}
        <div className="section" style={{ marginTop: 20 }}>
          <p className="section-label">Maaltijdtypes</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {MEAL_TYPES.map(type => (
              <button
                key={type.key}
                className={`toggle-card${selectedMealTypes.includes(type.key) ? ' selected' : ''}`}
                onClick={() => toggleMealType(type.key)}
              >
                <span className="toggle-card-icon">{type.icon}</span>
                <span className="toggle-card-label">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferences summary */}
        <div className="section" style={{ marginTop: 20 }}>
          <p className="section-label">Voorkeuren</p>
          <button
            onClick={() => setShowPrefs(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Dieet, vaste maaltijden & geschiedenis
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                {restrictionCount > 0 ? `${restrictionCount} beperking${restrictionCount !== 1 ? 'en' : ''}` : 'Geen beperkingen'}
                {fixedMealCount > 0 ? ` · ${fixedMealCount} vaste maaltijd${fixedMealCount !== 1 ? 'en' : ''}` : ''}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 3l5 5-5 5"/>
            </svg>
          </button>
        </div>

        {/* AH bonus note */}
        <div className="section" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bonus-bg)', borderRadius: 12, border: '1px solid var(--bonus-border)' }}>
            <span style={{ fontSize: 16 }}>🏷️</span>
            <span style={{ fontSize: 12, color: 'var(--bonus-text)', fontWeight: 500 }}>
              Albert Heijn bonusdeals worden automatisch verwerkt in je weekplan
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="section" style={{ marginTop: 24, paddingBottom: 20 }}>
          <button
            className="btn-primary"
            onClick={generatePlan}
            disabled={!canGenerate}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Plan genereren...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 3 15 9 3 15 3 3"/>
                </svg>
                Genereer weekplan
              </>
            )}
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            {selectedDays.length} dag{selectedDays.length !== 1 ? 'en' : ''} · {selectedMealTypes.length} maaltijdtype{selectedMealTypes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} />}
    </>
  );
}
