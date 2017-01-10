var FirebaseSearch = require('quiver-firebase-search');
var env = require('./environment');

module.exports = function (ref) {
  console.log('inside algolia.js', env);
  var commentsSearchRef = ref.child('Search/Comments');
  var search = new FirebaseSearch(commentsSearchRef, {
    algolia: env.algolia
  }, 'Comments');

  console.log(commentsSearchRef.toString());
  console.log(search.algolia.firebase.start);

  return {
    build: search.algolia.firebase.build.bind(search.algolia.firebase),
    start: search.algolia.firebase.start.bind(search.algolia.firebase),
    stop: search.algolia.firebase.stop.bind(search.algolia.firebase),
    search: search
  };
};