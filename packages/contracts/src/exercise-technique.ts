import { z } from "zod";
import {
  classifiedExercises,
  type ClassifiedExercise,
  type DoseProfile,
} from "./exercise-classification.js";

export const exercisePrescriptionSchema = z.object({
  profile: z.enum([
    "warmup",
    "power",
    "strength",
    "hypertrophy",
    "interval",
    "conditioning",
    "core-control",
    "mobility",
  ]),
  sets: z.number().int().min(1).max(8),
  repsMin: z.number().int().min(1).max(100).optional(),
  repsMax: z.number().int().min(1).max(100).optional(),
  workSeconds: z.number().int().min(5).max(300).optional(),
  restSecondsMin: z.number().int().min(0).max(300),
  restSecondsMax: z.number().int().min(0).max(600),
  rpeMin: z.number().min(1).max(10),
  rpeMax: z.number().min(1).max(10),
  stopRule: z.string().min(10).max(300),
});

export const exerciseSubstitutionSchema = z.object({
  exerciseId: z.string().min(1),
  reason: z.enum(["easier", "lower-impact", "equipment", "same-pattern"]),
});

export const exerciseTechniqueSchema = z.object({
  exercise: z.object({
    id: z.string().min(1),
    name: z.object({ es: z.string().min(1), en: z.string().min(1) }),
    origin: z.string().min(1),
    patterns: z.array(z.string()).min(1),
    goals: z.array(z.string()).min(1),
    regions: z.array(z.string()).min(1),
    equipment: z.array(z.string()).min(1),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    impact: z.enum(["none", "low", "medium", "high"]),
    metric: z.enum(["reps", "seconds", "distance", "calories"]),
    unilateral: z.boolean(),
  }),
  setup: z.array(z.string().min(8)).min(2),
  execution: z.array(z.string().min(8)).min(3),
  cues: z.array(z.string().min(8)).min(2),
  commonMistakes: z.array(z.string().min(8)).min(2),
  stopConditions: z.array(z.string().min(8)).min(2),
  coachingNote: z.string().min(20),
  beginnerEligible: z.boolean(),
  coachReviewRequired: z.boolean(),
  prescriptions: z.array(exercisePrescriptionSchema).min(1),
  substitutions: z.array(exerciseSubstitutionSchema).max(6),
  provenance: z.object({
    sourceFrames: z.array(z.string()),
    sourceUrl: z.string().url().optional(),
    techniqueStatus: z.enum(["template-reviewed", "coach-review-required"]),
  }),
});

export type ExerciseTechnique = z.infer<typeof exerciseTechniqueSchema>;

type TechniqueCopy = Pick<
  ExerciseTechnique,
  "setup" | "execution" | "cues" | "commonMistakes"
>;

