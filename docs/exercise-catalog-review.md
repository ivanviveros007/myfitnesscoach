# Revisión del catálogo de ejercicios

## Material revisado

- 100 capturas `IMG_3801.PNG`–`IMG_3900.PNG` de la carpeta BIGG.
- La grabación `screen_recording.mov`, usada para entender navegación, composición de bloques y contexto.
- El catálogo activo de MyFitnessCoach en `packages/contracts/src/catalog.ts` y `packages/contracts/src/index.ts`.

El texto de las capturas se extrajo localmente con Vision de macOS. Los nombres ambiguos o cortados por la interfaz no se incorporaron.

## Resultado

La primera versión normalizada vive en `packages/contracts/src/exercise-classification.ts`. Distingue los ejercicios observados en el material de BIGG de los candidatos añadidos por nosotros. Cada registro contiene:

- nombre en español e inglés;
- procedencia y capturas donde se observó;
- patrones de movimiento;
- intenciones de entrenamiento compatibles;
- regiones corporales y equipamiento;
- nivel, impacto, unidad y perfiles válidos de dosificación;
- condición unilateral cuando corresponde.

Esta lista todavía no reemplaza el catálogo activo de la aplicación. Un ejercicio solo debe pasar a estado utilizable cuando tenga instrucciones, indicaciones técnicas, alternativas y una demostración revisada. Así evitamos mostrar movimientos nuevos sin cumplir el requisito de explicar siempre cómo se hacen.

## Qué aprendimos de las propuestas

La categoría no depende únicamente del ejercicio. También depende del formato y la dosis:

- **HIIT:** movimientos técnicamente simples bajo fatiga, organizados por intervalos y con relación explícita entre trabajo y pausa.
- **Cross Training:** movimientos globales con carga moderada o peso corporal, combinados en intervalos, rondas, AMRAP o EMOM.
- **Strength:** pocas repeticiones, carga desafiante, descanso largo y patrones principales estables.
- **Combined Strength:** dos o más patrones de fuerza complementarios con cargas moderadas y volumen controlado.
- **Traditional Hypertrophy:** trabajo localizado, repeticiones medias o altas y descanso suficiente para acumular volumen.
- **Power:** saltos, lanzamientos o levantamientos explosivos con pocas repeticiones y recuperación completa.
- **Sport:** aceleración, frenada, desplazamiento, salto, rotación o lanzamiento vinculados con la demanda deportiva.
- **Pilates y Midline:** control, estabilidad, respiración y tempo; no se deben tratar como cardio solo por usar rondas.
- **Mobility:** rango activo y controlado, sin perseguir fatiga.

Por eso el generador tendrá dos filtros. Primero seleccionará movimientos compatibles con la intención, el perfil y el equipamiento. Después aplicará una receta que determine formato, series, repeticiones, descanso e intensidad.

## Próxima implementación

1. Revisar y completar las fichas técnicas de un primer grupo de 30 ejercicios.
2. Definir recetas verificables para cada estilo de entrenamiento.
3. Hacer que el generador trabaje únicamente con fichas activas y rechace bloques incoherentes.
4. Ampliar el grupo activo por lotes hasta cubrir el catálogo completo.
5. Conectar la IA después, para seleccionar y explicar dentro de estas reglas.

No se copiaron imágenes, textos descriptivos ni contenido de marca de BIGG. Las capturas se usaron como referencia para identificar nombres y estructuras; las ilustraciones y explicaciones de MyFitnessCoach deberán ser propias o provenir de fuentes autorizadas.
