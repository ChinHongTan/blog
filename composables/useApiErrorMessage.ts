type UnknownRecord = Record<string, unknown>;

function pickMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as UnknownRecord;
  const direct = obj.message;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const nested = obj.data;
  if (nested && typeof nested === "object") {
    const nestedMsg = (nested as UnknownRecord).message;
    if (typeof nestedMsg === "string" && nestedMsg.trim()) return nestedMsg.trim();
  }
  return null;
}

export function useApiErrorMessage() {
  return (error: unknown, fallback: string): string => {
    const err = (error ?? {}) as UnknownRecord;
    const statusCode = typeof err.statusCode === "number" ? err.statusCode : undefined;
    const dataMessage = pickMessage(err.data);
    const directMessage = typeof err.message === "string" ? err.message.trim() : "";
    const message = dataMessage || directMessage;

    // Common GitHub permission/auth failures should be explicit for admin UX.
    if (statusCode === 401) return "尚未登入或登入已過期，請重新登入 GitHub。";
    if (statusCode === 403) return message || "沒有寫入此 GitHub 倉庫的權限，請確認帳號是否有 write access。";

    if (message && !message.startsWith("[") && !message.includes("FetchError")) {
      return message;
    }
    return fallback;
  };
}
