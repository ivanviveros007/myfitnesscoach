import type { DailyTrainingRequest } from "@myfitnesscoach/contracts";
import {
  dailySelectionCandidates,
  type DailyExerciseSelections,
} from "./daily-training.js";

type GeminiSelection = {
  routines?: { key?: string; blocks?: { position?: number; exerciseIds?: string[] }[] }[];
};

function parseSelections(value: GeminiSelection): DailyExerciseSelections {
  const selections: DailyExerciseSelections = {};
  for (const routine of value.routines ?? []) {
    if (!routine.key) continue;
    const blocks: Record<number, string[]> = {};
    for (const block of routine.blocks ?? []) {
      if (!Number.isInteger(block.position) || !Array.isArray(block.exerciseIds))
        continue;
      blocks[block.position!] = block.exerciseIds.filter(
        (id): id is string => typeof id === "string",
      );
    }
    selections[routine.key] = blocks;
  }
  return selections;
}

export async function selectDailyExercisesWithAi(
  input: DailyTrainingRequest,
): Promise<DailyExerciseSelections | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Seleccioná los IDs para una programación diaria. Respetá la intención, patrones, regiones y cantidad de cada bloque. Priorizá variedad entre propuestas y evitá repetir IDs dentro de una rutina. No inventes IDs. Perfil: ${JSON.stringify({ experience: input.profile.experience, equipment: input.profile.equipment, jumpReady: input.profile.jumpReady, orientation: input.orientation, completedCount: input.completedCount })}. Opciones permitidas: ${JSON.stringify(dailySelectionCandidates(input))}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.65,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                routines: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    required: ["key", "blocks"],
                    properties: {
                      key: { type: "STRING" },
                      blocks: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          required: ["position", "exerciseIds"],
                          properties: {
                            position: { type: "INTEGER" },
                            exerciseIds: { type: "ARRAY", items: { type: "STRING" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
              required: ["routines"],
            },
          },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini respondió ${response.status}`);
    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini no devolvió una selección");
    return parseSelections(JSON.parse(text) as GeminiSelection);
  } finally {
    clearTimeout(timeout);
  }
}
