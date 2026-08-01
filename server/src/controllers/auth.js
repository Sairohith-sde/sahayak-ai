import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { repository } from '../utils/repository.js';

export async function register(req, res) {
  try {
    const { name, email, password, role, supervisorId, languagePref } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields: name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existing = await repository.getOne('User', { email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await repository.create('User', {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'worker',
      supervisorId: supervisorId || null,
      languagePref: languagePref || 'en'
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    // Sign Token
    const token = jwt.sign(
      { id: newUser._id || newUser.id },
      process.env.JWT_SECRET || 'sahayak_ai_jwt_secret_institutional_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: `Registration failed: ${error.message}` });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password.' });
    }

    const user = await repository.getOne('User', { email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please verify your email and password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Please verify your email and password.' });
    }

    // Sign Token
    const token = jwt.sign(
      { id: user._id || user.id },
      process.env.JWT_SECRET || 'sahayak_ai_jwt_secret_institutional_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: `Login failed: ${error.message}` });
  }
}

export async function getMe(req, res) {
  try {
    const { password: _, ...userWithoutPassword } = req.user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: `Retrieving user session failed: ${error.message}` });
  }
}

export async function updateLanguagePref(req, res) {
  try {
    const { languagePref } = req.body;
    if (!languagePref) {
      return res.status(400).json({ message: 'languagePref field is required.' });
    }
    const userId = req.user._id || req.user.id;
    const updated = await repository.updateById('User', userId, { languagePref });
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { password: _, ...userWithoutPassword } = updated;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: `Failed to update language preference: ${error.message}` });
  }
}
