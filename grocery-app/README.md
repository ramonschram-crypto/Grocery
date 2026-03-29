# Boodschappen App

Een mobile-first React weekplanner met Albert Heijn bonusdeals en Claude AI.

## Setup

### 1. Installeer dependencies

```bash
npm install
cd netlify/functions && npm install && cd ../..
```

### 2. Stel environment variables in

In Netlify UI → Site settings → Environment variables:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Lokaal testen

```bash
npm install -g netlify-cli
netlify dev
```

### 4. Deployen naar Netlify

Verbind je GitHub repo met Netlify. De `netlify.toml` regelt alles.
Laat de **base directory leeg** in Netlify UI.

## Features

- Dagenselectie (Ma-Zo) + maaltijdtypes
- Dieetbeperkingen, vaste maaltijden (CRUD), koopgeschiedenis
- AH bonus deals automatisch ophalen (1u cache)
- Weekoverzicht per dag, maaltijd vervangen met één tik
- Gecategoriseerde boodschappenlijst met afvinken + progress bar
- Alles persistent via localStorage
