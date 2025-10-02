import { NextResponse } from "next/server";

interface PriceAlertPayload {
  email?: string;
  product?: string;
  priceThreshold?: number;
}

export async function POST(request: Request) {
  let payload: PriceAlertPayload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Format JSON invalide." }, { status: 400 });
  }

  const { email, product, priceThreshold } = payload;

  if (!email || !product || typeof priceThreshold !== "number" || Number.isNaN(priceThreshold)) {
    return NextResponse.json(
      { message: "Informations manquantes pour créer l'alerte." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Adresse e-mail invalide." }, { status: 400 });
  }

  if (priceThreshold <= 0) {
    return NextResponse.json(
      { message: "Le seuil de prix doit être supérieur à zéro." },
      { status: 400 }
    );
  }

  console.info("[PriceAlert]", {
    email,
    product,
    priceThreshold,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      message: "Alerte prix enregistrée.",
    },
    { status: 201 }
  );
}
