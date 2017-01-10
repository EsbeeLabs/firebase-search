var admin = require("firebase-admin");
var env = require('./environment.json');
var FirebaseSearch = require('quiver-firebase-search');
var _ = require('lodash');

admin.initializeApp({
  credential: admin.credential.cert(env.firebaseConfig.serviceAccount),
  databaseURL: env.firebaseConfig.databaseURL
});

var ref = admin.database().ref();
var postsRef = ref.child('Posts');
var commentsSearchRef = ref.child('Search/Comments');

var search = new FirebaseSearch(commentsSearchRef, {
  algolia: env.algolia
}, 'Comments');

// search.algolia.firebase.build()
//   .catch(function() {
//     return true;
//   })
//   .then(function () {
//     return search.algolia.firebase.start();
//   })
search.algolia.firebase.start()
  .then(function () {
    return listenToPosts();
  });

// Use .build to delete and rebuild Algolia
// search.algolia.firebase.build();

// Use search.algolia.index to access the entire Algolia API

function syncPostComments(postId, post) {
  var commentKeys = Object.keys(post.comments || {});
  var i = commentKeys.length;
  var updates = {};
  var key;
  var comment;

  while (i--) {
    key = commentKeys[i];
    comment = post.comments[key];
    updates[key] = {
      userComment: comment.userComment,
      postId: postId,
      // userName: comment.userName
    };
  }
  return commentsSearchRef.update(updates);
};

function removePostComments(postId) {
  return commentsSearchRef.orderByChild('postId').equalTo(postId).once('value')
    .then(function (snap) {
      var commentSearchKeys = Object.keys(snap.val() || {});
      var i = commentSearchKeys.length;
      var updates = {};

      while (i--) {
        updates[commentSearchKeys[i]] = null;
      }

      return commentsSearchRef.update(updates);
    });
};

function isCommentEqual(a, b) {
  return a.userComment == b.userComment && a.postId == b.postId;
};

function updatePostComments(postId, post) {
  var postComments = post.comments || {};
  var commentKeys = Object.keys(postComments);
  return commentsSearchRef.orderByChild('postId').equalTo(postId).once('value')
    .then(function (snap) {
      var updates = {};
      var searchKeys = Object.keys(snap.val() || {});
      var toRemove = _.difference(searchKeys, commentKeys);

      toRemove.forEach(function (key) {
        updates[key] = null;
      });

      for (var key in postComments) {
        updates[key] = {
          postId: postId,
          userComment: postComments[key].userComment
        };
      }

      return commentsSearchRef.update(updates);
    });
};

function listenToPosts() {
  postsRef.orderByKey().limitToLast(1).on('child_added', function (snap) {
    syncPostComments(snap.key, snap.val())
      .catch(function() {
        console.log('syncPostComments error', err);
      });
  });

  postsRef.on('child_removed', function (snap) {
    removePostComments(snap.key);
  });

  postsRef.on('child_changed', function (snap) {
    updatePostComments(snap.key, snap.val());
  });

  return true;
};

