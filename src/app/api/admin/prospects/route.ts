import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProspectsByAgent, getUserById } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const agentId = request.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "agentId requis" }, { status: 400 });
  }

  const agent = await getUserById(agentId);
  if (!agent || agent.role !== "agent") {
    return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
  }

  const prospects = await getProspectsByAgent(agentId);
  const totalReward = prospects.reduce((sum, p) => sum + p.rewardAmount, 0);

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      phone: agent.phone,
      promoCode: agent.promoCode,
    },
    prospects,
    total: prospects.length,
    totalReward,
  });
}
