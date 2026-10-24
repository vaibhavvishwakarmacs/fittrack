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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        ret.user_id = ret.userId ? ret.userId.toString() : '';
        ret.isCustom = true;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CustomExercise = mongoose.model('CustomExercise', customExerciseSchema);
