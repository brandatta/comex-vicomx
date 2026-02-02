import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    background: { default: "#ffffff", paper: "#ffffff" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`,
    h4: { fontWeight: 700 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { border: "1px solid #eef2f7" } } },
    MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
  },
});
