import { NextRequest, NextResponse } from "next/server";

// Map Vercel country codes → our region slugs
const COUNTRY_TO_REGION: Record<string, string> = {
  // Europe
  AT: "eu", BE: "eu", BG: "eu", HR: "eu", CY: "eu", CZ: "eu",
  DK: "eu", EE: "eu", FI: "eu", FR: "eu", DE: "eu", GR: "eu",
  HU: "eu", IE: "eu", IT: "eu", LV: "eu", LT: "eu", LU: "eu",
  MT: "eu", NL: "eu", PL: "eu", PT: "eu", RO: "eu", SK: "eu",
  SI: "eu", ES: "eu", SE: "eu", GB: "eu", NO: "eu", IS: "eu", CH: "eu",
  // North America
  US: "us", CA: "us", MX: "us",
  // APAC
  JP: "apac", KR: "apac", CN: "apac", HK: "apac", TW: "apac",
  SG: "apac", MY: "apac", TH: "apac", VN: "apac", PH: "apac",
  ID: "apac", AU: "apac", NZ: "apac", IN: "apac",
};

export const runtime = "edge";

export function GET(req: NextRequest) {
  // Vercel injects x-vercel-ip-country on all edge/serverless requests
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    "";

  const region = COUNTRY_TO_REGION[country.toUpperCase()] ?? "us";

  return NextResponse.json(
    { country: country || null, region },
    {
      headers: {
        // Cache for 1 hour — country doesn't change between requests
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
