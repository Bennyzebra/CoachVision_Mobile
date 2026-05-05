export type GeminiAction =
  | "generatePracticePlan"
  | "generateDrillExplainWhys"
  | "summarizeIntentForPlanning"
  | "parseSearchIntent";

export type GeminiFunctionRequest = {
  action: GeminiAction;
  payload: unknown;
};

export type GeminiFunctionError = {
  error: string;
  code?: "missing_gemini_key" | "invalid_action" | "gemini_request_failed";
};

type InvokeResult<T> = {
  data: T | null;
  error: unknown;
};

type InvokeGeminiFunction = <T>(
  name: string,
  options: { body: GeminiFunctionRequest; signal?: AbortSignal }
) => Promise<InvokeResult<T>>;

export type GeminiFunctionCallOptions = {
  signal?: AbortSignal;
};

const getErrorMessage = async (error: unknown) => {
  const fallback = error instanceof Error ? error.message : "Gemini request failed.";
  const maybeContext = (error as { context?: unknown } | null)?.context;

  if (maybeContext instanceof Response) {
    try {
      const body = (await maybeContext.clone().json()) as Partial<GeminiFunctionError>;
      return body.error || fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export const createGeminiFunctionCaller =
  (invoke: InvokeGeminiFunction) =>
  async <T>(
    action: GeminiAction,
    payload: unknown,
    options: GeminiFunctionCallOptions = {}
  ): Promise<T> => {
    const { data, error } = await invoke<T>("gemini", {
      body: { action, payload },
      signal: options.signal,
    });

    if (error) {
      throw new Error(await getErrorMessage(error));
    }

    if (data === null) {
      throw new Error("Gemini function returned no data.");
    }

    return data;
  };
