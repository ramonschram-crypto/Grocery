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
    console.log('[ah-bonus] Returning cached deals:', cache.length);
    return { statusCode: 200, headers, body: JSON.stringify({ deals: cache, cached: true }) };
  }

  try {
    // Step 1: anonymous token
    const tokenRes = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Appie/8.22.3 Android/33',
        'x-application': 'Appie',
        'x-clientversion': '8.22.3',
      },
      body: JSON.stringify({ clientId: 'appie' }),
    });

    console.log('[ah-bonus] Token status:', tokenRes.status);
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Token request failed: ${tokenRes.status} — ${errText.slice(0, 200)}`);
    }

    const { access_token } = await tokenRes.json();
    console.log('[ah-bonus] Got token:', access_token ? 'yes' : 'no');

    const apiHeaders = {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Appie/8.22.3 Android/33',
      'x-application': 'Appie',
      'x-clientversion': '8.22.3',
    };

    // Step 2: fetch bonus products — 3 pages
    // NOTE: do NOT pre-filter on price.discount or shield.text — API shape varies per product.
    // The "bonus" query already filters server-side. Keep ALL returned products.
    const allProducts = [];
    for (let page = 0; page < 3; page++) {
      const url = `https://api.ah.nl/mobile-services/product/search/v2?query=bonus&sortOn=RELEVANCE&page=${page}&size=50`;
      const bonusRes = await fetch(url, { headers: apiHeaders });

      console.log(`[ah-bonus] Page ${page} status:`, bonusRes.status);

      if (!bonusRes.ok) {
        const errText = await bonusRes.text();
        console.warn(`[ah-bonus] Page ${page} failed: ${bonusRes.status} — ${errText.slice(0, 200)}`);
        break;
      }

      const data = await bonusRes.json();
      const products = data.products || [];
      console.log(`[ah-bonus] Page ${page}: ${products.length} products`);
      allProducts.push(...products);

      // Stop early if last page
      if (products.length < 50) break;
    }

    console.log('[ah-bonus] Total raw products:', allProducts.length);

    // Map to clean format — keep ALL products, extract whatever discount info is available
    const deals = allProducts
      .map(p => {
        const currentPrice = p.price?.now ?? p.price?.unitPrice ?? null;
        const wasPrice = p.price?.was ?? null;
        const discountText = p.price?.discount?.percentage
          ? `${p.price.discount.percentage}% korting`
          : p.shield?.text || (wasPrice ? `was €${wasPrice}` : null);

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
      .filter(d => d.name && d.name !== 'Onbekend product' && d.price !== null)
      .slice(0, 100);

    console.log('[ah-bonus] Mapped deals:', deals.length);

    // Cache it
    cache = deals;
    cacheTime = Date.now();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ deals }),
    };
  } catch (err) {
    console.error('[ah-bonus] Error:', err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ deals: [], error: err.message }),
    };
  }
};