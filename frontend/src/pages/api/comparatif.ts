import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendUrl = "https://musical-cod-4jp747x6w77vf7gxw-8000.app.github.dev/comparatif";

    const response = await fetch(backendUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Erreur backend: ${response.status}`);
    }

    const text = await response.text();

    // 👀 Debug : si ce n’est pas du JSON, on log
    if (text.startsWith("<!DOCTYPE")) {
      throw new Error("Le backend renvoie du HTML au lieu du JSON");
    }

    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Erreur proxy:", error.message);
    res.status(500).json({ error: error.message });
  }
}
