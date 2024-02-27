const jwt = require("jsonwebtoken");

const verifyOptions = {
  algorithms: ['RS256'], // The algorithm used to sign the token
  issuer: process.env.ISSUER, // The issuer of the token
  audience: process.env.AWSCLIENTID, // Your app client ID
};

verifyToken = (req, res, next) => {
  let idToken = req.headers['authorization'].split(' ')[1];
  req.headers['authorization'] = idToken;
  
  if (!idToken) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }


  jwt.verify(idToken, getKey, verifyOptions, (err, decoded) => {
    if (err) {
      console.log('Token verification failed: ', err);
      return res.status(401).send({
        message: "Unauthorized!"
      });
  } else {
      console.log('Token verified successfully: ', decoded);
      req.userId = decoded.sub;
      next();
  }
  });

};
function getKey(header, callback) {
  const jwksClient = require('jwks-rsa');

  const client = jwksClient({
    jwksUri: process.env.jwksUri,
  });

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }

    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const authJwt = {
  verifyToken: verifyToken,

};
module.exports = authJwt;
