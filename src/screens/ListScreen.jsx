import React from 'react';
import { useApp } from '../context/AppContext';
import ListItem from '../components/ListItem';

const CATEGORY_ORDER = ['Vlees & Vis', 'Groente & Fruit', 'Zuivel', 'Droog & Pasta', 'Droog', 'Huishoud'];
const CATEGORY_ICONS = { 'Vlees & Vis': '🥩', 'Groente & Fruit': '🥦', 'Zuivel': '🥛', 'Droog & Pasta': '🌾', 'Droog': '🌾', 'Huishoud': '🧹' };

export default function ListScreen() {
  const { plan, checkedItems, resetList, setActiveScreen } = useApp();

  if (!plan?.shoppingList) {
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-text">Nog geen boodschappenlijst.<br/>Genereer eerst een weekplan.</div>
          <button className="btn-primary" style={{ marginTop: 20, width: 'auto', padding: '12px 24px' }} onClick={() => setActiveScreen('plan')}>
            Naar Plan
          </button>
        </div>
      </div>
    );
  }

  const shoppingList = plan.shoppingList;

  let totalItems = 0;
  let bonusItems = 0;
  Object.values(shoppingList).forEach(items => {
    if (!Array.isArray(items)) return;
    items.forEach(item => { totalItems++; if (item.bonus_deal) bonusItems++; });
  });

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const allDone = totalItems > 0 && checkedCount === totalItems;

  const categories = Object.keys(shoppingList).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a), bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 6 }}>Boodschappenlijst</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 className="screen-title">Jouw lijst</h1>
          {checkedCount > 0 && (
            <button onClick={resetList} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
              Reset afvinkjes
            </button>
          )}
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item"><div className="stat-value">{totalItems}</div><div className="stat-label">Producten</div></div>
        <div className="stat-item"><div className="stat-value" style={{ color: 'var(--bonus-text)' }}>{bonusItems}</div><div className="stat-label">Bonusdeals</div></div>
        {plan.estimatedCost && (
          <div className="stat-item"><div className="stat-value">€{plan.estimatedCost.toFixed(0)}</div><div className="stat-label">Geschat</div></div>
        )}
        <div className="stat-item"><div className="stat-value" style={{ color: 'var(--green)' }}>{checkedCount}</div><div className="stat-label">Afgevinkt</div></div>
      </div>

      {totalItems > 0 && (
        <div style={{ padding: '0 20px 4px' }}>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--green)', borderRadius: 2, width: `${Math.round((checkedCount / totalItems) * 100)}%`, transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{checkedCount} van {totalItems} items afgevinkt</p>
        </div>
      )}

      {allDone && (
        <div className="list-complete-banner">
          <span className="list-complete-emoji">🎉</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Alles afgevinkt!</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Geniet van je boodschappen 🛒</div>
        </div>
      )}

      {categories.map(category => {
        const items = shoppingList[category];
        if (!Array.isArray(items) || items.length === 0) return null;
        return (
          <div key={category} style={{ marginTop: 12 }}>
            <div className="category-header">{CATEGORY_ICONS[category] || '📦'} {category}</div>
            <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              {items.map((item, idx) => {
                const itemKey = `${category}-${item.name}-${idx}`;
                return <ListItem key={itemKey} itemKey={itemKey} name={item.name} amount={item.amount} bonus_deal={item.bonus_deal} index={idx} />;
              })}
            </div>
          </div>
        );
      })}
      <div style={{ height: 20 }} />
    </div>
  );
}
