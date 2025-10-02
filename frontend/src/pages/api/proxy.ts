import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const target = req.query.target as string;

    if (!target) {
      return res.status(400).json({ error: "Missing target" });
    }

    const backendUrl = `http://localhost:8000/${target}`; 
    // ⚠️ en prod, remplace par ton vrai backend FastAPI (ex: https://api.tonsite.com/)

    const response = await fetch(backendUrl);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy failed", details: err.message });
  }
}
