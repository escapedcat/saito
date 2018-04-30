const fs = require('fs-extra')

async function cleanup () {
  try {
    await Promise.all([
      fs.remove('lib/saito/web/client.options'),
      fs.remove('lib/remixtmp.js'),
      fs.remove('lib/saito/web/browser.js.gz'),
      fs.remove('lib/data/database.sq3'),
      fs.remove('lib/data/log.txt'),
      fs.remove('lib/data/*.sq3'),
      fs.remove('lib/data/*.sq3-journal'),
      fs.remove('lib/data/blocks/*.blk'),
      fs.remove('lib/data/blocks/*.zip'),
      fs.remove('lib/data/blocks/*.segadd'),
      fs.remove('lib/data/tmp/*.blk'),
      fs.remove('lib/data/tmp/*.zip'),
      fs.remove('lib/options'),
      fs.remove('lib/modules/mod/registry/web/addresses.txt')
    ])
    await fs.copy('lib/options.conf', 'lib/options')
    console.log('cleanup: success!')
  } catch (err) {
    console.error(err)
  }
}

cleanup()