import jwt from "jsonwebtoken";

// This is a "middleware" function
// Express middleware takes (req, res, next) as arguments
// - req = the incoming request (has headers, cookies, body, etc.)
// - res = the response you send back
// - next = a function that says "I'm done, move to the next step"

export const protect = (req, res, next) => {
  try {
    // Read the access token from the cookie
    // The cookie is named "accessToken" — we set this on login
    const token = req.cookies.accessToken;

    // If there's no token, the user is not logged in
    if (!token) {
      return res.status(401).json({
        message: "Not authenticated. Please log in.",
      });
    }

    // jwt.verify() checks two things:
    // 1. Was this token signed with our secret? (proves we created it)
    // 2. Has the token expired?
    // If both pass, it returns the "payload" we put inside the token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach the decoded user info to the request object
    // Now any route after this middleware can access req.user
    // e.g. req.user.id, req.user.email
    req.user = decoded;

    // Call next() to move on to the actual route handler
    next();
  } catch (error) {
    // If token is expired or tampered with, jwt.verify() throws an error
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
      });
    }
    return res.status(401).json({
      message: "Invalid token. Please log in again.",
    });
  }
};
