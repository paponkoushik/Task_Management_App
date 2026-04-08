type JsonRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type ApiErrorPayload = {
  error?: string;
};

export class ApiRequestError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(message: string, status: number, payload: ApiErrorPayload | null) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

function buildJsonRequest(options: JsonRequestOptions): RequestInit {
  const { body, headers, ...rest } = options;
  const nextHeaders = new Headers(headers);

  if (body !== undefined && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  return {
    ...rest,
    headers: nextHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export async function requestJson<TPayload = unknown>(
  url: string,
  options: JsonRequestOptions = {},
) {
  const response = await fetch(url, buildJsonRequest(options));
  const payload = (await response.json().catch(() => null)) as TPayload | null;

  return {
    response,
    payload,
  };
}

export async function sendJson<TPayload = unknown>(
  url: string,
  options: JsonRequestOptions = {},
) {
  const { response, payload } = await requestJson<TPayload>(url, options);
  const errorPayload = (payload as ApiErrorPayload | null) ?? null;

  if (!response.ok) {
    throw new ApiRequestError(
      errorPayload?.error ?? "Something went wrong.",
      response.status,
      errorPayload,
    );
  }

  return payload;
}
