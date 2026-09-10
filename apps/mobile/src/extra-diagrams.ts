// Original side/front-view schematics. Coordinates are local to each 150×145 panel.
export type Pose = { head: [number, number]; body: string; equipment?: string };
export const extraDiagrams: Record<string, [Pose, Pose]> = {
  goblet: [
    {
      head: [75, 25],
      body: "M75 40 L75 90 L60 137 M75 90 L92 137 M75 49 L55 63 L67 54 M75 49 L94 63 L83 54",
      equipment: "M67 48 L83 48 L83 60 L67 60 Z",
    },
    {
      head: [86, 55],
      body: "M82 70 L59 104 L103 107 L104 137 M59 104 L83 116 L81 137 M82 75 L67 88 L78 80 M84 73 L104 86 L90 80",
      equipment: "M78 73 L90 73 L90 86 L78 86 Z",
    },
  ],
  hinge: [
    {
      head: [72, 24],
      body: "M72 40 L72 91 L60 136 M72 91 L89 136 M72 48 L57 90 M73 48 L88 90",
      equipment: "M48 94 L66 94 M80 94 L98 94",
    },
    {
      head: [114, 76],
      body: "M100 77 L63 91 L80 111 L75 136 M63 91 L48 111 L52 136 M97 82 L92 116 M92 83 L82 114",
      equipment: "M83 119 L101 119 M73 116 L91 116",
    },
  ],
  push: [
    {
      head: [45, 49],
      body: "M53 62 L80 94 L113 135 M57 68 L35 93 L28 100 M64 73 L50 101",
      equipment: "M15 104 L58 104 L58 139 M15 104 L15 139",
    },
    {
      head: [29, 70],
      body: "M42 80 L78 105 L114 135 M44 82 L56 90 L28 100 M50 87 L63 97 L49 101",
      equipment: "M15 104 L58 104 L58 139 M15 104 L15 139",
    },
  ],
  row: [
    {
      head: [61, 35],
      body: "M61 51 L63 95 L99 97 L117 135 M61 58 L108 69",
      equipment: "M47 101 L83 101 M55 101 L55 139 M110 69 L143 69",
    },
    {
      head: [61, 35],
      body: "M61 51 L63 95 L99 97 L117 135 M61 58 L42 76 L73 75",
      equipment: "M47 101 L83 101 M55 101 L55 139 M75 75 L143 69",
    },
  ],
  "db-row": [
    {
      head: [111, 54],
      body: "M97 61 L58 75 L47 107 L42 136 M58 75 L78 103 L84 136 M91 64 L102 95 M83 67 L78 110",
      equipment: "M67 115 L88 115 M92 99 L136 99 L136 139",
    },
    {
      head: [111, 54],
      body: "M97 61 L58 75 L47 107 L42 136 M58 75 L78 103 L84 136 M91 64 L102 95 M83 67 L61 55 L72 78",
      equipment: "M62 84 L83 84 M92 99 L136 99 L136 139",
    },
  ],
  jump: [
    {
      head: [84, 63],
      body: "M80 79 L59 105 L97 107 L102 137 M59 105 L79 115 L77 137 M80 82 L108 94",
    },
    {
      head: [75, 21],
      body: "M75 37 L75 82 L62 116 M75 82 L89 116 M75 44 L56 27 L50 10 M75 44 L94 27 L100 10",
      equipment: "M55 137 L61 130 M89 130 L96 137",
    },
  ],
  child: [
    { head: [37, 71], body: "M49 83 L103 83 L106 134 L132 134 M57 87 L57 135" },
    {
      head: [40, 119],
      body: "M53 114 L104 107 L120 127 L88 137 M55 115 L16 134 M105 107 L91 127 L127 136",
    },
  ],
  shuffle: [
    {
      head: [75, 33],
      body: "M75 48 L75 89 L48 110 L42 136 M75 89 L103 110 L109 136 M75 57 L54 74 L64 57 M75 57 L96 74 L86 57",
    },
    {
      head: [90, 33],
      body: "M90 48 L90 89 L63 110 L37 136 M90 89 L110 110 L126 136 M90 57 L69 74 L79 57 M90 57 L111 74 L101 57",
      equipment: "M14 145 L133 145 M127 141 L133 145 L127 149",
    },
  ],
  "leg-swing": [
    {
      head: [70, 26],
      body: "M70 42 L70 87 L62 136 M70 87 L103 121 M70 50 L35 67",
      equipment: "M28 35 L28 139",
    },
    {
      head: [70, 26],
      body: "M70 42 L70 87 L62 136 M70 87 L37 116 M70 50 L35 67",
      equipment: "M28 35 L28 139",
    },
  ],
  calf: [
    {
      head: [70, 31],
      body: "M70 47 L70 89 L55 137 M70 89 L108 137 M70 53 L34 73",
      equipment: "M28 18 L28 139",
    },
    {
      head: [52, 35],
      body: "M54 51 L71 90 L55 110 L48 137 M71 90 L116 137 M55 56 L32 72",
      equipment: "M26 18 L26 139",
    },
  ],
};
