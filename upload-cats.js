const fs = require('fs');
const path = require('path');
const https = require('https');

const folder = path.join('C:', 'Users', 'Admin', 'Documents', 'ew seson');

const files = [
  { file: 'cat-pants.webp' },
  { file: 'cat-hoodie.webp' }
];

function upload(filePath, fileName) {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync(filePath);
    const bnd = '----B123';
    const body = Buffer.concat([
      Buffer.from('--' + bnd + '\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\nnewseson\r\n'),
      Buffer.from('--' + bnd + '\r\nContent-Disposition: form-data; name="file"; filename="' + fileName + '"\r\nContent-Type: image/webp\r\n\r\n'),
      data,
      Buffer.from('\r\n--' + bnd + '--\r\n')
    ]);
    console.log('  Sending', body.length, 'bytes');
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: '/v1_1/nyjavsnw/image/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + bnd,
        'Content-Length': body.length
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('  HTTP', res.statusCode);
        try {
          const r = JSON.parse(d);
          if (r.secure_url) resolve(r.secure_url);
          else { console.log('  Response:', d.substring(0,500)); reject(r); }
        } catch(e) { console.log('  Raw:', d.substring(0,500)); reject(e); }
      });
    });
    req.on('error', e => { console.log('  Error:', e.message); reject(e); });
    req.write(body);
    req.end();
  });
}

async function main() {
  for (const f of files) {
    const fp = path.join(folder, f.file);
    console.log(f.file);
    try {
      const url = await upload(fp, f.file);
      console.log('  => ' + url);
    } catch(e) {
      console.log('  FAIL');
    }
  }
}
main();
