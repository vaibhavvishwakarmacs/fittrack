import mongoose from 'mongoose';

const weightSchema = new mongoose.Schema(
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
    weightKg: {
      type: Number,
      required: true,
    },
    bodyFatPercentage: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    photoUrl: {
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
        ret.weight_kg = ret.weightKg;
        ret.body_fat_percentage = ret.bodyFatPercentage;
        ret.photo_url = ret.photoUrl;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Weight = mongoose.model('Weight', weightSchema);
