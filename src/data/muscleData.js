// Muscle Groups, Exercise Variations, Form Tips, and Rest Guidance

export const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Chest (Pectorals)', anatomy: 'Pectoralis Major & Minor', icon: 'Dumbbell' },
  { id: 'triceps', label: 'Triceps', anatomy: 'Long, Lateral & Medial Heads', icon: 'Zap' },
  { id: 'back', label: 'Back (Lats & Traps)', anatomy: 'Latissimus Dorsi, Rhomboids, Trapezius', icon: 'Shield' },
  { id: 'biceps', label: 'Biceps & Forearms', anatomy: 'Biceps Brachii & Brachialis', icon: 'Flame' },
  { id: 'shoulders', label: 'Shoulders (Delts)', anatomy: 'Anterior, Lateral & Posterior Deltoids', icon: 'Compass' },
  { id: 'quads', label: 'Quadriceps', anatomy: 'Rectus Femoris, Vastus Lateralis/Medialis', icon: 'Footprints' },
  { id: 'hamstrings', label: 'Hamstrings & Glutes', anatomy: 'Biceps Femoris & Gluteus Maximus', icon: 'Activity' },
  { id: 'calves', label: 'Calves', anatomy: 'Gastrocnemius & Soleus', icon: 'Layers' },
  { id: 'core', label: 'Core / Abs', anatomy: 'Rectus Abdominis & Obliques', icon: 'Target' },
  { id: 'cardio', label: 'Cardio & Conditioning', anatomy: 'Aerobic & Heart Stamina', icon: 'HeartPulse' },
];

export const WORKOUT_ROUTINES = [
  {
    id: 'chest_triceps',
    label: 'Chest & Triceps (Push A)',
    defaultMuscles: ['chest', 'triceps', 'shoulders'],
    category: 'hypertrophy',
    desc: 'Classic hypertrophy push session focusing on horizontal pressing and triceps extension.',
  },
  {
    id: 'back_biceps',
    label: 'Back & Biceps (Pull A)',
    defaultMuscles: ['back', 'biceps'],
    category: 'hypertrophy',
    desc: 'Vertical and horizontal pulling session targeting full back width, thickness, and arm flexors.',
  },
  {
    id: 'legs_calves',
    label: 'Leg Day (Quads, Hamstrings & Calves)',
    defaultMuscles: ['quads', 'hamstrings', 'calves'],
    category: 'strength',
    desc: 'Heavy compound lower body session focusing on squat patterns and hip hinge mechanics.',
  },
  {
    id: 'shoulders_arms',
    label: 'Shoulders & Arms Hypertrophy',
    defaultMuscles: ['shoulders', 'biceps', 'triceps'],
    category: 'hypertrophy',
    desc: 'V-taper aesthetic builder emphasizing lateral deltoids, long head triceps, and peaked biceps.',
  },
  {
    id: 'cardio_core',
    label: 'Cardio & Core Burn',
    defaultMuscles: ['cardio', 'core'],
    category: 'endurance',
    desc: 'High-intensity conditioning, steady-state fat loss, and core stability.',
  },
  {
    id: 'push_day',
    label: 'Full Push Day (Chest, Delts, Triceps)',
    defaultMuscles: ['chest', 'shoulders', 'triceps'],
    category: 'hypertrophy',
    desc: 'Complete upper body pushing volume.',
  },
  {
    id: 'pull_day',
    label: 'Full Pull Day (Back, Rear Delts, Biceps)',
    defaultMuscles: ['back', 'biceps'],
    category: 'hypertrophy',
    desc: 'Complete upper body pulling volume.',
  },
  {
    id: 'full_body',
    label: 'Full Body Power',
    defaultMuscles: ['chest', 'back', 'quads', 'shoulders'],
    category: 'strength',
    desc: 'High-frequency session hitting major compounds across the entire kinetic chain.',
  },
  {
    id: 'custom',
    label: 'Custom Workout Routine',
    defaultMuscles: ['chest', 'triceps', 'shoulders'],
    category: 'other',
    desc: 'Configure your own muscle combinations and exercises on the fly.',
  },
];

