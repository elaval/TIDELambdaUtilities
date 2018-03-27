// Require the framework and instantiate it
const api = require('lambda-api')()

const _ = require("lodash");
const dataStorage = require('./dataStorage');

 
// Get claims from Authorization JWT token
api.use(function(req,res,next) {
    if (req.headers.authorization || req.headers.Authorization) {
        const token = req.headers.authorization || req.headers.Authorization;
        const tokenData = token.split('.')[1];
        const buf = Buffer.from(tokenData, 'base64').toString();
        const claims = JSON.parse(buf);
        req.claims = claims;
    } else if (req.query.access_key) {
        const claims = dataStorage.getClaimsFromKey(req.query.access_key)
        req.claims = claims;
    } 
    if (req.claims && req.claims.sub) {
        next()
    } else {
        res.status(401).error('Not Authorized')
    }
})

// Define a route
api.get('/process', function(req,res) {

    const user = req.claims && req.claims.sub;

    dataStorage.getProcessCollection(user)
    .then(d => {
        res.status(200).json({ data:d })
    })
})

api.get('/process/:id', function(req,res) {
    const user = req.claims && req.claims.sub;

    dataStorage.getProcess(user, req.params.id)
    .then(d => {
        res.status(200).json({ data:d })
    })
})

api.post('/process', (req,res) => {
    const user = req.claims && req.claims.sub;

    dataStorage.createProcess(user, req.body)
    .then(d => {
        res.status(200).json({ process: req.params.id, data:d })
    })
})

api.post('/process/:id/event', (req,res) => {
    const user = req.claims && req.claims.sub;

    dataStorage.createEvent(user, req.params.id, req.body)
    .then(d => {
        res.status(200).json({ process: req.params.id, data:d })
    })
})

api.get('/process/echo', (req,res) => {
    const user = req.claims && req.claims.sub;

    res.status(200).json({headers: req.headers, query:req.query, params : req.params, req:req})
})

 
// Declare your Lambda handler
module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  dataStorage.dBConnection()
  .then(() => {
        console.log("DB Connected");
        // Run the request
        api.run(event, context, callback)
  })


}


