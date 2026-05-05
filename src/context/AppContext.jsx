import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const PROFILE_KEY = 'grocery_profile';
const PLAN_KEY = 'grocery_plan';
const LIST_CHECKED_KEY = 'grocery_list_checked';
const FREE_TEXT_KEY = 'grocery_free_text';

const defaultProfile = {
  restrictions: [],
  fixedMeals: [],
  purchaseHistory: [
    { product: 'kipfilet', frequency: 'weekly', brand: 'AH' },
    { product: 'havermout', frequency: 'weekly', brand: 'Quaker' },
    { product: 'halfvolle melk', frequency: 'weekly', brand: 'AH' },
    { product: 'volkoren brood', frequency: 'weekly', brand: 'Lantaarn' },
    { product: 'eieren', frequency: 'biweekly', brand: 'AH' },
    { product: 'pasta', frequency: 'biweekly', brand: 'AH' },
  ],
  bevelData: {
    hrv: '',
    rhr: '',
    sleepScore: '',
    cardioLoad: '',
    muscleFocus: '',
  },
};

export function AppProvider({ children }) {
  const [activeScreen, setActiveScreen] = useState('plan');

  // Plan config
  const [selectedDays, setSelectedDays] = useState(['Ma', 'Di', 'Wo', 'Do', 'Vr']);
  const [selectedMealTypes, setSelectedMealTypes] = useState(['breakfast', 'lunch', 'dinner']);

  // Free text instruction for plan generation
  const [freeText, setFreeText] = useState(() => {
    try {
      return localStorage.getItem(FREE_TEXT_KEY) || '';
    } catch {
      return '';
    }
  });

  // Profile
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge in defaults for new fields
        return {
          ...defaultProfile,
          ...parsed,
          bevelData: { ...defaultProfile.bevelData, ...(parsed.bevelData || {}) },
        };
      }
      return defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  // Plan result
  const [plan, setPlan] = useState(() => {
    try {
      const stored = localStorage.getItem(PLAN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Checked list items
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const stored = localStorage.getItem(LIST_CHECKED_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bonusDeals, setBonusDeals] = useState([]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (plan) localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    localStorage.setItem(LIST_CHECKED_KEY, JSON.stringify(checkedItems));
  }, [checkedItems]);

  useEffect(() => {
    localStorage.setItem(FREE_TEXT_KEY, freeText);
  }, [freeText]);

  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const toggleCheck = (itemKey) => {
    setCheckedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const resetList = () => setCheckedItems({});

  const fetchBonusDeals = async () => {
    try {
      const res = await fetch('/.netlify/functions/ah-bonus');
      if (res.ok) {
        const data = await res.json();
        setBonusDeals(data.deals || []);
        return data.deals || [];
      }
    } catch {
      // fallback to empty — plan still works
    }
    return [];
  };

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const deals = await fetchBonusDeals();
      const res = await fetch('/.netlify/functions/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: selectedDays,
          mealTypes: selectedMealTypes,
          userProfile: profile,
          bonusDeals: deals,
          freeText: freeText.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Plan genereren mislukt');
      const data = await res.json();
      setPlan(data);
      setCheckedItems({});
      setActiveScreen('meals');
    } catch (e) {
      setError(e.message || 'Er ging iets mis. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const replaceMeal = async (day, mealType) => {
    try {
      const res = await fetch('/.netlify/functions/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: [day],
          mealTypes: [mealType],
          userProfile: profile,
          bonusDeals,
          freeText: freeText.trim() || null,
          replaceSingle: true,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.plan?.[day]?.[mealType]) {
        setPlan(prev => ({
          ...prev,
          plan: {
            ...prev.plan,
            [day]: {
              ...prev.plan[day],
              [mealType]: data.plan[day][mealType],
            },
          },
        }));
      }
    } catch {
      // silent fail for replace
    }
  };

  return (
    <AppContext.Provider value={{
      activeScreen, setActiveScreen,
      selectedDays, setSelectedDays,
      selectedMealTypes, setSelectedMealTypes,
      profile, updateProfile,
      plan, setPlan,
      loading, error,
      checkedItems, toggleCheck, resetList,
      bonusDeals,
      generatePlan,
      replaceMeal,
      freeText, setFreeText,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
