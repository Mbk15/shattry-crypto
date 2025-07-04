import { NextResponse } from "next/server";
import { fetchHedgeWithCrypto } from "@/lib/wp-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;

  try {
    const posts = await fetchHedgeWithCrypto(page);
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
