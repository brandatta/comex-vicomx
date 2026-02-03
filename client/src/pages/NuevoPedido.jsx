import React from "react";
import { Box, Button, TextField, Alert, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SectionCard from "../components/SectionCard.jsx";
import { previewExcel, generatePedidos } from "../api.js";

function toMoney(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function toInt(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
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

  const mergedCols = [
    { field: "COD_ALFA", headerName: "COD_ALFA", flex: 1, minWidth: 130 },
    { field: "PRECIO", headerName: "PRECIO", flex: 1, minWidth: 120, valueFormatter: (p) => toMoney(p.value) },
    { field: "CANTIDAD", headerName: "CANTIDAD", flex: 1, minWidth: 120, valueFormatter: (p) => toInt(p.value) },
    { field: "proveedor", headerName: "PROVEEDOR", flex: 1, minWidth: 140 },
    { field: "nombre", headerName: "NOMBRE", flex: 2, minWidth: 240 },
  ];

  const resumenCols = [
    { field: "PROVEEDOR", headerName: "PROVEEDOR", flex: 1, minWidth: 140 },
    { field: "RAZON SOCIAL", headerName: "RAZON SOCIAL", flex: 2, minWidth: 280 },
    { field: "ITEMS", headerName: "ITEMS", flex: 1, minWidth: 110 },
    { field: "CANTIDAD_TOTAL", headerName: "CANTIDAD_TOTAL", flex: 1, minWidth: 160, valueFormatter: (p) => toInt(p.value) },
    { field: "ST_USD", headerName: "ST_USD", flex: 1, minWidth: 140, valueFormatter: (p) => toMoney(p.value) },
  ];

  return (
    <Box>
      <SectionCard title="Carga de planilla" subtitle="Seleccioná el Excel y validamos columnas y valores.">
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
            rows={preview.merged.map((r, i) => ({ id: i, ...r }))}
            columns={mergedCols}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          />
        </SectionCard>
      ) : null}

      {preview?.resumen?.length ? (
        <SectionCard title="Pedidos a Generar en vicomx" subtitle="Si está todo OK, generá los pedidos al final de la sección.">
          <DataGrid
            autoHeight
            rowHeight={38}
            sx={denseGridSx}
            rows={preview.resumen.map((r, i) => ({ id: i, ...r }))}
            columns={resumenCols}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          />

          {/* BOTÓN ABAJO */}
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={onGenerate}
              disabled={loading || !file || !!preview?.sin?.length}
              sx={denseButtonSx}
            >
              Generar en vicomx
            </Button>
          </Box>

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
