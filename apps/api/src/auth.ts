import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request } from "express";
import { Database } from "./database.js";
const scrypt = promisify(scryptCallback);
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export type UserRequest = Request & { userId: string };
@Injectable()
export class Auth {
  constructor(private readonly db: Database) {}
  async authenticate(email: string, password: string, register: boolean) {
    let userId: string;
    if (register) {
      userId = randomUUID();
      const salt = randomBytes(16).toString("hex");
      const hash = ((await scrypt(password, salt, 64)) as Buffer).toString(
        "hex",
      );
      try {
        await this.db.pool.query(
          "INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)",
          [userId, email, `${salt}:${hash}`],
        );
      } catch (error) {
        if ((error as { code: string }).code === "23505")
          throw new ConflictException("La cuenta ya existe. Iniciá sesión.");
        throw error;
      }
    } else {
      const { rows } = await this.db.pool.query(
        "SELECT id,password_hash FROM users WHERE email=$1",
        [email],
      );
      const [salt, stored] = (rows[0]?.password_hash ?? "dummy:00").split(":");
      const computed = (await scrypt(password, salt, 64)) as Buffer;
      const expected = Buffer.from(stored, "hex");
      if (
        expected.length !== computed.length ||
        !timingSafeEqual(expected, computed)
      )
        throw new UnauthorizedException("Correo o contraseña incorrectos.");
      userId = rows[0].id;
    }
    const token = randomBytes(32).toString("hex");
    await this.db.pool.query(
      "INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 days')",
      [digest(token), userId],
    );
    return { token, userId };
  }
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly db: Database) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<UserRequest>();
    const token = req.headers.authorization?.match(
      /^Bearer ([a-f0-9]{64})$/,
    )?.[1];
    if (!token) throw new UnauthorizedException();
    const { rows } = await this.db.pool.query(
      "SELECT user_id FROM auth_sessions WHERE token_hash=$1 AND expires_at>now()",
      [digest(token)],
    );
    if (!rows.length)
      throw new UnauthorizedException("Volvé a iniciar sesión.");
    req.userId = rows[0].user_id;
    return true;
  }
}
