import { provider } from '../../../../src/auth/provider-singleton';

export async function POST(req: Request): Promise<Response> {
  const contentType = req.headers.get('content-type') ?? '';
  let privyIdToken: string | undefined;
  let state: string | undefined;

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData();
    privyIdToken =
      (formData.get('privy_id_token') as string | null) ?? undefined;
    state = (formData.get('state') as string | null) ?? undefined;
  } else {
    const body = (await req.json()) as Record<string, unknown>;
    privyIdToken = body.privy_id_token as string | undefined;
    state = body.state as string | undefined;
  }

  const result = await provider.handlePrivyCallback({
    privyIdToken,
    state,
  });

  switch (result.type) {
    case 'redirect':
      return Response.redirect(result.url, 302);
    case 'html':
      return new Response(result.html, { headers: result.headers });
    case 'error':
      return Response.json(result.body, { status: result.status });
  }
}
