var admin = require("firebase-admin");
var env = require('./services/environment');
var _ = require('lodash');

console.log('environment', env);

admin.initializeApp({
  credential: admin.credential.cert(env.firebaseConfig.serviceAccount),
  databaseURL: env.firebaseConfig.databaseURL
});

var ref = admin.database().ref();

console.log(ref.toString());

var searchService = require('./services/search')(ref);
var algoliaService = require('./services/algolia')(ref);

// ref.child('Search/Comments').once('value', function(snap) {
//   console.log('numChildren', snap.numChildren());
// });

console.log(1);
algoliaService.start()
  .then(function () {
    console.log(2);
    return searchService.listenToPosts();
  })
  .catch(function(err) {
    console.log('searchService error', err);
  });

ref.child('Queue/rebuild').on('child_changed', function() {
  console.log(3);
  algoliaService.stop();

  return searchService.rebuild()
    .then(function() {
      console.log(4);
      return algoliaService.build();
    })
    .then(function() {
      console.log(5);
      return algoliaService.start();
    });
});

// Use .build to delete and rebuild Algolia
// search.algolia.firebase.build();

// Use search.algolia.index to access the entire Algolia API

