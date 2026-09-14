import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  Vibration,
  View,
} from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { BottomSheet, RNHostView } from "@expo/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  routineBlocks,
  type TrainingProfile,
  type Routine,
  type Prescription,
  type BlockGoal,
  type WorkoutBlock,
} from "@myfitnesscoach/contracts";
import { availableReplacements, replaceRoutineExercise } from "./replacements";

type CardImage =
  | "padel"
  | "strength"
  | "mobility"
  | "amrap"
  | "landmine"
  | "boxJump"
  | "dumbbellRdl"
  | "battleRopes";
type Choice = {
  key: string;
  title: string;
  tag: string;
  insight?: string;
  icon: SymbolViewProps["name"];
  routine: Routine;
  color: string;
  image: CardImage;
};
const cardImages = {
  padel: require("../assets/training/padel-conditioning.jpg"),
  strength: require("../assets/training/strength.jpg"),
  mobility: require("../assets/training/mobility.jpg"),
  amrap: require("../assets/training/amrap.jpg"),
  landmine: require("../assets/training/landmine.jpg"),
  boxJump: require("../assets/training/box-jump.jpg"),
  dumbbellRdl: require("../assets/training/dumbbell-rdl.jpg"),
  battleRopes: require("../assets/training/battle-ropes.jpg"),
};

