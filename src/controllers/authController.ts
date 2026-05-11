import { Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { body } from 'express-validator';
import { User } from '../models/index.ts';
import { ApiError } from '../utils/ApiError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { AuthenticatedRequest } from '../types/express.ts';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE ?? '7d',
  } as SignOptions);
};

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      'Username can only contain letters, numbers, and underscores',
    ),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required'),
];

export const register = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { username, email, password } = req.body as {
      username: string;
      email: string;
      password: string;
    };

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ApiError(
        409,
        existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken',
      );
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  },
);

export const login = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: { user, token },
    });
  },
);

export const logout = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (req.user) {
      req.user.isOnline = false;
      req.user.lastSeen = new Date();
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  },
);

export const getMe = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: req.user,
    });
  },
);

export const updateProfile = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { username, profileImage } = req.body as {
      username?: string;
      profileImage?: string;
    };
    const updates: Record<string, string> = {};

    if (username) updates.username = username;
    if (profileImage !== undefined)
      updates.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    res.json({
      success: true,
      data: user,
    });
  },
);

export const updatePassword = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await User.findById(req.user!._id).select(
      '+password',
    );
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: { token },
    });
  },
);
