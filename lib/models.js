import mongoose from 'mongoose';

// ── User ──────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  contact:    { type: String, required: true, unique: true },
  altContact: { type: String },
  type:       { type: String, enum: ['student', 'other'], required: true },
  createdAt:  { type: Date, default: Date.now },
});

// ── OTP ───────────────────────────────────────────────────────────────────────
const OTPSchema = new mongoose.Schema({
  contact:   { type: String, required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date,   required: true },
});

export const StudentGaming = mongoose.models.StudentGaming || mongoose.model('StudentGaming', UserSchema);
export const OTP  = mongoose.models.OTP  || mongoose.model('OTP',  OTPSchema);