import { readFileSync } from "node:fs";
import { type Exercise } from "@myfitnesscoach/contracts";

type FreeExercise = {
  id: string;
  externalId: string;
  name: string;
  equipment: string;
  muscles: string[];
  primaryMuscles: string[];
  level: string;
  category: string;
  instructions: string[];
  imagePaths: string[];
};

export const freeExercises = JSON.parse(
  readFileSync(new URL("../data/free-exercise-catalog.json", import.meta.url), "utf8"),
) as FreeExercise[];

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
