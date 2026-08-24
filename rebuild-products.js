const https = require('https');
const SB = 'https://dfnobqwqkcxtzupqohno.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmbm9icXdxa2N4dHp1cHFvaG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjEyNzEsImV4cCI6MjEwMzEzNzI3MX0.98940bFi_ePFsYlu_e7dJPvaVmzFYyIXymdsbmPuLAk';
const HEADERS = { 'Content-Type':'application/json', 'apikey':KEY, 'Authorization':'Bearer '+KEY };

function sbRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SB + path);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: { ...HEADERS, 'Prefer': body ? 'return=representation' : '' }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(d || '[]')); } catch(e) { resolve([]); }
        } else {
          reject(new Error(d));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Fetch all 32 products with images
  console.log('Fetching existing products...');
  const products = await sbRequest('GET', '/rest/v1/products?select=*&order=created_at.asc');
  console.log('Found', products.length, 'products');

  // 2. Collect all individual items
  const items = [];
  let productNum = 0;
  for (const p of products) {
    const imgs = p.images || (p.img ? [p.img] : []);
    for (const imgUrl of imgs) {
      productNum++;
      items.push({
        brand: 'New Season',
        name: 'Product ' + productNum,
        price: 12,
        category: 'Pants',
        img: imgUrl,
        images: [imgUrl],
        description: 'Premium streetwear pants from New Season collection'
      });
    }
  }
  console.log('Prepared', items.length, 'individual products');

  // 3. Delete old 32 products
  console.log('Deleting old products...');
  for (const p of products) {
    await sbRequest('DELETE', '/rest/v1/products?id=eq.' + p.id);
  }
  console.log('Deleted', products.length, 'old products');

  // 4. Insert new products in batches of 10
  const BATCH = 10;
  let inserted = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    await sbRequest('POST', '/rest/v1/products', batch);
    inserted += batch.length;
    if (inserted % 50 === 0 || inserted === items.length) {
      console.log('Inserted:', inserted + '/' + items.length);
    }
  }
  console.log('DONE! Total products:', items.length);
}

main().catch(console.error);
