const fs = require('fs');
const zlib = require('zlib');
const content = fs.readFileSync('pruduct_ui_html/pruduct_ui.html', 'utf8');
const match = content.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (match) {
  let manifest = JSON.parse(match[1].trim());
  let jsFiles = [];
  for (let key in manifest) {
    if (manifest[key].mime.includes('javascript') || manifest[key].mime.includes('jsx')) {
      try {
        let binaryStr = Buffer.from(manifest[key].data, 'base64');
        if (manifest[key].compressed) {
          binaryStr = zlib.gunzipSync(binaryStr);
        }
        jsFiles.push('// FILE: ' + key + ' (' + manifest[key].mime + ')\n' + binaryStr.toString('utf8'));
      } catch (e) {
        console.error('Error decoding', key, e);
      }
    }
  }
  fs.writeFileSync('pruduct_ui_html/extracted_scripts.js', jsFiles.join('\n\n'));
  console.log('Done');
}
