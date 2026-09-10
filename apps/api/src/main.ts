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
} from "@nestjs/common";
import { json } from "express";
import helmet from "helmet";
import {
  credentialsSchema,
  exercises,
  orientations,
  syncSchema,
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
    return { exercises, orientations };
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
