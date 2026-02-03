import { Paper, Box, Typography } from "@mui/material";

function Metric({ label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        backgroundColor: "#ffffff",
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", textTransform: "uppercase" }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          mt: 0.25,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

export default function MetricsRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}) {
  return (
    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
      <Metric label={leftLabel} value={leftValue} />
      <Metric label={rightLabel} value={rightValue} />
    </Box>
  );
}
