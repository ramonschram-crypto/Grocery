# Boodschappen App

Een mobiele React-app die een AI-gegenereerd weekplan maakt met Albert Heijn bonusdeals.

## Deploy op Netlify

### 1. Repo aanmaken
Push deze map naar een GitHub/GitLab repo.

### 2. Netlify koppelen
- Ga naar [app.netlify.com](https://app.netlify.com) → New site from Git
- Selecteer je repo
- **Laat "Base directory" leeg** — `netlify.toml` regelt alles
- Klik Deploy

### 3. Environment variable instellen
In Netlify → Site settings → Environment variables:
```
ANTHROPIC_API_KEY = sk-ant-...
```

### 4. Klaar
De app staat live. Geen verdere configuratie nodig.

---

## Lokaal draaien

```bash
npm install
npm install -g netlify-cli
netlify dev
```

Zet `ANTHROPIC_API_KEY` in een `.env` bestand in de root:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Structuur

```
src/
  screens/        PlanScreen, MealsScreen, ListScreen
  components/     BottomNav, MealCard, ListItem, PreferencesModal
  context/        AppContext (globale state + API calls)
netlify/
  functions/
    generate-plan.js   Claude API — weekplan genereren
    ah-bonus.js        AH bonus deals ophalen (1u cache)
```

## Dataopslag
- Gebruikersprofiel: `localStorage` (grocery_profile)
- Weekplan: `localStorage` (grocery_plan)
- Afgevinkte items: `localStorage` (grocery_list_checked)
- Nooit persoonlijke data naar server — alleen anoniem naar Claude API als planningcontext
