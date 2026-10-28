import mongoose from 'mongoose';

const nutritionSchema = new mongoose.Schema(
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
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    servingSize: {
      type: String,
      default: '1 serving',
    },
    calories: {
      type: Number,
      required: true,
      default: 0,
    },
    proteinG: {
      type: Number,
      default: 0,
    },
    carbsG: {
      type: Number,
      default: 0,
    },
    fatG: {
      type: Number,
      default: 0,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        ret.user_id = ret.userId ? ret.userId.toString() : '';
        ret.meal_type = ret.mealType;
        ret.food_name = ret.foodName;
        ret.serving_size = ret.servingSize;
        ret.protein_g = ret.proteinG;
        ret.carbs_g = ret.carbsG;
        ret.fat_g = ret.fatG;
        ret.photo_url = ret.photoUrl || null;
        ret.notes = ret.notes || '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Nutrition = mongoose.model('Nutrition', nutritionSchema);
