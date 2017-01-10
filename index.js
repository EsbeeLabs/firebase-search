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

console.log(credential.certificate_.privateKey);
console.log("\n\n");
console.log(process.env.FIREBASE_PRIVATE_KEY);

credential.certificate_.privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCUuFdMyZjyzWT9\nJLSAHo9+BRllHJ1EFxa0m35S1g/s0sipt80vvr3T9oti5Pe5NQqSSsUpwhAsB8v+\nitzfKT3+gAqEHcQ0ijOCQZ65Oh3GeHG80vS44Xp+61cJA1IsTdJteggMvV3wvQis\nEEX23bc1MvsOQNU1VleUhXuAvC6RIYv8eR78vyY8wX0i5CAKVmHL2TqulUvPq5LX\nh+U0AP3Je/8LwKnU3iGzAigb/REK71e2X+zvV5q3WRH0VmHgb1ftQ3M65Ph2MARS\nfxayLMknSk1TrvYtUiOnoX+KFkCeCNFqIbRmU245yVU56hB2NhSKF0EO3r9SuhyU\n7UdLDD1TAgMBAAECggEBAImNlvFm5Rht8SJSeMCng4DDpqFmve7kjBOwXj6vzzr0\nGrUfU6D9gwYx2uo1bQrYjFaS4Zml7N9MttlQBspBkx15wEBCZ99QlCO+HdikcDXJ\n4SkM1VzK8EnD0lR7xd1EfYTUge2GmQS5UvQSeSPEHlgONzcPsCQNICQ28ew4IboJ\nLEY9gH+S/9j8LEo3Z9qhzSue5KnahQgE2zP1U5RMxFefH9t2AQbUYJeuZivw8T/b\nnGkbL2eGdFwHVxvMoDUQ5v2wcNUcb6yBbxG98Hg3/z9ihOnv4sMXozrMH7Q8gD7z\nJ/7+Hr1yziPwL4ZbXHKhg/KHoszY7dnzlWCym5cr5AECgYEAw8sGXtgOoOMZ+Cm6\nvtJJQG/VSSoKGa3S4HnrmkeFh/U8smWPjbkUlS2yL+NeZU6/i6MzWJBY2EQw+Vew\nM6P6pJ7esTAphGqaQduOnxLiwhQoiYCj3vj4tskWLZ4fzRJHsW2UtTWfcBr6jlnY\nZSb/ymyPQ6VPpvTrG0F3t1xqxpMCgYEAwnOyLE5eBE2Ktgm8NPve4KKt9Kgf08GD\nZ/blvxMh7Gapw0M03/tlpRD9Z5JK9blcpcZhFOIhI0V2Mnqk6eEGZ37P3gcG+sgb\n183ib8H8Y3u6MPg40VJOyiS4r0WuiOsNN2zdaw4qs/+HTcpu+bx8b6s3a6N8q4/X\nHeQqrF9yJkECgYBYBK9Kd+qrnSyRiYDwQ+y2URAbIhEEVkZUr7qg0sJOyoqM0Gdm\nmOuN3MscCCTpeitWBPoSOGIYZx91GFyX+oG0+8607Sfc5WePb7p//KeABDvtBK2m\nkVqOIXwc6db2A9/C/bY6eG7CoP4+fFlxr8SSJZeKG4jhT31Z9WZyQdOmjQKBgBq5\naeBa+OLggVLZbateflgjI4M/Y/hnXRb5wMOM7pmd1nEGmIq781FHT3xfh7vTuN7z\nr73+Ag3l6wOvBWE7UvUAYbMjBhuLSwBSxG8VmwlVJNa8Fpr2E+wGNfeovP8GRu+6\nH4gqD0ZjtQXE75GVDQkP3/MEKgsuHqN2C0NbbsXBAoGBAKwfAqJ9oxBOHvi2JX8Q\nLNx9fDtmu2QN1WxsLycCgp8JOcuYoABHjUhjCP5+dTcko28ldOEi579F6bMiICOg\n3QgfQ6rnYrViX1Tlza9zpUe9nISGCuzq3mDuG5WWPdxQeaboN8wZ3ley6HDG4qNw\n4l6fkAtPC882k3T+0wwAAg2t\n-----END PRIVATE KEY-----\n";

console.log("\n\n");
console.log(credential.certificate_.privateKey);

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

