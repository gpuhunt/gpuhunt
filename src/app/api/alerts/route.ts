import { NextRequest, NextResponse } from "next/server";
import { getDbWrite } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, gpu_model } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const db = getDbWrite();

    // Create table if it doesn't exist yet
    db.exec(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        gpu_model TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(email, gpu_model)
      )
    `);

    db.prepare(
      `INSERT OR IGNORE INTO price_alerts (email, gpu_model, created_at)
       VALUES (?, ?, ?)`
    ).run(email.toLowerCase().trim(), gpu_model ?? null, new Date().toISOString());

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Don't expose errors to client
  }
}
