export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatModel {
  /** Returns the assistant's text reply. */
  complete(messages: ChatMessage[], opts?: { json?: boolean; maxTokens?: number }): Promise<string>;
}

/** Pulls the JSON object out of a model reply that may include reasoning or code fences. */
export function extractJsonObject(reply: string): unknown {
  const withoutThinking = reply.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const start = withoutThinking.indexOf("{");
  const end = withoutThinking.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in model reply");
  return JSON.parse(withoutThinking.slice(start, end + 1));
}
