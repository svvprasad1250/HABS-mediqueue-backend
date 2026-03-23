const asyncHandler = require("./asyncHandler");
const jwt = require("jsonwebtoken");

const validateToken = asyncHandler(async (req, res, next) => {

    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        res.status(401);
        throw new Error("No token provided");
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        req.user = decoded.user;

        next();
    } catch (err) {
        res.status(401);
        throw new Error("Token expired or invalid");
    }
});

module.exports = validateToken;