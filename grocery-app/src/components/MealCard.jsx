import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const TYPE_LABELS = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Diner',
  household: 'Huishoud',
};

export default function MealCard({ day, mealType, meal }) {
  const { replaceMeal } = useApp();
  const [replacing, setReplacing] = useState(false);

  const handleReplace = async () => {
    setReplacing(true);
    await replaceMeal(day, mealType);
    setReplacing(false);
  };

  if (!meal) return null;

  return (
    <div className="meal-card">
      <div className="meal-card-type">{TYPE_LABELS[mealType] || mealType}</div>
      {meal.fixed && (
        <div className="fixed-meal-tag">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <path d="M4 0L5 3H8L5.5 5L6.5 8L4 6L1.5 8L2.5 5L0 3H3L4 0Z"/>
          </svg>
          Vaste maaltijd
        </div>
      )}
      <div className="meal-card-name">{meal.name}</div>
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
          <span className="meal-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 1C6 1 2 4 2 7a4 4 0 008 0c0-3-4-6-4-6z"/>
            </svg>
            {meal.kcal} kcal
          </span>
        )}
        {meal.bonus_deal && (
          <span className="bonus-badge">
            🏷️ {meal.bonus_deal}
          </span>
        )}
        <button
          className="meal-replace-btn"
          onClick={handleReplace}
          disabled={replacing}
          style={{ marginLeft: 'auto' }}
        >
          {replacing ? '...' : '↺ Vervang'}
        </button>
      </div>
    </div>
  );
}
