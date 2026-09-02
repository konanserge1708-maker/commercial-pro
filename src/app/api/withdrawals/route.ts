import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getUserById,
  processWithdrawal,
  getWithdrawalsByUser,
  getAllWithdrawals,
  updateWithdrawalStatus,
} from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (session.role === "admin") {
    const withdrawals = await getAllWithdrawals();
    const enriched = await Promise.all(
      withdrawals.map(async (w) => {
        const user = await getUserById(w.userId);
        return {
          ...w,
          agentName: user?.name ?? "Inconnu",
          agentPhone: user?.phone ?? "",
        };
      })
    );
    return NextResponse.json({ withdrawals: enriched });
  }

  const withdrawals = await getWithdrawalsByUser(session.userId);
  return NextResponse.json({ withdrawals });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { amount } = await request.json();
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const withdrawal = await processWithdrawal(
      session.userId,
      withdrawAmount,
      generateId("wd"),
      generateId("act")
    );

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const status = message === "Solde insuffisant" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Admin : valider ou rejeter un retrait en attente */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { withdrawalId, status } = await request.json();

    if (!withdrawalId || !["completed", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "withdrawalId et status (completed|rejected) requis" },
        { status: 400 }
      );
    }

    const withdrawal = await updateWithdrawalStatus(withdrawalId, status);
    return NextResponse.json({ withdrawal, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const code =
      message.includes("déjà") || message.includes("introuvable") ? 400 : 500;
    return NextResponse.json({ error: message }, { status: code });
  }
}
