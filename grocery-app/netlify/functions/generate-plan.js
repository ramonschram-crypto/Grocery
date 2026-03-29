const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { days, mealTypes, userProfile, bonusDeals = [], replaceSingle = false } = body;

  if (!days?.length || !mealTypes?.length) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing days or mealTypes' }) };
  }

  // Build prompt
  const mealTypeLabels = {
    breakfast: 'ontbijt',
    lunch: 'lunch',
    dinner: 'diner',
    household: 'huishoudproducten',
  };

  const dealsText = bonusDeals.length > 0
    ? `Actieve Albert Heijn bonusdeals:\n${bonusDeals.slice(0, 30).map(d =>
        `- ${d.name} (${d.brand}): €${d.price}${d.was ? ` (was €${d.was})` : ''}${d.discount ? ` — ${d.discount}` : ''}`
      ).join('\n')}`
    : 'Geen bonusdeals beschikbaar.';

  const restrictionsText = userProfile.restrictions?.length > 0
    ? `Dieetbeperkingen: ${userProfile.restrictions.join(', ')}`
    : 'Geen dieetbeperkingen.';

  const historyText = userProfile.purchaseHistory?.length > 0
    ? `Koopgeschiedenis (gebruik deze producten bij voorkeur):\n${userProfile.purchaseHistory.map(p =>
        `- ${p.product} (${p.brand}, ${p.frequency})`
      ).join('\n')}`
    : '';

  const fixedMealsText = userProfile.fixedMeals?.length > 0
    ? `Vaste maaltijden (verplicht inplannen als type overeenkomt):\n${userProfile.fixedMeals.map(m =>
        `- ${m.type}: ${m.name} (ingrediënten: ${m.ingredients?.join(', ') || 'n.v.t.'})`
      ).join('\n')}`
    : '';

  const systemPrompt = `Je bent een Nederlandse maaltijdplanner die realistische, betaalbare weekplannen genereert voor Nederlandse huishoudens.
Reageer ALLEEN met geldige JSON, geen markdown, geen uitleg, geen preamble. De JSON moet direct parseerbaar zijn.

Regels:
1. Gebruik bij voorkeur producten uit de koopgeschiedenis van de gebruiker
2. Verwerk actieve bonusdeals in maaltijden waar dat logisch past
3. Respecteer dieetbeperkingen strikt
4. Vaste maaltijden ALTIJD inplannen op het juiste type
5. Geef realistische bereidingstijden en kcal-waarden
6. Kies voor eenvoudige, Nederlandse maaltijden die bij AH te kopen zijn`;

  const userPrompt = `Genereer een weekplan voor de volgende dagen: ${days.join(', ')}
Maaltijdtypes: ${mealTypes.map(t => mealTypeLabels[t] || t).join(', ')}

${restrictionsText}
${historyText ? '\n' + historyText : ''}
${fixedMealsText ? '\n' + fixedMealsText : ''}

${dealsText}

${replaceSingle ? 'Genereer ALLEEN de gevraagde vervangende maaltijd, niet de hele lijst opnieuw.' : ''}

Geef je antwoord in deze exacte JSON-structuur:
{
  "plan": {
    "Ma": {
      "breakfast": {
        "name": "Naam van de maaltijd",
        "time_minutes": 10,
        "kcal": 350,
        "ingredients": ["ingredient1", "ingredient2"],
        "bonus_deal": "Beschrijving van de bonusdeal of null",
        "fixed": false
      }
    }
  },
  "shoppingList": {
    "Vlees & Vis": [
      {
        "name": "Productnaam",
        "amount": "500g",
        "meals": ["maandag diner"],
        "bonus_deal": "Bonusdeal beschrijving of null"
      }
    ],
    "Groente & Fruit": [],
    "Zuivel": [],
    "Droog & Pasta": [],
    "Huishoud": []
  },
  "estimatedCost": 65.00,
  "bonusSavings": 8.50
}

Zorg dat alle gevraagde dagen aanwezig zijn in "plan" en alle benodigde ingrediënten in "shoppingList".`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content?.[0]?.text || '';

    // Strip any accidental markdown fences
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let planData;
    try {
      planData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message);
      console.error('Raw text:', rawText.slice(0, 500));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Plan genereren mislukt: ongeldige JSON van AI' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(planData),
    };
  } catch (err) {
    console.error('Claude API error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AI service tijdelijk niet beschikbaar' }),
    };
  }
};
