import React from "react";
import { Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function InfoTip({ title }) {
  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton
        size="small"
        sx={{
          ml: 0.75,
          p: 0.25,
          color: "text.secondary",
          "&:hover": { color: "text.primary" },
        }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
