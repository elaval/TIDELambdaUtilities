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
        next();
    } else if (req.query.access_key) {
        const claims = dataStorage.getClaimsFromKey(req.query.access_key)
        .then(claims => {
            req.claims = claims;
            next();
        })
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
    .catch(err => {
        res.status(200).json({ "msg":"ERROR caught in post /process", "error": err })
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


api.post('/process/:id/event', (req,res) => {
    const user = req.claims && req.claims.sub;

    dataStorage.createEvent(user, req.params.id, req.body)
    .then(d => {
        res.status(200).json({ process: req.params.id, data:d })
    })
})

api.post('/token', (req,res) => {
    const user = req.claims && req.claims.sub;

    dataStorage.createToken(user)
    .then(d => {
        res.status(200).json({ token: d })
    })
})

api.get('/token/:token', (req,res) => {
    const token = req.params && req.params.token;

    dataStorage.getToken(token)
    .then(d => {
        res.status(200).json({ token: d })
    })
})

api.get('/token', (req,res) => {
    const user = req.claims && req.claims.sub;
    
    dataStorage.getTokenCollection(user)
    .then(d => {
        res.status(200).json({ data: d })
    })
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
  .catch(err => {
    const response = {
        statusCode: 201,
        headers: {
            "Content-Type" : "application/json",
          },
        body: JSON.stringify({"msg":"ERROR at initial dBConnection", "error": err})
    };

    callback(null, response);
  });


}


