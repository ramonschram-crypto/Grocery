import React from 'react';
import { useApp } from '../context/AppContext';

export default function ListItem({ itemKey, name, amount, bonus_deal, index = 0 }) {
  const { checkedItems, toggleCheck } = useApp();
  const checked = !!checkedItems[itemKey];

  return (
    <div
      className={`list-item${checked ? ' checked' : ''}`}
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => toggleCheck(itemKey)}
    >
      <div className="list-item-check">
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div className="list-item-name">{name}</div>
        {bonus_deal && (
          <div style={{ marginTop: 3 }}>
            <span className="bonus-badge">🏷️ {bonus_deal}</span>
          </div>
        )}
      </div>
      <div className="list-item-amount">{amount}</div>
    </div>
  );
}
