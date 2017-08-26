var saito = require('../../../saito');
var ModTemplate = require('../../template');
var util = require('util');


//////////////////
// CONSTRUCTOR  //
//////////////////
function Facebook(app) {

  if (!(this instanceof Facebook)) { return new Facebook(app); }

  Facebook.super_.call(this);

  this.app               = app;

  this.name              = "Facebook";
  this.browser_active    = 0;
  this.mylastposttime    = 0;
  this.mylastcommenttime = 0;

  this.facebook          = {};
  this.facebook.firehose = 1;   // do I want ALL posts
				//
				// 1 = show me everything
				// 0 = only who i follow

  this.facebook.filter   = 0;   // do I want ALL comments
				//
				// 0 = show all comments
				// 1 = only comments from ppl I follow

  return this;

}
module.exports = Facebook;
util.inherits(Facebook, ModTemplate);






// handle options, force minimal preferences saved to wallet
Facebook.prototype.saveFacebook = function saveFacebook(app) {
  app.options.facebook = this.facebook;
  app.storage.saveOptions();
}
Facebook.prototype.updateFilter = function updateFilter(nf) {
  this.facebook.filter = nf;
  this.saveFacebook();
}
Facebook.prototype.updateFirehose = function updateFirehose(nf) {
  this.facebook.firehose = nf;
  this.saveFacebook();
}



