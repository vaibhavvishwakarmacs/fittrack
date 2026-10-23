import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    fitnessGoal: {
      type: String,
      enum: ['build_muscle', 'lose_fat', 'maintain', 'strength', 'endurance', 'general_health'],
      default: 'build_muscle',
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'very_active', 'extra_active'],
      default: 'moderate',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'other',
    },
    currentWeightKg: {
      type: Number,
      default: 75,
    },
    targetWeightKg: {
      type: Number,
      default: 75,
    },
    heightCm: {
      type: Number,
      default: 178,
    },
    dailyCalorieTarget: {
      type: Number,
      default: 2200,
    },
    dailyProteinTargetG: {
      type: Number,
      default: 140,
    },
    dailyCarbsTargetG: {
      type: Number,
      default: 230,
    },
    dailyFatTargetG: {
      type: Number,
      default: 65,
    },
    dailyStepTarget: {
      type: Number,
      default: 10000,
    },
    dailyWaterTargetMl: {
      type: Number,
      default: 2500,
    },
    unitSystem: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric',
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Password hashing middleware
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
