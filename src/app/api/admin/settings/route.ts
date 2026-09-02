import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAppSettings, setSetting } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const settings = await getAppSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { prospectRewardAmount, apiKey } = body;

    if (prospectRewardAmount !== undefined) {
      const amount = Number(prospectRewardAmount);
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
      }
      await setSetting("prospect_reward_amount", String(amount));
    }

    if (apiKey !== undefined && String(apiKey).trim()) {
      await setSetting("api_key", String(apiKey).trim());
    }

    const settings = await getAppSettings();
    return NextResponse.json({ settings, success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