Facebook.prototype.initializeHTML = function initializeHTML(app) {

  if (app.BROWSER == 0) { return; }


  // update name
  if (app.wallet.returnIdentifier() != "") {
    $('#saitoname').text(app.wallet.returnIdentifier());
  } else {
    $('#saitoname').text(app.wallet.returnPublicKey());
  }


  // update firehost and filter variables
  if (app.options.facebook != null) {
    this.facebook.firehose = app.options.facebook.firehose;
    this.facebook.filter   = app.options.facebook.filter;
    $('#post_options_select_firehose').val(this.facebook.firehose);
    $('#post_options_select_filter').val(this.facebook.filter);
  }


/***************
  // check to make sure we have an identifier
  if (app.wallet.returnIdentifier() == "") {

    $.fancybox({
      href            : '#lightbox_identifier_missing',
      fitToView       : false,
      width           : '600px',
      height          : '440px',
      closeBtn        : true,
      autoSize        : false,
      closeClick      : false,
      openEffect      : 'none',
      closeEffect     : 'none',
      helpers: {
        overlay : {
          closeClick : false
        }
      },
      keys : {
        close : null
      }
    });
  }
**************/


  msg = {};
  msg.id = 10;
  msg.time   = "Aug 17, 2017";
  msg.from   = "david@saito";
  msg.module = "Facebook";
  msg.title  = "Hello World";
  msg.data   = "It would be hard to identify the exact source of that inner intuition, not founded on rational argument, which prompted our refusal to enter the NKVD schools. It certainly didn't derive from the lectures on historical materialism we listened to: it was clear from them that the struggle against the internal enemy was a crucial battlefront, and to share in it was an honorable task. Our decision even ran counter to our material interests: at that time the provincial university we attended could not promise us anything more than the chance to teach in a rural school in a remote area for miserly wages. The NKVD school dangled before us special rations and double or triple pay. Our feelings could not be put into words—and even if we had found the words, fear would have prevented our speaking them aloud to one another. It was not our minds that resisted but something inside our breasts. People can shout at you from all sides: \"You must!\" And your own “head can be saying also: \"You must!\" But inside your breast there is a sense of revulsion, repudiation. I don't want to. It makes me feel sick. Do what you want without me; I want no part of it.<p></p> -- Alexander Solzhenitsyn";
  this.attachMessage(msg, app, 1);


  facebook_self = this;
  app.archives.processMessages(20, function (err, txarray) {
    for (bv = 0; bv < txarray.length; bv++) {
console.log("LOADING from ARCHIVES: "+txarray[bv].transaction.msg);
      if (txarray[bv].transaction.msg.type == "post") {
        facebook_self.addPostToWall(txarray[bv], app, 1);
      }
      if (txarray[bv].transaction.msg.type == "comment") {
        facebook_self.addCommentToPost(txarray[bv], app, 0);
      }
    }
  });


  // update friend list
  $("#following_friends_box").empty();
  facebook_friends = this.app.keys.returnKeywordArray("Facebook");
  for (ff = 0; ff < facebook_friends.length; ff++) {
    thisfriend = '<div id="following_'+ff+'" class="following_friend">' + facebook_friends[ff].identifier + '</div>';
    $("#following_friends_box").append(thisfriend);
  }


  // update account balance
  this.updateBalance(this.app);

}
//////////////////////
// Add Post to Wall //
//////////////////////
Facebook.prototype.addCommentToPost = function addCommentToPost(tx, app, prepend = 0) {

    // fetch data from tx
    msg = {};
    msg.id      = tx.transaction.id;
    msg.time    = tx.transaction.ts;
    msg.from    = tx.transaction.from[0].add;
    msg.module  = tx.transaction.msg.module;
    msg.data    = tx.transaction.msg.data;
    msg.type    = tx.transaction.msg.type;
    msg.post_id = tx.transaction.msg.post_id;

    if (msg.from == app.wallet.returnPublicKey()) {
      if (msg.time == this.mylastcommenttime) {
	//console.log("NOT ADDING COMMENT: would be repost");
	return;
      }
      this.mylastcommenttime = msg.time;
    } else {
      tocheck = "#comment_"+msg.id;
      if ($(tocheck).length > 0) { 
	//console.log("COMMENT ALREADY FOUND -- not adding");
	return; 
      }
    }

    this.attachComment(msg, app, prepend);

}
Facebook.prototype.addPostToWall = function addPostToWall(tx, app, prepend = 0) {

    // fetch data from tx
    msg = {};
    msg.id     = tx.transaction.id;
    msg.time   = tx.transaction.ts;
    msg.from   = tx.transaction.from[0].add;
    msg.module = tx.transaction.msg.module;
    msg.type   = tx.transaction.msg.type;
    msg.data   = tx.transaction.msg.data;

    if (msg.from == app.wallet.returnPublicKey()) {
      if (msg.time == this.mylastposttime) {
	tmppost_selector  = "#post_box_1";
	tmppost_update_id = "post_box_"+msg.id;
	$(tmppost_selector).attr('id',tmppost_update_id);
	return;
      }
      this.mylastposttime = msg.time;
    } else {
      tocheck = "#post_box_"+tx.transaction.id;
      if ($(tocheck).length > 0) { 
	//console.log("POST ALREADY FOUND -- not adding");
	return; 
      }
    }

    this.attachMessage(msg, app, prepend);

}
Facebook.prototype.formatComment = function formatComment(msg, app) {
  return '\
  <div class="comment" id="comment_'+msg.id+'"> \
    <table><tr><td valign="top"><div class="post_comment_avatar load_information"></div></td><td valign="top"><div class="comment_address">'+msg.from+'</div><div class="comment_name" id="comment_name_'+msg.id+'">'+this.formatAuthor(msg.from, app, msg)+'</div> - <div class="comment_text">'+msg.data+'</div></td></tr></table> \
  </div> \
';
}
Facebook.prototype.formatNewPost = function formatNewPost(app) {
  return '\
<div class="post_box" id="post_box_create">\
  <div class="post_header"> \
    <div class="post_header_avatar load_information"> \
    </div> \
    <div class="post_header_titlebox"> \
      <div class="post_header_name">'+this.formatAuthor(app.wallet.returnPublicKey(), app)+'</div> \
      <div class="post_header_date">'+this.formatDate(new Date().getTime())+'</div> \
    </div> \
  </div> \
  <div class="post_create"><textarea id="post_create_textarea" class="post_create_textarea"></textarea></div> \
  <div class="facebook_button publish_button" id="publish_button" alt="publish"><i class="fa fa-upload"></i> <div class="post_controls_label">PUBLISH</div></div> \
</div> \
';
}
Facebook.prototype.formatPost = function formatPost(msg, app) {
  return '\
<div class="post_box" id="post_box_'+msg.id+'">\
  <div class="post_header"> \
    <div class="post_header_avatar load_information"> \
    </div> \
    <div class="post_header_titlebox"> \
      <div class="post_header_name">'+this.formatAuthor(msg.from, app, msg)+'</div> \
      <div class="post_header_date">'+this.formatDate(msg.time)+'</div> \
      <div class="post_header_address">'+msg.from+'</div> \
    </div> \
  </div> \
  <div class="post_content">'+msg.data+'</div> \
  <div class="post_controls"> \
    <div id="post_controls_like_'+msg.id+'" class="post_controls_item post_controls_like" alt="like"><i class="fa fa-heart-o"></i> <div class="post_controls_label">LIKE</div></div> \
    <div id="post_controls_comment_'+msg.id+'" class="post_controls_item post_controls_comment" alt="comment"><i class="fa fa-comment-o"></i> <div class="post_controls_label">COMMENT</div></div> \
    <div id="post_controls_share_'+msg.id+'" class="post_controls_item post_controls_share" alt="share"><i class="fa fa-share-alt"></i> <div class="post_controls_label">SHARE</div></div> \
  </div> \
  <div class="post_commentbox"> \
    <div class="post_comments"> \
    </div> \
    <div class="post_comments_create"> \
    </div> \
  </div> \
</div> \
';
}
Facebook.prototype.formatNewComment = function formatNewComment(msg, app) {
  return '\
  <textarea id="post_comments_create_textarea" class="post_comments_create_textarea"></textarea> \
  <div class="facebook_button post_comments_button" id="comment_button_'+msg.id+'" alt="publish"><i class="fa fa-upload"></i> <div class="post_controls_label">LEAVE COMMENT</div></div> \
';
}

