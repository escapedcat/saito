const fs = require('fs-extra');
const colors = require('colors');
const browserify = require('browserify');

async function cleanup () {
  try {
    await Promise.all([
      fs.copy('./lib/modules/mods/remix/start.js', './lib/modules/mods/remix/remixtmp.js'),
      fs.copy('./lib/modules/mods/remix/start.js', './lib/modules/mods/remix/remixtmp2.js'),
    ])
    await fs.remove('lib/modules/mods/remix/web/cache/browser.js'),
    console.log('cleanup: success!')
  } catch (err) {
    console.error(err)
  }
}

cleanup()

browserify remixtmp.js -o web/cache/browser.js -i express -i sqlite3 -i express-basic-auth -i sendgrid -i request -i bluebird -i socket.io -i phantomjs -i express-fileupload -i body-parser -i shashmap -i http -i http-proxy -i simple-socks -i unzip -i node-zip

console.log('');
console.log('///////////////'.yellow);
console.log('// IMPORTANT //'.yellow);
console.log('///////////////'.yellow);
console.log('');
console.log('We have regenerated the BROWSER JS file with this new module');
console.log('');
console.log('');

