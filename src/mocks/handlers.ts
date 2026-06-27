import { http, HttpResponse } from "msw";
import { Practice } from "../lib/types";
import { practicesStore } from "./data";

const MOCK_LATENCY = Number(process.env.EXPO_PUBLIC_MOCK_LATENCY) || 500;

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * MSW HTTP request handlers.
 * All fetch() calls from the app are intercepted here —
 * no real network request ever leaves the device.
 */
export const handlers = [
  // ─── GET /api/practices ───────────────────────────────────────────────────
  // Returns the full list of practices from the in-memory store.
  http.get("*/api/practices", async () => {
    await delay(MOCK_LATENCY);
    return HttpResponse.json([...practicesStore]);
  }),

  // ─── GET /api/practices/:id ───────────────────────────────────────────────
  http.get("*/api/practices/:id", async ({ params }) => {
    await delay(MOCK_LATENCY);
    const practice = practicesStore.find((p) => p.id === params.id);
    if (!practice) {
      return HttpResponse.json(
        { message: "Practice not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json({ ...practice });
  }),

  // ─── PATCH /api/practices/:id/completion ─────────────────────────────────
  // Toggles the completed_today flag on a practice.
  http.patch("*/api/practices/:id/completion", async ({ params, request }) => {
    await delay(MOCK_LATENCY);
    const body = (await request.json()) as { completed: boolean };

    const index = practicesStore.findIndex((p) => p.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { message: "Practice not found" },
        { status: 404 },
      );
    }
    practicesStore[index] = {
      ...practicesStore[index],
      completed_today: body.completed,
    };
    return HttpResponse.json({ ...practicesStore[index] });
  }),

  // ─── PATCH /api/practices/:id/rating ─────────────────────────────────────
  // Mutation 1: Updates the star rating (1–5) or clears it (null).
  http.patch("*/api/practices/:id/rating", async ({ params, request }) => {
    await delay(MOCK_LATENCY);
    const body = (await request.json()) as { rating: number | null };
    const index = practicesStore.findIndex((p) => p.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { message: "Practice not found" },
        { status: 404 },
      );
    }
    practicesStore[index] = { ...practicesStore[index], rating: body.rating };
    return HttpResponse.json({ ...practicesStore[index] });
  }),

  // ─── PATCH /api/practices/:id/title ──────────────────────────────────────
  // Mutation 2: Updates the title of a practice card.
  http.patch("*/api/practices/:id/title", async ({ params, request }) => {
    await delay(MOCK_LATENCY);
    const body = (await request.json()) as { title: string };
    if (!body.title || body.title.trim().length === 0) {
      return HttpResponse.json(
        { message: "Title cannot be empty" },
        { status: 400 },
      );
    }
    const index = practicesStore.findIndex((p) => p.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { message: "Practice not found" },
        { status: 404 },
      );
    }
    practicesStore[index] = {
      ...practicesStore[index],
      title: body.title.trim(),
    } as Practice;
    return HttpResponse.json({ ...practicesStore[index] });
  }),
];
