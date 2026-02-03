import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import NuevoPedido from "./pages/NuevoPedido.jsx";
import Pedidos from "./pages/Pedidos.jsx";

export default function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <Box
      sx={{
        maxWidth: 1120,
        mx: "auto",
        px: 2,
        pb: 6,
        pt: 4,   // ⬅️ más espacio arriba
      }}
    >
      <Typography
        variant="h5"
        sx={{
          mb: 1,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        Pedidos COMEX
      </Typography>

      <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 1.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": {
              textTransform: "none",
              minHeight: 36,
              py: 0.5,
              fontSize: 13,
              fontWeight: 600,
              color: "text.secondary",
            },
            "& .Mui-selected": {
              color: "primary.main",
              fontWeight: 800,
            },
          }}
        >
          <Tab icon={<span>➕</span>} iconPosition="start" label="Nuevo Pedido" />
          <Tab icon={<span>📦</span>} iconPosition="start" label="Pedidos" />
        </Tabs>
      </Box>

      <Box mt={1.5}>
        {tab === 0 ? <NuevoPedido /> : <Pedidos />}
      </Box>
    </Box>
  );
}
