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
    // Use AH website search API — no app registration required
    const allProducts = [];

    for (let page = 0; page < 3; page++) {
      const url = `https://www.ah.nl/zoeken/api/products/search?query=bonus&page=${page}&size=36&sortBy=RELEVANCE`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://www.ah.nl/bonus',
        },
      });

      console.log(`[ah-bonus] Page ${page} status:`, res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[ah-bonus] Page ${page} failed: ${res.status} — ${errText.slice(0, 300)}`);
        break;
      }

      const data = await res.json();
      const cards = data.cards || [];
      const products = cards
        .filter(c => c.type === 'default' && c.products?.length > 0)
        .flatMap(c => c.products);

      console.log(`[ah-bonus] Page ${page}: ${products.length} products from ${cards.length} cards`);
      allProducts.push(...products);

      if (products.length < 30) break;
    }

    console.log('[ah-bonus] Total raw products:', allProducts.length);

    const deals = allProducts
      .map(p => {
        const currentPrice = p.price?.now ?? null;
        const wasPrice = p.price?.was ?? null;
        const discountText = p.price?.discount?.percentage
          ? `${p.price.discount.percentage}% korting`
          : p.shield?.text || (wasPrice ? `was €${wasPrice}` : null);

        return {
          name: p.title || p.description || null,
          brand: p.brand?.name || p.brand || 'AH',
          price: currentPrice,
          was: wasPrice,
          discount: discountText,
          unit: p.price?.unitSize || null,
          category: p.taxonomyId || null,
        };
      })
      .filter(d => d.name && d.price !== null)
      .slice(0, 100);

    console.log('[ah-bonus] Mapped deals:', deals.length);

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