import React from "react";
import { Box, Button, TextField, Alert, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SectionCard from "../components/SectionCard.jsx";
import { previewExcel, generatePedidos } from "../api.js";
const UI_BUILD = "UI_BUILD_2026-02-04_01";


// --- FIX: soporta números como "9,81", "1.234,56", "$ 9.811,93", etc. ---
function parseNumberAR(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const s = String(v).trim();
  if (!s) return 0;

  const clean = s.replace(/[^\d.,-]/g, "");

  // caso AR típico: 1.234,56  -> 1234.56
  if (clean.includes(",") && clean.includes(".")) {
    const normalized = clean.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  // caso: 123,45 -> 123.45
  if (clean.includes(",") && !clean.includes(".")) {
    const n = Number(clean.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  // caso: 1234.56 o 1234
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function toMoney(n) {
  const x = parseNumberAR(n);
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toInt(n) {
  const x = parseNumberAR(n);
  return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/**
 * Normaliza nombres de campos del backend/excel para que la grilla no muestre 0 por undefined.
 * Corrige el caso típico: backend devuelve price/quantity y la UI busca PRECIO/CANTIDAD.
 */
function normalizeMergedRow(r, id) {
  return {
    id,
    COD_ALFA: r.COD_ALFA ?? r.cod_alfa ?? "",
    PRECIO: r.PRECIO ?? r.precio ?? r.price ?? 0,
    CANTIDAD: r.CANTIDAD ?? r.cantidad ?? r.quantity ?? 0,
    proveedor: r.proveedor ?? r.PROVEEDOR ?? "",
    nombre: r.nombre ?? r.NOMBRE ?? r["RAZON SOCIAL"] ?? r.RAZON_SOCIAL ?? r.razon_social ?? "",
  };
}

function normalizeResumenRow(r, id) {
  const razon =
    r["RAZON SOCIAL"] ??
    r.RAZON_SOCIAL ??
    r.razon_social ??
    r.nombre ??
    r.NOMBRE ??
    "";

  return {
    id,
    PROVEEDOR: r.PROVEEDOR ?? r.proveedor ?? "",
    "RAZON SOCIAL": razon,
    ITEMS: r.ITEMS ?? r.items ?? 0,
    CANTIDAD_TOTAL: r.CANTIDAD_TOTAL ?? r.cantidad_total ?? 0,
    ST_USD: r.ST_USD ?? r.st_usd ?? 0,
  };
}

export default function NuevoPedido() {
  const [user, setUser] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const [preview, setPreview] = React.useState(null); // {merged, sin, resumen}
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [created, setCreated] = React.useState([]);

  // DENSE UI
  const denseTextFieldSx = {
    "& .MuiInputBase-root": { height: 40 },
    "& .MuiInputBase-input": { py: 0.5 },
  };
  const denseButtonSx = { height: 38, px: 1.5 };
  const denseGridSx = {
    "& .MuiDataGrid-columnHeaders": { minHeight: 38, maxHeight: 38 },
    "& .MuiDataGrid-row": { maxHeight: 38 },
    "& .MuiDataGrid-cell": { py: 0.5 },
    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
  };

  async function onPreview(f) {
    setError("");
    setSuccess("");
    setCreated([]);
    setPreview(null);

    try {
      setLoading(true);
      const data = await previewExcel(f);
      setPreview(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function onGenerate() {
    setError("");
    setSuccess("");
    setCreated([]);

    if (!user.trim()) {
      setError("Ingresá el usuario antes de confirmar.");
      return;
    }
    if (!file) {
      setError("Seleccioná un archivo Excel.");
      return;
    }

    try {
      setLoading(true);
      const data = await generatePedidos(file, user.trim());
      setSuccess(data.message || "Pedidos Generados y registrados en vicomx");
      setCreated(data.created || []);
    } catch (e) {
      const payload = e?.response?.data;
      setError(payload?.error || payload?.message || e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  // ✅ FIX definitivo: valueGetter evita que el DataGrid pase undefined al formatter (que termina como 0)
  const mergedCols = [
    { field: "COD_ALFA", headerName: "COD_ALFA", flex: 1, minWidth: 130 },
    {
      field: "PRECIO",
      headerName: "PRECIO",
      flex: 1,
      minWidth: 120,
      valueGetter: (p) => p.row?.PRECIO ?? 0,
      valueFormatter: (p) => toMoney(p.value),
    },
    {
      field: "CANTIDAD",
      headerName: "CANTIDAD",
      flex: 1,
      minWidth: 120,
      valueGetter: (p) => p.row?.CANTIDAD ?? 0,
      valueFormatter: (p) => toInt(p.value),
    },
    { field: "proveedor", headerName: "PROVEEDOR", flex: 1, minWidth: 140 },
    { field: "nombre", headerName: "NOMBRE", flex: 2, minWidth: 240 },
  ];

  const resumenCols = [
    { field: "PROVEEDOR", headerName: "PROVEEDOR", flex: 1, minWidth: 140 },
    { field: "RAZON SOCIAL", headerName: "RAZON SOCIAL", flex: 2, minWidth: 280 },
    { field: "ITEMS", headerName: "ITEMS", flex: 1, minWidth: 110 },
    {
      field: "CANTIDAD_TOTAL",
      headerName: "CANTIDAD_TOTAL",
      flex: 1,
      minWidth: 160,
      valueGetter: (p) => p.row?.["CANTIDAD_TOTAL"] ?? 0,
      valueFormatter: (p) => toInt(p.value),
    },
    {
      field: "ST_USD",
      headerName: "ST_USD",
      flex: 1,
      minWidth: 140,
      valueGetter: (p) => p.row?.ST_USD ?? 0,
      valueFormatter: (p) => toMoney(p.value),
    },
  ];

  return (
    <Box>
      <SectionCard title="Carga de planilla" subtitle="Seleccioná el Excel y validamos columnas y valores.">
        <Alert severity="info" sx={{ mt: 2 }}>
          {UI_BUILD}
        </Alert>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={2} alignItems="center">
          <TextField
            label="Usuario"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            sx={denseTextFieldSx}
          />

          <Button
            variant="outlined"
            component="label"
            sx={{
              ...denseButtonSx,
              justifyContent: "space-between",
              textTransform: "none",
              width: "100%",
            }}
            disabled={loading}
          >
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pr: 1 }}>
              {file ? `Archivo: ${file.name}` : "Seleccionar planilla Excel (.xlsx)"}
            </Box>
            <input
              hidden
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFile(f);
                onPreview(f);
              }}
            />
          </Button>
        </Box>

        <Box mt={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}
        </Box>
      </SectionCard>

      {preview?.sin?.length ? (
        <SectionCard title="Validación" subtitle="Ítems sin proveedor (falta mapeo en articulos_comex).">
          <Alert severity="error" sx={{ mb: 2 }}>
            Hay ítems sin proveedor. Corregí el mapeo antes de generar.
          </Alert>
          <DataGrid
            autoHeight
            rowHeight={38}
            sx={denseGridSx}
            rows={preview.sin.map((r, i) => ({ id: i, ...r }))}
            columns={[{ field: "COD_ALFA", headerName: "COD_ALFA", flex: 1, minWidth: 160 }]}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          />
        </SectionCard>
      ) : null}

      {preview?.merged?.length ? (
        <SectionCard title="Vista Previa" subtitle="Revisá los ítems y sus valores antes de generar.">
          <DataGrid
            autoHeight
            rowHeight={38}
            sx={denseGridSx}
            rows={preview.merged.map((r, i) => normalizeMergedRow(r, i))}
            columns={mergedCols}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          />
        </SectionCard>
      ) : null}

      {preview?.resumen?.length ? (
        <SectionCard
          title="Pedidos a Generar en vicomx"
          subtitle="Si está todo OK, generá los pedidos al final de la sección."
          footer={
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={onGenerate}
                disabled={loading || !file || !!preview?.sin?.length}
                sx={denseButtonSx}
              >
                Generar en vicomx
              </Button>
            </Box>
          }
        >
          <DataGrid
            autoHeight
            rowHeight={38}
            sx={denseGridSx}
            rows={preview.resumen.map((r, i) => normalizeResumenRow(r, i))}
            columns={resumenCols}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          />

          {created?.length ? (
            <Box mt={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                Pedidos creados
              </Typography>
              <DataGrid
                autoHeight
                rowHeight={38}
                sx={denseGridSx}
                rows={created.map((r, i) => ({ id: i, ...r }))}
                columns={[
                  { field: "PEDIDO", headerName: "PEDIDO", flex: 2, minWidth: 240 },
                  { field: "PROVEEDOR", headerName: "PROVEEDOR", flex: 1, minWidth: 140 },
                  { field: "RAZON SOCIAL", headerName: "RAZON SOCIAL", flex: 2, minWidth: 280 },
                  { field: "ESTADO", headerName: "ESTADO", flex: 1, minWidth: 160 },
                ]}
                pageSizeOptions={[25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
              />
            </Box>
          ) : null}
        </SectionCard>
      ) : null}
    </Box>
  );
}