const copyByPattern: Record<string, TechniqueCopy> = {
  squat: {
    setup: [
      "Ubicá los pies en una postura estable y apoyá toda la planta.",
      "Alineá rodillas con pies y mantené el tronco firme.",
    ],
    execution: [
      "Iniciá el descenso flexionando caderas y rodillas con control.",
      "Descendé sólo hasta conservar apoyo, alineación y una columna estable.",
      "Empujá el suelo y extendé caderas y rodillas sin perder la postura.",
    ],
    cues: [
      "Rodillas acompañan la dirección de los pies.",
      "Mantené el peso repartido en todo el pie.",
    ],
    commonMistakes: [
      "Dejar que las rodillas colapsen hacia adentro.",
      "Perder el apoyo del talón o redondear la espalda.",
    ],
  },
  hinge: {
    setup: [
      "Separá los pies al ancho de caderas y afirmá el abdomen.",
      "Llevá hombros atrás y mantené la carga cerca del cuerpo.",
    ],
    execution: [
      "Llevá la cadera hacia atrás con una leve flexión de rodillas.",
      "Descendé mientras la espalda permanezca estable y sientas tensión en la cadena posterior.",
      "Empujá el suelo y extendé la cadera sin hiperextender la zona lumbar.",
    ],
    cues: [
      "Pensá en cerrar una puerta con la cadera.",
      "La carga se desplaza cerca de las piernas.",
    ],
    commonMistakes: [
      "Convertir el gesto en una sentadilla profunda.",
      "Alejar la carga o redondear la espalda.",
    ],
  },
  "horizontal-push": {
    setup: [
      "Acomodá manos y hombros en una posición firme y simétrica.",
      "Estabilizá tronco, pelvis y pies antes de iniciar.",
    ],
    execution: [
      "Descendé o acercá la carga con control y sin perder la línea del torso.",
      "Mantené los codos en un ángulo cómodo respecto del cuerpo.",
      "Empujá de forma continua hasta completar el recorrido sin bloquear con violencia.",
    ],
    cues: [
      "Alejá el apoyo de tu cuerpo al empujar.",
      "Conservá hombros lejos de las orejas.",
    ],
    commonMistakes: [
      "Abrir excesivamente los codos.",
      "Perder la posición del tronco para terminar la repetición.",
    ],
  },
  "horizontal-pull": {
    setup: [
      "Adoptá una base estable y sostené la columna neutra.",
      "Extendé los brazos sin soltar el control de los hombros.",
    ],
    execution: [
      "Iniciá llevando los hombros suavemente hacia atrás.",
      "Acercá la carga al torso sin encoger los hombros.",
      "Volvé con control hasta extender los brazos manteniendo tensión.",
    ],
    cues: [
      "Llevá los codos hacia atrás.",
      "Mantené el pecho estable durante todo el recorrido.",
    ],
    commonMistakes: [
      "Impulsar el torso para mover la carga.",
      "Elevar los hombros o perder el control al volver.",
    ],
  },
  "vertical-push": {
    setup: [
      "Afirmá pies, glúteos y abdomen antes de elevar la carga.",
      "Partí con muñecas y codos en una posición cómoda bajo la carga.",
    ],
    execution: [
      "Empujá la carga hacia arriba siguiendo una trayectoria controlada.",
      "Dejá que la cabeza pase entre los brazos sin arquear la espalda.",
      "Bajá con control hasta la posición inicial.",
    ],
    cues: [
      "Costillas contenidas y abdomen activo.",
      "Terminá con brazos estables sobre los hombros.",
    ],
    commonMistakes: [
      "Arquear la zona lumbar para completar el movimiento.",
      "Bajar la carga sin control o forzar el rango del hombro.",
    ],
  },
  "vertical-pull": {
    setup: [
      "Tomá el agarre de forma simétrica y estabilizá los hombros.",
      "Afirmá el tronco antes de iniciar el tirón.",
    ],
    execution: [
      "Iniciá descendiendo las escápulas sin balancearte.",
      "Llevá los codos hacia abajo manteniendo el pecho estable.",
      "Regresá con control hasta una extensión cómoda de brazos.",
    ],
    cues: [
      "Pensá en llevar los codos hacia las costillas.",
      "Evitá usar impulso de piernas o tronco.",
    ],
    commonMistakes: [
      "Balancearse para completar repeticiones.",
      "Encoger los hombros o soltar la fase de regreso.",
    ],
  },
  lunge: {
    setup: [
      "Separá los pies para formar una base estable.",
      "Orientá pelvis, rodillas y pies hacia una dirección cómoda.",
    ],
    execution: [
      "Descendé flexionando ambas piernas sin perder el equilibrio.",
      "Mantené la rodilla delantera alineada con el pie.",
      "Empujá el suelo para regresar con control y completar el lado indicado.",
    ],
    cues: [
      "Tronco largo y pelvis estable.",
      "Usá todo el pie delantero como apoyo.",
    ],
    commonMistakes: [
      "Cruzar los pies sobre una línea demasiado estrecha.",
      "Dejar caer la rodilla hacia adentro.",
    ],
  },
  plank: {
    setup: [
      "Ubicá los apoyos debajo de hombros y extendé el cuerpo.",
      "Afirmá abdomen y glúteos sin contener la respiración.",
    ],
    execution: [
      "Alejá el suelo con los brazos y mantené el cuello largo.",
      "Realizá el movimiento indicado sin rotar ni hundir la pelvis.",
      "Regresá con control y repetí manteniendo la misma postura.",
    ],
    cues: [
      "Formá una línea estable entre cabeza y pelvis.",
      "Respirá mientras mantenés tensión abdominal.",
    ],
    commonMistakes: [
      "Hundir o elevar excesivamente la cadera.",
      "Trasladar todo el esfuerzo al cuello y los hombros.",
    ],
  },
  "vertical-jump": {
    setup: [
      "Buscá una superficie firme, despejada y con espacio para caer.",
      "Flexioná levemente caderas y rodillas con los pies bien apoyados.",
    ],
    execution: [
      "Impulsate con intención rápida extendiendo tobillos, rodillas y caderas.",
      "Aterrizá sobre ambos pies amortiguando con caderas y rodillas.",
      "Estabilizá por completo antes de comenzar la siguiente repetición.",
    ],
    cues: [
      "Cada salto debe conservar altura y control.",
      "Caé silencioso y con las rodillas alineadas.",
    ],
    commonMistakes: [
      "Encadenar saltos después de perder altura o estabilidad.",
      "Aterrizar rígido o con las rodillas hacia adentro.",
    ],
  },
  running: {
    setup: [
      "Comprobá que el recorrido esté libre y tenga una zona segura para frenar.",
      "Adoptá una postura alta con apoyo activo de los pies.",
    ],
    execution: [
      "Acelerá de manera progresiva usando brazos y piernas coordinados.",
      "Mantené pasos reactivos debajo del cuerpo.",
      "Desacelerá con varios apoyos cortos y controlados.",
    ],
    cues: [
      "Mirada al frente y brazos activos.",
      "Frená bajando el centro de masa sin bloquear las rodillas.",
    ],
    commonMistakes: [
      "Frenar de golpe con un único apoyo rígido.",
      "Perder la postura por buscar más velocidad.",
    ],
  },
  rotation: {
    setup: [
      "Establecé una base firme y alineá la columna antes de rotar.",
      "Ajustá la resistencia para controlar todo el recorrido.",
    ],
    execution: [
      "Iniciá la rotación desde la zona indicada por el ejercicio.",
      "Movete dentro de un rango cómodo sin forzar la espalda.",
      "Regresá lentamente y completá ambos lados cuando corresponda.",
    ],
    cues: [
      "Rotá con control y respiración continua.",
      "Mantené pelvis y costillas organizadas según el objetivo.",
    ],
    commonMistakes: [
      "Usar impulso para ganar recorrido.",
      "Forzar la zona lumbar o perder la base de apoyo.",
    ],
  },
  cyclic: {
    setup: [
      "Ajustá el equipo a tu altura y comprobá que esté estable.",
      "Comenzá con una resistencia que permita mantener técnica.",
    ],
    execution: [
      "Aumentá el ritmo de forma progresiva durante los primeros segundos.",
      "Sostené una cadencia uniforme durante el intervalo indicado.",
      "Reducí el ritmo gradualmente al finalizar.",
    ],
    cues: [
      "Respirá de forma rítmica.",
      "Priorizá una cadencia sostenible antes que la resistencia.",
    ],
    commonMistakes: [
      "Comenzar demasiado rápido y perder la técnica.",
      "Usar una configuración incorrecta del equipo.",
    ],
  },
};

