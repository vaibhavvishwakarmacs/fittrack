import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    steps: {
      type: Number,
      default: 0,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    activeCalories: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        ret.user_id = ret.userId ? ret.userId.toString() : '';
        ret.distance_km = ret.distanceKm;
        ret.active_calories = ret.activeCalories;
        ret.duration_minutes = ret.durationMinutes;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

activitySchema.index({ userId: 1, date: 1 }, { unique: true });

export const Activity = mongoose.model('Activity', activitySchema);
