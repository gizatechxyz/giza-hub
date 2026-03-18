export function oauthErrorResponse(
  error: string,
  description: string,
  status = 400,
  headers?: Record<string, string>,
): Response {
  return Response.json(
    { error, error_description: description },
    { status, headers },
  );
}
