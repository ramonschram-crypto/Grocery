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

const BEVEL_FIELDS = [
  { key: 'hrv', label: 'HRV (ms)', placeholder: 'bv. 45' },
  { key: 'rhr', label: 'Rust hartslag (bpm)', placeholder: 'bv. 58' },
  { key: 'sleepScore', label: 'Slaapscore', placeholder: 'bv. 82' },
  { key: 'cardioLoad', label: 'Cardio Load', placeholder: 'bv. laag / gemiddeld / hoog' },
  { key: 'muscleFocus', label: 'Spierfocus', placeholder: 'bv. benen 40%, borst 25%, rug 20%' },
];

function parseAHPaste(text) {
  // Parse common patterns from AH app copy-paste:
  // "Product Name  €1.23" or "Product Name  1.23" or just product lines
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const products = [];
  const seen = new Set();

  for (const line of lines) {
    // Skip lines that are only dates, totals, headers
    if (/^(datum|totaal|subtotaal|betaald|korting|bonus|statiegeld|\d{1,2}[-\/]\d{1,2})/i.test(line)) continue;
    if (/^\d+[.,]\d{2}$/.test(line)) continue; // just a price
    if (line.length < 3) continue;

    // Extract product name: strip trailing price, quantity markers
    let name = line
      .replace(/[\u20AC]\s*\d+[.,]\d{2}/, '') // remove €1.23
      .replace(/\d+[.,]\d{2}\s*$/, '') // remove trailing 1.23
      .replace(/^\d+\s*[xX]\s*/, '') // remove leading "2x "
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (name.length < 3) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    products.push({
      product: name,
      frequency: 'weekly',
      brand: name.startsWith('AH ') ? 'AH' : 'Overig',
    });
  }
  return products;
}

export default function PreferencesModal({ onClose }) {
  const { profile, updateProfile } = useApp();

  const [newMeal, setNewMeal] = useState({ name: '', type: 'breakfast', ingredients: '' });
  const [newProduct, setNewProduct] = useState({ product: '', frequency: 'weekly', brand: '' });
  const [tab, setTab] = useState('restrictions');
  const [ahPasteText, setAhPasteText] = useState('');
  const [ahParseResult, setAhParseResult] = useState(null);

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

  const updateBevelField = (key, value) => {
    updateProfile({
      bevelData: { ...(profile.bevelData || {}), [key]: value },
    });
  };

  const handleAHParse = () => {
    const parsed = parseAHPaste(ahPasteText);
    setAhParseResult(parsed);
  };

  const handleAHImport = () => {
    if (!ahParseResult || ahParseResult.length === 0) return;
    const existing = profile.purchaseHistory || [];
    const existingNames = new Set(existing.map(p => p.product.toLowerCase()));
    const newItems = ahParseResult.filter(p => !existingNames.has(p.product.toLowerCase()));
    updateProfile({ purchaseHistory: [...existing, ...newItems] });
    setAhPasteText('');
    setAhParseResult(null);
  };

  const TABS = [
    { key: 'restrictions', label: 'Dieet' },
    { key: 'bevel', label: 'Bevel' },
    { key: 'fixed', label: 'Vaste maaltijden' },
    { key: 'history', label: 'Geschiedenis' },
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

        {/* ── Dieet tab ── */}
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

        {/* ── Bevel tab ── */}
        {tab === 'bevel' && (
          <div>
            <p className="pref-section-title">Bevel Health Data</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Vul je Bevel-gegevens in zodat het weekplan rekening houdt met je herstel en trainingsbelasting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BEVEL_FIELDS.map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {field.label}
                  </label>
                  <input
                    className="input"
                    placeholder={field.placeholder}
                    value={(profile.bevelData || {})[field.key] || ''}
                    onChange={e => updateBevelField(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--green-light)', borderRadius: 10, border: '1px solid var(--green)' }}>
              <p style={{ fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.4 }}>
                💡 Bij hoge cardio load of lage slaapscore zal het plan meer herstelbevorderende voeding voorstellen (meer eiwitten, anti-inflammatoir, etc.)
              </p>
            </div>
          </div>
        )}

        {/* ── Vaste maaltijden tab ── */}
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

        {/* ── Geschiedenis tab ── */}
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

            {/* AH Paste Import */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <p className="pref-section-title">AH Aankoopgeschiedenis importeren</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
                Open de AH app → Mijn bestellingen → kopieer de tekst en plak hieronder.
              </p>
              <textarea
                className="input"
                placeholder={"Plak hier de tekst uit je AH app...\n\nbv:\nAH Halfvolle melk 1L  \u20AC1.19\nAH Kipfiletblokjes 300g  \u20AC3.49\n2x AH Volkoren brood  \u20AC2.38"}
                value={ahPasteText}
                onChange={e => { setAhPasteText(e.target.value); setAhParseResult(null); }}
                rows={5}
                style={{ resize: 'vertical', minHeight: 80, fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.4 }}
              />
              <button
                className="btn-primary"
                style={{ marginTop: 8, background: ahPasteText.trim() ? 'var(--green)' : 'var(--border)', cursor: ahPasteText.trim() ? 'pointer' : 'not-allowed' }}
                onClick={handleAHParse}
                disabled={!ahPasteText.trim()}
              >
                🔍 Producten herkennen
              </button>

              {ahParseResult !== null && (
                <div style={{ marginTop: 12 }}>
                  {ahParseResult.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--red)' }}>Geen producten herkend. Probeer een ander formaat.</p>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: 'var(--green-dark)', fontWeight: 600, marginBottom: 8 }}>
                        {ahParseResult.length} product{ahParseResult.length !== 1 ? 'en' : ''} herkend:
                      </p>
                      <div style={{ maxHeight: 150, overflowY: 'auto', background: 'var(--bg)', borderRadius: 8, padding: 8 }}>
                        {ahParseResult.map((p, i) => (
                          <div key={i} style={{ fontSize: 12, padding: '3px 0', color: 'var(--text-secondary)' }}>
                            • {p.product} <span style={{ color: 'var(--text-muted)' }}>({p.brand})</span>
                          </div>
                        ))}
                      </div>
                      <button
                        className="btn-primary"
                        style={{ marginTop: 8 }}
                        onClick={handleAHImport}
                      >
                        ✓ Importeer {ahParseResult.length} producten
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
