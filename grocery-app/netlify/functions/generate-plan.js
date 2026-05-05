const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async function (event, context) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { days, mealTypes, userProfile, bonusDeals = [], freeText = '', replaceSingle = false } = body;
  if (!days?.length || !mealTypes?.length) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing days or mealTypes' }) };

  const mealTypeLabels = { breakfast: 'ontbijt', lunch: 'lunch', dinner: 'diner', household: 'huishoudproducten' };

  // Pass up to 50 deals, clearly numbered so Claude can reference them by index
  const dealsText = bonusDeals.length > 0
    ? `ACTIEVE ALBERT HEIJN BONUSDEALS (gebruik deze zoveel mogelijk):\n${bonusDeals.slice(0, 50).map((d, i) =>
        `[${i}] ${d.name}${d.brand ? ` (${d.brand})` : ''}: €${d.price}${d.was ? ` (was €${d.was})` : ''}${d.discount ? ` — ${d.discount}` : ''}`
      ).join('\n')}`
    : 'Geen bonusdeals beschikbaar.';

  const restrictionsText = userProfile.restrictions?.length > 0
    ? `Dieetbeperkingen: ${userProfile.restrictions.join(', ')}`
    : 'Geen dieetbeperkingen.';

  const historyText = userProfile.purchaseHistory?.length > 0
    ? `Koopgeschiedenis (gebruik deze producten bij voorkeur):\n${userProfile.purchaseHistory.map(p => `- ${p.product} (${p.brand}, ${p.frequency})`).join('\n')}`
    : '';

  const fixedMealsText = userProfile.fixedMeals?.length > 0
    ? `Vaste maaltijden (verplicht inplannen als type overeenkomt):\n${userProfile.fixedMeals.map(m => `- ${m.type}: ${m.name} (ingrediënten: ${m.ingredients?.join(', ') || 'n.v.t.'})`).join('\n')}`
    : '';

  const freeTextSection = freeText?.trim()
    ? `\nEXTRA INSTRUCTIES (hoogste prioriteit):\n${freeText.trim()}`
    : '';

  const systemPrompt = `Je bent een Nederlandse maaltijdplanner die realistische, betaalbare weekplannen genereert voor Nederlandse huishoudens.
Reageer ALLEEN met geldige JSON, geen markdown, geen uitleg, geen preamble.

REGELS:
1. Gebruik bij voorkeur producten uit de koopgeschiedenis van de gebruiker.
2. Verwerk actieve bonusdeals in het plan — minstens 3 à 4 bonusproducten per week.
3. Respecteer dieetbeperkingen strikt.
4. Vaste maaltijden ALTIJD inplannen op het juiste type.
5. Geef realistische bereidingstijden en kcal-waarden per portie (1 persoon).
6. Geef bij elke maaltijd macros als kcal uit eiwitten, koolhydraten en vetten.
7. Kies eenvoudige, Nederlandse maaltijden die bij AH verkrijgbaar zijn.

PRODUCTNAMEN IN BOODSCHAPPENLIJST — VERPLICHT:
- Gebruik ALTIJD specifieke AH productnamen met merk en gewicht/volume. NOOIT generieke namen.
- Goede voorbeelden:
    "AH Kipfiletblokjes 300g", "AH Halfvolle melk 1L", "Quaker Havermout 500g",
    "AH Biologisch Volkoren Spaghetti 500g", "Calvé Pindakaas 650g",
    "AH Geraspte kaas Gouda jong belegen 200g", "Arla Skyr Naturel 450g",
    "Conimex Woksaus Teriyaki 175ml", "AH Verse spinazie 250g",
    "AH Roomboter ongezouten 250g", "Lantaarn Volkoren Brood 800g"
- Slechte voorbeelden (VERBODEN): "kipfilet", "melk", "pasta", "yoghurt", "kaas", "brood"
- Gebruik "AH" als huismerk tenzij een ander merk bekender is voor dat product.

BONUS DEALS VERWERKEN — VERPLICHT:
- Kijk voor elk item in shoppingList of er een overeenkomende bonusdeal is in de lijst.
- Als er een match is: zet bonus_deal op een string met de kortingsomschrijving, bijv. "50% korting — was €4.99".
- Als er geen match is: zet bonus_deal op null.
- Een match is wanneer het product inhoudelijk overeenkomt (bijv. bonusdeal "AH Kipfilet 500g" matcht shoppingList item "AH Kipfiletblokjes 300g").
- Verwerk bonusproducten actief in maaltijden zodat de boodschappenlijst bonusdeals bevat.`;

  const userPrompt = `Genereer een weekplan voor: ${days.join(', ')}
Maaltijdtypes: ${mealTypes.map(t => mealTypeLabels[t] || t).join(', ')}

${restrictionsText}
${historyText ? '\n' + historyText : ''}
${fixedMealsText ? '\n' + fixedMealsText : ''}
${freeTextSection}

${dealsText}

${replaceSingle ? 'Genereer ALLEEN de gevraagde vervangende maaltijd.' : ''}

Geef je antwoord in deze exacte JSON-structuur. Let op de voorbeeldwaarden — bonus_deal is een STRING (niet null) als er een deal is:
{
  "plan": {
    "Ma": {
      "breakfast": {
        "name": "Havermout met banaan en honing",
        "time_minutes": 5,
        "kcal": 380,
        "macros": { "protein_kcal": 52, "carb_kcal": 264, "fat_kcal": 64 },
        "ingredients": ["Quaker Havermout 500g", "banaan", "honing", "AH Halfvolle melk 1L"],
        "bonus_deal": null,
        "fixed": false
      },
      "dinner": {
        "name": "Pasta met kipfilet en pesto",
        "time_minutes": 20,
        "kcal": 620,
        "macros": { "protein_kcal": 148, "carb_kcal": 356, "fat_kcal": 116 },
        "ingredients": ["AH Kipfiletblokjes 300g", "AH Biologisch Volkoren Spaghetti 500g", "AH Pesto Genovese 190g"],
        "bonus_deal": "2e halve prijs — was €3.49",
        "fixed": false
      }
    }
  },
  "shoppingList": {
    "Vlees & Vis": [
      {
        "name": "AH Kipfiletblokjes 300g",
        "amount": "2 pakken",
        "meals": ["maandag diner", "woensdag lunch"],
        "bonus_deal": "2e halve prijs — was €3.49"
      }
    ],
    "Groente & Fruit": [
      {
        "name": "AH Verse spinazie 250g",
        "amount": "1 zak",
        "meals": ["dinsdag diner"],
        "bonus_deal": null
      }
    ],
    "Zuivel": [],
    "Droog & Pasta": [
      {
        "name": "AH Biologisch Volkoren Spaghetti 500g",
        "amount": "1 pak",
        "meals": ["maandag diner"],
        "bonus_deal": null
      }
    ],
    "Huishoud": []
  },
  "estimatedCost": 65.00,
  "bonusSavings": 8.50
}

NOGMAALS: In "shoppingList" en "ingredients" ALTIJD specifieke productnamen met merk en gewicht — NOOIT "kipfilet", "melk", "pasta" enz.
NOGMAALS: bonus_deal invullen als STRING als er een overeenkomende bonusdeal is, anders null.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content?.[0]?.text || '';
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let planData;
    try { planData = JSON.parse(cleaned); }
    catch (e) {
      console.error('JSON parse error:', e.message);
      console.error('Raw response (first 500 chars):', rawText.slice(0, 500));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Plan genereren mislukt: ongeldige JSON van AI' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(planData) };
  } catch (err) {
    console.error('Claude API error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI service tijdelijk niet beschikbaar' }) };
  }
};
