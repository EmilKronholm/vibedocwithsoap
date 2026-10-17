import type { AiEvent, AiProvider } from "./contract";

/**
 * A provider that POSTs the request as JSON to `url` and reads newline-delimited
 * `AiEvent` JSON back. For a backend that holds the model call and the key.
 */
export function httpProvider(url: string, init: RequestInit = {}): AiProvider {
  return async function* (request, { signal }) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    const response = await fetch(url, { ...init, method: "POST", headers, body: JSON.stringify(request), signal });

    if (!response.ok || !response.body) {
      yield { type: "error", message: (await response.text().catch(() => "")) || `AI endpoint returned ${response.status}` };
      return;
    }
    yield* readLines(response.body);
  };
}

async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<AiEvent> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += value;

    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as AiEvent;
      newline = buffer.indexOf("\n");
    }
    if (done) break;
  }
  if (buffer.trim()) yield JSON.parse(buffer) as AiEvent;
}
