let  MongoClient = require('mongodb').MongoClient;
const _ = require("lodash");
let  ObjectID = require('mongodb').ObjectID;
let  ACCESS_KEYS = require("config").ACCESS_KEYS;

class DataStorage {

    constructor() {
          
    }

    dBConnection() {
        const resolver = (resolve, reject) => {
            if (this.db && this.db.serverConfig.isConnected()) {
                resolve(this.db)
            } else {

                var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'] || null;
                console.log("URI", uri);
                
                try {
                    console.log('=> connecting to database');
                    MongoClient.connect(uri,  (err, db) => {
                        if (err) {
                            reject(err);                   
                        } else {
                            this.db = db;
                            resolve(db)
                        }
                    });
                }
                catch (err) {
                    reject(err);
                }

            }

        }

        return new Promise(resolver);
    }

    test() {
        return new Promise((resolve, reject) => {
            this.dBConnection()
            .then(dbConnection => {
                //dbConnection.close();
                resolve(123)
            })
            .catch(err => reject(err))
        })

    }

    getProcess(user, id) {
        let dbConnection;

        return new Promise((resolve, reject) => {
            this.dBConnection()
            .then(conn => {
                dbConnection = conn;
                const collection = dbConnection.db('general_data').collection('process');
    
        
                const options = {
                    "limit": 20
                };
            
                collection.findOne({'user': user, '_id':ObjectID(id)})
                .then(d => {
                    resolve(d);
                })
                .catch(err => {
                    reject(err);
                })
                
            })                
            .catch(err => {
                reject(err);
            })

 
        })


    }

    getProcessCollection(user) {
        let dbConnection;

        return new Promise((resolve, reject) => {
            this.dBConnection()
            .then(conn => {
                dbConnection = conn;
                const collection = dbConnection.db('general_data').collection('process');
    
        
                const options = {
                    "limit": 20
                };
            
                var cursor = collection.find({user: user});
                
                return cursor.toArray();  // Promise
            })
            .then(data => {
                dbConnection.close();
                resolve(data);
            })
            .catch(err => {
                reject(err);
            })
        })


    }

    createProcess(user, data) {
        let dbConnection;
    
        return new Promise((resolve, reject) => {
            this.dBConnection()
            .then(conn => {
                dbConnection = conn;
                const collection = dbConnection.db('general_data').collection('process');
    
                let objectToInsert = _.clone(data); 
                objectToInsert.user = user;
                
                // JSON.parse(data);
                //const claims = getClaims(event);
                //const userId = claims && claims.sub;
            
                //objectToInsert['userId']=userId;
            
                collection.insertOne(objectToInsert)
                .then((r) => {                
                    resolve(objectToInsert);
                })
                .catch((err) => {
                    reject(err);
                })

            })
            .catch(err => {
                reject(err);
            })
        })
    
    
    }

    createEvent(user, processId, event) {
        let dbConnection;

        return new Promise((resolve, reject) => {
            this.dBConnection()
            .then(conn => {
                dbConnection = conn;
                const collection = dbConnection.db('general_data').collection('process');
    
        
                const options = {
                    "limit": 20
                };
            
                return collection.findOne({'user': user, '_id':ObjectID(processId)})
            })   
            .then(process => {
                const collection = dbConnection.db('general_data').collection('process');

                process.events = process.events || [];

                event.timeStamp = new Date();
                process.events.push(event);

                return collection.findAndModify(
                    {'_id':ObjectID(processId)}, // query
                    [],  // sort order
                    {$set: {events: process.events}}, // replacement, replaces only the field "hi"
                    {}
                );
            })
            .then(d => {
                resolve(d);
            })             
            .catch(err => {
                reject(err);
            })

 
        })


    }

    getClaimsFromKey(key) {
        return ACCESS_KEYS[key] || {};
    }


}

const dataStorage = new DataStorage();


module.exports = dataStorage;