const fallback: TechniqueCopy = {
  setup: [
    "Prepará el espacio y el equipamiento indicado antes de comenzar.",
    "Adoptá una posición estable y practicá el recorrido sin carga.",
  ],
  execution: [
    "Iniciá el movimiento lentamente para comprobar el control.",
    "Completá el recorrido indicado sin compensaciones ni dolor.",
    "Regresá con control y repetí sólo mientras mantengas la técnica.",
  ],
  cues: [
    "Respirá de forma continua.",
    "Priorizá control y calidad sobre velocidad o carga.",
  ],
  commonMistakes: [
    "Usar más carga o velocidad de la que se puede controlar.",
    "Continuar cuando aparece dolor o se pierde la postura.",
  ],
};

const copyByExercise: Partial<Record<string, TechniqueCopy>> = {
  "single-leg-rdl": {
    setup: [
      "Apoyá todo el pie de la pierna de trabajo y flexioná apenas esa rodilla.",
      "Sostené la carga cerca de la pierna de apoyo y extendé la otra pierna hacia atrás.",
    ],
    execution: [
      "Llevá la cadera hacia atrás mientras la pierna libre se eleva como contrapeso.",
      "Descendé la carga cerca de la pierna hasta conservar pelvis y espalda estables.",
      "Empujá el suelo y extendé la cadera para volver sin apoyar la pierna libre entre repeticiones.",
    ],
    cues: [
      "Mantené ambas caderas orientadas hacia el suelo.",
      "Formá una línea larga entre cabeza, tronco y pierna libre.",
    ],
    commonMistakes: [
      "Abrir la cadera de la pierna que se eleva.",
      "Buscar profundidad redondeando la espalda o perdiendo el equilibrio.",
    ],
  },
};

