import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  profilePhoto: {
    type: String,
  },
  role: {
    type: String,
    enum: ['admin', 'recruiter', 'projectManager', 'freelancer', 'agency'],
    default: 'freelancer',
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  skills: [{
    type: String,
    trim: true,
  }],
  hourlyRate: {
    type: Number,
    min: 0,
  },
  experienceLevel: {
    type: String,
    enum: ['junior', 'mid', 'senior', 'expert'],
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available',
  },
  location: {
    city: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  portfolioLinks: [{
    type: String,
  }],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
userSchema.index({ skills: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ availability: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
