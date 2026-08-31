import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;

async function handleProxy(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/v1/, "");
  const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
  const targetUrl = `${backendUrl}/api/v1${path}${url.search}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
      Accept: req.headers.get("accept") || "application/json",
    };
    const authHeader = req.headers.get("authorization");
    if (authHeader) headers["Authorization"] = authHeader;
    const cookie = req.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const fetchOptions: RequestInit = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = await req.text();
    }

    const backendRes = await fetch(targetUrl, fetchOptions);
    const contentType = backendRes.headers.get("content-type") || "application/json";
    const body = await backendRes.text();

    return new NextResponse(body, {
      status: backendRes.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": backendRes.headers.get("cache-control") || "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "BACKEND_UNAVAILABLE", message: "Backend service is not running." } },
      { status: 503 }
    );
  }
}
