const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = callback => {
    MongoClient.connect(`${process.env.MONGODB_STRING}`, { useUnifiedTopology: true, useNewUrlParser: true })
       .then(client => {
            console.log("MongoDB Connected!");
            _db = client.db('carpentry_shop');
            callback();
        })
        .catch(err => {

            throw err;
        });

};

const getDb = () => {
    if (_db) { return _db; }
    throw 'No database found';
}

exports.getDb = getDb;
exports.mongoConnect = mongoConnect;