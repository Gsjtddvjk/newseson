const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUD_NAME = 'nyjavsnw';
const UPLOAD_PRESET = 'newseson';
const SUPABASE_URL = 'https://dfnobqwqkcxtzupqohno.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmbm9icXdxa2N4dHp1cHFvaG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjEyNzEsImV4cCI6MjEwMzEzNzI3MX0.98940bFi_ePFsYlu_e7dJPvaVmzFYyIXymdsbmPuLAk';

const folder = path.join('C:', 'Users', 'Admin', 'Documents', 'ew seson', 'المنتجات');

function uploadToCloudinary(filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const fileName = path.basename(filePath);
    
    const parts = [];
    
    // upload_preset field first
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n${UPLOAD_PRESET}\r\n`
    ));
    
    // file field
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`
    ));
    parts.push(fileData);
    parts.push(Buffer.from('\r\n'));
    
    // end boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));
    
    const fullBody = Buffer.concat(parts);
    
    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error(result.error?.message || JSON.stringify(result)));
          }
        } catch(e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

function insertToSupabase(product) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(product);
    const url = new URL(`${SUPABASE_URL}/rest/v1/products`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(jsonData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(data));
        }
      });
    });
    
    req.on('error', reject);
    req.write(jsonData);
    req.end();
  });
}

async function main() {
  const files = fs.readdirSync(folder)
    .filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg'))
    .sort();
  
  const groups = {};
  files.forEach(f => {
    const baseName = f.replace(/ \(\d+\)\.(jpeg|jpg)$/, '.$1').replace(/\.(jpeg|jpg)$/, '');
    if (!groups[baseName]) groups[baseName] = [];
    groups[baseName].push(path.join(folder, f));
  });
  
  const keys = Object.keys(groups).sort();
  const categories = ['T-Shirts', 'Pants', 'Hoodies', 'Jackets', 'Tracksuits'];
  const total = keys.length;
  
  console.log(`Total products: ${total}`);
  console.log(`Total images: ${files.length}\n`);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const imgs = groups[key];
    const uploadedUrls = [];
    
    console.log(`[${i+1}/${total}] ${key} (${imgs.length} images)`);
    
    for (const imgPath of imgs) {
      try {
        const url = await uploadToCloudinary(imgPath);
        uploadedUrls.push(url);
        console.log(`  OK: ${path.basename(imgPath)}`);
      } catch(e) {
        console.log(`  FAIL: ${path.basename(imgPath)} - ${e.message}`);
      }
    }
    
    if (uploadedUrls.length > 0) {
      const catIdx = i % categories.length;
      const product = {
        brand: 'New Season',
        name: `Product ${i + 1}`,
        price: 12,
        category: categories[catIdx],
        img: uploadedUrls[0],
        images: uploadedUrls,
        description: 'Premium streetwear from New Season collection'
      };
      
      try {
        await insertToSupabase(product);
        console.log(`  => Saved to Supabase!`);
      } catch(e) {
        console.log(`  => Supabase error: ${e.message}`);
      }
    }
  }
  
  console.log('\nDONE!');
}

main().catch(console.error);
