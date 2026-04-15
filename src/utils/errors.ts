import axios from "axios";

export function extractApiErrors(err: unknown, fallback: string): string[] {
  if (axios.isAxiosError(err)) {
    const apiErrors = err.response?.data?.errors;
    if (apiErrors && typeof apiErrors === "object") {
      return Object.values(apiErrors).flat() as string[];
    }
  }
  return [fallback];
}
