import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  Module,
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode,
  Query,
  Param,
  NotFoundException,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { json, type Response } from "express";
import helmet from "helmet";
import {
  credentialsSchema,
  exercises,
  orientations,
  syncSchema,
  cloudDataSyncSchema,
  exerciseTechniques,
  dailyTrainingRequestSchema,
} from "@myfitnesscoach/contracts";
import { Database } from "./database.js";
import { Auth, AuthGuard, type UserRequest } from "./auth.js";
import { Sync } from "./sync.js";
import { makeDailyRoutines } from "./daily-training.js";
import { selectDailyExercisesWithAi } from "./ai-training.js";
import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import { appExercise, visualProgrammingStats } from "./training-catalog.js";
import {
  freeExerciseByExternalId,
  freeExercises,
  searchFreeExercises,
} from "./free-catalog.js";
function parse<T>(
  schema: { safeParse: (x: unknown) => { success: boolean; data?: T } },
  input: unknown,
): T {
  const r = schema.safeParse(input);
  if (!r.success)
    throw new BadRequestException("Datos inválidos. Revisá los campos.");
  return r.data!;
}
@Controller()
class Api {
  constructor(
    private readonly db: Database,
    private readonly auth: Auth,
    private readonly sync: Sync,
  ) {}
  @Get("health") async health() {
    await this.db.pool.query("SELECT 1");
    return { status: "ok", ai: process.env.GEMINI_API_KEY ? "ready" : "fallback" };
  }
  @Get("catalog") catalog() {
    return {
      exercises,
      orientations,
      technicalExerciseCount: exerciseTechniques.length,
      expandedExerciseCount: freeExercises.length,
      totalCatalogCount: exerciseTechniques.length + freeExercises.length,
      automaticProgrammingCount: visualProgrammingStats.total,
    };
  }
  @Get("catalog/search") catalogSearch(
    @Query("q") query = "",
    @Query("limit") rawLimit = "40",
    @Query("offset") rawOffset = "0",
  ) {
    const limit = Math.min(80, Math.max(1, Number(rawLimit) || 40));
    const offset = Math.max(0, Number(rawOffset) || 0);
    const normalized = query.trim().toLowerCase();
    const curated = exerciseTechniques
      .map(appExercise)
      .filter((item) =>
        `${item.name} ${item.muscles} ${item.equipment}`
          .toLowerCase()
          .includes(normalized),
      )
      .map((item) => ({ ...item, catalogSource: "curated" as const }));
    const expanded = searchFreeExercises(query, freeExercises.length, 0).items;
    const names = new Set(curated.map((item) => item.name.toLowerCase()));
    const merged = [
      ...curated,
      ...expanded.filter((item) => !names.has(item.name.toLowerCase())),
    ];
    return {
      total: merged.length,
      items: merged.slice(offset, offset + limit),
      limit,
      offset,
    };
  }
  @Get("catalog/media/:id/:frame") catalogMedia(
    @Param("id") id: string,
    @Param("frame") rawFrame: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const item = freeExerciseByExternalId(id);
    const frame = Number(rawFrame);
    const relative = Number.isInteger(frame) ? item?.imagePaths[frame] : undefined;
    if (!relative) throw new NotFoundException("Imagen no encontrada.");
    const root = process.env.FREE_EXERCISE_DB_IMAGES ??
      "/Users/ivanviveros/myfitnesscoach-data/free-exercise-db/exercises";
    const file = resolve(root, relative);
    if (!file.startsWith(resolve(root)) || !existsSync(file))
      throw new NotFoundException("Imagen no disponible en este servidor.");
    response.setHeader("Content-Type", "image/jpeg");
    response.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    return new StreamableFile(createReadStream(file));
  }
  @Get("catalog/exercises") async technicalExercises(
    @Query("goal") goal?: string,
    @Query("equipment") equipment?: string,
    @Query("level") level?: string,
    @Query("beginnerEligible") beginnerEligible?: string,
  ) {
    if (level && !["beginner", "intermediate", "advanced"].includes(level))
      throw new BadRequestException("Nivel inválido.");
    if (beginnerEligible && !["true", "false"].includes(beginnerEligible))
      throw new BadRequestException("beginnerEligible debe ser true o false.");
    return this.db.listExercises({
      goal,
      equipment,
      level,
      beginnerEligible:
        beginnerEligible === undefined
          ? undefined
          : beginnerEligible === "true",
    });
  }
  @Get("catalog/exercises/:id") async technicalExercise(
    @Param("id") id: string,
  ) {
    const sheet = await this.db.getExercise(id);
    if (!sheet) throw new NotFoundException("Ejercicio no encontrado.");
    return sheet;
  }
  @Post("training/daily") @HttpCode(200) async dailyTraining(@Body() body: unknown) {
    const input = parse(dailyTrainingRequestSchema, body);
    if (input.profile.limitations === "review")
      throw new BadRequestException(
        "El perfil requiere una adaptación revisada antes de generar un entrenamiento.",
      );
    const generator = process.env.GEMINI_API_KEY ? "gemini-v2" : "rules-v1";
    const cacheKey = createHash("sha256")
      .update(`${generator}:${JSON.stringify(input)}`)
      .digest("hex");
    const cached = await this.db.getDailyTraining(cacheKey);
    if (cached) return cached;
    let aiPlan = null;
    try {
      aiPlan = await selectDailyExercisesWithAi(input);
    } catch (error) {
      console.warn("Gemini no disponible; se usa el generador validado.", error);
    }
    const result = {
      date: input.date,
      orientation: input.orientation,
      generatedAt: new Date().toISOString(),
      choices: makeDailyRoutines(
        input,
        aiPlan?.selections,
        aiPlan?.insights,
      ),
    };
    await this.db.cacheDailyTraining(cacheKey, input.date, result);
    return result;
  }
  @Post("auth/register") register(@Body() body: unknown) {
    const c = parse(credentialsSchema, body);
    return this.auth.authenticate(c.email, c.password, true);
  }
  @Post("auth/login") @HttpCode(200) login(@Body() body: unknown) {
    const c = parse(credentialsSchema, body);
    return this.auth.authenticate(c.email, c.password, false);
  }
  @Get("sessions") @UseGuards(AuthGuard) sessions(@Req() req: UserRequest) {
    return this.sync.list(req.userId);
  }
  @Post("sync") @UseGuards(AuthGuard) @HttpCode(200) push(
    @Req() req: UserRequest,
    @Body() body: unknown,
  ) {
    return this.sync.push(req.userId, parse(syncSchema, body));
  }
  @Get("data") @UseGuards(AuthGuard) data(@Req() req: UserRequest) {
    return this.sync.listData(req.userId);
  }
  @Post("data/sync") @UseGuards(AuthGuard) @HttpCode(200) pushData(
    @Req() req: UserRequest,
    @Body() body: unknown,
  ) {
    return this.sync.pushData(req.userId, parse(cloudDataSyncSchema, body));
  }
}
@Module({ controllers: [Api], providers: [Database, Auth, AuthGuard, Sync] })
class AppModule {}
const app = await NestFactory.create(AppModule, { bodyParser: false });
app.use(helmet());
app.use(json({ limit: "256kb" }));
// No forwarded IP trust: the initial single-user service shares a global auth budget.
let attempts = 0,
  reset = Date.now();
app.use("/auth", (req: any, res: any, next: () => void) => {
  if (Date.now() - reset > 60000) {
    attempts = 0;
    reset = Date.now();
  }
  if (++attempts > 20) {
    res
      .status(429)
      .json({ message: "Esperá un minuto antes de volver a intentar." });
    return;
  }
  next();
});
app.enableShutdownHooks();
await app.listen(
  Number(process.env.PORT ?? 3000),
  process.env.HOST ?? "127.0.0.1",
);
