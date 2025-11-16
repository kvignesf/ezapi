module.exports = {
    'secret': 'supersecret',
    signOptions: {
        issuer:  'EzAPI',
        subject:  'info@ezapi.ai',
        audience:  'http://ezapi.ai',
        expiresIn:  "24h",
        algorithm:  "RS256"   // RSASSA [ "RS256", "RS384", "RS512" ]
    },
    verifyOptions: {
        issuer:  'EzAPI',
        subject:  'info@ezapi.ai',
        audience:  'http://ezapi.ai',
        expiresIn:  "12h",
        algorithm:  ["RS256"]   // RSASSA [ "RS256", "RS384", "RS512" ]
    },
}
