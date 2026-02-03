import { Paper, Box, Typography } from "@mui/material";

export default function SectionCard({ title, subtitle, footer, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,            // más compacto
        mb: 2,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        backgroundColor: "#ffffff",
      }}
    >
      {(title || subtitle) && (
        <Box mb={1.25}>
          {title && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.01em",
                fontSize: 14,
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.25, fontSize: 12, lineHeight: 1.35 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      {children}

      {footer ? (
        <Box mt={1.25} display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
          {footer}
        </Box>
      ) : null}
    </Paper>
  );
}
