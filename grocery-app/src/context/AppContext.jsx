import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const PROFILE_KEY = 'grocery_profile';
const PLAN_KEY = 'grocery_plan';
const LIST_CHECKED_KEY = 'grocery_list_checked';

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
};

export function AppProvider({ children }) {
  const [activeScreen, setActiveScreen] = useState('plan');

  // Plan config
  const [selectedDays, setSelectedDays] = useState(['Ma', 'Di', 'Wo', 'Do', 'Vr']);
  const [selectedMealTypes, setSelectedMealTypes] = useState(['breakfast', 'lunch', 'dinner']);

  // Profile
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      return stored ? JSON.parse(stored) : defaultProfile;
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
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
