import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

const RESTRICTIONS = [
  'Vegetarisch', 'Veganistisch', 'Lactosevrij', 'Glutenvrij',
  'Koolhydraatarm', 'Noten-allergie', 'Halal',
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Ontbijt' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Diner' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Dagelijks' },
  { value: 'weekly', label: 'Wekelijks' },
  { value: 'biweekly', label: '2x per maand' },
  { value: 'monthly', label: 'Maandelijks' },
];

export default function PreferencesModal({ onClose }) {
  const { profile, updateProfile } = useApp();

  const [newMeal, setNewMeal] = useState({ name: '', type: 'breakfast', ingredients: '' });
  const [newProduct, setNewProduct] = useState({ product: '', frequency: 'weekly', brand: '' });
  const [tab, setTab] = useState('restrictions');

  const toggleRestriction = (r) => {
    const lower = r.toLowerCase();
    const current = profile.restrictions || [];
    if (current.includes(lower)) {
      updateProfile({ restrictions: current.filter(x => x !== lower) });
    } else {
      updateProfile({ restrictions: [...current, lower] });
    }
  };

  const addFixedMeal = () => {
    if (!newMeal.name.trim()) return;
    const meal = {
      id: uuidv4(),
      type: newMeal.type,
      name: newMeal.name.trim(),
      ingredients: newMeal.ingredients.split(',').map(s => s.trim()).filter(Boolean),
    };
    updateProfile({ fixedMeals: [...(profile.fixedMeals || []), meal] });
    setNewMeal({ name: '', type: 'breakfast', ingredients: '' });
  };

  const removeFixedMeal = (id) => {
    updateProfile({ fixedMeals: (profile.fixedMeals || []).filter(m => m.id !== id) });
  };

  const addProduct = () => {
    if (!newProduct.product.trim()) return;
    updateProfile({
      purchaseHistory: [...(profile.purchaseHistory || []), {
        product: newProduct.product.trim(),
        frequency: newProduct.frequency,
        brand: newProduct.brand.trim() || 'AH',
      }],
    });
    setNewProduct({ product: '', frequency: 'weekly', brand: '' });
  };

  const removeProduct = (idx) => {
    const updated = [...(profile.purchaseHistory || [])];
    updated.splice(idx, 1);
    updateProfile({ purchaseHistory: updated });
  };

  const TABS = [
    { key: 'restrictions', label: 'Dieet' },
    { key: 'fixed', label: 'Vaste maaltijden' },
    { key: 'history', label: 'Koopgeschiedenis' },
  ];

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600 }}>Voorkeuren</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: tab === t.key ? 'var(--green)' : 'var(--border)',
                background: tab === t.key ? 'var(--green-light)' : 'var(--bg-card)',
                color: tab === t.key ? 'var(--green-dark)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'restrictions' && (
          <div>
            <p className="pref-section-title">Dieetwensen</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RESTRICTIONS.map(r => {
                const active = (profile.restrictions || []).includes(r.toLowerCase());
                return (
                  <button
                    key={r}
                    className={`chip${active ? ' selected' : ''}`}
                    onClick={() => toggleRestriction(r)}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'fixed' && (
          <div>
            <p className="pref-section-title">Opgeslagen maaltijden</p>
            {(profile.fixedMeals || []).length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Nog geen vaste maaltijden</p>
            )}
            {(profile.fixedMeals || []).map(meal => (
              <div key={meal.id} className="fixed-meal-row">
                <div className="fixed-meal-row-info">
                  <div className="fixed-meal-row-name">{meal.name}</div>
                  <div className="fixed-meal-row-type">{MEAL_TYPES.find(t => t.value === meal.type)?.label || meal.type}</div>
                </div>
                <button className="delete-btn" onClick={() => removeFixedMeal(meal.id)}>✕</button>
              </div>
            ))}

            <div className="add-meal-form" style={{ marginTop: 12 }}>
              <p className="pref-section-title" style={{ marginBottom: 6 }}>Nieuwe vaste maaltijd</p>
              <input
                className="input"
                placeholder="Naam (bv. Havermout met banaan)"
                value={newMeal.name}
                onChange={e => setNewMeal(p => ({ ...p, name: e.target.value }))}
              />
              <div className="row">
                <select className="input" value={newMeal.type} onChange={e => setNewMeal(p => ({ ...p, type: e.target.value }))}>
                  {MEAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <input
                className="input"
                placeholder="Ingrediënten (komma-gescheiden)"
                value={newMeal.ingredients}
                onChange={e => setNewMeal(p => ({ ...p, ingredients: e.target.value }))}
              />
              <button className="btn-primary" style={{ marginTop: 4 }} onClick={addFixedMeal}>
                + Toevoegen
              </button>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <p className="pref-section-title">Vaste boodschappen</p>
            {(profile.purchaseHistory || []).map((item, idx) => (
              <div key={idx} className="fixed-meal-row">
                <div className="fixed-meal-row-info">
                  <div className="fixed-meal-row-name">{item.product}</div>
                  <div className="fixed-meal-row-type">{item.brand} · {FREQUENCIES.find(f => f.value === item.frequency)?.label}</div>
                </div>
                <button className="delete-btn" onClick={() => removeProduct(idx)}>✕</button>
              </div>
            ))}

            <div className="add-meal-form" style={{ marginTop: 12 }}>
              <p className="pref-section-title" style={{ marginBottom: 6 }}>Product toevoegen</p>
              <input
                className="input"
                placeholder="Product (bv. kipfilet)"
                value={newProduct.product}
                onChange={e => setNewProduct(p => ({ ...p, product: e.target.value }))}
              />
              <div className="row">
                <input
                  className="input"
                  placeholder="Merk (bv. AH)"
                  value={newProduct.brand}
                  onChange={e => setNewProduct(p => ({ ...p, brand: e.target.value }))}
                  style={{ flex: 1 }}
                />
                <select
                  className="input"
                  value={newProduct.frequency}
                  onChange={e => setNewProduct(p => ({ ...p, frequency: e.target.value }))}
                  style={{ flex: 1 }}
                >
                  {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <button className="btn-primary" style={{ marginTop: 4 }} onClick={addProduct}>
                + Toevoegen
              </button>
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
