import { readFileSync } from "node:fs";
import {
  type Exercise,
  type ExerciseTechnique,
  type DoseProfile,
} from "@myfitnesscoach/contracts";

type FreeExercise = {
  id: string;
  externalId: string;
  name: string;
  equipment: string;
  muscles: string[];
  primaryMuscles: string[];
  level: string;
  category: string;
  force?: string | null;
  mechanic?: string | null;
  instructions: string[];
  imagePaths: string[];
};

const prescriptions: Record<DoseProfile, ExerciseTechnique["prescriptions"][number]> = {
  warmup: { profile: "warmup", sets: 1, repsMin: 8, repsMax: 12, restSecondsMin: 0, restSecondsMax: 20, rpeMin: 2, rpeMax: 4, stopRule: "Detenete si el movimiento pierde fluidez o control." },
  mobility: { profile: "mobility", sets: 2, workSeconds: 30, restSecondsMin: 10, restSecondsMax: 30, rpeMin: 2, rpeMax: 4, stopRule: "Usá un rango cómodo y detenete ante dolor o compensaciones." },
  power: { profile: "power", sets: 3, repsMin: 3, repsMax: 5, restSecondsMin: 90, restSecondsMax: 180, rpeMin: 6, rpeMax: 8, stopRule: "Cortá la serie cuando disminuya la velocidad o calidad." },
  strength: { profile: "strength", sets: 3, repsMin: 4, repsMax: 8, restSecondsMin: 90, restSecondsMax: 240, rpeMin: 6, rpeMax: 8, stopRule: "Terminá con dos repeticiones técnicamente posibles en reserva." },
  hypertrophy: { profile: "hypertrophy", sets: 3, repsMin: 8, repsMax: 15, restSecondsMin: 60, restSecondsMax: 120, rpeMin: 7, rpeMax: 9, stopRule: "Detenete antes de que la fatiga altere el recorrido." },
  interval: { profile: "interval", sets: 4, workSeconds: 30, restSecondsMin: 30, restSecondsMax: 90, rpeMin: 7, rpeMax: 9, stopRule: "Reducí el ritmo cuando no puedas sostener la técnica." },
  conditioning: { profile: "conditioning", sets: 3, workSeconds: 40, restSecondsMin: 20, restSecondsMax: 90, rpeMin: 6, rpeMax: 8, stopRule: "Bajá la intensidad si perdés el control respiratorio." },
  "core-control": { profile: "core-control", sets: 2, repsMin: 8, repsMax: 12, restSecondsMin: 30, restSecondsMax: 60, rpeMin: 4, rpeMax: 7, stopRule: "Terminá la serie cuando pierdas estabilidad del tronco." },
};

const patternFor = (name: string) => {
  const value = normalize(name);
  if (/squat/.test(value)) return "squat";
  if (/lunge|split squat|step up/.test(value)) return "lunge";
  if (/deadlift|good morning|hip thrust|glute bridge|swing/.test(value)) return "hinge";
  if (/row/.test(value)) return "horizontal-pull";
  if (/pull up|chin up|pulldown|pull down/.test(value)) return "vertical-pull";
  if (/overhead|shoulder press|military press|push press/.test(value)) return "vertical-push";
  if (/bench press|chest press|push up|pushup|dip/.test(value)) return "horizontal-push";
  if (/curl/.test(value)) return "elbow-flexion";
  if (/triceps|pushdown|extension/.test(value)) return "elbow-extension";
  if (/jump|hop|bound/.test(value)) return "vertical-jump";
  if (/plank/.test(value)) return "plank";
  if (/crunch|sit up|leg raise|dead bug/.test(value)) return "anti-extension";
  if (/run|rower|rowing|cycle|elliptical|walk/.test(value)) return "locomotion";
  if (/stretch|mobility|circle|inchworm/.test(value)) return "mobility";
  return null;
};

const equipmentMap: Record<string, string> = {
  "body only": "none", kettlebells: "kettlebell", "e-z curl bar": "barbell",
  other: "none", machine: "machine", cable: "cable", dumbbell: "dumbbell",
  barbell: "barbell", bands: "band", "medicine ball": "medicine-ball",
  "exercise ball": "stability-ball", foam: "foam-roller",
};

