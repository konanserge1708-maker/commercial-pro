import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProspectsByAgent, getProspectRewardAmount } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (session.role !== "agent") {
    return NextResponse.json({ error: "Accès réservé aux agents" }, { status: 403 });
  }

  const prospects = await getProspectsByAgent(session.userId);
  const rewardPerProspect = await getProspectRewardAmount();

  return NextResponse.json({ prospects, rewardPerProspect, total: prospects.length });
}
