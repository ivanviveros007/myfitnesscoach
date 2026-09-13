export type ExerciseOrigin = "bigg-reference" | "curated";
export type ExerciseLevel = "beginner" | "intermediate" | "advanced";
export type ExerciseImpact = "none" | "low" | "medium" | "high";
export type ExerciseMetric = "reps" | "seconds" | "distance" | "calories";
export type DoseProfile =
  | "warmup"
  | "power"
  | "strength"
  | "hypertrophy"
  | "interval"
  | "conditioning"
  | "core-control"
  | "mobility";

export type ClassifiedExercise = {
  id: string;
  name: { es: string; en: string };
  origin: ExerciseOrigin;
  patterns: string[];
  goals: string[];
  regions: string[];
  equipment: string[];
  level: ExerciseLevel;
  impact: ExerciseImpact;
  metric: ExerciseMetric;
  doseProfiles: DoseProfile[];
  unilateral?: boolean;
  sourceFrames?: string[];
};

const bigg = (
  id: string,
  es: string,
  en: string,
  patterns: string[],
  goals: string[],
  regions: string[],
  equipment: string[],
  level: ExerciseLevel,
  impact: ExerciseImpact,
  doseProfiles: DoseProfile[],
  sourceFrames: string[],
  unilateral = false,
): ClassifiedExercise => ({
  id,
  name: { es, en },
  origin: "bigg-reference",
  patterns,
  goals,
  regions,
  equipment,
  level,
  impact,
  metric: doseProfiles.includes("mobility") ? "seconds" : "reps",
  doseProfiles,
  sourceFrames,
  unilateral,
});

const curated = (
  id: string,
  es: string,
  en: string,
  patterns: string[],
  goals: string[],
  regions: string[],
  equipment: string[],
  level: ExerciseLevel,
  impact: ExerciseImpact,
  doseProfiles: DoseProfile[],
  unilateral = false,
): ClassifiedExercise => ({
  id,
  name: { es, en },
  origin: "curated",
  patterns,
  goals,
  regions,
  equipment,
  level,
  impact,
  metric: doseProfiles.includes("mobility") ? "seconds" : "reps",
  doseProfiles,
  unilateral,
});

