import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

// ─── Helper: generate tokens ──────────────────────────────────────────────────

// Creates a short-lived access token (15 minutes)
// This is the token the user sends with every request to prove who they are
const generateAccessToken = (userId, email) => {
  return jwt.sign(
    // Payload: data we embed inside the token
    { id: userId, email },
    // Secret: used to sign the token — only our server knows this
    process.env.JWT_ACCESS_SECRET,
    // Options: the token expires in 15 minutes
    { expiresIn: "15m" },
  );
};

// Creates a long-lived refresh token (7 days)
// This is used ONLY to get a new access token when the old one expires
// It lives in an httpOnly cookie (JavaScript in the browser can't read it)
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// ─── Helper: set cookies ──────────────────────────────────────────────────────

// Sets both tokens as httpOnly cookies on the response
// httpOnly = browser JavaScript cannot read these cookies
// This protects against XSS attacks (malicious JS stealing your tokens)
const setTokenCookies = (res, accessToken, refreshToken) => {
  // Access token cookie — expires in 15 minutes
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only HTTPS in production
    sameSite: "lax", // prevents CSRF attacks
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
  });

  // Refresh token cookie — expires in 7 days
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account

export const register = async (req, res) => {
  try {
    // Destructure the fields from the request body
    // The frontend sends: { name, email, password }
    const { name, email, password } = req.body;

    // Basic validation — make sure required fields are present
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    // Check if a user with this email already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    // Hash the password before saving it
    // NEVER store plain-text passwords in a database
    // bcrypt.hash(password, saltRounds)
    // saltRounds = 12 means it runs the hash function 2^12 times — makes brute force very slow
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user record in the database
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(), // always store email in lowercase
        password: hashedPassword,
      },
    });

    // Generate both tokens for the new user
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Save the refresh token in the database
    // We store it so we can invalidate it on logout
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        // Expires 7 days from now
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set the tokens as cookies on the response
    setTokenCookies(res, accessToken, refreshToken);

    // Send back the user data (without the password!)
    res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Logs in an existing user

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // If no user found — don't say "user not found" (security risk)
    // Always say "invalid credentials" so hackers can't discover which emails exist
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare the plain-text password the user typed
    // against the hashed password stored in the database
    // bcrypt.compare() handles the hashing internally
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate fresh tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Save the new refresh token to the database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Respond with user info
    res.json({
      message: "Logged in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Logs out the user by deleting their tokens

export const logout = async (req, res) => {
  try {
    // Read the refresh token from the cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Delete this refresh token from the database
      // This means it can never be used again even if someone has a copy
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Clear both cookies by setting them to empty with maxAge 0
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Issues a new access token using the refresh token
// Called automatically by the frontend when the access token expires

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token." });
    }

    // Verify the refresh token is valid and not expired
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check that this refresh token actually exists in our database
    // (it might have been deleted on logout)
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }, // also fetch the user record
    });

    if (!storedToken) {
      return res
        .status(401)
        .json({ message: "Refresh token has been revoked." });
    }

    // Generate a brand new access token
    const newAccessToken = generateAccessToken(
      storedToken.user.id,
      storedToken.user.email,
    );

    // Set the new access token as a cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed." });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token." });
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// GET /api/auth/me
// Returns the currently logged-in user's data
// Protected route — requires a valid access token

export const getMe = async (req, res) => {
  try {
    // req.user was set by the protect middleware
    // It contains { id, email } from the JWT payload
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      // Select only safe fields — never return the password
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
