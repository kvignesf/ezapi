

const ValidateLinkedinToken = async (req, res, next) =>{
    req.isDBCheck = true;
    next();
}

module.exports = ValidateLinkedinToken;