Facebook.prototype.attachComment = function attachComment(msg, app, prepend = 0) {
  cbsel = "#post_box_" + msg.post_id + " > .post_commentbox > .post_comments";
  if (prepend == 0) {
    $(cbsel).append(this.formatComment(msg, app));
  } else {
    $(cbsel).prepend(this.formatComment(msg, app));
  }
  this.attachEvents(app);
}
Facebook.prototype.attachMessage = function attachMessage(msg, app, prepend = 0) {
  if (prepend == 0) {
    $('#posts').append(this.formatPost(msg, app));
  } else {
    $('#posts').prepend(this.formatPost(msg, app));
  }
  this.attachEvents(app);
}
Facebook.prototype.attachEvents = function attachEvents(app) {

  facebook_self = this;


  $('.post_header_name').off();
  $('.post_header_name').on('click', function() {
    var addthisuser = confirm("Do you want to follow this user?");
    if (addthisuser) {
      identifier = $(this).text(); 
      publickey  = $(this).next().next().text(); 
      app.keys.addKey(publickey, identifier, 1, "Facebook");
      app.keys.saveKeys();
      facebook_self.showBrowserAlert("Account Followed");
      facebook_self.initializeHTML(app);
      facebook_self.attachEvents(app);
    }
  });

  $('.comment_name').off();
  $('.comment_name').on('click', function() {
    var addthisuser = confirm("Do you want to follow this user?");
    if (addthisuser) {
      identifier = $(this).text();
      publickey  = $(this).next().next().text();
      app.keys.addKey(publickey, identifier, 1, "Facebook");
      app.keys.saveKeys();
      facebook_self.showBrowserAlert("Account Followed");
      facebook_self.initializeHTML(app);
      facebook_self.attachEvents(app);
    }
  });


  $('#settings').off();
  $('#settings').on('click', function() {

    $.fancybox({
      href            : '#lightbox_settings',
      fitToView       : false,
      width           : '600px',
      height          : '440px',
      closeBtn        : true,
      autoSize        : false,
      closeClick      : false,
      openEffect      : 'none',
      closeEffect     : 'none',
      helpers: {
        overlay : {
          closeClick : false
        }
      },
      keys : {
        close : null
      }
    });

  });


  $('#post_options_select_firehose').off();
  $('#post_options_select_firehose').on('click', function() {
    newval = $(this).val();
    facebook_self.facebook.firehose = newval;
    facebook_self.saveFacebook(facebook_self.app);
  });


  $('#post_options_select_filter').off();
  $('#post_options_select_filter').on('click', function() {
    newval = $(this).val();
    facebook_self.facebook.filter = newval;
    facebook_self.saveFacebook(facebook_self.app);
  });


  $('.load_information').off();
  $('.load_information').on('click', function() {

    $.fancybox({
      href            : '#lightbox_information',
      fitToView       : false,
      width           : '600px',
      height          : '440px',
      closeBtn        : true,
      autoSize        : false,
      closeClick      : false,
      openEffect      : 'none',
      closeEffect     : 'none',
      helpers: {
        overlay : {
          closeClick : false
        }
      },
      keys : {
        close : null
      }
    });

  });




  $('#add_friend').off();
  $('#add_friend').on('click', function() {

    $.fancybox({
      href            : '#lightbox_follow',
      fitToView       : false,
      width           : '300px',
      height          : '140px',
      closeBtn        : true,
      autoSize        : false,
      closeClick      : false,
      openEffect      : 'none',
      closeEffect     : 'none',
      helpers: {
        overlay : {
          closeClick : false
        }
      },
      keys : {
        close : null
      },
      afterShow : function(){

        $('.lightbox_follow_submit').off();
        $('.lightbox_follow_submit').on('click', function() {

          newfriend = $('.lightbox_follow_input').val();
	  if (facebook_self.isPublicKey(newfriend) == 1) {

		  answer = newfriend.substring(0,12) + "...";

	  	  // add them
                  app.keys.addKey(newfriend, answer, 1, "Facebook");
		  app.keys.saveKeys();

                  facebook_self.showBrowserAlert("Account Followed");

                  $.fancybox.close();

                  facebook_self.initializeHTML(app);
                  facebook_self.attachEvents(app);

	  } else {

            app.dns.fetchRecordFromAppropriateServer(newfriend, function(answer) {

              if (answer == "server not found") {
                facebook_self.showBrowserAlert("To follow this account, you need to add a DNS server that tracks this domain. Alternately, just provide their public key directly");
	        return;
              }
	      if (answer == "dns server publickey changed") {
                facebook_self.showBrowserAlert("Cannot lookup public key of this account -- your DNS server is using an out-of-date publickey");
	        return;
	      }
	      if (answer == "no dns servers") {
	        facebook_self.showBrowserAlert("To follow this account, you need to add a DNS server that tracks this domain. Alternately, just provide their public key directly");
	        return;
	      } else {
                if (answer == "") {
                  facebook_self.showBrowserAlert("DNS server cannot find a record for this user");
                } else {

	  	  // add them
                  app.keys.addKey(answer, newfriend, 1, "Facebook");
		  app.keys.saveKeys();

                  facebook_self.showBrowserAlert("Account Followed");

                  $.fancybox.close();

                  facebook_self.initializeHTML(app);
                  facebook_self.attachEvents(app);

                  // send an email to the recipient
                  to = answer;
                  from = app.wallet.returnPublicKey();
                  amount = 0.0;
                  fee = 0.005;

                  server_email_html = 'You have a new follower: \
<p></p> \
The account with this public key: \
<p></p> \
'+ answer +' \
<br /> \
'+ facebook_self.app.wallet.returnIdentifier() +' \
<p></p> \
Is now following you on the Saito network. \
';

                  newtx = app.wallet.createUnsignedTransactionWithFee(to, amount, fee);
                  newtx.transaction.msg.module = "Email";
                  newtx.transaction.msg.data   = server_email_html;
                  newtx.transaction.msg.title  = "New Facebook Follower!";
                  newtx = app.wallet.signTransaction(newtx);
                  app.blockchain.mempool.addTransaction(newtx);
                  app.network.propagateTransaction(newtx);

		}
              }
            });
          }
        });
      }
    });
  });



  $('#publish_button').off('click');
  $('#publish_button').on('click', function() {

    tmppost = $('#post_create_textarea').val();
    publickeyaddress = app.wallet.returnPublicKey();
    amount = 0.0;
    fee = 0.0;

    newtx = app.wallet.createUnsignedTransactionWithFee(publickeyaddress, amount, fee);
    newtx.transaction.msg.module = "Facebook";
    newtx.transaction.msg.data   = tmppost;
    newtx.transaction.msg.type   = "post";
    newtx = app.wallet.signTransaction(newtx);
    app.network.propagateTransaction(newtx);
    facebook_self.addPostToWall(newtx, app, 1);

    $('#post_box_create').remove();

  });


  $('#new_post').off('click');
  $('#new_post').on('click', function() {
    $('#posts').prepend(facebook_self.formatNewPost(app));
    $('#post_create_textarea').focus();
    facebook_self.attachEvents(app);
  });



  $('.post_controls_like').off('click');
  $('.post_controls_like').on('click', function() {
     id = $(this).attr('id');
     msgid = id.substring(19);

     publickey_selector = "#post_box_" + msg.id + " > .post_header > .post_header_titlebox > .post_header_address";
     publickeyaddress = $(publickey_selector).text();
     amount = 0.0;
     fee = 0.0005;

     iam = facebook_self.app.wallet.returnIdentifier();
     if (iam == "") { iam = facebook_self.app.wallet.returnPublicKey().substring(0, 20) + "..."; }
     like_email = iam + ' liked your post';

     newtx = app.wallet.createUnsignedTransactionWithFee(publickeyaddress, amount, fee);
     newtx.transaction.msg.module  = "Email";
     newtx.transaction.msg.data    = like_email;
     newtx.transaction.msg.title   = like_email;
     newtx = app.wallet.signTransaction(newtx);
     app.network.propagateTransaction(newtx);
     alert("You liked this Post");
   });



  $('.post_controls_comment').off('click');
  $('.post_controls_comment').on('click', function() {
     id = $(this).attr('id');
     msg = {}; msg.id = id.substring(22);
     pcc = facebook_self.formatNewComment(msg,app);
     
     tmpselector  = "#post_box_" + msg.id + " > .post_commentbox > .post_comments_create";
     $('.post_comments_create').hide();
     $('.post_comments_create').empty();
     $(tmpselector).html(pcc);
     $(tmpselector).slideDown();
     facebook_self.attachEvents(app);

     // scroll to comment box
     //$('html, body').animate({
     //   scrollTop: $(".post_comments_create").offset().top
     //}, 2000);

   });





   $('.post_comments_button').off('click');
   $('.post_comments_button').on('click', function() {
     id = $(this).attr('id');
     msg = {}; msg.id = id.substring(15);
     tmpcomment = $('#post_comments_create_textarea').val();

     publickey_selector = "#post_box_" + msg.id + " > .post_header > .post_header_titlebox > .post_header_address";
     publickeyaddress = $(publickey_selector).text();
     amount = 0.0;
     fee = 0.0005;

     newtx = app.wallet.createUnsignedTransactionWithFee(publickeyaddress, amount, fee);
     newtx.transaction.msg.module  = "Facebook";
     newtx.transaction.msg.type    = "comment";
     newtx.transaction.msg.data    = tmpcomment;
     newtx.transaction.msg.post_id = msg.id;
     newtx = app.wallet.signTransaction(newtx);
     app.network.propagateTransaction(newtx);
     facebook_self.addCommentToPost(newtx, app, 0);
     $('.post_comments_create').slideUp().empty();

   });



  $('.post_controls_share').off('click');
  $('.post_controls_share').on('click', function() {

     id = $(this).attr('id');
     msgid = id.substring(20);

     postauthorid = '';
     postauthorpk = '';
     postbody = '';

     tmpselector  = "#post_box_" + msg.id + " > .post_header > .post_header_titlebox > .post_header_address";
     postauthorpk = $(tmpselector).text();

     tmpselector  = "#post_box_" + msg.id + " > .post_header > .post_header_titlebox > .post_header_name";
     postauthorid = $(tmpselector).text();

     tmpselector  = "#post_box_" + msg.id + " > .post_content";
     postbody     = $(tmpselector).text();

     if (postauthorpk == facebook_self.app.wallet.returnPublicKey()) {
       facebook_self.showBrowserAlert("You cannot share your own posts");
       return;
     }

     amount = 0.0;
     fee    = 0.0005;

     post_to_share = postbody + '<p></p><b>original poster: </b>';
     if (postauthorpk != "") { post_to_share += '<span class="comment_name">'+postauthorid+'</span>'; }
     post_to_share += '<br><div class="publickey_small">'+postauthorpk+'</div>'; 

     myid = "";
     if (facebook_self.app.wallet.returnIdentifier() != "") { myid = facebook_self.app.wallet.returnIdentifier() + "<br />"; }
     myid += facebook_self.app.wallet.returnPublicKey();
     share_email = 'Your post has been shared:<p></p>The user who shared it is: <p></p> '+ myid;

     newtx = app.wallet.createUnsignedTransactionWithFee(facebook_self.app.wallet.returnPublicKey(), amount, fee);
     newtx.transaction.msg.module = "Facebook";
     newtx.transaction.msg.data   = post_to_share;
     newtx.transaction.msg.type   = "post";
     newtx = app.wallet.signTransaction(newtx);
     app.network.propagateTransaction(newtx);
     facebook_self.addPostToWall(newtx, app, 1);

     newtx = app.wallet.createUnsignedTransactionWithFee(postauthorpk, amount, fee);
     newtx.transaction.msg.module  = "Email";
     newtx.transaction.msg.data    = share_email;
     newtx.transaction.msg.title   = "someone has shared your post!";
     newtx = app.wallet.signTransaction(newtx);
     app.network.propagateTransaction(newtx);

   });

}







