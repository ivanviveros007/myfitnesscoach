import type { DailyTrainingRequest } from "@myfitnesscoach/contracts";
import {
  dailySelectionCandidates,
  type DailyExerciseSelections,
} from "./daily-training.js";

type GeminiSelection = {
  routines?: { key?: string; insight?: string; blocks?: { position?: number; exerciseIds?: string[] }[] }[];
};

export type DailyAiPlan = {
  selections: DailyExerciseSelections;
  insights: Record<string, string>;
};

function parseSelections(value: GeminiSelection): DailyAiPlan {
  const selections: DailyExerciseSelections = {};
  const insights: Record<string, string> = {};
  for (const routine of value.routines ?? []) {
    if (!routine.key) continue;
    if (routine.insight?.trim())
      insights[routine.key] = routine.insight.trim().slice(0, 280);
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
  return { selections, insights };
}

export async function selectDailyExercisesWithAi(
  input: DailyTrainingRequest,
): Promise<DailyAiPlan | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
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
                  text: `Seleccioná los IDs para una programación diaria. Respetá la intención, patrones, regiones y cantidad de cada bloque. Priorizá variedad entre propuestas y evitá repetir IDs dentro de una rutina. No inventes IDs. Para cada rutina escribí insight: una explicación en español rioplatense, clara, de una sola oración y máximo 180 caracteres, sobre por qué sirve esa combinación; no hagas afirmaciones médicas. Perfil: ${JSON.stringify({ experience: input.profile.experience, equipment: input.profile.equipment, jumpReady: input.profile.jumpReady, orientation: input.orientation, completedCount: input.completedCount })}. Opciones permitidas: ${JSON.stringify(dailySelectionCandidates(input))}`,
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
                    required: ["key", "insight", "blocks"],
                    properties: {
                      key: { type: "STRING" },
                      insight: { type: "STRING" },
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
