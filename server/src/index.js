import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { makePool } from "./db.js";
import { SQL } from "./sql.js";
import { nowArSql, nowArCompact } from "./time.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const pool = makePool();

const REQUIRED_COLS = ["cod_alfa", "price", "quantity"];
const DEFAULT_ESTADO_ID = 1;

function genNumero(pref = "COMEX") {
  const ts = nowArCompact();
  return `${pref}-${ts}-${uuidv4().slice(0, 4)}`;
}

function normalizeCols(row) {
  // lower + trim keys
  const out = {};
  for (const [k, v] of Object.entries(row)) out[String(k).trim().toLowerCase()] = v;
  return out;
}

function parseExcel(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const wsName = wb.SheetNames[0];
  const ws = wb.Sheets[wsName];
  const rowsRaw = XLSX.utils.sheet_to_json(ws, { defval: "" });

  const rows = rowsRaw.map(normalizeCols);

  // validate required cols exist in at least header sense:
  const keys = new Set(Object.keys(rows[0] || {}));
  const miss = REQUIRED_COLS.filter((c) => !keys.has(c));
  if (miss.length) {
    return { ok: false, error: `Faltan columnas: ${miss.join(", ")}` };
  }

  const parsed = [];
  for (const r of rows) {
    const cod = String(r.cod_alfa ?? "").trim();
    const price = Number(r.price);
    const qty = Number(r.quantity);

    parsed.push({
      cod_alfa: cod,
      price,
      quantity: qty,
    });
  }

  const bad = parsed.filter(
    (r) =>
      !r.cod_alfa ||
      !Number.isFinite(r.price) ||
      !Number.isFinite(r.quantity) ||
      r.price <= 0 ||
      r.quantity <= 0
  );

  if (bad.length) {
    return { ok: false, error: "Hay valores inválidos (price/quantity deben ser numéricos y > 0).", bad };
  }

  return { ok: true, rows: parsed };
}

async function loadArticulos(conn, cods) {
  if (!cods.length) return [];
  const [res] = await conn.query(SQL.load_articulos(cods.length), cods);
  return res;
}

async function getEstadoTextoPorId(conn, estadoId) {
  const [rows] = await conn.query(SQL.get_estado_texto_por_id, [Number(estadoId)]);
  if (!rows?.length) throw new Error(`No existe comex_estados.id=${estadoId}.`);
  return rows[0].estado;
}

// ---------------- API ----------------

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/estados", async (_req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(SQL.get_estados);
    res.json({ estados: rows });
  } finally {
    conn.release();
  }
});

app.get("/api/pedidos/index", async (req, res) => {
  const limit = Number(req.query.limit ?? 2000);
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(SQL.get_pedidos_index, [limit]);
    res.json({ index: rows });
  } finally {
    conn.release();
  }
});

app.get("/api/pedidos/:pedido/trazabilidad", async (req, res) => {
  const pedido = String(req.params.pedido);
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(SQL.get_trazabilidad, [pedido]);
    res.json({ trazabilidad: rows });
  } finally {
    conn.release();
  }
});

app.get("/api/pedidos/:pedido/lines", async (req, res) => {
  const pedido = String(req.params.pedido);
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(SQL.load_pedido_lines, [pedido]);
    res.json({ lines: rows });
  } finally {
    conn.release();
  }
});

app.put("/api/pedidos/:pedido/lines", async (req, res) => {
  const pedido = String(req.params.pedido);

  const Schema = z.object({
    lines: z.array(
      z.object({
        ITEM: z.number().int(),
        CANTIDAD: z.number().positive(),
        PRECIO: z.number().positive(),
      })
    ),
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Payload inválido", detail: parsed.error.flatten() });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const tsNow = nowArSql();

    for (const r of parsed.data.lines) {
      await conn.query(SQL.update_pedido_line, [
        Number(r.CANTIDAD),
        Number(r.PRECIO),
        tsNow,
        pedido,
        Number(r.ITEM),
      ]);
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "DB error", detail: String(e?.message || e) });
  } finally {
    conn.release();
  }
});

app.post("/api/pedidos/:pedido/estado", async (req, res) => {
  const pedido = String(req.params.pedido);
  const Schema = z.object({
    estado_texto: z.string().min(1),
    usr: z.string().min(1),
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Payload inválido", detail: parsed.error.flatten() });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(SQL.insert_pedido_meta, [
      pedido,
      parsed.data.estado_texto,
      nowArSql(),
      parsed.data.usr,
    ]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "DB error", detail: String(e?.message || e) });
  } finally {
    conn.release();
  }
});

