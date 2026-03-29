// In-memory cache (lives for the duration of the function instance)
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Return cache if fresh
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return { statusCode: 200, headers, body: JSON.stringify({ deals: cache, cached: true }) };
  }

  try {
    // Step 1: anonymous token
    const tokenRes = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'appie' }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token request failed: ${tokenRes.status}`);
    }

    const { access_token } = await tokenRes.json();

    // Step 2: fetch bonus products
    const bonusRes = await fetch(
      'https://api.ah.nl/mobile-services/product/search/v2?query=bonus&sortOn=RELEVANCE&page=0&size=50',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!bonusRes.ok) {
      throw new Error(`Bonus fetch failed: ${bonusRes.status}`);
    }

    const data = await bonusRes.json();
    const products = data.products || [];

    // Map to clean format
    const deals = products
      .filter(p => p.price?.discount || p.shield?.text)
      .slice(0, 50)
      .map(p => {
        const currentPrice = p.price?.now ?? p.price?.unitPrice ?? null;
        const wasPrice = p.price?.was ?? null;
        const discountText = p.price?.discount?.percentage
          ? `${p.price.discount.percentage}% korting`
          : p.shield?.text || null;

        return {
          name: p.title || p.description || 'Onbekend product',
          brand: p.brand || 'AH',
          price: currentPrice,
          was: wasPrice,
          discount: discountText,
          unit: p.price?.unitSize || p.unitSize || null,
          category: p.category?.toLowerCase() || null,
        };
      })
      .filter(d => d.name && d.price !== null);

    // Cache it
    cache = deals;
    cacheTime = Date.now();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ deals }),
    };
  } catch (err) {
    console.error('AH bonus error:', err.message);
    // Return empty list — plan still works without deals
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ deals: [], error: err.message }),
    };
  }
};
