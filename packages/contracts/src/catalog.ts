import type { Exercise } from "./index.js";
const nasm = "https://www.nasm.org/resource-center/exercise-library/";
const sport =
  "https://www.inclusivesport.gov.sg/learning-opportunities/resources/warm-up-cool-down-exercises/";
export const additionalExercises: Exercise[] = [
  {
    id: "goblet",
    name: "Sentadilla goblet",
    equipment: "Mancuerna o kettlebell",
    muscles: "Cuádriceps · glúteos",
    illustration: "goblet",
    steps: [
      "Sostené una mancuerna frente al pecho, con los pies separados y toda la planta apoyada.",
      "Flexioná caderas y rodillas con control, manteniendo la carga cerca del cuerpo.",
      "Volvé de pie empujando el suelo, sin perder la posición del tronco.",
    ],
    cues: [
      "Elegí una carga que puedas controlar.",
      "Rodillas orientadas en la dirección de los pies.",
    ],
    videoId: "nfX7IFK9UNI",
    sourceUrl: nasm + "goblet-squat",
  },
  {
    id: "rdl",
    name: "Peso muerto rumano con mancuernas",
    equipment: "Mancuernas",
    muscles: "Isquiotibiales · glúteos",
    illustration: "hinge",
    steps: [
      "De pie, sostené las mancuernas a los lados, con rodillas ligeramente flexionadas.",
      "Llevá la cadera hacia atrás, manteniendo la espalda neutra y las cargas próximas a las piernas.",
      "Volvé extendiendo la cadera. Detené el descenso antes de perder la posición de la espalda.",
    ],
    cues: [
      "No conviertas el movimiento en una sentadilla.",
      "Aprendé primero la bisagra con poca carga.",
    ],
    videoId: "V8Hdl1FiNt4",
    sourceUrl: nasm + "dumbbell-romanian-deadlift",
  },
  {
    id: "incline-push",
    name: "Flexión inclinada",
    equipment: "Pared o apoyo elevado firme",
    muscles: "Pecho · tríceps",
    illustration: "push",
    steps: [
      "Apoyá las manos en una pared o superficie elevada estable. Alejá los pies hasta formar una línea con el cuerpo.",
      "Flexioná los codos y acercá el pecho al apoyo sin dejar caer la pelvis.",
      "Empujá para regresar. Un apoyo más alto facilita el movimiento.",
    ],
    cues: [
      "No uses muebles que puedan deslizarse.",
      "Mantené el tronco alineado.",
    ],
    videoId: "0JUrOH--Kdk",
    sourceUrl: nasm + "incline-push-up",
  },
  {
    id: "machine-row",
    name: "Remo sentado en máquina",
    equipment: "Máquina de remo",
    muscles: "Espalda · bíceps",
    illustration: "row",
    steps: [
      "Ajustá asiento y apoyos para alcanzar el agarre sin redondear la espalda.",
      "Tirá del agarre hacia el tronco llevando los codos hacia atrás.",
      "Regresá lentamente sin balancearte ni soltar la carga.",
    ],
    cues: [
      "Empezá con una resistencia cómoda.",
      "No eleves los hombros hacia las orejas.",
    ],
    videoId: "k0cTJCfxa0Y",
    sourceUrl: "https://www.youtube.com/watch?v=k0cTJCfxa0Y",
  },
  {
    id: "dumbbell-row",
    name: "Remo con mancuerna y apoyo",
    equipment: "Mancuerna y apoyo firme",
    muscles: "Espalda · bíceps",
    illustration: "db-row",
    steps: [
      "Apoyá una mano en una superficie firme e incliná el tronco desde las caderas. Sostené la mancuerna con la otra mano.",
      "Acercá la mancuerna al costado del cuerpo flexionando el codo, sin girar el tronco.",
      "Bajá con control y repetí del otro lado.",
    ],
    cues: [
      "Mantené la espalda neutra.",
      "No uses impulso para levantar el peso.",
    ],
    videoUrl:
      "https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/bent-over-row/vid-20084680",
    sourceUrl:
      "https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/bent-over-row/vid-20084680",
  },
  {
    id: "jump",
    name: "Salto desde media sentadilla",
    equipment: "Suelo firme y espacio libre",
    muscles: "Potencia de piernas",
    illustration: "jump",
    steps: [
      "Con los pies separados, descendé a una media sentadilla cómoda.",
      "Extendé caderas, rodillas y tobillos para despegar del suelo.",
      "Aterrizá suavemente flexionando rodillas y caderas. Estabilizate antes de repetir.",
    ],
    cues: [
      "Solo si ya dominás los saltos y las recepciones.",
      "Terminá la serie si disminuye la calidad o aparece dolor.",
    ],
    videoId: "tZSYZdtbONc",
    sourceUrl: nasm + "squat-jump",
  },
  {
    id: "child",
    name: "Postura del niño",
    equipment: "Colchoneta opcional",
    muscles: "Espalda · hombros",
    illustration: "child",
    steps: [
      "Desde cuatro apoyos, llevá lentamente las caderas hacia los talones.",
      "Extendé los brazos hacia adelante hasta una posición cómoda y respirable.",
      "Mantené una tensión suave sin dolor y volvé despacio.",
    ],
    cues: [
      "No fuerces las rodillas ni la profundidad.",
      "Respirá con normalidad.",
    ],
    videoId: "_ZX_zTOBgp8",
    sourceUrl: nasm + "childs-pose",
  },
  {
    id: "shuffle",
    name: "Pasos laterales y regreso",
    equipment: "Espacio libre y suelo firme",
    muscles: "Coordinación · desplazamiento lateral",
    illustration: "shuffle",
    steps: [
      "De pie, flexioná ligeramente las rodillas y mirá al frente.",
      "Dá dos pasos hacia un lado y regresá hacia el otro, sin cruzar los pies.",
      "Practicá primero despacio. Mantené el control al cambiar de dirección.",
    ],
    cues: [
      "Empezá con la versión fácil del video.",
      "Es una base coordinativa; la transferencia al juego se practica también en cancha.",
    ],
    videoId: "nrCCnojxVEA",
    sourceUrl: sport,
  },
  {
    id: "leg-swing",
    name: "Balanceo controlado de pierna",
    equipment: "Pared o apoyo firme",
    muscles: "Movilidad de cadera",
    illustration: "leg-swing",
    steps: [
      "De pie junto a una pared, apoyá una mano para mantener el equilibrio.",
      "Balanceá una pierna suavemente hacia adelante y atrás, dentro de un rango cómodo.",
      "Mantené el tronco quieto y cambiá de lado.",
    ],
    cues: [
      "No fuerces la amplitud ni uses rebotes bruscos.",
      "Usá la variante fácil del video.",
    ],
    videoId: "XV9FZ4aOQuY",
    sourceUrl: sport,
  },
  {
    id: "calf-stretch",
    name: "Estiramiento de gemelo en pared",
    equipment: "Pared",
    muscles: "Gemelos · tobillo",
    illustration: "calf",
    steps: [
      "Apoyá las manos en una pared y llevá una pierna hacia atrás.",
      "Mantené el talón posterior en el suelo y acercá el cuerpo a la pared hasta una tensión suave.",
      "Sostené sin rebotar y repetí del otro lado.",
    ],
    cues: ["No debe doler.", "El tiempo indicado es por lado."],
    videoId: "j_DMDeZwbKY",
    sourceUrl: sport,
  },
];