const regionMap: Record<string, string> = {
  quadriceps: "quads", hamstrings: "hamstrings", glutes: "glutes", calves: "calves",
  chest: "chest", shoulders: "shoulders", triceps: "triceps", biceps: "biceps",
  lats: "back", "middle back": "back", "lower back": "back", abdominals: "core",
  abductors: "hips", adductors: "hips", traps: "back", forearms: "forearms",
};

function profilesFor(item: FreeExercise, pattern: string): DoseProfile[] {
  if (item.category === "stretching" || pattern === "mobility") return ["warmup", "mobility"];
  if (item.category === "plyometrics") return ["power", "conditioning"];
  if (item.category === "cardio") return ["interval", "conditioning"];
  if (["plank", "anti-extension"].includes(pattern)) return ["core-control", "conditioning"];
  return ["strength", "hypertrophy"];
}

function goalsFor(item: FreeExercise, profiles: DoseProfile[]) {
  const goals = new Set<string>();
  if (profiles.includes("warmup")) goals.add("warmup");
  if (profiles.includes("mobility")) { goals.add("mobility"); goals.add("recovery"); }
  if (profiles.includes("power")) { goals.add("power"); goals.add("sport"); goals.add("cross-training"); }
  if (profiles.includes("conditioning") || profiles.includes("interval")) { goals.add("conditioning"); goals.add("hiit"); goals.add("cross-training"); }
  if (profiles.includes("strength")) { goals.add("strength"); goals.add("full-body"); }
  if (profiles.includes("hypertrophy")) goals.add("hypertrophy");
  if (item.primaryMuscles.some((muscle) => ["quadriceps", "hamstrings", "glutes", "calves"].includes(muscle))) goals.add("legs");
  if (item.primaryMuscles.some((muscle) => ["chest", "shoulders", "triceps", "biceps", "lats", "middle back"].includes(muscle))) goals.add("upper-body");
  if (item.primaryMuscles.includes("abdominals")) { goals.add("midline"); goals.add("stability"); }
  return [...goals];
}

export function buildFreeExerciseTechniques(): ExerciseTechnique[] {
 return freeExercises.flatMap((item) => {
  const pattern =
    patternFor(item.name) ??
    (item.category === "stretching"
      ? "mobility"
      : item.category === "cardio"
        ? "locomotion"
        : null);
  if (!pattern || item.imagePaths.length < 2 || item.instructions.length < 5) return [];
  const advanced = item.level === "advanced" || item.category === "olympic weightlifting";
  if (advanced) return [];
  const profiles = profilesFor(item, pattern);
  const regions = [...new Set(item.muscles.map((muscle) => regionMap[muscle] ?? muscle))];
  const instructions = item.instructions
    .map((step) => step.trim())
    .filter(Boolean);
  const setup = instructions.slice(0, 2).map((step) => step.slice(0, 580));
  const execution = instructions.slice(2, 7).map((step) => step.slice(0, 580));
  if (execution.length < 3 || !regions.length) return [];
  return [{
    exercise: {
      id: item.id,
      name: { es: item.name, en: item.name },
      origin: "free-exercise-db",
      patterns: [pattern],
      goals: goalsFor(item, profiles),
      regions,
      equipment: [equipmentMap[item.equipment] ?? item.equipment],
      level: item.level === "beginner" ? "beginner" : "intermediate",
      impact: item.category === "plyometrics" ? "high" : item.category === "cardio" ? "medium" : item.category === "stretching" ? "none" : "low",
      metric: item.category === "cardio" || item.category === "stretching" ? "seconds" : "reps",
      unilateral: /single|one arm|one leg|alternating|lunge/i.test(item.name),
    },
    setup,
    execution,
    cues: ["Mantené el movimiento controlado durante toda la serie.", "Usá un rango que puedas sostener sin compensaciones."],
    commonMistakes: ["Usar una carga que impide completar el recorrido con control.", "Acelerar la repetición cuando aparece fatiga."],
    stopConditions: ["Detenete si aparece dolor agudo, mareo o falta de aire inusual.", "Interrumpí la serie si ya no podés conservar la técnica indicada."],
    coachingNote: "Empezá con una carga conservadora y priorizá la ejecución mostrada en las imágenes.",
    beginnerEligible: item.level === "beginner" && item.category !== "plyometrics",
    coachReviewRequired: false,
    prescriptions: profiles.map((profile) => prescriptions[profile]),
    substitutions: [],
    provenance: { sourceFrames: item.imagePaths, sourceUrl: `https://github.com/yuhonas/free-exercise-db/tree/main/exercises/${encodeURIComponent(item.externalId)}`, techniqueStatus: "template-reviewed" },
  }];
 });
}

