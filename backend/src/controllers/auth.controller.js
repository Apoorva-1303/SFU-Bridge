import passport from "passport";
import User from "../models/user.model.js";


export const userSignup = async (req, res, next) => {
  const { email, username, password } = req.body;

  try {
    const newUser = new User({ email, username });

    await User.register(newUser, password);

    passport.authenticate('local')(req, res, () => {
      res.status(201).json({
        success: true,
        message: 'Registered and logged in',
        redirectUrl: `${process.env.BASE_CLIENT_URL}/dashboard`
      });
    });

  } catch (err) {
    if (err.name === 'UserExistsError') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    next(err);
  }
};

export const userLogin = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username
    }
  });
};

export const userLoginError = async (err, req, res, next) => {
  if (err.status === 401 || err.name === 'AuthenticationError') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  next(err);
};

export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleRedirect = passport.authenticate('google', { 
  failureRedirect: `${process.env.BASE_CLIENT_URL}/signup`, 
  failureMessage: true 
});

export const redirect = async (req, res) => {
  res.redirect(`${process.env.BASE_CLIENT_URL}/signup`);
};

export const getProfile = async (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        username: req.user.username
      }
    });
  }
  return res.status(401).json({ success: false, message: 'Not authenticated' });
};

export const userLogout = async (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });
};