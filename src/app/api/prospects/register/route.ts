import { NextRequest, NextResponse } from "next/server";
import { registerQualifiedProspect, getSetting } from "@/lib/db";

/**
 * API publique GET — enregistre un prospect qualifié après paiement WhatsApp
 *
 * Exemple :
 * GET /api/prospects/register?code=JEAA1B2C3&phone=0701020304&payment_ref=PAY123&api_key=VOTRE_CLE
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const apiKey =
      searchParams.get("api_key") ||
      request.headers.get("x-api-key") ||
      "";

    const expectedKey =
      (await getSetting("api_key")) ||
      process.env.API_KEY ||
      "commercial-api-key-change-me";

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "Clé API invalide" }, { status: 401 });
    }

    const code = searchParams.get("code") || searchParams.get("promo_code") || "";
    const name = searchParams.get("name") || undefined;
    const phone = searchParams.get("phone") || "";
    const paymentRef =
      searchParams.get("payment_ref") ||
      searchParams.get("payment_id") ||
      searchParams.get("ref") ||
      undefined;

    if (!code || !phone) {
      return NextResponse.json(
        {
          error: "Paramètres requis : code (promo), phone",
          example:
            "/api/prospects/register?code=JEAA1B2C3&phone=0701020304&payment_ref=PAY123&api_key=VOTRE_CLE",
        },
        { status: 400 }
      );
    }

    const result = await registerQualifiedProspect({
      promoCode: code,
      name,
      phone,
      paymentRef,
    });

    return NextResponse.json({
      success: true,
      message: "Prospect qualifié enregistré",
      prospect: result.prospect,
      rewardAmount: result.rewardAmount,
      agent: result.agentName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const status =
      message.includes("invalide") ||
      message.includes("déjà") ||
      message.includes("requis")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
