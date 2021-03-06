var saito = require('../saito');
var net = require('net');
var http = require('http');
var util = require('util');
var fs = require('fs');
var path = require('path');


function Server(app, serverjson = '') {
  if (!(this instanceof Server)) {
    return new Server(app, serverjson);
  }

  this.app = app || {};

  this.blocks_dir = path.join(__dirname, '../data/blocks/');
  this.server = {};
  this.server.host = '';
  this.server.port = 0;
  this.server.publickey = '';
  this.webserver = null;
  this.io = null;

  if (serverjson != '') {
    this.server = JSON.parse(serverjson);
  }

  return this;
}
module.exports = Server;


Server.prototype.initialize = function initialize() {
  if (this.app.BROWSER == 1) { return; }

  this.server.publickey = this.app.wallet.returnPublicKey();

  if (this.app.options.server != null) {
    this.server.host = this.app.options.server.host;
    this.server.port = this.app.options.server.port;
  }
  if (this.server.host == '' || this.server.port == 0) {
    console.log('Not starting local server as no hostname / port in options file');
    return;
  }

  var server_self = this;

  var app = require('express')();
  const fileUpload = require('express-fileupload');
  var webserver = require('http').Server(app);
  var io = require('socket.io')(webserver);

  const bodyParser = require('body-parser');
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(fileUpload());


  // /////////////////////
  // blocks on request //
  // /////////////////////
  app.get('/blocks/:blockfile', (req, res) => {
    var blkf = req.params.blockfile;
    var dirfile = server_self.blocks_dir + blkf;
    if (blkf.indexOf('..') != -1) { return; }
    res.sendFile(dirfile);
  });


  // ///////////////////////
  // general web content //
  // ///////////////////////
  app.all('/', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
  });
  app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/web/index.html`);
  });
  app.get('/style.css', (req, res) => {
    res.sendFile(`${__dirname}/web/style.css`);
  });
  app.get('/browser.js', (req, res) => {
    // gzipped, cached -- if you enable cached
    // and gzipped, be sure to manually edit the
    // content-length to reflect the size of the
    // file
    // res.setHeader("Cache-Control", "public");
    // res.setHeader("Content-Encoding", "gzip");
    // res.setHeader("Content-Length", "368432");
    // res.sendFile(__dirname + '/web/browser.js.gz');

    // non-gzipped, non-cached
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('expires', '-1');
    res.setHeader('pragma', 'no-cache');
    res.sendFile(`${__dirname}/web/browser.js`);
  });
  app.get('/client.options', (req, res) => {
    server_self.app.storage.saveClientOptions();
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('expires', '-1');
    res.setHeader('pragma', 'no-cache');
    res.sendFile(`${__dirname}/web/client.options`);
  });

  app.get('/img/:imagefile', (req, res) => {
    var imgf = `/web/img/${req.params.imagefile}`;
    if (imgf.indexOf('\/') != false) { return; }
    res.sendFile(__dirname + imgf);
  });
  app.get('/img/graphs/:imagefile', (req, res) => {
    var imgf = `/web/img/graphs/${req.params.imagefile}`;
    if (imgf.indexOf('\/') != false) { return; }
    res.sendFile(__dirname + imgf);
  });
  app.get('/docs/:basefile', (req, res) => {
    var imgf = `/web/docs/${req.params.basefile}`;
    if (imgf.indexOf('\/') != false) { return; }
    res.sendFile(__dirname + imgf);
  });
  app.get('/jquery/:basefile', (req, res) => {
    var imgf = `/web/lib/jquery/${req.params.basefile}`;
    if (imgf.indexOf('\/') != false) { return; }
    res.sendFile(__dirname + imgf);
  });
  app.get('/qrcode/:basefile', (req, res) => {
    var imgf = `/web/lib/qrcode/${req.params.basefile}`;
    if (imgf.indexOf('\/') != false) { return; }
    res.sendFile(__dirname + imgf);
  });
  app.get('/fancybox/:filename', (req, res) => {
    var imgf = `/web/lib/fancybox/${req.params.filename}`;
    if (imgf.indexOf('\/') != false) { return; }
    res.sendFile(__dirname + imgf);
  });
  app.get('/font-awesome/css/:filename', (req, res) => {
    var imgf = `/web/lib/font-awesome/css/${req.params.filename}`;
    if (imgf.indexOf('\/') != false) { return; }
    res.sendFile(__dirname + imgf);
  });
  app.get('/font-awesome/fonts/:filename', (req, res) => {
    var imgf = `/web/lib/font-awesome/fonts/${req.params.filename}`;
    if (imgf.indexOf('\/') != false) { return; }
    res.sendFile(__dirname + imgf);
  });


  // ///////////////
  // module data //
  // ///////////////
  this.app.modules.webServer(app);


  webserver.listen(this.server.port);

  // update network with new peer
  io.on('connection', (socket) => {
    server_self.app.network.addPeerWithSocket(socket);
  });
};

Server.prototype.returnServer = function returnServer() {
  this.server.publickey = this.app.wallet.returnPublicKey();
  return this.server;
};
Server.prototype.returnServerJson = function returnServerJson() {
  return JSON.stringify(this.returnServer());
};

