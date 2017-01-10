var env;
try {
  env = require('../environment.json');
} catch (e) {
  env = {
    "firebaseConfig": {
      "serviceAccount": process.env.FIREBASE_SERVICE_ACCOUNT,
      "databaseURL": process.env.FIREBASE_DATABASE_URL
    },
    "algolia": {
      "applicationID": process.env.ALGOLIA_APPLICATION_ID,
      "searchAPIKey": process.env.ALGOLIA_SEARCH_API_KEY,
      "monitoringAPIKey": process.env.ALGOLIA_MONITORING_API_KEY,
      "apiKey": process.env.ALGOLIA_API_KEY
    }
  };
}

module.exports = env;