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
    h1: { fontWeight: 800, fontSize: "30px" }, // App.jsx igual lo overridea por responsive
    h4: { fontWeight: 700 },
    body2: { fontSize: "0.90rem" },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { border: "1px solid #eef2f7" } } },
    MuiButton: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiInputBase: {
      styleOverrides: {
        root: { borderRadius: 10 },
        input: { paddingTop: 8, paddingBottom: 8 }, // baja altura visual
      },
    },
    MuiTabs: { styleOverrides: { root: { minHeight: 40 } } },
    MuiTab: { styleOverrides: { root: { minHeight: 40, paddingTop: 6, paddingBottom: 6 } } },
  },
});
