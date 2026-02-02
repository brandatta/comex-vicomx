import React from "react";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";
import NuevoPedido from "./pages/NuevoPedido.jsx";
import Pedidos from "./pages/Pedidos.jsx";

export default function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4">Pedidos COMEX</Typography>

      <Box mt={2}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="➕ Nuevo Pedido" />
          <Tab label="📦 Pedidos" />
        </Tabs>
      </Box>

      <Box mt={2}>
        {tab === 0 ? <NuevoPedido /> : <Pedidos />}
      </Box>
    </Container>
  );
}
