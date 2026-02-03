import { Paper, Box, Typography } from "@mui/material";

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
      {(title || actions) && (
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          gap={2}
          mb={2}
        >
          <Box>
            {title && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.25 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions ? <Box>{actions}</Box> : null}
        </Box>
      )}

      {children}
    </Paper>
  );
}