export const EXERCISE_VARIATIONS_BY_MUSCLE = {
  chest: [
    {
      name: 'Flat Barbell Bench Press',
      target: 'Mid & Lower Pectorals, Anterior Delts',
      tips: [
        'Retract scapulae and pinch shoulder blades together on the bench.',
        'Tuck elbows at ~45-degree angle to avoid excessive shoulder impingement.',
        'Drive through your heels to generate leg drive off the chest.',
      ],
      defaultRestSec: 90,
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Incline Dumbbell Press',
      target: 'Clavicular (Upper) Pectorals',
      tips: [
        'Set bench incline between 30° to 45° max.',
        'Lower dumbbells with a 2-second negative until chest gets a deep stretch.',
        'Converge slightly at the top without clanking weights together.',
      ],
      defaultRestSec: 90,
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Cable Chest Flye',
      target: 'Sternal Pectorals (Inner/Mid Chest Peak Contraction)',
      tips: [
        'Maintain a soft bend at the elbows throughout the entire arc.',
        'Squeeze your chest together as if hugging a wide barrel.',
        'Pause for 1 second in peak contraction on every repetition.',
      ],
      defaultRestSec: 60,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Weighted Chest Dips',
      target: 'Lower Pectorals & Triceps',
      tips: [
        'Lean torso forward ~30 degrees to emphasize the chest rather than upright triceps.',
        'Lower until your shoulders are slightly below your elbows, then drive up.',
      ],
      defaultRestSec: 90,
    },
    {
      name: 'Decline Barbell / Dumbbell Press',
      target: 'Inferior Pectoral Head',
      tips: [
        'Anchor feet securely in footpads.',
        'Lower the bar to the lower sternum line with controlled tempo.',
      ],
      defaultRestSec: 90,
    },
  ],
  triceps: [
    {
      name: 'Rope Triceps Pushdown',
      target: 'Lateral & Medial Heads',
      tips: [
        'Pin elbows tightly to your ribcage and do not let them drift forward.',
        'Spread the rope ends apart at the bottom for maximal lateral head contraction.',
        'Control the negative for 2 seconds on the return.',
      ],
      defaultRestSec: 60,
      image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Overhead Cable Triceps Extension',
      target: 'Long Head Triceps (Maximum Stretch)',
      tips: [
        'Keep upper arms stationary near your ears throughout the movement.',
        'Allow the cable to give you a deep stretch behind your neck before extending.',
      ],
      defaultRestSec: 60,
    },
    {
      name: 'Skull Crushers (EZ Bar Lying Extension)',
      target: 'Long and Lateral Triceps Heads',
      tips: [
        'Angle your arms back slightly from 90° to maintain constant triceps tension.',
        'Lower bar to forehead or just behind crown of the head.',
      ],
      defaultRestSec: 75,
    },
    {
      name: 'Close-Grip Barbell Bench Press',
      target: 'Triceps Power & Inner Pectorals',
      tips: [
        'Grip roughly shoulder-width apart (avoid placing hands too close together to save wrists).',
        'Keep elbows tucked close to sides.',
      ],
      defaultRestSec: 90,
    },
  ],
  back: [
    {
      name: 'Barbell Bent-Over Row',
      target: 'Latissimus Dorsi, Rhomboids, Mid Traps',
      tips: [
        'Hinge at hips with a neutral spine at ~45-degree angle.',
        'Pull bar towards your navel, leading with your elbows.',
        'Squeeze your shoulder blades together at the peak.',
      ],
      defaultRestSec: 90,
      image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Lat Pulldown (Wide / Neutral)',
      target: 'Upper Lats & Teres Major',
      tips: [
        'Depress your shoulders before pulling with your arms.',
        'Drive elbows down towards your back pockets, pulling bar to upper chest.',
      ],
      defaultRestSec: 75,
    },
    {
      name: 'Seated Cable Row',
      target: 'Mid-Back Thickness & Lower Lats',
      tips: [
        'Keep chest tall with shoulders back; avoid excessive rocking.',
        'Pull handle to lower ribs and pause for a beat.',
      ],
      defaultRestSec: 75,
    },
    {
      name: 'Single-Arm Dumbbell Row',
      target: 'Unilateral Latissimus Dorsi',
      tips: [
        'Keep torso parallel to the bench without rotating hips.',
        'Pull dumbbell in a slight J-curve toward your hip.',
      ],
      defaultRestSec: 60,
    },
  ],
  biceps: [
    {
      name: 'Incline Dumbbell Biceps Curl',
      target: 'Long Head Biceps (Stretch Position)',
      tips: [
        'Set bench to 60° angle and let arms hang completely down.',
        'Supinate wrists (turn pinky up) as you curl to maximize peak contraction.',
        'Avoid kicking elbows forward.',
      ],
      defaultRestSec: 60,
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Barbell / EZ-Bar Standing Curl',
      target: 'Overall Biceps Mass',
      tips: [
        'Pin elbows at your sides; initiate curl with biceps, not hips.',
        'Squeeze hard at chin level and lower under control.',
      ],
      defaultRestSec: 60,
    },
    {
      name: 'Hammer Curls (Dumbbell / Rope)',
      target: 'Brachialis & Brachioradialis (Arm Thickness)',
      tips: [
        'Maintain a neutral grip (palms facing each other).',
        'Great for forearm strength and building overall arm width.',
      ],
      defaultRestSec: 60,
    },
    {
      name: 'Preacher Bench Curl',
      target: 'Short (Inner) Biceps Head Isolation',
      tips: [
        'Keep armpits snug against the top edge of the pad.',
        'Control the descent to protect the bicep tendon at bottom lockout.',
      ],
      defaultRestSec: 60,
    },
  ],
  shoulders: [
    {
      name: 'Dumbbell Lateral Raise',
      target: 'Lateral Deltoids (Shoulder Width)',
      tips: [
        'Slight forward torso lean (10°) and raise arms in the scapular plane (30° forward).',
        'Lead with elbows and avoid shrugging traps.',
      ],
      defaultRestSec: 60,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Overhead Barbell / Dumbbell Press',
      target: 'Anterior & Lateral Deltoids',
      tips: [
        'Brace core and squeeze glutes to prevent hyperextending your lower back.',
        'Press overhead until arms lock out directly aligned with ears.',
      ],
      defaultRestSec: 90,
    },
    {
      name: 'Face Pulls with Rope',
      target: 'Posterior Deltoids & Rotator Cuff',
      tips: [
        'Set pulley at eye level. Pull rope directly towards forehead.',
        'Externally rotate shoulders at the end so thumbs point backward.',
      ],
      defaultRestSec: 60,
    },
    {
      name: 'Arnold Dumbbell Press',
      target: 'Anterior and Medial Deltoid Rotation',
      tips: [
        'Begin palms facing chest, rotate outward as you press smoothly overhead.',
      ],
      defaultRestSec: 75,
    },
  ],
  quads: [
    {
      name: 'Barbell Back Squat',
      target: 'Quadriceps, Glutes, Core',
      tips: [
        'Brace 360° intra-abdominal pressure into your lifting belt.',
        'Break at knees and hips together, tracking knees in line with toes.',
        'Drive aggressively through the midfoot.',
      ],
      defaultRestSec: 120,
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Leg Press',
      target: 'Quadriceps Mass',
      tips: [
        'Place feet shoulder-width in middle of platform.',
        'Lower sled until knees reach 90° without letting lower back round off the pad.',
      ],
      defaultRestSec: 90,
    },
    {
      name: 'Leg Extension',
      target: 'Rectus Femoris (Quad Isolation)',
      tips: [
        'Align knee joint with machine pivot axis.',
        'Kick up and pause for 1 full second at top lockout.',
      ],
      defaultRestSec: 60,
    },
    {
      name: 'Bulgarian Split Squat',
      target: 'Unilateral Quad & Glute Hypertrophy',
      tips: [
        'Place rear foot elevated on bench. Lower hips straight down until back knee hovers.',
      ],
      defaultRestSec: 75,
    },
  ],
  hamstrings: [
    {
      name: 'Romanian Deadlift (RDL)',
      target: 'Hamstrings & Gluteus Maximus',
      tips: [
        'Keep soft bend in knees and push hips back toward the wall behind you.',
        'Keep bar grazing down shins until deep hamstring stretch, then drive hips forward.',
      ],
      defaultRestSec: 90,
    },
    {
      name: 'Lying / Seated Leg Curl',
      target: 'Hamstrings Isolation',
      tips: [
        'Keep hips pressed flat into the bench to prevent lumbar arching.',
        'Curl aggressively, then resist on the 3-second eccentric return.',
      ],
      defaultRestSec: 60,
    },
    {
      name: 'Barbell Hip Thrust',
      target: 'Gluteus Maximus & Hamstrings Lockout',
      tips: [
        'Position shoulder blades across the bench edge.',
        'Tuck chin and squeeze glutes hard at the top parallel line.',
      ],
      defaultRestSec: 90,
    },
  ],
  calves: [
    {
      name: 'Standing Calf Raise',
      target: 'Gastrocnemius',
      tips: [
        'Get a full 2-second deep stretch at the bottom before driving up onto balls of feet.',
        'Hold contraction at the peak for 1 second.',
      ],
      defaultRestSec: 45,
    },
    {
      name: 'Seated Calf Raise',
      target: 'Soleus Deep Muscle (Bent Knee)',
      tips: [
        'Keep pad resting above knees, drop heels down slowly and explode upwards.',
      ],
      defaultRestSec: 45,
    },
    {
      name: 'Leg Press Calf Press',
      target: 'Calf Stretch & High Rep Volume',
      tips: [
        'Balls of feet on edge of plate, keep knees slightly unlocked for safety.',
      ],
      defaultRestSec: 45,
    },
  ],
  core: [
    {
      name: 'Hanging Leg / Knee Raise',
      target: 'Rectus Abdominis & Hip Flexors',
      tips: [
        'Roll pelvis upward toward ribs rather than just swinging legs.',
        'Do not use momentum; control both the lift and lowering phases.',
      ],
      defaultRestSec: 45,
    },
    {
      name: 'Cable Woodchopper',
      target: 'Internal & External Obliques',
      tips: [
        'Rotate with torso and core, keeping arms relatively straight.',
        'Engage hips and pivot on back foot.',
      ],
      defaultRestSec: 45,
    },
    {
      name: 'Cable Rope Kneeling Crunch',
      target: 'Upper & Middle Abdominal Compression',
      tips: [
        'Anchor rope at forehead level, curl thoracic spine down towards knees.',
      ],
      defaultRestSec: 45,
    },
  ],
  cardio: [
    {
      name: 'Incline Treadmill Power Walk',
      target: 'Zone 2 Aerobic Fat Burn & Low-Impact Conditioning',
      tips: [
        'Set incline between 10% - 15% and speed around 4.5 - 5.5 km/h.',
        'Walk upright without gripping handrails to maximize core and posterior chain engagement.',
        'Breathe rhythmically and maintain conversational heart rate.',
      ],
      defaultRestSec: 45,
      trackingFields: ['time', 'distance', 'calories'],
      image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Stationary / Spin Bike Intervals',
      target: 'High-Intensity Quads, Glutes & Anaerobic Capacity',
      tips: [
        'Alternate 30 seconds all-out sprint with 60 seconds moderate recovery pace.',
        'Keep cadence above 85 RPM during working intervals.',
      ],
      defaultRestSec: 60,
      trackingFields: ['time', 'calories'],
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Stairmaster Cardio Climber',
      target: 'Glutes, Calves & Cardiovascular Stamina',
      tips: [
        'Step with full foot contact to activate glutes and hamstrings.',
        'Maintain a tall posture without leaning excessively on upper console.',
      ],
      defaultRestSec: 45,
      trackingFields: ['time', 'calories'],
    },
    {
      name: 'Rowing Machine 500m Intervals',
      target: 'Full Kinetic Chain (Legs, Core & Upper Back)',
      tips: [
        'Sequence: Drive through legs first, lean back 10°, then pull handle to sternum.',
        'Recovery: Arms forward, hinge hips, then bend knees back to the catch.',
      ],
      defaultRestSec: 60,
      trackingFields: ['distance', 'time', 'calories'],
    },
    {
      name: 'High-Speed Jump Rope',
      target: 'Calf Elasticity, Footwork & Anaerobic Stamina',
      tips: [
        'Jump just 1-2 inches off the ground on the balls of your feet.',
        'Rotate the rope using wrists, keeping elbows pinned near your hips.',
      ],
      defaultRestSec: 45,
      trackingFields: ['time', 'reps'],
    },
    {
      name: 'HIIT Sprint Circuit',
      target: 'VMax Oxygen Uptake & Fast-Twitch Muscle Burn',
      tips: [
        'Push to 90%+ maximum effort during work intervals.',
        'Focus on rapid knee drive and aggressive arm swings.',
      ],
      defaultRestSec: 60,
      trackingFields: ['time', 'calories'],
    },
  ],
};

export const BETWEEN_SET_TIPS = [
  'Breathe: Take 3 deep diaphragmatic nasal breaths (4s in, 6s out) to quickly down-regulate your nervous system.',
  'Hydrate: Take small sips of water to maintain muscular blood volume and intracellular hydration.',
  'Mindset: Mental rehearsal before the next set increases motor unit recruitment by up to 15%.',
  'Tempo: Remember the eccentric (lowering) phase causes the highest mechanical tension for hypertrophy.',
  'Grip: Reset your grip chalk or wrist wraps so your hands do not fatigue before the target muscle fails.',
  'Form Check: Squeeze the target muscle peak contraction on the next set for enhanced mind-muscle connection.',
  'Recovery: Shaking out your arms or legs helps flush metabolic byproducts and lactic buildup.',
  'RPE Guide: If your last set felt under RPE 7, consider nudging the load up by 2.5 kg on this next set.',
];