export const classifiedExercises: ClassifiedExercise[] = [
  bigg("prone-hip-rotation", "Rotación interna y externa de cadera en prono", "Prone Hip Internal-External Rotation", ["hip-rotation"], ["warmup", "mobility"], ["hips"], ["mat"], "beginner", "none", ["warmup", "mobility"], ["IMG_3809", "IMG_3811", "IMG_3815"], true),
  bigg("ankle-mobilization", "Movilización de tobillo", "Ankle Mobilization", ["ankle-mobility"], ["warmup", "mobility"], ["ankles"], ["none"], "beginner", "none", ["warmup", "mobility"], ["IMG_3809", "IMG_3810", "IMG_3813"], true),
  bigg("front-step-thoracic-rotation", "Paso frontal con rotación torácica", "Front Step + Thoracic Rotation", ["lunge", "thoracic-rotation"], ["warmup", "mobility", "transfer"], ["hips", "thoracic"], ["none"], "beginner", "low", ["warmup", "mobility"], ["IMG_3809", "IMG_3811", "IMG_3815"], true),
  bigg("glute-bridge-hold", "Puente de glúteos isométrico", "Glute Bridge Hold", ["hip-extension", "isometric"], ["warmup", "stability"], ["glutes", "core"], ["mat"], "beginner", "none", ["warmup", "core-control"], ["IMG_3809"]),
  bigg("reverse-plank-march", "Marcha en plancha invertida", "Reverse Plank March", ["anti-extension", "locomotion"], ["warmup", "stability"], ["core", "shoulders", "glutes"], ["mat"], "intermediate", "low", ["warmup", "core-control"], ["IMG_3809"]),
  bigg("skipping", "Skipping", "Skipping", ["locomotion", "knee-drive"], ["warmup", "conditioning", "transfer"], ["legs"], ["none"], "beginner", "medium", ["warmup", "interval"], ["IMG_3809", "IMG_3897"]),
  bigg("single-leg-diagonal-hop", "Saltos diagonales a una pierna", "Single-Leg Diagonal Hops", ["horizontal-jump", "landing"], ["power", "transfer", "sport"], ["legs", "ankles"], ["none"], "advanced", "high", ["power"], ["IMG_3809"], true),
  bigg("bird-dog", "Bird dog", "Bird Dog", ["anti-rotation", "contralateral"], ["warmup", "stability", "pilates"], ["core", "glutes"], ["mat"], "beginner", "none", ["warmup", "core-control"], ["IMG_3810"] , true),
  bigg("stiff-leg-dead-bug", "Dead bug con piernas extendidas", "Stiff Leg Dead Bug", ["anti-extension"], ["warmup", "stability", "midline"], ["core"], ["mat"], "intermediate", "none", ["warmup", "core-control"], ["IMG_3811"]),
  bigg("tall-windmill-plank", "Plancha alta windmill alternada", "Alternating Tall Windmill Plank", ["plank", "rotation"], ["warmup", "stability", "midline"], ["core", "shoulders"], ["mat"], "intermediate", "low", ["warmup", "core-control"], ["IMG_3811"], true),
  bigg("jump-squat", "Sentadilla con salto", "Jumping Squat", ["vertical-jump", "squat"], ["power", "hiit", "conditioning"], ["legs"], ["none"], "intermediate", "high", ["power", "interval", "conditioning"], ["IMG_3811", "IMG_3897"]),
  bigg("walking-samson-stretch", "Estiramiento Samson caminando", "Walking Samson Stretch", ["lunge", "hip-extension", "overhead-reach"], ["warmup", "mobility"], ["hips", "shoulders"], ["none"], "beginner", "low", ["warmup", "mobility"], ["IMG_3815"] , true),
  bigg("hip-back-rotation", "Movilidad de cadera y espalda", "Hip & Back Rotation Mobility", ["hip-rotation", "spinal-rotation"], ["mobility"], ["hips", "spine"], ["mat"], "beginner", "none", ["mobility"], ["IMG_3814"] , true),
  bigg("hamstring-floss", "Movilización dinámica de isquiotibiales", "Hamstring Floss", ["knee-extension", "hip-hinge"], ["warmup", "mobility"], ["hamstrings"], ["none"], "beginner", "none", ["warmup", "mobility"], ["IMG_3814", "IMG_3841"], true),
  bigg("dorsal-lumbar-rotation", "Rotación dorsal y lumbar", "Dorsal-Lumbar Rotation", ["spinal-rotation"], ["mobility"], ["thoracic", "lower-back"], ["mat"], "beginner", "none", ["mobility"], ["IMG_3814"], true),
  bigg("band-external-rotation", "Rotación externa con banda", "Banded External Rotation", ["external-rotation"], ["warmup", "stability", "upper-body"], ["shoulders"], ["band"], "beginner", "none", ["warmup", "core-control"], ["IMG_3815"], true),
  bigg("kb-sumo-deadlift", "Peso muerto sumo con kettlebell", "KB Sumo Deadlift", ["hinge", "squat"], ["hypertrophy", "full-body"], ["glutes", "hamstrings", "legs"], ["kettlebell"], "beginner", "low", ["hypertrophy", "conditioning"], ["IMG_3818"]),
  bigg("medicine-ball-deadlift", "Peso muerto con balón medicinal", "MB Deadlift", ["hinge"], ["warmup", "full-body", "conditioning"], ["glutes", "hamstrings"], ["medicine-ball"], "beginner", "low", ["warmup", "conditioning"], ["IMG_3819", "IMG_3866"]),
  bigg("medicine-ball-push-press", "Push press con balón medicinal", "MB Push Press", ["vertical-press", "leg-drive"], ["full-body", "conditioning"], ["shoulders", "legs"], ["medicine-ball"], "beginner", "low", ["conditioning"], ["IMG_3819", "IMG_3866"]),
  bigg("trx-row", "Remo en TRX", "TRX Row", ["horizontal-pull"], ["strength", "hypertrophy", "full-body"], ["back", "biceps"], ["suspension-trainer"], "beginner", "none", ["strength", "hypertrophy", "conditioning"], ["IMG_3819", "IMG_3838", "IMG_3866", "IMG_3898"]),
  bigg("plank-shoulder-tap", "Toques de hombro en plancha", "Plank Shoulder Taps", ["plank", "anti-rotation"], ["midline", "conditioning"], ["core", "shoulders"], ["mat"], "beginner", "low", ["core-control", "interval"], ["IMG_3820"] , true),
  bigg("sit-up", "Abdominal sit-up", "Sit Up", ["trunk-flexion"], ["midline", "conditioning", "full-body"], ["core"], ["mat"], "beginner", "none", ["core-control", "conditioning"], ["IMG_3820", "IMG_3827", "IMG_3899"]),
  bigg("bulgarian-squat", "Sentadilla búlgara", "Bulgarian Squat", ["squat", "single-leg"], ["strength", "hypertrophy", "legs"], ["quads", "glutes"], ["bench"], "intermediate", "low", ["strength", "hypertrophy"], ["IMG_3821", "IMG_3873"] , true),
  bigg("split-lunge", "Zancada estática", "Split Lunge", ["lunge", "single-leg"], ["strength", "warmup", "legs"], ["quads", "glutes"], ["none"], "beginner", "low", ["warmup", "strength", "hypertrophy"], ["IMG_3821", "IMG_3881"] , true),
  bigg("double-kb-front-rack-reverse-lunge", "Zancada inversa front rack con dos kettlebells", "DKB Front Rack Reverse Lunge", ["lunge", "single-leg"], ["strength", "combined-strength", "legs"], ["quads", "glutes", "core"], ["kettlebell"], "advanced", "low", ["strength", "hypertrophy"], ["IMG_3822", "IMG_3876"] , true),
  bigg("single-leg-glute-bridge", "Puente de glúteos a una pierna", "Single-Leg Glute Bridge", ["hip-extension", "single-leg"], ["strength", "stability", "legs"], ["glutes", "core"], ["mat"], "intermediate", "none", ["strength", "core-control"], ["IMG_3822", "IMG_3876"] , true),
  bigg("plank-in-out", "Plancha con apertura y cierre", "Plank In & Out", ["plank", "locomotion"], ["midline", "conditioning", "combined-strength"], ["core", "shoulders"], ["mat"], "intermediate", "medium", ["core-control", "interval"], ["IMG_3822", "IMG_3876"]),
  bigg("burpee-tuck-jump", "Burpee con salto agrupado", "Burpee Tuck Jump", ["burpee", "vertical-jump"], ["hiit", "cross-training", "conditioning"], ["full-body"], ["none"], "advanced", "high", ["interval", "conditioning"], ["IMG_3824", "IMG_3886"]),
  bigg("double-kb-devil-clean", "Devil clean con dos kettlebells", "DKB Devil Clean", ["hinge", "clean", "burpee"], ["cross-training", "conditioning"], ["full-body"], ["kettlebell"], "advanced", "high", ["interval", "conditioning"], ["IMG_3824", "IMG_3886"]),
  bigg("band-front-fly", "Apertura frontal con banda", "Banded Front Fly", ["horizontal-adduction"], ["hypertrophy", "upper-body"], ["chest", "shoulders"], ["band"], "beginner", "none", ["hypertrophy"], ["IMG_3825", "IMG_3887"]),
  bigg("band-alt-chest-press", "Press de pecho alternado con banda", "Banded Alternating Chest Press", ["horizontal-push"], ["hypertrophy", "upper-body"], ["chest", "triceps"], ["band"], "beginner", "none", ["hypertrophy"], ["IMG_3825", "IMG_3887"] , true),
  bigg("dumbbell-three-way-fly", "Apertura con mancuernas en tres direcciones", "DDB Three-Way Fly", ["shoulder-raise", "horizontal-adduction"], ["hypertrophy", "upper-body"], ["shoulders", "chest"], ["dumbbell"], "intermediate", "none", ["hypertrophy"], ["IMG_3825", "IMG_3887"]),
  bigg("jumping-jack", "Jumping jack", "Jumping Jack", ["locomotion"], ["hiit", "conditioning", "warmup"], ["full-body"], ["none"], "beginner", "medium", ["warmup", "interval"], ["IMG_3826"]),
  bigg("sprawl", "Sprawl", "Sprawl", ["burpee", "plank"], ["hiit", "conditioning", "sport"], ["full-body"], ["none"], "intermediate", "high", ["interval", "conditioning"], ["IMG_3827"]),
  bigg("single-db-hang-snatch", "Hang snatch con una mancuerna", "SDB Hang Snatch", ["hinge", "pull", "overhead"], ["cross-training", "power", "conditioning"], ["full-body"], ["dumbbell"], "advanced", "medium", ["power", "interval"], ["IMG_3828"] , true),
  bigg("medicine-ball-overhead-sit-up", "Sit-up con balón medicinal sobre la cabeza", "MB Overhead Sit-Up", ["trunk-flexion", "overhead"], ["midline"], ["core", "shoulders"], ["medicine-ball"], "intermediate", "none", ["core-control"], ["IMG_3829"]),
  bigg("toe-touch", "Toques de punta de pies", "Toe Touch", ["trunk-flexion"], ["midline", "pilates"], ["core"], ["mat"], "beginner", "none", ["core-control"], ["IMG_3829"]),
  bigg("windshield-wiper-over-ball", "Limpiaparabrisas sobre balón medicinal", "Windshield Wipers over the MB", ["trunk-rotation"], ["midline", "stability"], ["core"], ["medicine-ball", "mat"], "intermediate", "none", ["core-control"], ["IMG_3829"] , true),
  bigg("barbell-front-squat", "Sentadilla frontal con barra", "Barbell Front Squat", ["squat"], ["strength", "hypertrophy", "legs"], ["quads", "glutes", "core"], ["barbell", "rack"], "advanced", "low", ["strength", "hypertrophy"], ["IMG_3830", "IMG_3894"]),
  bigg("push-up", "Flexión de brazos", "Push Up", ["horizontal-push"], ["strength", "upper-body", "conditioning"], ["chest", "triceps", "core"], ["none"], "beginner", "none", ["strength", "hypertrophy", "conditioning"], ["IMG_3832"]),
  bigg("side-plank", "Plancha lateral", "Side Plank", ["anti-lateral-flexion"], ["midline", "stability", "upper-body"], ["core", "shoulders"], ["mat"], "beginner", "none", ["core-control"], ["IMG_3832"] , true),
  bigg("tempo-back-squat", "Sentadilla trasera con tempo descendente", "Tempo Barbell Back Squat (Down)", ["squat"], ["strength", "power-preparation", "legs"], ["quads", "glutes"], ["barbell", "rack"], "advanced", "low", ["strength"], ["IMG_3833", "IMG_3869"]),
  bigg("squat-hold", "Sentadilla isométrica", "Squat Hold", ["squat", "isometric"], ["strength", "power-preparation", "legs"], ["quads", "glutes"], ["none"], "beginner", "none", ["strength", "core-control"], ["IMG_3833", "IMG_3869"]),
  bigg("box-jump", "Salto al cajón", "Box Jump", ["vertical-jump", "landing"], ["power", "cross-training", "sport"], ["legs"], ["box"], "intermediate", "high", ["power"], ["IMG_3833", "IMG_3869"]),
  bigg("barbell-deadlift", "Peso muerto con barra", "Barbell Deadlift", ["hinge"], ["strength", "hypertrophy", "full-body"], ["glutes", "hamstrings", "back"], ["barbell"], "intermediate", "low", ["strength", "hypertrophy"], ["IMG_3834", "IMG_3837", "IMG_3879"]),
  bigg("ham-roller-rollout", "Rollout con ham roller", "Ham Roller Roll Out", ["anti-extension"], ["pilates", "midline"], ["core", "hamstrings"], ["ham-roller"], "intermediate", "none", ["core-control"], ["IMG_3835", "IMG_3839"]),
  bigg("ham-roller-kickback-crunch", "Kickback y crunch con ham roller", "Ham Roller Kickback + Crunch", ["hip-extension", "trunk-flexion"], ["pilates", "midline"], ["core", "glutes"], ["ham-roller"], "intermediate", "none", ["core-control"], ["IMG_3835"] , true),
  bigg("dumbbell-shoulder-press", "Press de hombros con mancuernas", "DDB Shoulder Press", ["vertical-push"], ["strength", "hypertrophy", "upper-body"], ["shoulders", "triceps"], ["dumbbell"], "beginner", "none", ["strength", "hypertrophy"], ["IMG_3836"]),
  bigg("barbell-bent-over-row", "Remo inclinado con barra", "Barbell Bent Over Row", ["horizontal-pull", "hinge"], ["strength", "hypertrophy", "full-body"], ["back", "biceps"], ["barbell"], "intermediate", "none", ["strength", "hypertrophy"], ["IMG_3837", "IMG_3899"]),
  bigg("barbell-push-press", "Push press con barra", "Barbell Push Press", ["vertical-push", "leg-drive"], ["power", "strength", "full-body"], ["shoulders", "legs"], ["barbell"], "advanced", "medium", ["power", "strength"], ["IMG_3837"]),
  bigg("hollow-hold", "Hollow hold", "Hollow Hold", ["anti-extension", "isometric"], ["midline", "stability"], ["core"], ["mat"], "intermediate", "none", ["core-control"], ["IMG_3801", "IMG_3837", "IMG_3842"]),
  bigg("dumbbell-chest-press", "Press de pecho con mancuernas", "DDB Chest Press", ["horizontal-push"], ["combined-strength", "strength", "hypertrophy"], ["chest", "triceps"], ["dumbbell", "bench"], "beginner", "none", ["strength", "hypertrophy"], ["IMG_3838"]),
  bigg("barbell-rdl", "Peso muerto rumano con barra", "Barbell Romanian Deadlift", ["hinge"], ["combined-strength", "strength", "hypertrophy"], ["hamstrings", "glutes"], ["barbell"], "intermediate", "low", ["strength", "hypertrophy"], ["IMG_3838"]),
  bigg("goblet-lunge", "Zancada goblet", "Goblet Lunge", ["lunge", "single-leg"], ["combined-strength", "strength", "legs"], ["quads", "glutes"], ["dumbbell", "kettlebell"], "intermediate", "low", ["strength", "hypertrophy"], ["IMG_3838"] , true),
  bigg("ham-roller-lateral-lunge", "Zancada lateral con ham roller", "Ham Roller Lateral Lunge", ["lateral-lunge"], ["pilates", "mobility", "legs"], ["adductors", "glutes"], ["ham-roller"], "intermediate", "none", ["core-control", "mobility"], ["IMG_3839"] , true),
  bigg("ham-roller-bridge-slide", "Deslizamiento de puente con ham roller", "Ham Roller Bridge Slide", ["hip-extension", "knee-flexion"], ["pilates", "strength"], ["hamstrings", "glutes"], ["ham-roller"], "intermediate", "none", ["hypertrophy", "core-control"], ["IMG_3839"]),
  bigg("pallof-rotation", "Rotación Pallof en media rodilla", "Half-Kneeling Pallof Rotation", ["anti-rotation", "rotation"], ["stability", "midline", "sport"], ["core"], ["cable", "band"], "intermediate", "none", ["core-control"], ["IMG_3842"] , true),
  bigg("medicine-ball-russian-twist", "Giro ruso con balón medicinal", "MB Russian Twist", ["trunk-rotation"], ["midline", "conditioning"], ["core"], ["medicine-ball"], "intermediate", "none", ["core-control", "conditioning"], ["IMG_3843"] , true),
  bigg("medicine-ball-chest-throw", "Lanzamiento de pecho con balón medicinal", "MB Chest Throw", ["horizontal-push", "throw"], ["power", "sport"], ["chest", "triceps"], ["medicine-ball", "wall"], "intermediate", "low", ["power"], ["IMG_3843"]),
  bigg("medicine-ball-mountain-climber", "Mountain climber sobre balón medicinal", "MB Mountain Climber", ["plank", "knee-drive"], ["conditioning", "midline"], ["core", "shoulders"], ["medicine-ball"], "intermediate", "medium", ["interval", "conditioning"], ["IMG_3843"] , true),
  bigg("sprawl-backhand-volley", "Sprawl, paso y volea de revés", "Sprawl to Step + Backhand Volley", ["burpee", "lateral-step", "rotation"], ["padel", "transfer", "sport"], ["full-body"], ["none"], "advanced", "high", ["conditioning"], ["IMG_3853", "IMG_3855"] , true),
  bigg("anti-rotation-half-kneeling-twist", "Giro antirotacional en media rodilla", "Anti-Rotational Half-Kneeling Twist", ["anti-rotation", "rotation"], ["padel", "stability", "sport"], ["core"], ["band", "cable"], "intermediate", "none", ["core-control"], ["IMG_3853", "IMG_3855"] , true),
  bigg("pivot-drive", "Pivote y salida", "Pivot + Drive", ["pivot", "acceleration"], ["padel", "transfer", "sport"], ["legs", "core"], ["none"], "intermediate", "medium", ["power", "conditioning"], ["IMG_3853", "IMG_3855"] , true),
  bigg("single-leg-standing-pulse-raise", "Pulso y elevación de pie a una pierna", "Single-Leg Standing Pulse + Raise", ["single-leg", "balance"], ["pilates", "stability"], ["legs", "glutes"], ["none"], "intermediate", "none", ["core-control"], ["IMG_3862"] , true),
  bigg("quadruped-straight-kickback", "Patada posterior extendida en cuadrupedia", "Quadruped Straight Kickback", ["hip-extension"], ["pilates", "stability", "legs"], ["glutes", "core"], ["mat"], "beginner", "none", ["core-control", "hypertrophy"], ["IMG_3862"] , true),
  bigg("cossack-rotating-lunge", "Cossack a zancada con rotación", "Cossack to Rotating Lunge", ["lateral-lunge", "rotation"], ["pilates", "mobility", "transfer"], ["hips", "legs", "thoracic"], ["none"], "intermediate", "low", ["mobility", "core-control"], ["IMG_3862"] , true),
  bigg("loaded-beast-jump-squat", "Loaded beast a sentadilla con salto", "Loaded Beast to Jumping Squat", ["quadruped", "vertical-jump"], ["sport", "power", "cross-training"], ["full-body"], ["mat"], "advanced", "high", ["power", "conditioning"], ["IMG_3881"]),
  bigg("stiff-leg-vertical-jump", "Salto vertical con piernas semirrígidas", "Stiff Leg Vertical Jump", ["vertical-jump", "ankle-stiffness"], ["power", "sport"], ["calves", "ankles"], ["none"], "advanced", "high", ["power"], ["IMG_3881"]),
  bigg("barbell-back-squat", "Sentadilla trasera con barra", "Barbell Back Squat", ["squat"], ["strength", "hypertrophy", "legs"], ["quads", "glutes"], ["barbell", "rack"], "advanced", "low", ["strength", "hypertrophy"], ["IMG_3891", "IMG_3894"]),
  bigg("barbell-shoulder-press", "Press de hombros con barra", "Barbell Shoulder Press", ["vertical-push"], ["strength", "upper-body"], ["shoulders", "triceps"], ["barbell", "rack"], "intermediate", "none", ["strength", "hypertrophy"], ["IMG_3892"]),
  bigg("barbell-hip-thrust", "Hip thrust con barra", "Barbell Hip Thrust", ["hip-extension"], ["strength", "hypertrophy", "legs"], ["glutes", "hamstrings"], ["barbell", "bench"], "intermediate", "none", ["strength", "hypertrophy"], ["IMG_3893", "IMG_3895"]),
  bigg("burpee", "Burpee", "Burpee", ["burpee"], ["hiit", "cross-training", "conditioning"], ["full-body"], ["none"], "intermediate", "high", ["interval", "conditioning"], ["IMG_3897"]),
  bigg("mountain-climber", "Mountain climber", "Mountain Climber", ["plank", "knee-drive"], ["hiit", "conditioning", "midline"], ["core", "shoulders"], ["none"], "beginner", "medium", ["interval", "conditioning"], ["IMG_3897"] , true),
  bigg("plank-jack", "Plancha con apertura y cierre de piernas", "Plank Jack", ["plank", "locomotion"], ["hiit", "conditioning"], ["core", "shoulders"], ["none"], "intermediate", "medium", ["interval"], ["IMG_3897"]),
  bigg("strict-chin-up", "Dominada supina estricta", "Strict Chin Up", ["vertical-pull"], ["strength", "upper-body"], ["back", "biceps"], ["pull-up-bar"], "advanced", "none", ["strength", "hypertrophy"], ["IMG_3897"]),
  bigg("barbell-good-morning", "Good morning con barra", "Barbell Good Morning", ["hinge"], ["strength", "full-body"], ["hamstrings", "glutes", "back"], ["barbell", "rack"], "advanced", "none", ["strength"], ["IMG_3899"]),
  bigg("v-sit-up", "Abdominal en V", "V-Sit Up", ["trunk-flexion"], ["hiit", "midline"], ["core"], ["mat"], "intermediate", "none", ["core-control", "interval"], ["IMG_3899", "IMG_3900"]),

  curated("air-squat", "Sentadilla sin carga", "Air Squat", ["squat"], ["warmup", "strength", "conditioning"], ["quads", "glutes"], ["none"], "beginner", "none", ["warmup", "strength", "conditioning"]),
  curated("goblet-squat", "Sentadilla goblet", "Goblet Squat", ["squat"], ["strength", "hypertrophy", "full-body"], ["quads", "glutes"], ["dumbbell", "kettlebell"], "beginner", "none", ["strength", "hypertrophy"]),
  curated("dumbbell-rdl", "Peso muerto rumano con mancuernas", "Dumbbell Romanian Deadlift", ["hinge"], ["strength", "hypertrophy", "full-body"], ["hamstrings", "glutes"], ["dumbbell"], "beginner", "none", ["strength", "hypertrophy"]),
  curated("incline-push-up", "Flexión inclinada", "Incline Push Up", ["horizontal-push"], ["strength", "upper-body"], ["chest", "triceps"], ["bench"], "beginner", "none", ["strength", "hypertrophy"]),
  curated("one-arm-dumbbell-row", "Remo con mancuerna y apoyo", "One-Arm Dumbbell Row", ["horizontal-pull"], ["strength", "hypertrophy", "upper-body"], ["back", "biceps"], ["dumbbell", "bench"], "beginner", "none", ["strength", "hypertrophy"], true),
  curated("half-squat-jump", "Salto desde media sentadilla", "Half Squat Jump", ["vertical-jump", "landing"], ["power", "sport"], ["legs"], ["none"], "intermediate", "high", ["power"]),
  curated("lateral-shuffle", "Desplazamiento lateral", "Lateral Shuffle", ["lateral-locomotion", "deceleration"], ["warmup", "transfer", "sport"], ["legs"], ["none"], "beginner", "medium", ["warmup", "conditioning"]),
  curated("dead-bug", "Dead bug", "Dead Bug", ["anti-extension", "contralateral"], ["stability", "midline", "pilates"], ["core"], ["mat"], "beginner", "none", ["core-control"], true),
  curated("pallof-press", "Press Pallof", "Pallof Press", ["anti-rotation"], ["stability", "midline", "sport"], ["core"], ["band", "cable"], "beginner", "none", ["core-control"], true),
  curated("step-up", "Subida al cajón", "Step Up", ["step", "single-leg"], ["strength", "legs", "transfer"], ["quads", "glutes"], ["box"], "beginner", "low", ["strength", "hypertrophy"], true),
  curated("lateral-step-up", "Subida lateral al cajón", "Lateral Step Up", ["lateral-step", "single-leg"], ["strength", "legs", "sport"], ["quads", "glutes"], ["box"], "intermediate", "low", ["strength", "hypertrophy"], true),
  curated("bench-press", "Press de banca", "Barbell Bench Press", ["horizontal-push"], ["strength", "hypertrophy", "upper-body"], ["chest", "triceps"], ["barbell", "bench", "rack"], "intermediate", "none", ["strength", "hypertrophy"]),
  curated("lat-pulldown", "Jalón al pecho", "Lat Pulldown", ["vertical-pull"], ["strength", "hypertrophy", "upper-body"], ["back", "biceps"], ["cable"], "beginner", "none", ["strength", "hypertrophy"]),
  curated("seated-cable-row", "Remo sentado en polea", "Seated Cable Row", ["horizontal-pull"], ["strength", "hypertrophy", "upper-body"], ["back", "biceps"], ["cable"], "beginner", "none", ["strength", "hypertrophy"]),
  curated("leg-press", "Prensa de piernas", "Leg Press", ["squat"], ["strength", "hypertrophy", "legs"], ["quads", "glutes"], ["leg-press"], "beginner", "none", ["strength", "hypertrophy"]),
  curated("hamstring-curl", "Curl femoral", "Hamstring Curl", ["knee-flexion"], ["hypertrophy", "legs"], ["hamstrings"], ["machine"], "beginner", "none", ["hypertrophy"]),
  curated("calf-raise", "Elevación de gemelos", "Calf Raise", ["plantar-flexion"], ["strength", "hypertrophy", "legs"], ["calves"], ["none"], "beginner", "none", ["strength", "hypertrophy"]),
  curated("farmer-carry", "Caminata del granjero", "Farmer Carry", ["carry", "locomotion"], ["strength", "full-body", "cross-training"], ["grip", "core", "legs"], ["dumbbell", "kettlebell"], "beginner", "low", ["strength", "conditioning"]),
  curated("sled-push", "Empuje de trineo", "Sled Push", ["horizontal-push", "locomotion"], ["strength", "conditioning", "sport"], ["legs", "full-body"], ["sled"], "intermediate", "low", ["strength", "conditioning"]),
  curated("kettlebell-swing", "Swing con kettlebell", "Kettlebell Swing", ["hinge", "ballistic"], ["power", "cross-training", "conditioning"], ["glutes", "hamstrings", "core"], ["kettlebell"], "intermediate", "medium", ["power", "interval", "conditioning"]),
  curated("dumbbell-thruster", "Thruster con mancuernas", "Dumbbell Thruster", ["squat", "vertical-push"], ["cross-training", "conditioning", "full-body"], ["full-body"], ["dumbbell"], "intermediate", "medium", ["interval", "conditioning"]),
  curated("bike-erg", "Bicicleta ergométrica", "Bike Erg", ["cyclic"], ["hiit", "conditioning", "warmup"], ["legs", "cardio"], ["bike-erg"], "beginner", "low", ["warmup", "interval", "conditioning"]),
  curated("rowing-erg", "Remo ergométrico", "Rowing Erg", ["cyclic", "pull"], ["hiit", "conditioning", "full-body"], ["full-body", "cardio"], ["rower"], "intermediate", "low", ["warmup", "interval", "conditioning"]),
  curated("ski-erg", "Ski erg", "Ski Erg", ["cyclic", "vertical-pull"], ["hiit", "conditioning", "upper-body"], ["upper-body", "cardio"], ["ski-erg"], "intermediate", "low", ["warmup", "interval", "conditioning"]),
  curated("battle-rope", "Ondas con cuerda", "Battle Rope Waves", ["cyclic", "arm-drive"], ["hiit", "conditioning", "upper-body"], ["shoulders", "arms", "cardio"], ["battle-rope"], "beginner", "low", ["interval", "conditioning"]),
  curated("bear-crawl", "Caminata de oso", "Bear Crawl", ["quadruped", "locomotion"], ["warmup", "cross-training", "stability"], ["full-body", "core"], ["none"], "intermediate", "low", ["warmup", "conditioning", "core-control"]),
  curated("broad-jump", "Salto horizontal", "Broad Jump", ["horizontal-jump", "landing"], ["power", "sport"], ["legs"], ["none"], "intermediate", "high", ["power"]),
  curated("lateral-bound", "Salto lateral con recepción", "Lateral Bound", ["lateral-jump", "landing"], ["power", "transfer", "sport"], ["legs", "ankles"], ["none"], "intermediate", "high", ["power"], true),
  curated("medicine-ball-rotational-throw", "Lanzamiento rotacional con balón medicinal", "Medicine Ball Rotational Throw", ["rotation", "throw"], ["power", "transfer", "sport"], ["core", "hips", "shoulders"], ["medicine-ball", "wall"], "intermediate", "low", ["power"], true),
  curated("cable-chop", "Leñador en polea", "Cable Chop", ["rotation"], ["strength", "stability", "sport"], ["core", "shoulders"], ["cable"], "beginner", "none", ["strength", "core-control"], true),
  curated("copenhagen-plank", "Plancha Copenhagen", "Copenhagen Plank", ["anti-lateral-flexion", "hip-adduction"], ["stability", "sport", "midline"], ["adductors", "core"], ["bench"], "advanced", "none", ["core-control"], true),
  curated("single-leg-rdl", "Peso muerto rumano a una pierna", "Single-Leg Romanian Deadlift", ["hinge", "single-leg", "balance"], ["strength", "stability", "sport"], ["hamstrings", "glutes", "core"], ["dumbbell"], "intermediate", "none", ["strength", "core-control"], true),
  curated("world-greatest-stretch", "Estiramiento global con rotación", "World's Greatest Stretch", ["lunge", "thoracic-rotation"], ["warmup", "mobility"], ["hips", "thoracic"], ["none"], "beginner", "none", ["warmup", "mobility"], true),
  curated("ninety-ninety-hip-switch", "Cambios de cadera 90/90", "90/90 Hip Switch", ["hip-rotation"], ["mobility", "warmup"], ["hips"], ["mat"], "beginner", "none", ["warmup", "mobility"], true),
  curated("thoracic-open-book", "Rotación torácica en libro abierto", "Thoracic Open Book", ["thoracic-rotation"], ["mobility", "recovery"], ["thoracic", "shoulders"], ["mat"], "beginner", "none", ["mobility"], true),
  curated("downward-dog-calf-pedal", "Pedaleo de gemelos en perro boca abajo", "Downward Dog Calf Pedal", ["ankle-mobility", "overhead-support"], ["mobility", "pilates", "warmup"], ["calves", "shoulders"], ["mat"], "beginner", "none", ["warmup", "mobility"], true),
];

export const exerciseCatalogStats = {
  total: classifiedExercises.length,
  observedInBigg: classifiedExercises.filter((item) => item.origin === "bigg-reference").length,
  curated: classifiedExercises.filter((item) => item.origin === "curated").length,
};