export const freeExercises = JSON.parse(
  readFileSync(new URL("../data/free-exercise-catalog.json", import.meta.url), "utf8"),
) as FreeExercise[];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\b(kb|ddb|sdb|db)\b/g, "dumbbell")
    .replace(/\bmb\b/g, "medicine ball");

const freeByName = new Map(
  freeExercises.map((item) => [normalize(item.name), item]),
);

const curatedAliases: Record<string, string> = {
  "barbell front squat": "Front Barbell Squat",
  "barbell bent over row": "Bent Over Barbell Row",
  "barbell back squat": "Barbell Squat",
  "strict chin up": "Chin-Up",
  "barbell good morning": "Good Morning",
  "dumbbell front squat": "Dumbbell Squat",
  "dumbbell front raise": "Front Dumbbell Raise",
  "barbell romanian deadlift": "Romanian Deadlift",
  "cable triceps pushdown": "Triceps Pushdown",
};

export function freeImagesForName(name: string) {
  const normalized = normalize(name);
  const alias = curatedAliases[normalized];
  const item = freeByName.get(normalize(alias ?? name));
  if (!item) return undefined;
  return item.imagePaths.map(
    (_, frame) => `/catalog/media/${encodeURIComponent(item.externalId)}/${frame}`,
  );
}

const illustration = (item: FreeExercise): Exercise["illustration"] => {
  const text = normalize(`${item.name} ${item.category} ${item.muscles.join(" ")}`);
  if (/squat/.test(text)) return "squat";
  if (/deadlift|good morning|hyperextension/.test(text)) return "hinge";
  if (/jump|hop|bound/.test(text)) return "jump";
  if (/row|pull/.test(text)) return "row";
  if (/press|push|dip/.test(text)) return "push";
  if (/calf/.test(text)) return "calf";
  if (/lunge|split squat/.test(text)) return "goblet";
  if (/bridge|hip thrust/.test(text)) return "bridge";
  return "bird-dog";
};

export function searchFreeExercises(query = "", limit = 40, offset = 0) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matched = freeExercises.filter((item) => {
    const haystack = normalize(
      `${item.name} ${item.equipment} ${item.muscles.join(" ")} ${item.category}`,
    );
    return terms.every((term) => haystack.includes(term));
  });
  return {
    total: matched.length,
    items: matched.slice(offset, offset + limit).map((item): Exercise => ({
      id: item.id,
      name: item.name,
      equipment: item.equipment,
      muscles: item.muscles.join(" · ") || item.category,
      illustration: illustration(item),
      steps: item.instructions.length >= 2
        ? item.instructions.slice(0, 10)
        : ["Prepará el material y adoptá una posición estable.", "Realizá el movimiento de forma controlada."],
      cues: ["Priorizá el control y detenete si sentís dolor."],
      imageUrls: item.imagePaths.map(
        (_, frame) => `/catalog/media/${encodeURIComponent(item.externalId)}/${frame}`,
      ),
      catalogSource: "free-exercise-db",
      sourceUrl: `https://github.com/yuhonas/free-exercise-db/tree/main/exercises/${encodeURIComponent(item.externalId)}`,
    })),
  };
}

export function freeExerciseByExternalId(id: string) {
  return freeExercises.find((item) => item.externalId === id);
}
