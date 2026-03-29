import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const TYPE_LABELS = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Diner',
  household: 'Huishoud',
};

const TYPE_EMOJI = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍲',
  household: '🧹',
};

function MacroBar({ label, kcal, total, color }) {
  const pct = total > 0 ? Math.round((kcal / total) * 100) : 0;
  const grams = label === 'Vet' ? Math.round(kcal / 9) : Math.round(kcal / 4);
  return (
    <div className="macro-bar-row">
      <span className="macro-bar-label">{label} {grams}g</span>
      <div className="macro-bar-track">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="macro-bar-value">{pct}%</span>
    </div>
  );
}

export default function MealCard({ day, mealType, meal, index = 0 }) {
  const { replaceMeal } = useApp();
  const [replacing, setReplacing] = useState(false);
  const [showMacros, setShowMacros] = useState(false);

  const handleReplace = async () => {
    setReplacing(true);
    await replaceMeal(day, mealType);
    setReplacing(false);
  };

  if (!meal) return null;

  const macros = meal.macros;
  const totalMacroKcal = macros
    ? (macros.protein_kcal || 0) + (macros.carb_kcal || 0) + (macros.fat_kcal || 0)
    : 0;

  return (
    <div className="meal-card" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="meal-card-type">{TYPE_LABELS[mealType] || mealType}</div>
      {meal.fixed && (
        <div className="fixed-meal-tag">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <path d="M4 0L5 3H8L5.5 5L6.5 8L4 6L1.5 8L2.5 5L0 3H3L4 0Z"/>
          </svg>
          Vaste maaltijd
        </div>
      )}
      <div className="meal-card-name">
        {TYPE_EMOJI[mealType] || ''} {meal.name}
      </div>
      <div className="meal-card-meta">
        {meal.time_minutes && (
          <span className="meal-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="5"/>
              <polyline points="6 3 6 6 8 7.5"/>
            </svg>
            {meal.time_minutes} min
          </span>
        )}
        {meal.kcal && (
          <button
            onClick={() => macros && setShowMacros(p => !p)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--green-light)', color: 'var(--green-dark)',
              border: 'none', borderRadius: 20, padding: '3px 10px',
              fontSize: 12, fontWeight: 600,
              cursor: macros ? 'pointer' : 'default',
              fontFamily: 'var(--font-sans)',
            }}
          >
            🔥 {meal.kcal} kcal
            {macros && <span style={{ fontSize: 10, opacity: 0.7 }}>{showMacros ? '▲' : '▼'}</span>}
          </button>
        )}
        {meal.bonus_deal && (
          <span className="bonus-badge">🏷️ {meal.bonus_deal}</span>
        )}
        <button className="meal-replace-btn" onClick={handleReplace} disabled={replacing} style={{ marginLeft: 'auto' }}>
          {replacing ? '...' : '↺ Vervang'}
        </button>
      </div>
      {showMacros && macros && (
        <div className="macro-bar-wrap">
          <MacroBar label="Eiwit" kcal={macros.protein_kcal || 0} total={totalMacroKcal} color="#4a90d9" />
          <MacroBar label="Koolhydr." kcal={macros.carb_kcal || 0} total={totalMacroKcal} color="#e8a020" />
          <MacroBar label="Vet" kcal={macros.fat_kcal || 0} total={totalMacroKcal} color="#d05a5a" />
        </div>
      )}
    </div>
  );
}
