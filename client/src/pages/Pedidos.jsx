import React from "react";
import {
  Box,
  Button,
  TextField,
  Alert,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import SectionCard from "../components/SectionCard.jsx";
import MetricsRow from "../components/MetricsRow.jsx";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../api.js";

/**
 * Parse numérico robusto:
 * - Acepta "1.234,56" (EU) y "1,234.56" (US) y números puros
 * - Ignora símbolos/monedas
 * - Devuelve null si no es parseable
 */
function parseNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  let s = String(v).trim();
  if (!s) return null;

  // deja dígitos, signo, coma y punto
  s = s.replace(/[^\d.,-]/g, "");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // si tiene ambos, el separador decimal es el último de los dos
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    const decIsComma = lastComma > lastDot;

    if (decIsComma) {
      // miles "." -> remove, decimal "," -> "."
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // miles "," -> remove, decimal "." -> "."
      s = s.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    // sólo coma: si parece decimal (1-3 decimales) => decimal, sino miles
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 3) {
      s = s.replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else {
    // sólo punto o ninguno: mantenemos el punto como decimal
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function money(n) {
  const x = parseNum(n);
  return x === null
    ? "—"
    : x.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

/**
 * Cantidad:
 * - NO redondea a entero
 * - Muestra hasta 3 decimales, y si es entero, muestra 0 decimales
 */
function qtyf(n) {
  const x = parseNum(n);
  if (x === null) return "—";
  const isInt = Math.abs(x - Math.round(x)) < 1e-9;
  return x.toLocaleString(undefined, {
    minimumFractionDigits: isInt ? 0 : 0,
    maximumFractionDigits: isInt ? 0 : 3,
  });
}

export default function Pedidos() {
  const [user, setUser] = React.useState("");
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");

  const [estados, setEstados] = React.useState([]);
  const [index, setIndex] = React.useState([]);

  const [provLabel, setProvLabel] = React.useState("");
  const [pedidoLabel, setPedidoLabel] = React.useState("");

  const [traz, setTraz] = React.useState([]);
  const [linesUi, setLinesUi] = React.useState([]);

  const [newEstado, setNewEstado] = React.useState("");

  const proveedores = React.useMemo(() => {
    const map = new Map();
    for (const r of index) {
      const key = `${r.proveedor} - ${r.rs || ""}`;
      if (!map.has(key)) map.set(key, { proveedor: r.proveedor, rs: r.rs || "", label: key });
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [index]);

  const pedidosDelProveedor = React.useMemo(() => {
    const prov = proveedores.find((p) => p.label === provLabel);
    if (!prov) return [];
    return index
      .filter((r) => r.proveedor === prov.proveedor)
      .map((r) => {
        const estado = r.estado_texto || "(sin estado)";
        return {
          ...r,
          label: `${r.pedido} | ${estado} | ${String(r.last_ts)}`,
        };
      });
  }, [index, provLabel, proveedores]);

  const pedidoSel = React.useMemo(() => {
    const row = pedidosDelProveedor.find((p) => p.label === pedidoLabel);
    return row?.pedido || "";
  }, [pedidoLabel, pedidosDelProveedor]);

  const estadoActual = React.useMemo(() => {
    const row = pedidosDelProveedor.find((p) => p.pedido === pedidoSel);
    const e = row?.estado_texto || null;
    return e === "(sin estado)" ? null : e;
  }, [pedidoSel, pedidosDelProveedor]);

  async function loadBase() {
    setError("");
    setInfo("");
    try {
      const [eRes, iRes] = await Promise.all([
        api.get("/estados"),
        api.get("/pedidos/index", { params: { limit: 2000 } }),
      ]);

      const estadosRows = eRes.data.estados || [];
      if (!estadosRows.length) {
        setError("La tabla comex_estados no tiene registros.");
        return;
      }
      setEstados(estadosRows);
      setIndex(iRes.data.index || []);

      // default proveedor
      if ((iRes.data.index || []).length && !provLabel) {
        const map = new Map();
        for (const r of iRes.data.index || []) {
          const key = `${r.proveedor} - ${r.rs || ""}`;
          if (!map.has(key)) map.set(key, { proveedor: r.proveedor, rs: r.rs || "", label: key });
        }
        const provs = [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
        if (provs.length) setProvLabel(provs[0].label);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando datos");
    }
  }

  async function loadPedido(pedido) {
    if (!pedido) return;
    setError("");
    setInfo("");
    try {
      const [tRes, lRes] = await Promise.all([
        api.get(`/pedidos/${encodeURIComponent(pedido)}/trazabilidad`),
        api.get(`/pedidos/${encodeURIComponent(pedido)}/lines`),
      ]);

      const trazRows = tRes.data.trazabilidad || [];
      setTraz(trazRows);

      const raw = lRes.data.lines || [];
      const ui = raw.map((r) => ({
        ITEM: Number(r.ITEM),
        COD_ALFA: r.COD_ALFA,
        // guardamos como number (si parsea) para que el grid no “invente” 0
        CANTIDAD: parseNum(r.CANTIDAD),
        PRECIO: parseNum(r.PRECIO),
        "RAZON SOCIAL": r.rs,
      }));
      setLinesUi(ui);

      const estadosTextos = (estados || []).map((x) => x.estado);
      const def = estadoActual && estadosTextos.includes(estadoActual) ? estadoActual : estadosTextos[0];
      setNewEstado(def);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando pedido");
    }
  }

  React.useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!pedidosDelProveedor.length) {
      setPedidoLabel("");
      return;
    }
    if (!pedidoLabel) setPedidoLabel(pedidosDelProveedor[0].label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provLabel, pedidosDelProveedor.length]);

  React.useEffect(() => {
    if (pedidoSel) loadPedido(pedidoSel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoSel]);

  // ✅ CLAVE: sacamos type:"number" y usamos valueGetter/valueParser para que no caiga a 0
  const colsLines = [
    { field: "ITEM", headerName: "ITEM", width: 80 },
    { field: "COD_ALFA", headerName: "COD_ALFA", flex: 1, minWidth: 140 },
    {
      field: "CANTIDAD",
      headerName: "CANTIDAD",
      flex: 1,
      minWidth: 120,
      editable: true,
      valueGetter: (params) => parseNum(params.row?.CANTIDAD),
      valueParser: (value) => parseNum(value),
      valueFormatter: (p) => qtyf(p.value),
    },
    {
      field: "PRECIO",
      headerName: "PRECIO",
      flex: 1,
      minWidth: 120,
      editable: true,
      valueGetter: (params) => parseNum(params.row?.PRECIO),
      valueParser: (value) => parseNum(value),
      valueFormatter: (p) => money(p.value),
    },
    { field: "RAZON SOCIAL", headerName: "RAZON SOCIAL", flex: 2, minWidth: 220 },
  ];

  const trazCols = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "pedido", headerName: "PEDIDO", flex: 2, minWidth: 220 },
    { field: "estado", headerName: "ESTADO", flex: 1, minWidth: 160 },
    { field: "ts", headerName: "TS", flex: 1, minWidth: 180 },
    { field: "usr", headerName: "USR", flex: 1, minWidth: 160 },
  ];

  const totals = React.useMemo(() => {
    const qty = (linesUi || []).reduce((a, r) => a + (parseNum(r.CANTIDAD) ?? 0), 0);
    const st = (linesUi || []).reduce((a, r) => {
      const c = parseNum(r.CANTIDAD) ?? 0;
      const p = parseNum(r.PRECIO) ?? 0;
      return a + c * p;
    }, 0);
    return { qty, st };
  }, [linesUi]);

  async function saveLines() {
    setError("");
    setInfo("");
    if (!pedidoSel) return;

    for (const r of linesUi) {
      const c = parseNum(r.CANTIDAD);
      const p = parseNum(r.PRECIO);

      if (!Number.isFinite(c) || !Number.isFinite(p) || c <= 0 || p <= 0) {
        setError("Valores inválidos (cantidad/precio deben ser numéricos y > 0).");
        return;
      }
    }

    try {
      await api.put(`/pedidos/${encodeURIComponent(pedidoSel)}/lines`, {
        lines: linesUi.map((r) => ({
          ITEM: Number(r.ITEM),
          CANTIDAD: parseNum(r.CANTIDAD),
          PRECIO: parseNum(r.PRECIO),
        })),
      });
      setInfo("Líneas actualizadas.");
      await loadPedido(pedidoSel);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error guardando líneas");
    }
  }

  async function registrarEstado() {
    setError("");
    setInfo("");
    if (!pedidoSel) return;

    if (!user.trim()) {
      setError("Ingresá el usuario para registrar el cambio de estado.");
      return;
    }
    if (estadoActual === newEstado) {
      setInfo("El pedido ya está en ese estado. No se registró un nuevo movimiento.");
      return;
    }

    try {
      await api.post(`/pedidos/${encodeURIComponent(pedidoSel)}/estado`, {
        estado_texto: newEstado,
        usr: user.trim(),
      });
      setInfo(`'${newEstado}' registrado en vicomx`);
      await loadBase();
      await loadPedido(pedidoSel);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error registrando estado");
    }
  }

  const prov = proveedores.find((p) => p.label === provLabel);

  const gridSx = {
    "& .MuiDataGrid-columnHeaders": { minHeight: 36, maxHeight: 36 },
    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, fontSize: 12 },
    "& .MuiDataGrid-cell": { py: 0.5, fontSize: 12 },
    "& .MuiDataGrid-row": { maxHeight: 36 },
  };

  return (
    <Box>
      <SectionCard
        title="Filtros"
        subtitle="Seleccioná proveedor y pedido."
        footer={
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadBase()}>
            Refrescar
          </Button>
        }
      >
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 2fr" }} gap={1.25}>
          <TextField size="small" label="Usuario" value={user} onChange={(e) => setUser(e.target.value)} />
          <TextField
            size="small"
            select
            label="PROVEEDOR"
            value={provLabel}
            onChange={(e) => setProvLabel(e.target.value)}
          >
            {proveedores.map((p) => (
              <MenuItem key={p.label} value={p.label}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box mt={1.25}>
          <TextField
            size="small"
            fullWidth
            select
            label="PEDIDO"
            value={pedidoLabel}
            onChange={(e) => setPedidoLabel(e.target.value)}
            disabled={!pedidosDelProveedor.length}
          >
            {pedidosDelProveedor.map((p) => (
              <MenuItem key={p.label} value={p.label}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box mt={1.25}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {info ? <Alert severity="info">{info}</Alert> : null}
          {prov ? (
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.75 }}>
              Proveedor seleccionado:{" "}
              <b>
                {prov.proveedor} - {prov.rs}
              </b>
            </Typography>
          ) : null}
        </Box>
      </SectionCard>

      <Divider sx={{ my: 1.5 }} />

      <Accordion defaultExpanded sx={{ border: "1px solid #e5e7eb", borderRadius: 2, boxShadow: "none" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 13 }}>🧾 Detalle / Trazabilidad del pedido</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {!traz.length ? (
            <Alert severity="info">Este pedido no tiene trazabilidad registrada en vicomx</Alert>
          ) : (
            <>
              <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
                <b>Estado actual:</b> <code>{traz[traz.length - 1].estado}</code>{"  "}·{"  "}
                <b>Último cambio:</b> {traz[traz.length - 1].ts}{"  "}·{"  "}
                <b>Usuario:</b> {traz[traz.length - 1].usr}
              </Typography>

              <DataGrid
                sx={gridSx}
                autoHeight
                rows={traz.map((r, i) => ({ id: i, ...r }))}
                columns={trazCols}
                pageSizeOptions={[25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
              />
            </>
          )}
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 1.5 }} />

      <SectionCard
        title="Líneas del pedido"
        subtitle="Podés editar CANTIDAD y PRECIO (doble clic en la celda). Luego guardá los cambios."
        footer={
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => loadPedido(pedidoSel)}
              disabled={!pedidoSel}
            >
              Refrescar detalle
            </Button>
            <Button size="small" variant="contained" onClick={saveLines} disabled={!pedidoSel}>
              Guardar cambios
            </Button>
          </>
        }
      >
        <DataGrid
          sx={gridSx}
          autoHeight
          rows={linesUi.map((r) => ({ id: r.ITEM, ...r }))}
          columns={colsLines}
          disableRowSelectionOnClick
          processRowUpdate={(newRow) => {
            setLinesUi((prev) => prev.map((r) => (r.ITEM === newRow.ITEM ? newRow : r)));
            return newRow;
          }}
          onProcessRowUpdateError={() => {}}
          pageSizeOptions={[50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 50, page: 0 } } }}
        />

        <Box mt={1.25}>
          <MetricsRow leftLabel="Cantidad Total" leftValue={qtyf(totals.qty)} rightLabel="ST USD" rightValue={money(totals.st)} />
        </Box>
      </SectionCard>

      <SectionCard
        title="Estado del pedido"
        subtitle="Seleccioná el nuevo estado."
        footer={
          <Button size="small" variant="outlined" onClick={registrarEstado} disabled={!pedidoSel}>
            Registrar cambio de estado
          </Button>
        }
      >
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "3fr 1fr" }} gap={1.25} alignItems="end">
          <TextField
            size="small"
            select
            label="Nuevo estado"
            value={newEstado}
            onChange={(e) => setNewEstado(e.target.value)}
            disabled={!estados.length}
          >
            {estados.map((e) => (
              <MenuItem key={e.id} value={e.estado}>
                {e.estado}
              </MenuItem>
            ))}
          </TextField>

          <TextField size="small" disabled label="Estado actual" value={estadoActual || "(sin estado)"} />
        </Box>
      </SectionCard>
    </Box>
  );
}
