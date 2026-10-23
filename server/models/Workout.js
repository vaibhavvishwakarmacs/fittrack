import mongoose from 'mongoose';

const exerciseSetSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    weightKg: { type: Number, default: 0 },
    reps: { type: Number, default: 10 },
    rpe: { type: Number, default: null },
    support: {
      type: String,
      enum: ['normal', 'warmup', 'drop_set', 'assisted', 'failure'],
      default: 'normal',
    },
    isCompleted: { type: Boolean, default: true },
  },
  { _id: true }
);

const workoutExerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      default: 'chest',
    },
    orderIndex: { type: Number, default: 0 },
    notes: { type: String, default: null },
    imageUrl: { type: String, default: null },
    targetMuscles: [{ type: String }],
    tips: [{ type: String }],
    sets: [exerciseSetSchema],
  },
  { _id: true }
);

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    category: {
      type: String,
      default: 'strength',
    },
    targetMuscles: [{ type: String }],
    dayOfWeek: { type: String, default: null },
    durationMinutes: { type: Number, default: 45 },
    totalVolumeKg: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    notes: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: Date.now },
    exercises: [workoutExerciseSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        ret.user_id = ret.userId ? ret.userId.toString() : '';
        ret.duration_minutes = ret.durationMinutes;
        ret.total_volume_kg = ret.totalVolumeKg;
        ret.calories_burned = ret.caloriesBurned;
        ret.target_muscles = ret.targetMuscles || [];
        ret.day_of_week = ret.dayOfWeek;
        ret.started_at = ret.startedAt ? ret.startedAt.toISOString() : new Date().toISOString();
        if (ret.exercises) {
          ret.exercises = ret.exercises.map((ex) => ({
            id: ex._id.toString(),
            exercise_name: ex.name,
            exercise_category: ex.category,
            order_index: ex.orderIndex,
            notes: ex.notes,
            image_url: ex.imageUrl,
            target_muscles: ex.targetMuscles || [],
            tips: ex.tips || [],
            sets: (ex.sets || []).map((s) => ({
              id: s._id.toString(),
              set_number: s.setNumber,
              weight_kg: s.weightKg,
              reps: s.reps,
              rpe: s.rpe,
              support: s.support || 'normal',
              is_completed: s.isCompleted,
            })),
          }));
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Workout = mongoose.model('Workout', workoutSchema);
