import mongoose from 'mongoose';

const customExerciseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    muscle: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      default: '',
    },
    tips: [{ type: String }],
    image: {
      type: String,
      default: null,
    },
    defaultRestSec: {
      type: Number,
      default: 90,
    },
    trackingFields: {
      type: [String],
      default: ['weight', 'reps'],
    },
    isPresetOverride: {
      type: Boolean,
      default: false,
    },
    originalPresetName: {
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
        ret.isCustom = !ret.isPresetOverride;
        ret.isPresetOverride = Boolean(ret.isPresetOverride);
        ret.originalPresetName = ret.originalPresetName || null;
        ret.trackingFields = Array.isArray(ret.trackingFields) && ret.trackingFields.length > 0 ? ret.trackingFields : ['weight', 'reps'];
        ret.defaultRestSec = Number(ret.defaultRestSec) || 90;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CustomExercise = mongoose.model('CustomExercise', customExerciseSchema);
