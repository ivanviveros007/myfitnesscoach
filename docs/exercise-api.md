# Catálogo técnico de ejercicios

La API inicializa y actualiza el catálogo al arrancar. Cada uno de los 155 movimientos posee una ficha con:

- nombre en español e inglés, nivel, impacto, patrones, objetivos, regiones y equipamiento;
- preparación, ejecución paso a paso, indicaciones técnicas y errores frecuentes;
- condiciones para detener el ejercicio y nota de seguridad;
- dosis separadas para entrada en calor, potencia, fuerza, hipertrofia, intervalos, acondicionamiento, control del core y movilidad;
- hasta cuatro sustituciones compatibles por dificultad, impacto, equipamiento o patrón;
- procedencia y estado de revisión.

Los 28 movimientos avanzados o técnicamente complejos quedan marcados con `coachReviewRequired: true` y nunca con `beginnerEligible: true`.

## Persistencia

PostgreSQL recibe tres tablas idempotentes al iniciar la API:

- `exercises`: ficha completa en JSONB y columnas para los filtros principales;
- `exercise_prescriptions`: una dosis por ejercicio y perfil;
- `exercise_substitutions`: alternativas ordenadas y su motivo.

## Endpoints

`GET /catalog` informa `technicalExerciseCount` además del catálogo anterior.

`GET /catalog/exercises` devuelve fichas completas. Admite filtros combinables:

```text
/catalog/exercises?goal=power
/catalog/exercises?equipment=dumbbell&level=beginner
/catalog/exercises?beginnerEligible=true
```

`GET /catalog/exercises/:id` devuelve una ficha concreta, por ejemplo:

```text
/catalog/exercises/goblet-squat
```

El catálogo se sirve desde PostgreSQL. Reiniciar la API vuelve a aplicar el seed mediante `UPSERT`, conservando los identificadores estables.