const aliases: Record<string, string> = {
  "lateral-lunge": "lunge",
  "single-leg": "lunge",
  step: "lunge",
  "horizontal-jump": "vertical-jump",
  "lateral-jump": "vertical-jump",
  landing: "vertical-jump",
  "thoracic-rotation": "rotation",
  "spinal-rotation": "rotation",
  "trunk-rotation": "rotation",
  "anti-rotation": "plank",
  "anti-extension": "plank",
  "anti-lateral-flexion": "plank",
  "trunk-flexion": "plank",
  quadruped: "plank",
  burpee: "plank",
  locomotion: "running",
  acceleration: "running",
  footwork: "running",
  "lateral-locomotion": "running",
  "change-of-direction": "running",
  "shoulder-raise": "vertical-push",
  "elbow-extension": "vertical-push",
  pull: "horizontal-pull",
  "elbow-flexion": "horizontal-pull",
  "hip-extension": "hinge",
  "knee-flexion": "hinge",
};

const dose: Record<
  DoseProfile,
  Omit<z.infer<typeof exercisePrescriptionSchema>, "profile">
> = {
  warmup: {
    sets: 1,
    repsMin: 6,
    repsMax: 10,
    restSecondsMin: 0,
    restSecondsMax: 30,
    rpeMin: 2,
    rpeMax: 4,
    stopRule: "Detenete si el movimiento no mejora con las repeticiones.",
  },
  power: {
    sets: 3,
    repsMin: 3,
    repsMax: 5,
    restSecondsMin: 90,
    restSecondsMax: 180,
    rpeMin: 6,
    rpeMax: 8,
    stopRule:
      "Cortá la serie cuando disminuya la velocidad, altura o calidad de recepción.",
  },
  strength: {
    sets: 3,
    repsMin: 4,
    repsMax: 8,
    restSecondsMin: 90,
    restSecondsMax: 240,
    rpeMin: 6,
    rpeMax: 8,
    stopRule: "Finalizá con dos repeticiones técnicamente posibles en reserva.",
  },
  hypertrophy: {
    sets: 3,
    repsMin: 8,
    repsMax: 15,
    restSecondsMin: 60,
    restSecondsMax: 120,
    rpeMin: 7,
    rpeMax: 9,
    stopRule:
      "Detenete antes de que la fatiga altere el recorrido o la postura.",
  },
  interval: {
    sets: 4,
    workSeconds: 30,
    restSecondsMin: 30,
    restSecondsMax: 90,
    rpeMin: 7,
    rpeMax: 9,
    stopRule:
      "Reducí el ritmo o terminá el intervalo si no podés sostener la técnica.",
  },
  conditioning: {
    sets: 3,
    workSeconds: 40,
    restSecondsMin: 20,
    restSecondsMax: 90,
    rpeMin: 6,
    rpeMax: 8,
    stopRule:
      "Bajá la intensidad cuando no puedas recuperar el control respiratorio.",
  },
  "core-control": {
    sets: 2,
    repsMin: 6,
    repsMax: 12,
    restSecondsMin: 30,
    restSecondsMax: 60,
    rpeMin: 4,
    rpeMax: 7,
    stopRule:
      "Terminá la serie cuando la columna o pelvis deje de mantenerse estable.",
  },
  mobility: {
    sets: 2,
    workSeconds: 30,
    restSecondsMin: 0,
    restSecondsMax: 30,
    rpeMin: 2,
    rpeMax: 4,
    stopRule:
      "Reducí el rango si aparece dolor, hormigueo o una tensión intensa.",
  },
};

