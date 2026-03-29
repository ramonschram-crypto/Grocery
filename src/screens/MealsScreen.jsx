import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import MealCard from '../components/MealCard';

const DAYS_ORDER = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MEAL_TYPE_ORDER = ['breakfast', 'lunch', 'dinner', 'household'];

export default function MealsScreen() {
  const { plan, selectedDays, setActiveScreen } = useApp();

  const planDays = plan?.plan
    ? DAYS_ORDER.filter(d => selectedDays.includes(d) && plan.plan[d])
    : [];

  const [activeDay, setActiveDay] = useState(planDays[0] || null);

  if (!plan) {
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <div className="empty-state-text">
            Geen weekplan beschikbaar.<br/>
            Ga naar <strong>Plan</strong> om er een te genereren.
          </div>
          <button
            className="btn-primary"
            style={{ marginTop: 20, width: 'auto', padding: '12px 24px' }}
            onClick={() => setActiveScreen('plan')}
          >
            Naar Plan
          </button>
        </div>
      </div>
    );
  }

  const currentDayMeals = plan.plan?.[activeDay] || {};

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 6 }}>Weekoverzicht</p>
        <h1 className="screen-title">Jouw maaltijden</h1>
        {plan.bonusSavings > 0 && (
          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bonus-bg)', border: '1px solid var(--bonus-border)', borderRadius: 20, padding: '4px 12px' }}>
            <span style={{ fontSize: 12 }}>🏷️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bonus-text)' }}>
              €{plan.bonusSavings?.toFixed(2)} bespaard met bonusdeals
            </span>
          </div>
        )}
      </div>

      {/* Day tabs */}
      <div className="day-tabs">
        {planDays.map(day => (
          <button
            key={day}
            className={`day-tab${activeDay === day ? ' active' : ''}`}
            onClick={() => setActiveDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Meals for selected day */}
      <div style={{ padding: '0 20px 20px' }}>
        {MEAL_TYPE_ORDER.map(type => {
          const meal = currentDayMeals[type];
          if (!meal) return null;
          return (
            <MealCard
              key={type}
              day={activeDay}
              mealType={type}
              meal={meal}
            />
          );
        })}
        {Object.keys(currentDayMeals).length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 20 }}>
            Geen maaltijden voor deze dag
          </p>
        )}
      </div>

      {/* Goto list CTA */}
      {plan.shoppingList && (
        <div style={{ padding: '0 20px 20px' }}>
          <button
            className="btn-primary"
            style={{ background: 'var(--bg-card)', color: 'var(--green)', border: '1.5px solid var(--green)' }}
            onClick={() => setActiveScreen('list')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="4" x2="14" y2="4"/>
              <line x1="6" y1="8" x2="14" y2="8"/>
              <line x1="6" y1="12" x2="14" y2="12"/>
              <polyline points="2 4 3 5 5 2"/>
              <polyline points="2 8 3 9 5 6"/>
              <polyline points="2 12 3 13 5 10"/>
            </svg>
            Bekijk boodschappenlijst
          </button>
        </div>
      )}
    </div>
  );
}
