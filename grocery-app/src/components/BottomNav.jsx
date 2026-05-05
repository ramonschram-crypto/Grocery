import React from 'react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  {
    key: 'plan',
    label: 'Plan',
    icon: (active) => (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    key: 'meals',
    label: 'Maaltijden',
    icon: (active) => (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
  },
  {
    key: 'list',
    label: 'Lijst',
    icon: (active) => (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="9" y1="6" x2="20" y2="6"/>
        <line x1="9" y1="12" x2="20" y2="12"/>
        <line x1="9" y1="18" x2="20" y2="18"/>
        <polyline points="4 6 5 7 7 4"/>
        <polyline points="4 12 5 13 7 10"/>
        <polyline points="4 18 5 19 7 16"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { activeScreen, setActiveScreen } = useApp();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.key}
          className={`nav-item${activeScreen === item.key ? ' active' : ''}`}
          onClick={() => setActiveScreen(item.key)}
        >
          {item.icon(activeScreen === item.key)}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
