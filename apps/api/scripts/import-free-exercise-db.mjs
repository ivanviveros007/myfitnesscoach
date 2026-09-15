import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sourceRoot = resolve(process.argv[2] ?? "/private/tmp/free-exercise-db");
const output = resolve(
  process.argv[3] ?? new URL("../data/free-exercise-catalog.json", import.meta.url).pathname,
);
const records = JSON.parse(
  await readFile(resolve(sourceRoot, "dist/exercises.json"), "utf8"),
);
const catalog = records.map((item) => ({
  id: `free:${item.id}`,
  externalId: item.id,
  name: item.name,
  equipment: item.equipment || "body only",
  muscles: [...(item.primaryMuscles ?? []), ...(item.secondaryMuscles ?? [])],
  primaryMuscles: item.primaryMuscles ?? [],
  level: item.level ?? "intermediate",
  category: item.category ?? "strength",
  force: item.force ?? null,
  mechanic: item.mechanic ?? null,
  instructions: item.instructions ?? [],
  imagePaths: item.images ?? [],
}));

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(catalog)}\n`);
console.log(`Imported ${catalog.length} exercises into ${output}`);
