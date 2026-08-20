import crypto from "node:crypto";
import { getSql, handleOptions, requireJwt } from "../_route-utils";

async function productsHandler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }

  try {
    if (req.method === "POST" && !requireJwt(req, res)) return;
    const sql = await getSql();
    if (req.method === "POST") {
      const body = req.body || {};
      const id = body.id || `VND-PROD-${crypto.randomUUID().slice(0, 8)}`;
      const name = body.name || body.title || "Nouveau produit";
      const price = Number(body.priceFCFA || body.price || 0);
      const rows = await sql`
        INSERT INTO sat_products (id, name, category, brand, price_fcfa, stock, image_url, short_desc, specs)
        VALUES (${id}, ${name}, ${body.category || "Matériels Tech"}, ${body.brand || "SEN AURA"}, ${price}, ${Number(body.stock || 0)}, ${body.imageUrl || body.image || ""}, ${body.description || ""}, ${JSON.stringify(body.specs || {})})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, category = EXCLUDED.category, brand = EXCLUDED.brand,
          price_fcfa = EXCLUDED.price_fcfa, stock = EXCLUDED.stock, image_url = EXCLUDED.image_url,
          short_desc = EXCLUDED.short_desc, specs = EXCLUDED.specs, updated_at = NOW()
        RETURNING *;
      `;
      const product = rows[0];
      return res.json({ success: true, product: { ...product, priceFCFA: Number(product.price_fcfa) || 0, stock: Number(product.stock) || 0 } });
    }
    const rows = await sql`SELECT * FROM sat_products ORDER BY price_fcfa DESC;`;
    const products = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      title: row.name,
      category: row.category,
      brand: row.brand,
      priceFCFA: Number(row.price_fcfa) || 0,
      oldPriceFCFA: row.old_price_fcfa ? Number(row.old_price_fcfa) : undefined,
      stock: Number(row.stock) || 0,
      rating: Number(row.rating) || 4.9,
      image: row.image_url,
      imageUrl: row.image_url,
      mainMediaUrl: row.image_url,
      description: row.short_desc || "",
      shortDesc: row.short_desc || "",
      badge: row.badge,
      specs: row.specs || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return res.json({ success: true, products: products || [] });
  } catch (err) {
    console.warn("Vercel products fallback:", err);
    return res.json({ success: true, products: [] });
  }
}

export default async function handler(req: any, res: any) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (handleOptions(req, res)) return;
    return await productsHandler(req, res);
  } catch (error) {
    console.error("[PRODUCTS_HANDLER_ERROR]", error);
    if (!res.headersSent) return res.status(500).json({ success: false, error: "Erreur serveur." });
  }
}
