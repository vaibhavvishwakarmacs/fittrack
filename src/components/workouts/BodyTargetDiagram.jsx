import React from 'react';

/**
 * Apple Fitness-inspired Anatomical Muscle Target Diagram
 * Displays front & back silhouette with neon-lime glowing highlights for targeted muscles.
 */
export const BodyTargetDiagram = ({ targetedMuscles = [], activeExerciseMuscle = null }) => {
  const isTargeted = (muscleId) => targetedMuscles.includes(muscleId);
  const isCurrent = (muscleId) => activeExerciseMuscle === muscleId;

  const getFill = (muscleId) => {
    if (isCurrent(muscleId)) return 'fill-lime drop-shadow-[0_0_8px_rgba(187,244,61,0.8)]';
    if (isTargeted(muscleId)) return 'fill-lime/60 drop-shadow-[0_0_4px_rgba(187,244,61,0.4)]';
    return 'fill-dark-800 hover:fill-dark-750';
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 rounded-3xl bg-dark-950/70 border border-white/5 backdrop-blur-md">
      {/* Front View */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">
          Anterior (Front)
        </span>
        <svg
          viewBox="0 0 160 260"
          className="w-28 h-44 sm:w-32 sm:h-52 transition-all duration-300"
        >
          {/* Head & Neck */}
          <circle cx="80" cy="22" r="14" className="fill-dark-850 stroke-white/10 stroke-1" />
          <path d="M74 36 L74 44 L86 44 L86 36 Z" className="fill-dark-850" />

          {/* Shoulders / Deltoids (Front) */}
          <path
            d="M50 48 C46 52 42 62 44 72 C48 70 54 62 58 52 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('shoulders')}`}
          >
            <title>Shoulders (Left Anterior Deltoid)</title>
          </path>
          <path
            d="M110 48 C114 52 118 62 116 72 C112 70 106 62 102 52 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('shoulders')}`}
          >
            <title>Shoulders (Right Anterior Deltoid)</title>
          </path>

          {/* Chest / Pectorals */}
          <path
            d="M58 50 C68 48 78 52 80 56 C80 68 76 74 60 74 C54 74 52 66 58 50 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('chest')}`}
          >
            <title>Left Pectoral</title>
          </path>
          <path
            d="M102 50 C92 48 82 52 80 56 C80 68 84 74 100 74 C106 74 108 66 102 50 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('chest')}`}
          >
            <title>Right Pectoral</title>
          </path>

          {/* Cardio Heart / Pulse Highlight */}
          {(isTargeted('cardio') || isCurrent('cardio')) && (
            <g className="cursor-pointer">
              <circle cx="75" cy="62" r="7" className="fill-rose-500/50 animate-ping" />
              <circle cx="75" cy="62" r="5" className="fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]">
                <title>Cardiovascular Aerobic Zone</title>
              </circle>
            </g>
          )}

          {/* Biceps & Forearms (Front) */}
          <path
            d="M43 74 C41 84 41 94 44 104 C47 104 49 96 48 84 C48 78 45 74 43 74 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('biceps')}`}
          >
            <title>Left Biceps</title>
          </path>
          <path
            d="M117 74 C119 84 119 94 116 104 C113 104 111 96 112 84 C112 78 115 74 117 74 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('biceps')}`}
          >
            <title>Right Biceps</title>
          </path>
          {/* Forearms */}
          <path
            d="M44 106 C42 120 40 134 42 144 C45 144 48 136 49 122 C50 114 47 106 44 106 Z"
            className="fill-dark-850 hover:fill-dark-750"
          />
          <path
            d="M116 106 C118 120 120 134 118 144 C115 144 112 136 111 122 C110 114 113 106 116 106 Z"
            className="fill-dark-850 hover:fill-dark-750"
          />

          {/* Core / Abs */}
          <path
            d="M62 76 C72 76 88 76 98 76 C96 110 92 124 88 132 C82 134 78 134 72 132 C68 124 64 110 62 76 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('core')}`}
          >
            <title>Rectus Abdominis & Obliques</title>
          </path>

          {/* Quadriceps (Thighs) */}
          <path
            d="M61 136 C73 136 78 142 77 166 C76 182 74 196 68 202 C64 202 58 190 56 166 C55 148 57 138 61 136 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('quads')}`}
          >
            <title>Left Quadriceps</title>
          </path>
          <path
            d="M99 136 C87 136 82 142 83 166 C84 182 86 196 92 202 C96 202 102 190 104 166 C105 148 103 138 99 136 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('quads')}`}
          >
            <title>Right Quadriceps</title>
          </path>

          {/* Calves & Shins */}
          <path
            d="M66 206 C71 208 72 222 71 236 C69 246 67 252 64 252 C61 252 60 242 61 230 C61 218 63 208 66 206 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('calves')}`}
          >
            <title>Left Calf/Shin</title>
          </path>
          <path
            d="M94 206 C89 208 88 222 89 236 C91 246 93 252 96 252 C99 252 100 242 99 230 C99 218 97 208 94 206 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('calves')}`}
          >
            <title>Right Calf/Shin</title>
          </path>
        </svg>
      </div>

      {/* Back View */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">
          Posterior (Back)
        </span>
        <svg
          viewBox="0 0 160 260"
          className="w-28 h-44 sm:w-32 sm:h-52 transition-all duration-300"
        >
          {/* Head & Neck Back */}
          <circle cx="80" cy="22" r="14" className="fill-dark-850 stroke-white/10 stroke-1" />
          <path d="M74 36 L74 44 L86 44 L86 36 Z" className="fill-dark-850" />

          {/* Traps & Upper / Mid Back (Lats) */}
          <path
            d="M60 46 C70 42 90 42 100 46 C106 58 106 72 96 98 C88 114 84 122 80 126 C76 122 72 114 64 98 C54 72 54 58 60 46 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('back')}`}
          >
            <title>Trapezius, Latissimus Dorsi & Rhomboids</title>
          </path>

          {/* Triceps (Back of arms) */}
          <path
            d="M45 58 C42 68 41 82 43 96 C47 96 50 86 52 74 C53 66 49 58 45 58 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('triceps')}`}
          >
            <title>Left Triceps</title>
          </path>
          <path
            d="M115 58 C118 68 119 82 117 96 C113 96 110 86 108 74 C107 66 111 58 115 58 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('triceps')}`}
          >
            <title>Right Triceps</title>
          </path>

          {/* Glutes & Hamstrings */}
          <path
            d="M62 132 C74 130 80 134 80 152 C80 168 76 196 68 202 C62 202 56 186 56 162 C56 142 58 134 62 132 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('hamstrings')}`}
          >
            <title>Left Glute & Hamstring</title>
          </path>
          <path
            d="M98 132 C86 130 80 134 80 152 C80 168 84 196 92 202 C98 202 104 186 104 162 C104 142 102 134 98 132 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('hamstrings')}`}
          >
            <title>Right Glute & Hamstring</title>
          </path>

          {/* Posterior Calves */}
          <path
            d="M64 206 C70 208 72 222 71 236 C69 246 66 252 63 252 C60 252 59 242 60 230 C60 218 62 208 64 206 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('calves')}`}
          >
            <title>Left Gastrocnemius (Calf)</title>
          </path>
          <path
            d="M96 206 C90 208 88 222 89 236 C91 246 94 252 97 252 C100 252 101 242 100 230 C100 218 98 208 96 206 Z"
            className={`transition-colors duration-300 cursor-pointer ${getFill('calves')}`}
          >
            <title>Right Gastrocnemius (Calf)</title>
          </path>
        </svg>
      </div>

      {/* Target Muscles Pill Summary */}
      <div className="flex-1 max-w-xs text-left">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
          <span>Active Target Zones</span>
        </h4>
        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
          {activeExerciseMuscle
            ? `Focusing primary load on ${activeExerciseMuscle.toUpperCase()}`
            : 'Select target muscles for this training session'}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {targetedMuscles.length > 0 ? (
            targetedMuscles.map((m) => (
              <span
                key={m}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase transition-colors ${
                  activeExerciseMuscle === m
                    ? 'bg-lime text-dark-950 shadow-lime-sm'
                    : 'bg-lime/10 text-lime border border-lime/30'
                }`}
              >
                {m}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-500 italic">No muscles targeted yet</span>
          )}
        </div>
      </div>
    </div>
  );
};
