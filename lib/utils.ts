import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = [
  "#DC2626", // Red
  "#D97706", // Orange
  "#059669", // Green
  "#7C3AED", // Purple
  "#DB2777", // Pink
  "#2563EB", // Blue
  "#0891B2", // Cyan
  "#4F46E5", // Indigo
  "#65A30D", // Lime
  "#E11D48", // Rose
];

export const idToColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};
