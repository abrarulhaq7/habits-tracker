import { Platform } from "react-native";
import { Practice } from "../types";

const BASE_URL = Platform.OS === "web" ? "/api" : "https://api.example.com/api";

const jsonHeaders = {
  "Content-Type": "application/json",
};

/** Fetch the complete list of practices. */
export const fetchPractices = async (): Promise<Practice[]> => {
  const url = `${BASE_URL}/practices`;
  console.log("[fetchPractices] Requesting URL:", url);
  try {
    const res = await fetch(url);
    console.log(
      "[fetchPractices] Response status:",
      res.status,
      res.statusText,
    );
    if (!res.ok) {
      throw new Error(
        `Failed to fetch practices: ${res.status} ${res.statusText}`,
      );
    }
    const data = await res.json();
    console.log(
      "[fetchPractices] Successfully parsed JSON, items:",
      data.length,
    );
    return data;
  } catch (error) {
    console.error("[fetchPractices] Network/Fetch Error:", error);
    throw error;
  }
};

/** Fetch a single practice by ID. */
export const fetchPracticeById = async (id: string): Promise<Practice> => {
  const res = await fetch(`${BASE_URL}/practices/${id}`);
  if (!res.ok) throw new Error("Practice not found");
  return res.json();
};

/** Toggle the completed_today flag on a practice. */
export const updatePracticeCompletion = async (
  id: string,
  completed: boolean,
): Promise<Practice> => {
  const res = await fetch(`${BASE_URL}/practices/${id}/completion`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error("Failed to update completion");
  return res.json();
};

/**
 * Mutation 1: Update the star rating of a practice (1–5 or null to clear).
 */
export const updatePracticeRating = async (
  id: string,
  rating: number | null,
): Promise<Practice> => {
  const res = await fetch(`${BASE_URL}/practices/${id}/rating`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify({ rating }),
  });

  if (!res.ok) throw new Error("Failed to update rating");
  return res.json();
};

/**
 * Mutation 2: Update the title of a practice card.
 */
export const updatePracticeTitle = async (
  id: string,
  title: string,
): Promise<Practice> => {
  const res = await fetch(`${BASE_URL}/practices/${id}/title`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
};
