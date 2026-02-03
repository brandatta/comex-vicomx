import { Paper, Box, Typography } from "@mui/material";

function Metric({ label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        backgroundColor: "#ffffff",
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", textTransform: "uppercase", lineHeight: 1.1 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          mt: 0.25,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

export default function MetricsRow({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={1}>
      <Metric label={leftLabel} value={leftValue} />
      <Metric label={rightLabel} value={rightValue} />
    </Box>
  );
}
