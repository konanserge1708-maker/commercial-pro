import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPin } from "@/lib/auth";
import {
  createUser,
  getAllAgents,
  getUserByPhone,
  updateUser,
  setWeeklyPerformance,
  addActivity,
} from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const agents = (await getAllAgents()).map(({ pinHash: _, ...agent }) => agent);
  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, phone, pin, monthlyTarget, initialBalance } = body;

    const cleanPhone = String(phone).replace(/\D/g, "");
    const cleanPin = String(pin).replace(/\D/g, "");

    if (!name || !cleanPhone || cleanPin.length !== 4) {
      return NextResponse.json(
        { error: "Nom, numéro et PIN à 4 chiffres requis" },
        { status: 400 }
      );
    }

    if (await getUserByPhone(cleanPhone)) {
      return NextResponse.json(
        { error: "Ce numéro est déjà utilisé" },
        { status: 409 }
      );
    }

    const pinHash = await hashPin(cleanPin);
    const userId = generateId("agent");

    const user = await createUser({
      id: userId,
      phone: cleanPhone,
      pinHash,
      name: String(name).trim(),
      role: "agent",
      balance: Number(initialBalance) || 0,
      monthlyTarget: Number(monthlyTarget) || 0,
      monthlyAchieved: 0,
      createdAt: new Date().toISOString(),
    });

    const defaultDays = [
      { day: "L", amount: 0 },
      { day: "M", amount: 0 },
      { day: "M", amount: 0 },
      { day: "J", amount: 0 },
      { day: "V", amount: 0 },
      { day: "S", amount: 0 },
      { day: "D", amount: 0 },
    ];
    await setWeeklyPerformance(userId, defaultDays);

    if (user.balance > 0) {
      await addActivity({
        id: generateId("act"),
        userId,
        type: "bonus",
        label: "Solde initial",
        amount: user.balance,
        createdAt: new Date().toISOString(),
      });
    }

    const { pinHash: _, ...publicUser } = user;
    return NextResponse.json({ user: publicUser }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, monthlyTarget, monthlyAchieved, balance, weeklyData } = body;

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    const updates: Record<string, number> = {};
    if (monthlyTarget !== undefined) updates.monthlyTarget = Number(monthlyTarget);
    if (monthlyAchieved !== undefined) updates.monthlyAchieved = Number(monthlyAchieved);
    if (balance !== undefined) updates.balance = Number(balance);

    const user = await updateUser(userId, updates);

    if (weeklyData && Array.isArray(weeklyData)) {
      await setWeeklyPerformance(userId, weeklyData);
    }

    const { pinHash: _, ...publicUser } = user;
    return NextResponse.json({ user: publicUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
