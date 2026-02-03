import { Paper, Box, Typography, Divider } from "@mui/material";

export default function SectionCard({
  title,
  subtitle,
  actions,   // ahora lo usamos como FOOTER (abajo)
  children,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1.5,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        backgroundColor: "#ffffff",
      }}
    >
      {(title || subtitle) ? (
        <Box mb={1}>
          {title ? (
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
              }}
            >
              {title}
            </Typography>
          ) : null}

          {subtitle ? (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mt: 0.25, lineHeight: 1.2 }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      {children}

      {actions ? (
        <>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
            {actions}
          </Box>
        </>
      ) : null}
    </Paper>
  );
}
