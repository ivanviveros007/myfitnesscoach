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
} from "@nestjs/common";
import { json } from "express";
import helmet from "helmet";
import {
  credentialsSchema,
  exercises,
  orientations,
  syncSchema,
  cloudDataSyncSchema,
  exerciseTechniques,
} from "@myfitnesscoach/contracts";
import { Database } from "./database.js";
import { Auth, AuthGuard, type UserRequest } from "./auth.js";
import { Sync } from "./sync.js";
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
    return { status: "ok" };
  }
  @Get("catalog") catalog() {
    return { exercises, orientations, technicalExerciseCount: exerciseTechniques.length };
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
      beginnerEligible: beginnerEligible === undefined ? undefined : beginnerEligible === "true",
    });
  }
  @Get("catalog/exercises/:id") async technicalExercise(@Param("id") id: string) {
    const sheet = await this.db.getExercise(id);
    if (!sheet) throw new NotFoundException("Ejercicio no encontrado.");
    return sheet;
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
