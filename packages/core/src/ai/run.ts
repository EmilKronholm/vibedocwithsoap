import type { AiEvent, AiProvider, AiRequest, AiResult } from "./contract";

export class CancelledError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "CancelledError";
  }
}

export class EmptyResultError extends Error {
  constructor() {
    super("The AI finished without returning a document.");
    this.name = "EmptyResultError";
  }
}

const isStream = (value: unknown): value is AsyncIterable<AiEvent> =>
  typeof value === "object" && value !== null && Symbol.asyncIterator in value;

/**
 * Runs one request. `onProgress` receives the document as written so far.
 * Rejects with `CancelledError` once `signal` aborts, with `EmptyResultError`
 * if no document came back, or with the provider's own error.
 */
export async function runProvider(
  provider: AiProvider,
  request: AiRequest,
  signal: AbortSignal,
  onProgress: (html: string) => void,
): Promise<AiResult> {
  let result: AiResult | null;
  try {
    result = await collect(provider, request, signal, onProgress);
  } catch (error) {
    // A fetch aborted mid-request rejects with its own error; it is still a cancel.
    if (signal.aborted) throw new CancelledError();
    throw error;
  }
  if (signal.aborted) throw new CancelledError();
  if (!result?.html.trim()) throw new EmptyResultError();
  return result;
}

async function collect(provider: AiProvider, request: AiRequest, signal: AbortSignal, onProgress: (html: string) => void): Promise<AiResult | null> {
  const output = provider(request, { signal });
  if (!isStream(output)) return output;

  let result: AiResult | null = null;
  for await (const event of output) {
    if (signal.aborted) break;
    if (event.type === "progress") onProgress(event.html);
    else if (event.type === "done") result = event.result;
    else throw new Error(event.message);
  }
  return result;
}
