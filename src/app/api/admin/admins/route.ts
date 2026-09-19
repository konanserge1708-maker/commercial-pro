import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPin } from "@/lib/auth";
import {
  createUser,
  getAllAdmins,
  getUserByPhone,
  getUserById,
  updateUser,
  deleteUser,
} from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const admins = (await getAllAdmins()).map(({ pinHash: _, ...admin }) => admin);
  return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, phone, pin } = body;

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
    const userId = generateId("admin");

    const user = await createUser({
      id: userId,
      phone: cleanPhone,
      pinHash,
      name: String(name).trim(),
      role: "admin",
      balance: 0,
      monthlyTarget: 0,
      monthlyAchieved: 0,
      createdAt: new Date().toISOString(),
    });

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
    const { userId, name, phone, pin } = body;

    if (!userId) {
      return NextResponse.json({ error: "ID administrateur requis" }, { status: 400 });
    }

    const target = await getUserById(userId);
    if (!target || target.role !== "admin") {
      return NextResponse.json({ error: "Administrateur introuvable" }, { status: 404 });
    }

    const updates: { name?: string; phone?: string; pinHash?: string } = {};

    if (name !== undefined && String(name).trim()) {
      updates.name = String(name).trim();
    }

    if (phone !== undefined) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone && cleanPhone !== target.phone) {
        const existing = await getUserByPhone(cleanPhone);
        if (existing && existing.id !== userId) {
          return NextResponse.json(
            { error: "Ce numéro est déjà utilisé" },
            { status: 409 }
          );
        }
        updates.phone = cleanPhone;
      }
    }

    if (pin) {
      const cleanPin = String(pin).replace(/\D/g, "");
      if (cleanPin.length !== 4) {
        return NextResponse.json(
          { error: "Le PIN doit contenir 4 chiffres" },
          { status: 400 }
        );
      }
      updates.pinHash = await hashPin(cleanPin);
    }

    const user = await updateUser(userId, updates);
    const { pinHash: _, ...publicUser } = user;
    return NextResponse.json({ user: publicUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "ID administrateur requis" }, { status: 400 });
    }

    if (userId === session.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    const target = await getUserById(userId);
    if (!target || target.role !== "admin") {
      return NextResponse.json({ error: "Administrateur introuvable" }, { status: 404 });
    }

    const admins = await getAllAdmins();
    if (admins.length <= 1) {
      return NextResponse.json(
        { error: "Impossible de supprimer le dernier administrateur" },
        { status: 400 }
      );
    }

    await deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
