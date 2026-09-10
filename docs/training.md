# Planificación semanal

La app pregunta experiencia, equipamiento, restricciones y preparación para saltos. Cada semana permite elegir 2–4 días, 30/45/60 minutos, días de deporte y fatiga. Es un generador determinista inicial, no una respuesta de IA ni una planificación validada individualmente por un profesional.

Dos exposiciones principales de fuerza se distribuyen en días no consecutivos, evitando el día de partido y el anterior. Las otras sesiones reducen series. La fatiga reduce carga y desactiva saltos. La experiencia declarada y las recepciones controladas habilitan potencia. Una restricción solicita adaptación revisada y conserva la disponibilidad sin prescribir rehabilitación.

Las sesiones incluyen entrada en calor, coordinación, fuerza de patrones globales, estabilidad y flexibilidad; potencia cuando corresponde. La transferencia requiere práctica específica en cancha/campo. Pádel y fútbol comparten actualmente una base de gimnasio: los textos de enfoque no equivalen a programas deportivos completos diferentes. Sin equipo se informa la falta de tracción progresiva. Las series se ajustan al tiempo estimado sin acortar los descansos; las estimaciones no son un cronómetro garantizado.

El catálogo contiene 13 ejercicios con esquemas SVG originales offline, pasos y fuentes con video online. El registro distingue repeticiones y segundos y contempla ambos lados. Las referencias externas pueden impedir la reproducción embebida: hay apertura en navegador.

## Persistencia y alcance

SQLite guarda perfil y planes por propietario, deporte y semana. Cada modificación archiva la versión anterior de forma transaccional. Al iniciar una sesión se conserva una copia del plan: replanificar no cambia entrenamientos ya registrados. Los datos de invitado se vinculan a la cuenta local al ingresar.

Las sesiones, el perfil, los planes y los movimientos favoritos se sincronizan con Nest mediante registros versionados por usuario. No existe ajuste automático según cargas históricas, planificación entre semanas ni control completo del calendario competitivo. Los comentarios quedan registrados, pero no son interpretados por una IA. La interfaz explica una progresión conservadora sin incrementar automáticamente el peso. Se necesita ampliar catálogo, revisión deportiva y adaptación longitudinal antes de presentar esto como entrenador experto.

Las rutinas nuevas se dividen en warm up, bloque 1, bloque 2 y bloque 3. Las sesiones antiguas se leen como un bloque compatible y conservan su contenido. El modo AMRAP es opcional, agrega un warm up, inicia el reloj por acción del usuario y registra rondas completas.

## Fuentes y decisiones

- [ACSM, actualización de entrenamiento de resistencia de 2026](https://acsm.org/resistance-training-guidelines-update-2026/): individualización, fuerza y potencia. Las reglas concretas de calendario y selección de esta app son decisiones de implementación, no un protocolo avalado por ACSM.
- [NSCA, período preparatorio](https://www.nsca.com/education/articles/kinetic-select/preparatory-period/): organización del entrenamiento y preparación general/específica.
- [Revisión de demandas del pádel](https://pmc.ncbi.nlm.nih.gov/articles/PMC10694705/): contexto de demandas físicas del deporte; no valida estas sesiones.
- [Sport Singapore, calentamiento y vuelta a la calma](https://www.inclusivesport.gov.sg/learning-opportunities/resources/warm-up-cool-down-exercises/): referencias de movimientos básicos.
- Fuentes NASM y Mayo Clinic enlazadas individualmente en cada ejercicio del catálogo.

Las pruebas cubren 54 combinaciones de disponibilidad, experiencia, equipamiento y duración; reglas de fatiga/competición, restricciones, disponibilidad inválida, guías presentes y ausencia de mutaciones de planes anteriores.
