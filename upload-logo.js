const https = require('https');
const fs = require('fs');
const path = require('path');

const logoPath = path.join('C:', 'Users', 'Admin', 'Documents', 'ew seson', 'newseason', 'logo.png');
const data = fs.readFileSync(logoPath);
const bnd = '----B123';
const body = Buffer.concat([
  Buffer.from('--' + bnd + '\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\nnewseson\r\n'),
  Buffer.from('--' + bnd + '\r\nContent-Disposition: form-data; name="file"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n'),
  data,
  Buffer.from('\r\n--' + bnd + '--\r\n')
]);
const req = https.request({
  hostname: 'api.cloudinary.com',
  path: '/v1_1/nyjavsnw/image/upload',
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data; boundary=' + bnd, 'Content-Length': body.length }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const r = JSON.parse(d);
    console.log(r.secure_url || JSON.stringify(r));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(body);
req.end();
