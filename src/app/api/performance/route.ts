import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActivitiesByUser, getWeeklyPerformance } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const weekly = await getWeeklyPerformance(session.userId);
  const activities = await getActivitiesByUser(session.userId);

  return NextResponse.json({ weekly, activities });
}
