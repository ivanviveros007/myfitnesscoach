import React from "react";
import Svg, { Circle, Path, Line, Text as SvgText, G } from "react-native-svg";
import type { Exercise } from "@myfitnesscoach/contracts";
// Original schematic illustrations, packaged as code and available without a network.
export function ExerciseDiagram({ kind }: { kind: Exercise["illustration"] }) {
  const squat = kind === "squat",
    bridge = kind === "bridge";
  return (
    <Svg
      width="100%"
      height={175}
      viewBox="0 0 340 175"
      accessibilityLabel={
        squat
          ? "Sentadilla: posición de pie y descenso"
          : bridge
            ? "Puente: pelvis apoyada y elevada"
            : "Bird dog: cuatro apoyos y extensión contraria"
      }
    >
      <Line
        x1="15"
        y1="145"
        x2="325"
        y2="145"
        stroke="#cad8d2"
        strokeWidth="2"
      />
      <G
        stroke="#143f37"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {squat ? (
          <>
            <Circle cx="82" cy="35" r="11" fill="#143f37" />
            <Path d="M82 51 L82 96 L67 138 M82 96 L100 138 M82 57 L62 50 L74 34 M82 57 L102 50 L91 34" />
            <Circle cx="246" cy="69" r="11" fill="#143f37" />
            <Path d="M242 84 L219 110 L260 111 L260 138 M219 110 L242 117 L237 138 M242 85 L228 76 L237 67 M244 85 L268 78 L255 67" />
          </>
        ) : bridge ? (
          <>
            <Circle cx="34" cy="131" r="10" fill="#143f37" />
            <Path d="M49 137 L91 137 L119 103 L147 138 M51 138 L79 140" />
            <Circle cx="200" cy="131" r="10" fill="#143f37" />
            <Path d="M215 137 L252 111 L284 91 L309 138 M217 137 L246 140" />
          </>
        ) : (
          <>
            <Circle cx="44" cy="80" r="10" fill="#143f37" />
            <Path d="M58 88 L118 88 L119 138 L139 138 M66 91 L66 138 M111 91 L99 138 L119 138" />
            <Circle cx="218" cy="81" r="10" fill="#143f37" />
            <Path d="M230 88 L276 88 L281 138 L300 138 M238 91 L238 138 M235 88 L190 88 M273 88 L320 86" />
          </>
        )}
      </G>
      <Path
        d="M161 70 L176 70 L171 65 M176 70 L171 75"
        stroke="#72a593"
        strokeWidth="2"
        fill="none"
      />
      <SvgText x="55" y="165" fill="#61766d" fontSize="11">
        INICIO
      </SvgText>
      <SvgText x="222" y="165" fill="#61766d" fontSize="11">
        MOVIMIENTO
      </SvgText>
    </Svg>
  );
}