export function TrainingCarousel({
  choices,
  equipment,
  isPersonalizing = false,
  onStart,
}: {
  choices: Choice[];
  equipment: TrainingProfile["equipment"];
  isPersonalizing?: boolean;
  onStart: (routine: Routine) => void;
}) {
  const [selected, setSelected] = useState(choices[0]?.key ?? "");
  const [preview, setPreview] = useState<Choice | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [withoutEquipment, setWithoutEquipment] = useState(false);
  const [replacementQuery, setReplacementQuery] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingBlock, setEditingBlock] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const current =
    choices.find((choice) => choice.key === selected) ?? choices[0];
  if (!current) return null;
  const selectNext = () => {
    const index = choices.findIndex((choice) => choice.key === current.key);
    setSelected(choices[(index + 1) % choices.length]?.key ?? current.key);
  };
  const previewBlocks = preview ? routineBlocks(preview.routine) : [];
  const blockOffsets = previewBlocks.map((_, blockIndex) =>
    previewBlocks
      .slice(0, blockIndex)
      .reduce((total, block) => total + block.items.length, 0),
  );
  const swapPrescription =
    preview && swapIndex !== null ? preview.routine.items[swapIndex] : null;
  const replacements = swapPrescription
    ? availableReplacements(
        swapPrescription.exercise,
        swapPrescription.block,
        withoutEquipment ? "bodyweight" : equipment,
        replacementQuery,
      )
    : [];
  const replaceWholeBlock = (blockIndex: number) => {
    setPreview((currentPreview) => {
      if (!currentPreview) return currentPreview;
      const currentChoiceIndex = choices.findIndex(
        (choice) => choice.key === currentPreview.key,
      );
      for (let step = 1; step < choices.length; step++) {
        const candidateChoice =
          choices[(currentChoiceIndex + step) % choices.length];
        const candidate = candidateChoice
          ? routineBlocks(candidateChoice.routine)[blockIndex]
          : undefined;
        const currentBlock = routineBlocks(currentPreview.routine)[blockIndex];
        if (
          !candidate ||
          !currentBlock ||
          candidate.title === currentBlock.title
        )
          continue;
        const nextBlocks = routineBlocks(currentPreview.routine).map(
          (block, index) =>
            index === blockIndex
              ? {
                  ...candidate,
                  id: `${currentPreview.routine.id}-${block.section}-${Date.now()}`,
                  position: block.position,
                  section: block.section,
                }
              : block,
        );
        return {
          ...currentPreview,
          routine: {
            ...currentPreview.routine,
            blocks: nextBlocks,
            items: nextBlocks.flatMap((block) => block.items),
            estimatedMinutes:
              (currentPreview.routine.estimatedMinutes ?? 30) -
              currentBlock.durationMinutes +
              candidate.durationMinutes,
          },
        };
      }
      return currentPreview;
    });
  };
  return (
    <View style={s.section}>
      <View style={s.adaptiveBanner}>
        <View style={s.adaptiveIcon}>
          <SymbolView name="sparkles" size={17} tintColor="#173e34" weight="bold" />
        </View>
        <View style={s.adaptiveCopy}>
          <Text style={s.adaptiveTitle}>COACH IA · SESIÓN PERSONALIZADA</Text>
          <Text style={s.adaptiveText}>
            {isPersonalizing
              ? "Analizando tu perfil, actividad y equipamiento…"
              : "La IA eligió y combinó estos bloques según tu perfil, equipamiento e historial."}
          </Text>
        </View>
        <View style={s.aiStatus}>
          <View style={s.aiStatusDot} />
          <Text style={s.aiStatusText}>
            {isPersonalizing ? "PENSANDO" : "LISTO"}
          </Text>
        </View>
      </View>
      <View>
        <Text style={s.eyebrow}>PROPUESTAS PARA HOY</Text>
        <Text style={s.heading}>Opciones para entrenar hoy</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={236}
        contentContainerStyle={s.track}
      >
        {choices.map((choice) => {
          const active = choice.key === current.key;
          const content = (
            <>
              <View style={[s.imageShade, active && s.imageShadeActive]} />
              {active && (
                <View style={s.selectedBadge}>
                  <SymbolView
                    name="checkmark"
                    size={12}
                    tintColor="#173e34"
                    weight="bold"
                  />
                  <Text style={s.selectedBadgeText}>ELEGIDA</Text>
                </View>
              )}
              <View style={[s.icon, active && s.iconActive]}>
                <SymbolView
                  name={choice.icon}
                  size={23}
                  tintColor={active ? "#173e34" : "white"}
                  weight="bold"
                />
              </View>
              <View style={s.cardCopy}>
                <Text style={s.tag}>{choice.tag}</Text>
                <Text style={s.cardTitle}>{choice.title}</Text>
                <Text style={s.cardMeta}>
                  ≈ {choice.routine.estimatedMinutes} min ·{" "}
                  {choice.routine.items.length} movimientos
                </Text>
              </View>
            </>
          );
          return (
            <Pressable
              key={choice.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setSelected(choice.key);
                setPreview(choice);
              }}
              style={({ pressed }) => [
                s.card,
                { backgroundColor: choice.color },
                active && s.cardActive,
                pressed && s.cardPressed,
              ]}
            >
              <ImageBackground
                source={cardImages[choice.image]}
                resizeMode="cover"
                imageStyle={s.cardImage}
                style={s.image}
              >
                {content}
              </ImageBackground>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cambiar rutina propuesta"
        onPress={selectNext}
        style={({ pressed }) => [s.changeRoutine, pressed && s.cardPressed]}
      >
        <SymbolView
          name="arrow.trianglehead.2.clockwise.rotate.90"
          size={18}
          tintColor="#173e34"
          weight="bold"
        />
        <View style={s.changeRoutineCopy}>
          <Text style={s.changeRoutineTitle}>✦ Pedir otra propuesta</Text>
          <Text style={s.changeRoutineText}>
            Tu entrenador elegirá otra opción compatible
          </Text>
        </View>
        <Text style={s.changeRoutineArrow}>›</Text>
      </Pressable>
      <BottomSheet
        isPresented={preview !== null}
        onDismiss={() => {
          setPreview(null);
          setSwapIndex(null);
          setReplacementQuery("");
          setEditMode(false);
          setEditingBlock(null);
        }}
        showDragIndicator
        snapPoints={["full"]}
        containerColor="#f4f5ef"
      >
        {preview && (
          <RNHostView
            style={{
              width: screenWidth,
              height: Math.max(560, screenHeight - Math.max(insets.top, 12)),
              backgroundColor: "transparent",
            }}
          >
            <View
              style={[
                s.sheet,
                {
                  width: Math.max(280, screenWidth - 24),
                  paddingBottom: Math.max(insets.bottom, 18),
                },
              ]}
            >
              {swapPrescription ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSwapIndex(null)}
                    style={s.sheetBack}
                  >
                    <Text style={s.sheetBackText}>← Volver al bloque</Text>
                  </Pressable>
                  <Text style={s.sheetKicker}>CAMBIAR MOVIMIENTO</Text>
                  <Text style={s.sheetTitle}>
                    {swapPrescription.exercise.name}
                  </Text>
                  <Text style={s.sheetMeta}>
                    Conservamos el objetivo, las series y la intensidad del
                    bloque.
                  </Text>
                </>
              ) : (
                <>
                  <View style={s.sheetTag}>
                    <Text style={s.sheetEyebrow}>{preview.tag}</Text>
                  </View>
                  <Text style={s.sheetTitle}>{preview.title}</Text>
                  <Text style={s.sheetMeta}>
                    ≈ {preview.routine.estimatedMinutes} min ·{" "}
                    {preview.routine.items.length} movimientos
                  </Text>
                  <View style={s.insightCard}>
                    <SymbolView name="sparkles" size={18} tintColor="#c8ff63" weight="bold" />
                    <View style={s.insightCopy}>
                      <Text style={s.insightTitle}>DECISIÓN DEL COACH IA</Text>
                      <Text style={s.insightText}>
                        {preview.insight ??
                          "Seleccionada según tu perfil, equipamiento y actividad reciente."}
                      </Text>
                    </View>
                  </View>
                  <View style={s.sessionTools}>
                    <View style={s.goalIcons}>
                      {sessionGoals(previewBlocks).map((goal) => (
                        <View key={goal.key} style={s.goalChip}>
                          <SymbolView
                            name={goal.icon}
                            size={16}
                            tintColor="#c8ff63"
                            weight="bold"
                          />
                          <Text style={s.goalText}>{goal.label}</Text>
                        </View>
                      ))}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Editar entrenamiento"
                      onPress={() => {
                        setEditMode((value) => !value);
                        setEditingBlock(null);
                      }}
                      style={[s.editSession, editMode && s.editSessionActive]}
                    >
                      <SymbolView
                        name={editMode ? "checkmark" : "pencil"}
                        size={16}
                        tintColor="#173e34"
                        weight="bold"
                      />
                      <Text style={s.editSessionText}>
                        {editMode ? "Listo" : "Editar"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
              <ScrollView
                style={s.sheetList}
                contentContainerStyle={s.sheetListContent}
                showsVerticalScrollIndicator={false}
              >
                {swapPrescription ? (
                  <>
                    <View style={s.catalogSearch}>
                      <SymbolView
                        name="magnifyingglass"
                        size={18}
                        tintColor="#708277"
                        weight="medium"
                      />
                      <TextInput
                        accessibilityLabel="Buscar ejercicio en el catálogo"
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                        placeholder="Buscar ejercicio, músculo o material"
                        placeholderTextColor="#86938b"
                        value={replacementQuery}
                        onChangeText={setReplacementQuery}
                        style={s.catalogSearchInput}
                      />
                    </View>
                    <Pressable
                      onPress={() => {
                        setWithoutEquipment((value) => !value);
                        setReplacementQuery("");
                      }}
                      style={[
                        s.equipmentFilter,
                        withoutEquipment && s.equipmentFilterActive,
                      ]}
                    >
                      <Text
                        style={[
                          s.equipmentFilterText,
                          withoutEquipment && s.equipmentFilterTextActive,
                        ]}
                      >
                        {withoutEquipment ? "✓ " : ""}No tengo el material
                      </Text>
                    </Pressable>
                    <Text style={s.catalogResultCount}>
                      {replacementQuery
                        ? `${replacements.length} resultados en el catálogo`
                        : "Alternativas recomendadas para este bloque"}
                    </Text>
                    {replacements.map((exercise) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Elegir ${exercise.name}`}
                        key={exercise.id}
                        onPress={() => {
                          setPreview((currentPreview) =>
                            currentPreview
                              ? {
                                  ...currentPreview,
                                  routine: replaceRoutineExercise(
                                    currentPreview.routine,
                                    swapIndex!,
                                    exercise,
                                  ),
                                }
                              : currentPreview,
                          );
                          setSwapIndex(null);
                          setWithoutEquipment(false);
                          setReplacementQuery("");
                        }}
                        style={({ pressed }) => [
                          s.replacementCard,
                          pressed && s.cardPressed,
                        ]}
                      >
                        <View style={s.replacementIcon}>
                          <SymbolView
                            name="arrow.trianglehead.2.clockwise.rotate.90"
                            size={18}
                            tintColor="#173e34"
                            weight="bold"
                          />
                        </View>
                        <View style={s.replacementCopy}>
                          <Text style={s.replacementTitle}>
                            {exercise.name}
                          </Text>
                          <Text style={s.replacementMeta}>
                            {exercise.muscles} · {exercise.equipment}
                          </Text>
                        </View>
                        <Text style={s.replacementArrow}>›</Text>
                      </Pressable>
                    ))}
                    {!replacements.length && (
                      <View style={s.emptyCatalog}>
                        <Text style={s.emptyCatalogTitle}>
                          No encontramos coincidencias
                        </Text>
                        <Text style={s.emptyCatalogText}>
                          Probá con “sentadilla”, “piernas”, “mancuerna” o
                          activá “No tengo el material”.
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  previewBlocks.map((block, blockIndex) => (
                    <View key={block.id} style={s.sheetBlock}>
                      <Text style={s.blockWatermark}>{blockIndex + 1}</Text>
                      <View style={s.sheetBlockHeading}>
                        <View style={s.blockBadge}>
                          <Text style={s.blockBadgeText}>
                            {blockIndex === 0
                              ? "WU"
                              : String(blockIndex).padStart(2, "0")}
                          </Text>
                        </View>
                        <View style={s.blockHeadingCopy}>
                          <Text style={s.sheetBlockTitle}>
                            {blockIndex === 0
                              ? "WARM UP"
                              : `BLOQUE ${blockIndex}: ${block.title}`}
                          </Text>
                          <Text style={s.blockFormat}>
                            {block.format.toUpperCase()} ·{" "}
                            {block.durationMinutes}'
                          </Text>
                        </View>
                        {editMode && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Editar bloque ${blockIndex}`}
                            hitSlop={8}
                            onPress={() =>
                              setEditingBlock((value) =>
                                value === blockIndex ? null : blockIndex,
                              )
                            }
                            style={s.blockEditButton}
                          >
                            <SymbolView
                              name="pencil"
                              size={17}
                              tintColor="#173e34"
                              weight="bold"
                            />
                          </Pressable>
                        )}
                      </View>
                      {editingBlock === blockIndex && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Cambiar bloque ${blockIndex}`}
                          onPress={() => replaceWholeBlock(blockIndex)}
                          style={s.replaceBlockAction}
                        >
                          <SymbolView
                            name="arrow.trianglehead.2.clockwise.rotate.90"
                            size={15}
                            tintColor="#173e34"
                            weight="bold"
                          />
                          <Text style={s.replaceBlockText}>
                            Cambiar bloque completo
                          </Text>
                        </Pressable>
                      )}
                      {block.items.map((item, itemIndex) => (
                        <View
                          key={`${item.exercise.id}-${itemIndex}`}
                          style={s.sheetExercise}
                        >
                          <View style={s.exerciseCopy}>
                            <Text style={s.sheetExerciseName}>
                              {item.exercise.name}
                            </Text>
                            <Text style={s.sheetPrescription}>
                              {prescriptionLabel(item, block.format)}
                            </Text>
                          </View>
                          {editingBlock === blockIndex && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Cambiar ${item.exercise.name}`}
                              hitSlop={8}
                              onPress={() =>
                                setSwapIndex(
                                  blockOffsets[blockIndex] + itemIndex,
                                )
                              }
                              style={s.swapButton}
                            >
                              <SymbolView
                                name="pencil"
                                size={17}
                                tintColor="#173e34"
                                weight="bold"
                              />
                            </Pressable>
                          )}
                        </View>
                      ))}
                    </View>
                  ))
                )}
              </ScrollView>
              {!swapPrescription && (
                <SlideToStart
                  onComplete={() => {
                    const routine = preview.routine;
                    setPreview(null);
                    setEditMode(false);
                    setEditingBlock(null);
                    onStart(routine);
                  }}
                />
              )}
            </View>
          </RNHostView>
        )}
      </BottomSheet>
    </View>
  );
}

