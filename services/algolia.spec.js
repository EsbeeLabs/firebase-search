const admin = require('firebase-admin');
const env = require('../environment.test.json');
var credential = admin.credential.cert(env.firebaseConfig.serviceAccount);

admin.initializeApp({
  databaseURL: env.firebaseConfig.databaseURL,
  credential
});
const ref = admin.database().ref('test/algolia-service');
const AlgoliaService = require('./algolia');

let searchRef, algoliaService, search;
beforeEach(() => {
  algoliaService = new AlgoliaService(ref, { index: 'test:comments', env: env });
  search = algoliaService.search;
  searchRef = ref.child('Search/Comments');

  search.on('all', function(record) {
    console.log('event', record);
  });
});

describe('Aloglia Service', () => {
  beforeEach(done => clean().then(done));
  afterEach(done => clean().then(done));

  function clean() {
    return Promise.resolve().then(() => searchRef.remove()).then(() => search.algolia.clearIndex());
  }

  it(
    'should sync new items up to Algolia',
    done => {
      const fakeEntries = createFakeEntries();
      const updates = fakeEntries.reduce(
        (updates, entry) => {
          updates[entry.postId] = entry;
          return updates;
        },
        {}
      );

      let counter = 0;
      search.on('algolia_child_added', function(record) {
        counter++;
        console.log('algolia_child_added', counter, record);
      });

      // searchRef.on('child_added', snap => {
      //   console.log('child_added', snap.ref.toString());
      // });

      algoliaService.start().then(() => searchRef.update(updates));
    },
    60000
  );

  function createFakeEntries(n = 5) {
    var i = n;
    var fakeEntries = [];
    while (i--) {
      fakeEntries.push({
        postId: `test-${i}`,
        userComment: `#fake #${i}`,
        userCommentParts: ['#fake', `#${i}`]
      });
    }
    return fakeEntries;
  }
});
