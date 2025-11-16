// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const MongoClient = require('mongodb').MongoClient;
const url = process.env.MONGO_CONNECTION;
//const url = "mongodb://localhost:27017";
//const url = "mongodb+srv://ezapimongoadmin:JRVvuh9D5V0IZxCW@cluster0.z8ggg.gcp.mongodb.net/test?retryWrites=true&w=majority";

// Reference - https://stackoverflow.com/a/24634454
// var db;

// module.exports = {
//     connectToServer: function (dbname, callback) {
//         console.log('connecting ' + dbname)
//         MongoClient.connect(url, { useUnifiedTopology: true }, function (err, client) {
//             console.log(dbname)
//             db = client.db('ezapi');
//             return callback(err);
//         });
//     },

//     getDb: function () {
//         return db;
//     }
// };

exports.connectToServer = async (dbname) => {
    const client = await MongoClient.connect(url, { useUnifiedTopology: true })
    if (client) {
        let db = client.db(dbname)
        return {
            client: client,
            db: db
        }
    }
}
