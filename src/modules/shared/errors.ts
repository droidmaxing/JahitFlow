export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("Unexpected API error", error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server." } },
    { status: 500 },
  );
}
