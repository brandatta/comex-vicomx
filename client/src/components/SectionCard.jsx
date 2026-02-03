import { Paper, Box, Typography, Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function SectionCard({ title, subtitle, footer, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        backgroundColor: "#ffffff",
      }}
    >
      {(title || subtitle) && (
        <Box mb={1.25} sx={{ overflow: "visible" }}>
          {(title || subtitle) && (
            <Box display="flex" alignItems="center" gap={0.5} sx={{ overflow: "visible" }}>
              {title ? (
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
              ) : null}

              {subtitle ? (
                <Tooltip title={subtitle} placement="right">
                  <IconButton
                    size="small"
                    sx={{
                      p: 0.25,
                      color: "text.secondary",
                      "&:hover": { backgroundColor: "transparent" },
                    }}
                    aria-label="Información"
                  >
                    <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
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

