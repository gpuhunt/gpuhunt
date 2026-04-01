import { NextRequest, NextResponse } from "next/server";
import { getBestDealsPerFamily } from "@/lib/db";

const MARKETPLACE_PROVIDERS = ["vast", "salad"];

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") ?? undefined;

  const deals = getBestDealsPerFamily({
    region,
    exclude_providers: MARKETPLACE_PROVIDERS,
    limit: 6,
  });

  return NextResponse.json(deals, {
    headers: {
      // Fresh data — cache for 10 minutes
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
    },
  });
}
