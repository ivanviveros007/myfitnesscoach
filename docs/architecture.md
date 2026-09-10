# Diseño inicial

## Decisiones acordadas

- Un repositorio para app móvil, backend, contratos y futuro backoffice.
- Expo SDK 57 con Expo Go y Expo UI como entorno móvil inicial.
- NestJS como API, alojada inicialmente en la Mac dedicada.
- Acceso público por HTTPS mediante ngrok, con autenticación propia.
- PostgreSQL en el servidor y SQLite en el celular.
- Orientaciones: pádel, fútbol, fitness general y entrenamiento libre.
- Registro de ejercicios completos, parciales u omitidos, series, pesos, repeticiones y comentarios.
- Imágenes e instrucciones descargadas disponibles offline; videos online mediante referencias externas.
- Asistente de IA a través de Nest. Credenciales del proveedor solo en el servidor.
- Backoffice visual pospuesto. Catálogo y plantillas iniciales cargados mediante datos iniciales.

## Estructura de datos propuesta

| Entidad                 | Responsabilidad                                                        |
| ----------------------- | ---------------------------------------------------------------------- |
| Usuario                 | Cuenta y credenciales protegidas; acceso a sus propios datos           |
| Perfil de entrenamiento | Experiencia, objetivos, disponibilidad y equipamiento                  |
| Orientación             | Pádel, fútbol, fitness general o libre                                 |
| Ejercicio               | Técnica, equipamiento, imagen y referencia de video; general o privado |
| Plan                    | Orientación, objetivo y agrupación de rutinas; propietario             |
| Rutina                  | Sesión prevista, con día semanal opcional                              |
| Ejercicio de rutina     | Orden y series, repeticiones, descanso y carga previstos               |
| Sesión realizada        | Visita real, fecha, estado y copia de la planificación al inicio       |
| Ejercicio realizado     | Resultado y comentarios de un ejercicio en una sesión                  |
| Serie realizada         | Repeticiones, peso y dificultad registrados                            |
| Propuesta de IA         | Propuesta pendiente, aceptada o rechazada y contexto utilizado         |

Cada registro privado pertenece a un usuario. Nest obtiene esa identidad de la sesión autenticada y valida permisos. Cambiar una rutina o su orientación no modifica sesiones históricas. Los días propuestos no impiden realizar una rutina en otra fecha.

## Offline y sincronización

Las acciones se guardan primero en SQLite junto con una operación pendiente. Los identificadores se generan en el dispositivo. Nest debe aceptar reintentos de forma idempotente para evitar duplicados. Se confirma la operación local únicamente después de recibir confirmación del servidor.

La app descarga cambios del servidor y conserva un historial local. Internet disponible no garantiza que Nest esté accesible. La IA requiere conexión con Nest y con el proveedor; una propuesta aceptada y descargada puede utilizarse offline.

Implementado: versiones por sesión, operaciones idempotentes y conservación explícita de ambas versiones ante conflictos. Ver `sync.md`. Eliminaciones y retención limitada quedan pendientes; inicialmente se conserva el historial completo.

## Asistente de entrenamiento

Propone rutinas y adaptaciones basadas en el perfil, historial relevante y catálogo. El usuario revisa y acepta los cambios. No se presentará contenido como validado profesionalmente sin revisión real. Se registrará consumo de tokens y se definirá un límite de uso. La selección del modelo y los beneficios de facturación de la cuenta todavía deben confirmarse.

## Infraestructura y seguridad

El backend y la base tendrán almacenamiento persistente. La base de datos no se publicará directamente. No se guardarán tokens, claves SSH ni contraseñas en Git. Pendientes: instalación de runtimes, servicio de inicio automático, autenticación, copias de seguridad fuera del disco del servidor y comprobación de estabilidad prolongada con tapa cerrada.

## Secuencia de implementación

1. Cerrar modelo y protocolo de sincronización.
2. Inicializar Expo, Nest y contratos compartidos con versiones compatibles.
3. Implementar cuenta, catálogo y rutinas.
4. Validar el recorrido offline: iniciar rutina, registrar serie, sincronizar y consultar historial.
5. Incorporar propuestas del asistente de IA.
6. Incorporar el backoffice según necesidades de uso.
