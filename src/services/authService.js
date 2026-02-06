import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import sequelize from '../config/database.js';

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  }

  validateRegistrationData(data) {
    const errors = [];
    const { username, email, password } = data;

    if (!username || username.trim().length < 3 || username.trim().length > 50) {
      errors.push({ field: 'username', message: 'Username must be between 3 and 50 characters' });
    }

    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }

    if (!password || password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    }

    return errors;
  }

  validateLoginData(data) {
    const errors = [];
    const { email, password } = data;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }

    if (!password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    return errors;
  }

  async register(userData) {
    const validationErrors = this.validateRegistrationData(userData);
    
    if (validationErrors.length > 0) {
      throw { statusCode: 400, message: 'Validation failed', errors: validationErrors };
    }

    const { username, email, password } = userData;

    const user = await sequelize.transaction(async (t) => {
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase().trim() },
        transaction: t
      });

      if (existingUser) {
        throw { statusCode: 400, message: 'User with this email already exists' };
      }

      return await User.create({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password
      }, { transaction: t });
    });

    const token = this.generateToken(user.id);

    return { user, token };
  }

  async login(credentials) {
    const validationErrors = this.validateLoginData(credentials);
    
    if (validationErrors.length > 0) {
      throw { statusCode: 400, message: 'Validation failed', errors: validationErrors };
    }

    const { email, password } = credentials;

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    if (!user.is_active) {
      throw { statusCode: 401, message: 'Account is inactive. Please contact support.' };
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const token = this.generateToken(user.id);

    return { user, token };
  }

  async getUserById(userId) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return user;
  }
}

export default new AuthService();
