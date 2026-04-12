import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, setCookies, clearCookies } from '../utils/helpers.js';
import jwt from 'jsonwebtoken';

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.validatedBody;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'Registration successful',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (user.isBanned) return res.status(403).json({ message: 'Account has been suspended' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    setCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isBanned) return res.status(403).json({ message: 'Account has been suspended' });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    setCookies(res, accessToken, refreshToken);

    res.json({ message: 'Token refreshed' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    clearCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
