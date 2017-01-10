var admin = require("firebase-admin");
var env = require('./services/environment');
var _ = require('lodash');


admin.initializeApp({
  credential: admin.credential.cert(env.firebaseConfig.serviceAccount),
  databaseURL: env.firebaseConfig.databaseURL
});

var ref = admin.database().ref();
var searchService = require('./services/search')(ref);
var algoliaService = require('./services/algolia')(ref);

// ref.child('Search/Comments').once('value', function(snap) {
//   console.log('numChildren', snap.numChildren());
// }

console.log(1);
algoliaService.start()
  .catch(function(err) {
    console.log('err', err);
  });
searchService.listenToPosts()
  .catch(function(err) {
    console.log('err', err);
  });

console.log('setting up rebuild', ref.child('Queue/rebuild').toString());
ref.child('Queue/rebuild').on('child_changed', function() {
  console.log(3);
  algoliaService.stop();

  console.log(4);
  return searchService.rebuild()
    .then(function() {
      console.log(5);
      return algoliaService.build();
    })
    .then(function() {
      console.log(6);
      return algoliaService.start();
    });
});

// Use .build to delete and rebuild Algolia
// search.algolia.firebase.build();

// Use search.algolia.index to access the entire Algolia API