/////////////////////////
// Handle Web Requests //
/////////////////////////
Facebook.prototype.webServer = function webServer(app, expressapp) {

  expressapp.get('/facebook/', function (req, res) {
    res.sendFile(__dirname + '/web/index.html');
    return;
  });
  expressapp.get('/facebook/style.css', function (req, res) {
    res.sendFile(__dirname + '/web/style.css');
    return;
  });

}





//////////////////////////
// Handle Peer Requests //
//////////////////////////
Facebook.prototype.handlePeerRequest = function handlePeerRequest(app, message, peer, mycallback) {
}






//////////////////
// Confirmation //
//////////////////
Facebook.prototype.onConfirmation = function onConfirmation(tx, conf, app) {

  if (app.BROWSER == 0) { return; }

  // facebook all zero-conf
  if (conf == 0) {

    myfacebook = app.modules.returnModule("Facebook");

    am_i_following = 0;
    is_for_me      = 0;

    if (app.keys.isWatched(tx.transaction.to[0].add) == 1) {
      am_i_following = 1;
    }
    if (tx.transaction.to[0].add == app.wallet.returnPublicKey()) {
      is_for_me = 1;
    }


    // "this" is technically the array that calls us, so we have
    // to use a roundabout way of accessing the functions in our
    // email module in the onConfirmation function.
    //
    if (tx.transaction.msg.type == "post" && (am_i_following == 1 || myfacebook.facebook.firehose == 1)) {
      app.modules.returnModule("Facebook").addPostToWall(tx, app, 1);
    }
    if (tx.transaction.msg.type == "comment") {
      if (myfacebook.facebook.filter == 0) {
        // show everything
        app.modules.returnModule("Facebook").addCommentToPost(tx, app, 1);
      } else {
        // only watching my comments
        if (am_i_following == 1) {
          app.modules.returnModule("Facebook").addCommentToPost(tx, app, 1);
        }
      }
    }


    // ONLY SAVE IF I FOLLOW
    if (am_i_following == 1) {
      app.archives.saveMessage(tx);
    }

  }
}



