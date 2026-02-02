import { Paper, Box, Typography } from "@mui/material";

function Metric({ label, value }) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.25 }}>{value}</Typography>
    </Paper>
  );
}

export default function MetricsRow({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
      <Metric label={leftLabel} value={leftValue} />
      <Metric label={rightLabel} value={rightValue} />
    </Box>
  );
}
