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
    console.log('[ah-bonus] Got anonymous token');

    // Step 2: fetch bonus products — page through up to 3 pages
    let allProducts = [];
    for (let page = 0; page < 3; page++) {
      const bonusRes = await fetch(
        `https://api.ah.nl/mobile-services/product/search/v2?query=bonus&sortOn=RELEVANCE&page=${page}&size=50`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!bonusRes.ok) {
        console.log(`[ah-bonus] Page ${page} returned ${bonusRes.status}`);
        break;
      }

      const data = await bonusRes.json();
      const products = data.products || [];
      console.log(`[ah-bonus] Page ${page}: ${products.length} products`);

      if (products.length === 0) break;
      allProducts = allProducts.concat(products);
    }

    console.log(`[ah-bonus] Total raw products: ${allProducts.length}`);

    // Debug: log first product structure to understand the API shape
    if (allProducts.length > 0) {
      console.log('[ah-bonus] Sample product keys:', JSON.stringify(Object.keys(allProducts[0])));
      console.log('[ah-bonus] Sample product[0]:', JSON.stringify({
        title: allProducts[0].title,
        description: allProducts[0].description,
        brand: allProducts[0].brand,
        price: allProducts[0].price,
        shield: allProducts[0].shield,
        discount: allProducts[0].discount,
        bonusMechanism: allProducts[0].bonusMechanism,
        promotionType: allProducts[0].promotionType,
      }));
    }

    // PERMISSIVE mapping — keep ALL products from the bonus search
    // The search query "bonus" already filters for bonus items server-side
    const deals = allProducts
      .slice(0, 80)
      .map(p => {
        // Price: try multiple possible field locations
        const currentPrice = p.price?.now ?? p.price?.unitPrice ?? p.priceBeforeBonus ?? null;
        const wasPrice = p.price?.was ?? p.price?.previousPrice ?? null;

        // Discount text: try multiple fields
        const discountText =
          p.shield?.text ||
          p.discount?.label ||
          p.bonusMechanism ||
          p.promotionType ||
          (p.price?.discount?.percentage ? `${p.price.discount.percentage}% korting` : null) ||
          (p.price?.discount?.label) ||
          (wasPrice && currentPrice ? `was \u20AC${wasPrice}` : null) ||
          'Bonus';

        return {
          name: p.title || p.description || p.webshopId || 'Onbekend product',
          brand: p.brand || 'AH',
          price: currentPrice,
          was: wasPrice,
          discount: discountText,
          unit: p.price?.unitSize || p.unitSize || null,
          category: (p.taxonomies?.[0]?.name || p.category || '').toLowerCase() || null,
        };
      })
      .filter(d => d.name && d.name !== 'Onbekend product');

    console.log(`[ah-bonus] Final deals count: ${deals.length}`);
    if (deals.length > 0) {
      console.log('[ah-bonus] First deal:', JSON.stringify(deals[0]));
    }

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
