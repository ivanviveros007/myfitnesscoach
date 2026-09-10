# MyFitnessCoach

Monorepo para una app de entrenamiento offline first, con Expo SDK 57, Expo UI y NestJS 12.

## Estructura

- `apps/mobile`: Expo Go, SQLite, SecureStore, ilustraciones SVG locales y videos de YouTube en WebView.
- `apps/api`: Nest, PostgreSQL, cuentas y sincronización.
- `packages/contracts`: esquemas Zod, catálogo y plantillas compartidas.
- `docs`: decisiones de arquitectura.

## Ejecutar

Requisitos: Node 22.20 o posterior, npm y PostgreSQL 16 o posterior para el backend.

```bash
npm ci
npm run build
npm run mobile
```

Abrir el QR con una versión de Expo Go compatible con SDK 57. La app permite probar las cuatro orientaciones, guías, registro de series e historial sin backend ni cuenta. Expo UI está integrado en los botones.

Para sincronizar, crear una base `myfitnesscoach`, copiar `apps/api/.env.example` a `apps/api/.env`, configurar `DATABASE_URL` y ejecutar:

```bash
npm run api
```

La API escucha en `127.0.0.1:3000` por defecto. En la Mac servidor, ngrok deberá apuntar a ese puerto. En la pantalla **Mi cuenta**, ingresar la URL HTTPS de la API. También se puede configurar `EXPO_PUBLIC_API_URL` antes de iniciar Expo. Una variable `EXPO_PUBLIC_*` nunca debe contener secretos.

Las cuentas se crean desde la app. Se requiere conexión para el primer ingreso; posteriormente se puede registrar offline. Al ingresar se vinculan las sesiones del modo invitado. Las credenciales de acceso se guardan en SecureStore, y las contraseñas se almacenan como hashes scrypt con salt en PostgreSQL.

## Verificación

```bash
npm run typecheck
npm run build
DATABASE_URL=postgresql://localhost:5432/fitness_test npm test
```

Usar una base de pruebas dedicada. La prueba crea usuarios temporales y elimina sus datos al terminar. Comprueba autenticación, reintentos concurrentes, conflictos de versión, aislamiento de usuarios y persistencia.

## Alcance actual y pendientes

- Tres ejercicios de demostración, cada uno con ilustración original de inicio/movimiento, pasos, indicaciones y referencia de video NASM. Las plantillas no son planes personalizados ni han sido revisadas profesionalmente.
- Las orientaciones cambian el orden y foco de presentación; aún no hay programación deportiva específica ni progresión de cargas.
- Registro completo/parcial, comentarios, historial local y sincronización mientras la app está abierta o vuelve al primer plano. No se promete ejecución en segundo plano.
- Los conflictos conservan ambos registros mediante una acción explícita. Todavía no se implementan eliminaciones, edición de rutinas ni paginación del historial.
- El esquema inicial de PostgreSQL se crea al arrancar; antes de modificarlo se incorporarán migraciones versionadas.
- Pendientes: IA, perfil ampliado, backoffice, despliegue en la Mac, arranque automático y copias de seguridad.
- Compilar bundles no sustituye probar Expo Go en un dispositivo real. La reproducción embebida puede estar restringida por YouTube; se ofrece abrir el video externamente.

[Diseño](docs/architecture.md) · [Sincronización](docs/sync.md)
