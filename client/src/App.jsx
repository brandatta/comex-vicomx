import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import NuevoPedido from "./pages/NuevoPedido.jsx";
import Pedidos from "./pages/Pedidos.jsx";

export default function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ maxWidth: 1120, mx: "auto", px: 2, pb: 8 }}>
      {/* Header (más chico) */}
      <Typography
        variant="h1"
        sx={{
          mb: 1,
          fontSize: { xs: 22, sm: 26, md: 30 },
          lineHeight: 1.2,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        Pedidos COMEX
      </Typography>

      {/* Tabs con underline */}
      <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              textTransform: "none",
              minHeight: 40,
              py: 0.5,
              fontWeight: 600,
              color: "text.secondary",
            },
            "& .Mui-selected": {
              color: "primary.main",
              fontWeight: 700,
            },
          }}
        >
          <Tab icon={<span>➕</span>} iconPosition="start" label="Nuevo Pedido" />
          <Tab icon={<span>📦</span>} iconPosition="start" label="Pedidos" />
        </Tabs>
      </Box>

      {/* Contenido */}
      <Box mt={2}>{tab === 0 ? <NuevoPedido /> : <Pedidos />}</Box>
    </Box>
  );
}
