import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdventure } from "../_lib/groundspeak";
import { normalizeDetail } from "../_lib/normalize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const guid = req.query.guid;
  if (typeof guid !== "string" || guid.length === 0) {
    res.status(400).json({ error: "guid path param is required" });
    return;
  }

  try {
    const raw = await getAdventure(guid);
    res.status(200).json(normalizeDetail(raw));
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}
