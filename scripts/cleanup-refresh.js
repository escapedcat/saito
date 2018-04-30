const fs = require('fs-extra')

async function cleanup () {
  try {
    await Promise.all([
      fs.remove('lib/saito/web/client.options'),
      fs.remove('lib/saito/web/browser.js.gz'),
    ])
    console.log('cleanup: success!')
  } catch (err) {
    console.error(err)
  }
}

cleanup()