Facebook.prototype.updateBalance = function updateBalance(app) {
  if (app.BROWSER == 0) { return; }
  $('#balance_money').html(app.wallet.returnBalance().replace(/0+$/,'').replace(/\.$/,'\.0'));
}








Facebook.prototype.formatDate = function formateDate(unixtime) {

  x    = new Date(unixtime);
  nowx = new Date();

  y = "";
  
  if (x.getMonth()+1 == 1) { y += "Jan "; }
  if (x.getMonth()+1 == 2) { y += "Feb "; }
  if (x.getMonth()+1 == 3) { y += "Mar "; }
  if (x.getMonth()+1 == 4) { y += "Apr "; }
  if (x.getMonth()+1 == 5) { y += "May "; }
  if (x.getMonth()+1 == 6) { y += "Jun "; }
  if (x.getMonth()+1 == 7) { y += "Jul "; }
  if (x.getMonth()+1 == 8) { y += "Aug "; }
  if (x.getMonth()+1 == 9) { y += "Sep "; }
  if (x.getMonth()+1 == 10) { y += "Oct "; }
  if (x.getMonth()+1 == 11) { y += "Nov "; }
  if (x.getMonth()+1 == 12) { y += "Dec "; }

  y += x.getDate();
  
  if (x.getFullYear() != nowx.getFullYear()) {
    y += " ";
    y += x.getFullYear();
  }

  return y;

}

Facebook.prototype.formatAuthor = function formatAuthor(author, app, msg=null) {

  x = this.app.keys.findByPublicKey(author);
  if (x != null) { return x.identifier; }

  if (this.isPublicKey(author) == 1) { 
    if (msg != null) {
      app.dns.fetchIdFromAppropriateServer(author, function(answer) {
        if (answer == "publickey not found") { return; }
        tmpselect = "";
        if (msg.type == "post")    { tmpselect = "#post_box_" + msg.id + " > .post_header > .post_header_titlebox > .post_header_name"; }
        if (msg.type == "comment") { tmpselect = "#comment_name_" + msg.id; }
 	$(tmpselect).html(answer);
      });
    }
    return author.substring(0, 30) + "...";
  }

  return author;

}
Facebook.prototype.isPublicKey = function isPublicKey(publickey) {
  if (publickey.length == 66) {
    return 1;
  }
  return 0;
}

Facebook.prototype.showBrowserAlert = function showBrowserAlert(message="error") {
  if (this.app.BROWSER == 0) { return; }
  alert(message);
}