// Preview (equivalente a la validación + merge articulos + resumen)
app.post("/api/preview", upload.single("file"), async (req, res) => {
  if (!req.file?.buffer) return res.status(400).json({ error: "Falta archivo .xlsx" });

  const parsed = parseExcel(req.file.buffer);
  if (!parsed.ok) return res.status(400).json(parsed);

  const cods = [...new Set(parsed.rows.map((r) => r.cod_alfa))];

  const conn = await pool.getConnection();
  try {
    const art = await loadArticulos(conn, cods);
    const artMap = new Map(art.map((a) => [String(a.cod_alfa).trim(), a]));

    const merged = parsed.rows.map((r) => {
      const a = artMap.get(r.cod_alfa) || null;
      return {
        COD_ALFA: r.cod_alfa,
        PRECIO: r.price,
        CANTIDAD: r.quantity,
        proveedor: a?.proveedor ?? null,
        nombre: a?.nombre ?? null,
      };
    });

    const sin = merged.filter((m) => m.proveedor == null);

    // resumen por proveedor/razon social
    const byKey = new Map();
    for (const m of merged) {
      const k = `${m.proveedor ?? "NULL"}|${m.nombre ?? ""}`;
      const cur = byKey.get(k) || {
        PROVEEDOR: m.proveedor,
        "RAZON SOCIAL": m.nombre,
        ITEMS: 0,
        CANTIDAD_TOTAL: 0,
        ST_USD: 0,
      };
      cur.ITEMS += 1;
      cur.CANTIDAD_TOTAL += Number(m.CANTIDAD);
      cur.ST_USD += Number(m.CANTIDAD) * Number(m.PRECIO);
      byKey.set(k, cur);
    }

    const resumen = [...byKey.values()].sort((a, b) =>
      String(a.PROVEEDOR ?? "").localeCompare(String(b.PROVEEDOR ?? ""))
    );

    res.json({ ok: true, merged, sin, resumen });
  } finally {
    conn.release();
  }
});

// Generar pedidos (equivalente al botón "Generar en vicomx")
app.post("/api/generate", upload.single("file"), async (req, res) => {
  const user_email = String(req.body.user_email ?? "").trim();
  if (!user_email) return res.status(400).json({ error: "Ingresá el usuario antes de confirmar." });
  if (!req.file?.buffer) return res.status(400).json({ error: "Falta archivo .xlsx" });

  const parsed = parseExcel(req.file.buffer);
  if (!parsed.ok) return res.status(400).json(parsed);

  const cods = [...new Set(parsed.rows.map((r) => r.cod_alfa))];

  const conn = await pool.getConnection();
  try {
    const art = await loadArticulos(conn, cods);
    const artMap = new Map(art.map((a) => [String(a.cod_alfa).trim(), a]));

    const merged = parsed.rows.map((r) => {
      const a = artMap.get(r.cod_alfa) || null;
      return {
        CLIENTE: a?.proveedor ?? null,
        "RAZON SOCIAL": a?.nombre ?? null,
        COD_ALFA: r.cod_alfa,
        CANTIDAD: r.quantity,
        PRECIO: r.price,
      };
    });

    const sin = merged.filter((m) => m.CLIENTE == null);
    if (sin.length) {
      return res.status(400).json({
        error: "Ítems sin proveedor (falta mapeo en articulos_comex).",
        sin: sin.map((x) => ({ COD_ALFA: x.COD_ALFA })),
      });
    }

    await conn.beginTransaction();

    const estadoInicial = await getEstadoTextoPorId(conn, DEFAULT_ESTADO_ID);
    const tsNow = nowArSql();

    // group by CLIENTE + RAZON SOCIAL
    const groups = new Map();
    for (const m of merged) {
      const key = `${m.CLIENTE}|${m["RAZON SOCIAL"]}`;
      const arr = groups.get(key) || [];
      arr.push(m);
      groups.set(key, arr);
    }

    const created = [];

    for (const [key, lines] of groups.entries()) {
      const [cliStr, razon] = key.split("|");
      const cli = Number(cliStr);
      const numero = genNumero(`COMEX-P${cli}`);

      // insert lines with ITEM autoincrement in-memory (igual que Python)
      let item = 1;
      for (const ln of lines) {
        await conn.query(SQL.insert_lines, [
          numero,
          String(cli),
          ln.COD_ALFA,
          Number(ln.CANTIDAD),
          Number(ln.PRECIO),
          razon,
          item,
          "CX",
          0,
          "N",
          user_email,
          tsNow,
        ]);
        item += 1;
      }

      await conn.query(SQL.insert_pedido_meta, [numero, estadoInicial, tsNow, user_email]);

      created.push({
        PEDIDO: numero,
        PROVEEDOR: cli,
        "RAZON SOCIAL": razon,
        ESTADO: estadoInicial,
      });
    }

    await conn.commit();

    res.json({
      ok: true,
      message: "Pedidos Generados y registrados en vicomx",
      created,
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "DB error", detail: String(e?.message || e) });
  } finally {
    conn.release();
  }
});

// ---------------- Serve React ----------------
app.use(express.static(path.join(__dirname, "../public")));
app.get("*", (req, res) => {
  const indexHtml = path.join(__dirname, "../public/index.html");
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  res.status(404).send("Client build not found");
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`✅ comex-vicomx listening on :${port}`));