const techniqueFor = (item: ClassifiedExercise): TechniqueCopy => {
  const exact = copyByExercise[item.id];
  if (exact) return exact;
  for (const pattern of item.patterns) {
    const key = aliases[pattern] ?? pattern;
    if (copyByPattern[key]) return copyByPattern[key];
  }
  return fallback;
};

const substitutionCandidates = (item: ClassifiedExercise) =>
  classifiedExercises
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => ({
      candidate,
      score:
        candidate.patterns.filter((p) => item.patterns.includes(p)).length * 5 +
        candidate.goals.filter((g) => item.goals.includes(g)).length * 2 +
        (candidate.level === "beginner" ? 2 : 0) +
        (candidate.impact === "none" || candidate.impact === "low" ? 1 : 0),
    }))
    .filter(({ score }) => score >= 5)
    .sort(
      (a, b) =>
        b.score - a.score || a.candidate.id.localeCompare(b.candidate.id),
    );

export const exerciseTechniques: ExerciseTechnique[] = classifiedExercises.map(
  (item) => {
    const technique = techniqueFor(item);
    const candidates = substitutionCandidates(item);
    const selected = new Map<
      string,
      ExerciseTechnique["substitutions"][number]
    >();
    const add = (
      reason: ExerciseTechnique["substitutions"][number]["reason"],
      predicate: (x: ClassifiedExercise) => boolean,
    ) => {
      const match = candidates.find(
        ({ candidate }) => predicate(candidate) && !selected.has(candidate.id),
      );
      if (match)
        selected.set(match.candidate.id, {
          exerciseId: match.candidate.id,
          reason,
        });
    };
    add("easier", (x) => x.level === "beginner");
    add("lower-impact", (x) => x.impact === "none" || x.impact === "low");
    add("equipment", (x) => x.equipment.includes("none"));
    for (const { candidate } of candidates) {
      if (selected.size >= 4) break;
      if (!selected.has(candidate.id))
        selected.set(candidate.id, {
          exerciseId: candidate.id,
          reason: "same-pattern",
        });
    }
    const advanced =
      item.level === "advanced" ||
      ["snatch", "clean", "climb"].some((p) => item.patterns.includes(p));
    return exerciseTechniqueSchema.parse({
      exercise: { ...item, unilateral: item.unilateral ?? false },
      ...technique,
      stopConditions: [
        "Detenete si aparece dolor agudo, mareo o falta de aire inusual.",
        "Interrumpí la serie si ya no podés conservar la técnica descripta.",
      ],
      coachingNote: advanced
        ? "Aprendé este movimiento con supervisión presencial y una progresión sin carga antes de usarlo en una sesión."
        : "Usá un rango y una carga que permitan completar cada repetición con control y sin dolor.",
      beginnerEligible: item.level === "beginner" && item.impact !== "high",
      coachReviewRequired: advanced,
      prescriptions: item.doseProfiles.map((profile) => ({
        profile,
        ...dose[profile],
      })),
      substitutions: [...selected.values()],
      provenance: {
        sourceFrames: item.sourceFrames ?? [],
        sourceUrl: item.sourceUrl,
        techniqueStatus: advanced
          ? "coach-review-required"
          : "template-reviewed",
      },
    });
  },
);

export const exerciseTechniqueById = new Map(
  exerciseTechniques.map((sheet) => [sheet.exercise.id, sheet]),
);
