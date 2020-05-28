const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db = null;

const mongoConnect = (callback) => {

    MongoClient.connect('mongodb+srv://daviduser:H6XgZKFbZFXh7g3p@cluster0-tipvi.mongodb.net/shop?retryWrites=true&w=majority', {useUnifiedTopology: true})
        .then( client => {
            console.log('CONNECTED!');
            _db = client.db();
            callback();
        })
        .catch( err => {
            console.log(err);
            throw err;
        });
}

const getDB = () => {
    if (_db) {
        return _db;
    }
    throw 'No database found!';
}

module.exports = {
    mongoConnect,
    getDB
};