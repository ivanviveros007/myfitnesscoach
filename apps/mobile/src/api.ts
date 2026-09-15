import * as SecureStore from "expo-secure-store";
import {
  acknowledge,
  pending,
  merge,
  pendingData,
  acknowledgeData,
  mergeData,
} from "./storage";
import {
  dailyTrainingRequestSchema,
  dailyTrainingResponseSchema,
  exerciseSchema,
  type DailyTrainingRequest,
  type Exercise,
} from "@myfitnesscoach/contracts";
export type Account = { token: string; userId: string; url: string };
export async function restore(): Promise<Account | null> {
  const data = await SecureStore.getItemAsync("fitness-account");
  return data ? JSON.parse(data) : null;
}
export async function remember(account: Account) {
  await SecureStore.setItemAsync("fitness-account", JSON.stringify(account));
}
export async function logout() {
  await SecureStore.deleteItemAsync("fitness-account");
}
export async function request(
  url: string,
  path: string,
  token?: string,
  body?: unknown,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url.replace(/\/$/, "") + path, {
      method: body ? "POST" : "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok)
      throw Object.assign(
        new Error(result.message ?? "No se pudo completar la solicitud."),
        { status: response.status },
      );
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
export async function dailyTraining(url: string, input: DailyTrainingRequest) {
  return dailyTrainingResponseSchema.parse(
    await request(
      url,
      "/training/daily",
      undefined,
      dailyTrainingRequestSchema.parse(input),
    ),
  );
}
export async function searchCatalog(url: string, query: string) {
  const result = await request(
    url,
    `/catalog/search?q=${encodeURIComponent(query)}&limit=60`,
  );
  const base = url.replace(/\/$/, "");
  return {
    total: Number(result.total ?? 0),
    items: exerciseSchema.array().parse(result.items).map((item: Exercise) => ({
      ...item,
      imageUrls: item.imageUrls?.map((image) =>
        image.startsWith("http") ? image : `${base}${image}`,
      ),
    })),
  };
}
let running = false;
export async function sync(account: Account) {
  if (running) return;
  running = true;
  try {
    for (const operation of pending(account.userId)) {
      try {
        await request(
          account.url,
          "/sync",
          account.token,
          JSON.parse(operation.payload),
        );
        acknowledge(operation.seq);
      } catch (error) {
        throw Object.assign(error as Error, { sessionId: operation.id });
      }
    }
    for (const operation of pendingData(account.userId)) {
      const result = await request(
        account.url,
        "/data/sync",
        account.token,
        JSON.parse(operation.payload),
      );
      acknowledgeData(
        account.userId,
        operation.seq,
        operation.key,
        result.version,
      );
    }
    merge(
      account.userId,
      await request(account.url, "/sessions", account.token),
    );
    mergeData(
      account.userId,
      await request(account.url, "/data", account.token),
    );
  } finally {
    running = false;
  }
}
