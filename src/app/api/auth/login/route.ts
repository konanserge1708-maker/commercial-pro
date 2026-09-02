import { NextRequest, NextResponse } from "next/server";
import { getUserByPhone } from "@/lib/db";
import { createSession, setSessionCookie, verifyPin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { phone, pin } = await request.json();

    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Numéro et code PIN requis" },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    const cleanPin = String(pin).replace(/\D/g, "");

    if (cleanPin.length !== 4) {
      return NextResponse.json(
        { error: "Le code PIN doit contenir 4 chiffres" },
        { status: 400 }
      );
    }

    const user = await getUserByPhone(cleanPhone);
    if (!user) {
      return NextResponse.json(
        { error: "Numéro ou code PIN incorrect" },
        { status: 401 }
      );
    }

    const valid = await verifyPin(cleanPin, user.pinHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Numéro ou code PIN incorrect" },
        { status: 401 }
      );
    }

    const token = await createSession({
      userId: user.id,
      role: user.role,
      phone: user.phone,
      name: user.name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      role: user.role,
      name: user.name,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