function SlideToStart({ onComplete }: { onComplete: () => void }) {
  const position = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const maxTravel = Math.max(0, trackWidth - 66);
  const maxTravelRef = useRef(maxTravel);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    maxTravelRef.current = maxTravel;
  }, [maxTravel]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finish = () => {
    const destination = maxTravelRef.current;
    Animated.spring(position, {
      toValue: destination,
      useNativeDriver: false,
      speed: 20,
      bounciness: 0,
    }).start(() => {
      Vibration.vibrate(35);
      onCompleteRef.current();
      position.setValue(0);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dx > 1,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dx > 1,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue(
          Math.max(0, Math.min(gesture.dx * 1.6, maxTravelRef.current)),
        );
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          gesture.dx >= maxTravelRef.current * 0.3 ||
          (gesture.dx > 30 && gesture.vx > 0.25)
        ) {
          finish();
          return;
        }
        Animated.spring(position, {
          toValue: 0,
          useNativeDriver: false,
          speed: 20,
          bounciness: 5,
        }).start();
      },
      onPanResponderTerminate: (_, gesture) => {
        if (gesture.dx >= maxTravelRef.current * 0.3) {
          finish();
          return;
        }
        Animated.spring(position, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Deslizá para iniciar el entrenamiento"
      accessibilityHint="Deslizá hacia la derecha. Con VoiceOver, tocá dos veces."
      accessibilityActions={[{ name: "activate", label: "Iniciar" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "activate") finish();
      }}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      style={s.slideTrack}
    >
      <Animated.View
        pointerEvents="none"
        style={[s.slideProgress, { width: Animated.add(position, 62) }]}
      />
      <Text pointerEvents="none" style={s.slideText}>
        Deslizá para entrenar
      </Text>
      <Animated.View
        hitSlop={{ top: 14, right: 18, bottom: 14, left: 18 }}
        style={[s.slideThumbTouch, { transform: [{ translateX: position }] }]}
      >
        <View style={s.slideThumb}>
          <SymbolView name="arrow.right" size={25} tintColor="#173e34" weight="bold" />
        </View>
      </Animated.View>
    </View>
  );
}

const goalDetails: Record<
  BlockGoal,
  { label: string; icon: SymbolViewProps["name"] }
> = {
  warmup: { label: "Warm up", icon: "flame.fill" },
  power: { label: "Potencia", icon: "bolt.fill" },
  strength: { label: "Fuerza", icon: "dumbbell.fill" },
  "full-body": {
    label: "Full body",
    icon: "figure.strengthtraining.traditional",
  },
  hypertrophy: { label: "Musculación", icon: "dumbbell.fill" },
  mobility: { label: "Movilidad", icon: "figure.flexibility" },
  "upper-body": {
    label: "Upper body",
    icon: "figure.strengthtraining.traditional",
  },
  legs: { label: "Piernas", icon: "figure.walk" },
  transfer: { label: "Transferencia", icon: "figure.run" },
  stability: { label: "Estabilidad", icon: "figure.core.training" },
  conditioning: { label: "Cardio", icon: "heart.fill" },
  recovery: { label: "Recuperación", icon: "heart.fill" },
};

function sessionGoals(blocks: WorkoutBlock[]) {
  const unique = new Map<
    string,
    { key: string; label: string; icon: SymbolViewProps["name"] }
  >();
  for (const block of blocks) {
    if (!block.goal || block.goal === "warmup") continue;
    const detail = goalDetails[block.goal];
    unique.set(detail.label, { key: block.goal, ...detail });
  }
  return [...unique.values()].slice(0, 4);
}

function prescriptionLabel(item: Prescription, format: WorkoutBlock["format"]) {
  const amount = `${item.reps} ${item.unit === "seconds" ? "s" : "rep."}`;
  if (format === "amrap") return `${amount} por ronda`;
  return `${item.sets} ${item.sets === 1 ? "serie" : "series"} × ${amount}${item.perSide ? " por lado" : ""}`;
}

const displayFont = Platform.select({
  ios: "Avenir Next Condensed",
  android: "sans-serif-condensed",
  default: undefined,
});
const s = StyleSheet.create({
  section: { gap: 15, marginHorizontal: -22 },
  adaptiveBanner: {
    marginHorizontal: 22,
    minHeight: 70,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#173e34",
  },
  adaptiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c8ff63",
  },
  adaptiveCopy: { flex: 1, gap: 3 },
  adaptiveTitle: {
    color: "#c8ff63",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  adaptiveText: { color: "white", fontSize: 12, lineHeight: 17 },
  aiStatus: {
    alignSelf: "flex-start",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(200,255,99,0.12)",
  },
  aiStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#c8ff63",
  },
  aiStatusText: {
    color: "#c8ff63",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  eyebrow: {
    paddingHorizontal: 22,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#708477",
  },
  heading: {
    paddingHorizontal: 22,
    marginTop: 4,
    fontFamily: displayFont,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: "#173e34",
  },
  track: { gap: 12, paddingHorizontal: 22, paddingVertical: 4 },
  card: {
    width: 224,
    height: 280,
    borderRadius: 25,
    overflow: "hidden",
    padding: 17,
    justifyContent: "space-between",
    borderWidth: 3,
    borderColor: "transparent",
    shadowColor: "#173e34",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  cardActive: {
    borderColor: "#c8ff63",
    backgroundColor: "#4f7624",
    transform: [{ translateY: -3 }],
  },
  cardPressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  changeRoutine: {
    minHeight: 64,
    marginHorizontal: 22,
    borderRadius: 19,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#e8eddf",
  },
  changeRoutineCopy: { flex: 1, gap: 2 },
  changeRoutineTitle: { color: "#173e34", fontSize: 15, fontWeight: "900" },
  changeRoutineText: { color: "#62766a", fontSize: 11 },
  changeRoutineArrow: { color: "#173e34", fontSize: 28, lineHeight: 30 },
  sheet: {
    height: "100%",
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: "#17211d",
    borderRadius: 28,
    overflow: "hidden",
  },
  sheetTag: {
    alignSelf: "flex-start",
    borderRadius: 7,
    backgroundColor: "#c8ff63",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sheetEyebrow: {
    color: "#173e34",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  sheetTitle: {
    color: "white",
    fontFamily: displayFont,
    fontSize: 33,
    lineHeight: 37,
    fontWeight: "900",
  },
  sheetMeta: { color: "#b8c7bd", fontSize: 13, marginBottom: 6 },
  insightCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#26332e",
  },
  insightCopy: { flex: 1, gap: 3 },
  insightTitle: {
    color: "#c8ff63",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  insightText: { color: "white", fontSize: 11, lineHeight: 16 },
  sessionTools: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  goalIcons: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  goalChip: {
    minHeight: 31,
    borderRadius: 99,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#26332e",
  },
  goalText: { color: "white", fontSize: 9, fontWeight: "800" },
  editSession: {
    minHeight: 38,
    borderRadius: 13,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#c8ff63",
  },
  editSessionActive: { backgroundColor: "white" },
  editSessionText: { color: "#173e34", fontSize: 11, fontWeight: "900" },
  sheetList: {
    flex: 1,
    flexShrink: 1,
    minHeight: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  sheetListContent: { gap: 15, paddingBottom: 12 },
  sheetBlock: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 18,
    padding: 14,
    gap: 8,
    backgroundColor: "#f8f9f4",
    borderWidth: 1,
    borderColor: "#e1e7dd",
  },
  blockWatermark: {
    position: "absolute",
    right: -8,
    bottom: -30,
    color: "rgba(139,190,50,0.38)",
    fontFamily: displayFont,
    fontSize: 118,
    lineHeight: 126,
    fontWeight: "900",
  },
  sheetBlockHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  blockBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c8ff63",
  },
  blockBadgeText: { color: "#173e34", fontSize: 12, fontWeight: "900" },
  blockHeadingCopy: { flex: 1 },
  blockEditButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e4eadf",
  },
  replaceBlockAction: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#c8ff63",
  },
  replaceBlockText: { color: "#173e34", fontSize: 11, fontWeight: "900" },
  blockFormat: {
    marginTop: 2,
    color: "#718078",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  sheetBlockTitle: {
    color: "#173e34",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sheetExercise: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  exerciseCopy: { flex: 1, gap: 2 },
  sheetExerciseName: { color: "#284a40", fontSize: 14, fontWeight: "700" },
  sheetPrescription: { color: "#708277", fontSize: 11 },
  swapButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e4eadf",
  },
  sheetBack: { alignSelf: "flex-start", paddingVertical: 5 },
  sheetBackText: { color: "#c8ff63", fontSize: 13, fontWeight: "800" },
  sheetKicker: {
    color: "#8da196",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  catalogSearch: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#f8f9f4",
    borderWidth: 1,
    borderColor: "#dfe6dc",
  },
  catalogSearchInput: {
    flex: 1,
    height: 50,
    color: "#173e34",
    fontSize: 14,
    fontWeight: "700",
  },
  catalogResultCount: {
    color: "#a9b7ae",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  emptyCatalog: {
    borderRadius: 18,
    padding: 18,
    gap: 5,
    backgroundColor: "#26332e",
  },
  emptyCatalogTitle: { color: "white", fontSize: 14, fontWeight: "900" },
  emptyCatalogText: { color: "#b8c7bd", fontSize: 12, lineHeight: 18 },
  equipmentFilter: {
    alignSelf: "flex-start",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#6e7d75",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  equipmentFilterActive: { backgroundColor: "#c8ff63", borderColor: "#c8ff63" },
  equipmentFilterText: { color: "white", fontSize: 12, fontWeight: "800" },
  equipmentFilterTextActive: { color: "#173e34" },
  replacementCard: {
    minHeight: 76,
    borderRadius: 18,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9f4",
  },
  replacementIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c8ff63",
  },
  replacementCopy: { flex: 1, gap: 3 },
  replacementTitle: { color: "#173e34", fontSize: 14, fontWeight: "900" },
  replacementMeta: { color: "#708277", fontSize: 10, lineHeight: 14 },
  replacementArrow: { color: "#173e34", fontSize: 25 },
  slideTrack: {
    width: "100%",
    alignSelf: "stretch",
    height: 64,
    borderRadius: 32,
    padding: 5,
    overflow: "hidden",
    backgroundColor: "#edf2e8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  slideProgress: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 32,
    backgroundColor: "#c8ff63",
  },
  slideText: {
    color: "#173e34",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  slideThumbTouch: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 64,
    height: 64,
    padding: 5,
  },
  slideThumb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    shadowColor: "#173e34",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  image: { flex: 1, margin: -17, padding: 17, justifyContent: "space-between" },
  cardImage: { borderRadius: 22 },
  imageShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(7,30,24,0.38)",
  },
  imageShadeActive: { backgroundColor: "rgba(91,132,30,0.5)" },
  selectedBadge: {
    position: "absolute",
    top: 13,
    right: 13,
    height: 27,
    borderRadius: 14,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#c8ff63",
  },
  selectedBadgeText: {
    color: "#173e34",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: { backgroundColor: "#c8ff63" },
  cardCopy: { gap: 6 },
  tag: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "rgba(13,37,31,0.62)",
    color: "#c8ff63",
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: "900",
  },
  cardTitle: {
    fontFamily: displayFont,
    fontSize: 29,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.7,
    color: "white",
  },
  cardMeta: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
  },
});
