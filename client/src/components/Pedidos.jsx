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

function money(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function intf(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
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
  const [linesRaw, setLinesRaw] = React.useState([]);
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
    const rows = index.filter((r) => r.proveedor === prov.proveedor).map((r) => {
      const estado = r.estado_texto || "(sin estado)";
      return {
        ...r,
        label: `${r.pedido} | ${estado} | ${String(r.last_ts)}`,
      };
    });
    return rows;
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

      // defaults
      const provs = (() => {
        const map = new Map();
        for (const r of iRes.data.index || []) {
          const key = `${r.proveedor} - ${r.rs || ""}`;
          if (!map.has(key)) map.set(key, { proveedor: r.proveedor, rs: r.rs || "", label: key });
        }
        return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
      })();

      if (provs.length && !provLabel) setProvLabel(provs[0].label);
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
      setLinesRaw(raw);

      // UI: ocultar TS, user_email, sap_ready, proc_sap
      const ui = raw.map((r) => ({
        ITEM: Number(r.ITEM),
        COD_ALFA: r.COD_ALFA,
        CANTIDAD: Number(r.CANTIDAD),
        PRECIO: Number(r.PRECIO),
        "RAZON SOCIAL": r.rs,
      }));
      setLinesUi(ui);

      // default estado select
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
    // al cambiar proveedor, default pedido
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

  const colsLines = [
    { field: "ITEM", headerName: "ITEM", width: 90 },
    { field: "COD_ALFA", headerName: "COD_ALFA", flex: 1, minWidth: 140 },
    {
      field: "CANTIDAD",
      headerName: "CANTIDAD",
      type: "number",
      flex: 1,
      minWidth: 140,
      editable: true,
      valueFormatter: (p) => intf(p.value),
    },
    {
      field: "PRECIO",
      headerName: "PRECIO",
      type: "number",
      flex: 1,
      minWidth: 140,
      editable: true,
      valueFormatter: (p) => money(p.value),
    },
    { field: "RAZON SOCIAL", headerName: "RAZON SOCIAL", flex: 2, minWidth: 260 },
  ];

  const trazCols = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "pedido", headerName: "PEDIDO", flex: 2, minWidth: 220 },
    { field: "estado", headerName: "ESTADO", flex: 1, minWidth: 180 },
    { field: "ts", headerName: "TS", flex: 1, minWidth: 200 },
    { field: "usr", headerName: "USR", flex: 1, minWidth: 200 },
  ];

  const totals = React.useMemo(() => {
    const imp = (linesUi || []).map((r) => Number(r.CANTIDAD) * Number(r.PRECIO));
    const qty = (linesUi || []).reduce((a, r) => a + Number(r.CANTIDAD || 0), 0);
    const st = imp.reduce((a, x) => a + x, 0);
    return { qty, st };
  }, [linesUi]);

  async function saveLines() {
    setError("");
    setInfo("");

    if (!pedidoSel) return;

    // validar > 0
    for (const r of linesUi) {
      if (!Number.isFinite(Number(r.CANTIDAD)) || !Number.isFinite(Number(r.PRECIO)) || Number(r.CANTIDAD) <= 0 || Number(r.PRECIO) <= 0) {
        setError("Valores inválidos (cantidad/precio deben ser numéricos y > 0).");
        return;
      }
    }

    try {
      await api.put(`/pedidos/${encodeURIComponent(pedidoSel)}/lines`, {
        lines: linesUi.map((r) => ({
          ITEM: Number(r.ITEM),
          CANTIDAD: Number(r.CANTIDAD),
          PRECIO: Number(r.PRECIO),
        })),
      });
      setInfo("Líneas Actualizadas.");
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
      // recargar index + pedido (para que cambie label)
      await loadBase();
      await loadPedido(pedidoSel);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error registrando estado");
    }
  }

  const prov = proveedores.find((p) => p.label === provLabel);

  return (
    <Box>
      <SectionCard
        title="Filtros"
        actions={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadBase()}>
            Refresh
          </Button>
        }
      >
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 2fr" }} gap={2}>
          <TextField
            label="Usuario"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <TextField
            select
            label="PROVEEDOR"
            value={provLabel}
            onChange={(e) => setProvLabel(e.target.value)}
          >
            {proveedores.map((p) => (
              <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Box mt={2}>
          <TextField
            fullWidth
            select
            label="PEDIDO"
            value={pedidoLabel}
            onChange={(e) => setPedidoLabel(e.target.value)}
            disabled={!pedidosDelProveedor.length}
          >
            {pedidosDelProveedor.map((p) => (
              <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Box mt={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {info ? <Alert severity="info">{info}</Alert> : null}
          {prov ? (
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
              Proveedor seleccionado: <b>{prov.proveedor} - {prov.rs}</b>
            </Typography>
          ) : null}
        </Box>
      </SectionCard>

      <Divider sx={{ my: 2 }} />

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 800 }}>🧾 Detalle / Trazabilidad del pedido</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {!traz.length ? (
            <Alert severity="info">Este pedido no tiene trazabilidad registrada en vicomx</Alert>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <b>Estado Actual:</b> <code>{traz[traz.length - 1].estado}</code><br/>
                <b>Último cambio:</b> {traz[traz.length - 1].ts}<br/>
                <b>Usuario:</b> {traz[traz.length - 1].usr}
              </Typography>
              <DataGrid
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

      <Divider sx={{ my: 2 }} />

      <SectionCard
        title="Líneas del pedido"
        actions={
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadPedido(pedidoSel)} disabled={!pedidoSel}>
              Refresh detalle
            </Button>
            <Button variant="contained" onClick={saveLines} disabled={!pedidoSel}>
              Guardar Modificaciones
            </Button>
          </Box>
        }
      >
        <DataGrid
          autoHeight
          rows={linesUi.map((r) => ({ id: r.ITEM, ...r }))}
          columns={colsLines}
          disableRowSelectionOnClick
          processRowUpdate={(newRow) => {
            // mantener en state
            setLinesUi((prev) => prev.map((r) => (r.ITEM === newRow.ITEM ? newRow : r)));
            return newRow;
          }}
          onProcessRowUpdateError={() => {}}
          pageSizeOptions={[50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 50, page: 0 } } }}
        />

        <Box mt={2}>
          <MetricsRow
            leftLabel="Cantidad Total"
            leftValue={intf(totals.qty)}
            rightLabel="ST USD"
            rightValue={money(totals.st)}
          />
        </Box>
      </SectionCard>

      <SectionCard title="Estado del pedido" subtitle="Seleccioná el nuevo estado y registralo.">
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "3fr 1fr" }} gap={2} alignItems="end">
          <TextField
            select
            label="Seleccioná nuevo estado"
            value={newEstado}
            onChange={(e) => setNewEstado(e.target.value)}
            disabled={!estados.length}
          >
            {estados.map((e) => (
              <MenuItem key={e.id} value={e.estado}>{e.estado}</MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={registrarEstado} disabled={!pedidoSel}>
            Registrar cambio de estado
          </Button>
        </Box>
      </SectionCard>
    </Box>
  );
}
