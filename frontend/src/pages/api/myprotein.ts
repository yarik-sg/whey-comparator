import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendUrl = "https://musical-cod-4jp747x6w77vf7gxw-8000.app.github.dev/produits/myprotein";
    const response = await fetch(backendUrl, { headers: { "Accept": "application/json" } });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: "Impossible de récupérer les données MyProtein." });
  }
}
