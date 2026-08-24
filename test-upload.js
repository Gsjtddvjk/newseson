const fs = require('fs');
const path = require('path');
const https = require('https');

const filePath = path.join('C:', 'Users', 'Admin', 'Documents', 'ew seson', 'cat-tshirt.webp');
const data = fs.readFileSync(filePath);
const b = '----B123';
const body = Buffer.concat([
  Buffer.from('--' + b + '\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\nnewseson\r\n'),
  Buffer.from('--' + b + '\r\nContent-Disposition: form-data; name="file"; filename="cat-tshirt.webp"\r\nContent-Type: image/webp\r\n\r\n'),
  data,
  Buffer.from('\r\n--' + b + '--\r\n')
]);

console.log('Body length:', body.length);

const req = https.request({
  hostname: 'api.cloudinary.com',
  path: '/v1_1/nyjavsnw/image/upload',
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data; boundary=' + b, 'Content-Length': body.length }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => { 
    console.log('Status:', res.statusCode);
    console.log('Response:', d.substring(0, 1000));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(body);
req.end();
