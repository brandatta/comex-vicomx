import { Paper, Box, Typography } from "@mui/material";

export default function SectionCard({ title, subtitle, actions, children }) {
  return (
    <Paper elevation={0} sx={{ p: 2.25, mb: 2 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
        <Box>
          {title && <Typography variant="h6" sx={{ fontWeight: 750 }}>{title}</Typography>}
          {subtitle && <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>{subtitle}</Typography>}
        </Box>
        {actions ? <Box>{actions}</Box> : null}
      </Box>
      <Box mt={2}>{children}</Box>
    </Paper>
  );
}
