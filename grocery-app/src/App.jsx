import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import PlanScreen from './screens/PlanScreen';
import MealsScreen from './screens/MealsScreen';
import ListScreen from './screens/ListScreen';
import './index.css';

function AppShell() {
  const { activeScreen } = useApp();

  return (
    <div className="app-shell">
      {activeScreen === 'plan' && <PlanScreen />}
      {activeScreen === 'meals' && <MealsScreen />}
      {activeScreen === 'list' && <ListScreen />}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
