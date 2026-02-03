import { Paper, Box, Typography } from "@mui/material";
import InfoTip from "./InfoTip.jsx";

export default function SectionCard({ title, subtitle, actions, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        backgroundColor: "#ffffff",
      }}
    >
      {(title || actions || subtitle) && (
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          gap={2}
          mb={2}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {title && (
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}
              >
                {title}
              </Typography>
            )}

            {subtitle ? <InfoTip title={subtitle} /> : null}
          </Box>

          {actions ? <Box>{actions}</Box> : null}
        </Box>
      )}

      {children}
    </Paper>
  );
}
