// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // हेडर से टोकन प्राप्त करें
    const token = req.header('x-auth-token');

    // यदि कोई टोकन नहीं है तो जांचें
    if (!token) {
        return res.status(401).json({ msg: 'कोई टोकन नहीं, प्रमाणीकरण अस्वीकृत' });
    }

    // टोकन सत्यापित करें
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // req.user में उपयोगकर्ता पेलोड जोड़ें
        next();
    } catch (err) {
        console.error("JWT सत्यापन विफल:", err.message);
        res.status(401).json({ msg: 'टोकन अमान्य है' });
    }
};