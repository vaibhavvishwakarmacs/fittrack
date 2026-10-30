import mongoose from 'mongoose';

const exerciseSetSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    weightKg: { type: Number, default: 0 },
    reps: { type: Number, default: 10 },
    timeSec: { type: Number, default: 0 },
    distanceMeters: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
    rpe: { type: Number, default: null },
    support: {
      type: String,
      enum: ['normal', 'warmup', 'drop_set', 'assisted', 'failure'],
      default: 'normal',
    },
    isCompleted: { type: Boolean, default: true },
    completedAt: { type: Date, default: null },
    restDurationSec: { type: Number, default: 90 },
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
    trackingFields: {
      type: [String],
      default: ['weight', 'reps'],
    },
    defaultRestSec: {
      type: Number,
      default: 90,
    },
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
        ret.completed_at = ret.completedAt ? ret.completedAt.toISOString() : null;
        if (ret.exercises) {
          ret.exercises = ret.exercises.map((ex) => ({
            id: ex._id ? ex._id.toString() : undefined,
            exercise_name: ex.name,
            exercise_category: ex.category,
            order_index: ex.orderIndex,
            notes: ex.notes,
            image_url: ex.imageUrl,
            target_muscles: ex.targetMuscles || [],
            tips: ex.tips || [],
            tracking_fields: Array.isArray(ex.trackingFields) && ex.trackingFields.length > 0 ? ex.trackingFields : ['weight', 'reps'],
            default_rest_sec: Number(ex.defaultRestSec) || 90,
            sets: (ex.sets || []).map((s) => ({
              id: s._id ? s._id.toString() : undefined,
              set_number: s.setNumber,
              weight_kg: s.weightKg ?? 0,
              reps: s.reps ?? 0,
              time_sec: s.timeSec ?? 0,
              distance_meters: s.distanceMeters ?? 0,
              calories: s.calories ?? 0,
              rpe: s.rpe,
              support: s.support || 'normal',
              isCompleted: s.isCompleted,
              is_completed: s.isCompleted,
              completed_at: s.completedAt ? (s.completedAt.toISOString ? s.completedAt.toISOString() : s.completedAt) : null,
              rest_duration_sec: s.restDurationSec ?? ex.defaultRestSec ?? 90,
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
