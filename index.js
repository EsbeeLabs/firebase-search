var admin = require("firebase-admin");
var env = require('./services/environment');
var _ = require('lodash');
var credential;

if (process.env.FIREBASE_PRIVATE_KEY) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  });
} else {
  credential = admin.credential.cert(env.firebaseConfig.serviceAccount);
}

console.log(JSON.stringify(credential));
console.log("\n\n");
console.log(process.env.FIREBASE_PRIVATE_KEY);

credential.certificate_.privatekey = credential.certificate_.privatekey.replace(/\\\\n/, '\n');

console.log("\n\n");
console.log(process.env.FIREBASE_PRIVATE_KEY);

admin.initializeApp({
  credential: credential,
  databaseURL: env.firebaseConfig.databaseURL
});

var ref = admin.database().ref();
var searchService = require('./services/search')(ref);
var algoliaService = require('./services/algolia')(ref);

try {
  ref.child('Search/Comments').once('value', function (snap) {
    console.log('numChildren', snap.numChildren());
  })
    .catch(function (error) {
      console.log('numChildren error', error);
    });

} catch (e) {
  console.log('catch error', e);
}

console.log(1);
algoliaService.start()
  .catch(function (err) {
    console.log('err', err);
  });

searchService.listenToPosts();

console.log('setting up rebuild', ref.child('Queue/rebuild').toString());
ref.child('Queue/rebuild').on('child_changed', function () {
  console.log(3);
  algoliaService.stop();

  console.log(4);
  return searchService.rebuild()
    .then(function () {
      console.log(5);
      return algoliaService.build();
    })
    .then(function () {
      console.log(6);
      return algoliaService.start();
    });
});

// Use .build to delete and rebuild Algolia
// search.algolia.firebase.build();

// Use search.algolia.index to access the entire Algolia API

