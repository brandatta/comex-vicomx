export const SQL = {
  load_articulos: (n) => `
    SELECT cod_alfa, proveedor, nombre
    FROM articulos_comex
    WHERE cod_alfa IN (${Array.from({ length: n }).map(() => "?").join(",")})
  `,

  get_estados: `
    SELECT id, estado FROM comex_estados ORDER BY id
  `,

  get_estado_texto_por_id: `
    SELECT estado FROM comex_estados WHERE id = ? LIMIT 1
  `,

  insert_pedido_meta: `
    INSERT INTO pedidos_meta_id (pedido, estado, ts, usr)
    VALUES (?, ?, ?, ?)
  `,

  get_trazabilidad: `
    SELECT id, pedido, estado, ts, usr
    FROM pedidos_meta_id
    WHERE pedido = ?
    ORDER BY ts ASC, id ASC
  `,

  get_pedidos_index: `
    SELECT
      p.NUMERO AS pedido,
      p.cliente AS proveedor,
      p.rs,
      p.last_ts,
      pm.estado AS estado_texto
    FROM (
      SELECT
        NUMERO,
        MAX(CLIENTE) AS cliente,
        MAX(rs) AS rs,
        MAX(TS) AS last_ts
      FROM sap_comex
      WHERE NUMERO IS NOT NULL AND NUMERO <> ''
      GROUP BY NUMERO
    ) p
    LEFT JOIN (
      SELECT x.pedido, x.estado, x.ts
      FROM pedidos_meta_id x
      INNER JOIN (
        SELECT pedido, MAX(ts) AS max_ts
        FROM pedidos_meta_id
        GROUP BY pedido
      ) y
      ON x.pedido = y.pedido AND x.ts = y.max_ts
    ) pm
      ON pm.pedido = p.NUMERO
    ORDER BY p.last_ts DESC
    LIMIT ?
  `,

  insert_lines: `
    INSERT INTO sap_comex
      (NUMERO, CLIENTE, COD_ALFA, CANTIDAD, PRECIO, rs,
       ITEM, app, proc_sap, sap_ready, user_email, TS)
    VALUES
      (?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      CANTIDAD=VALUES(CANTIDAD),
      PRECIO=VALUES(PRECIO),
      rs=VALUES(rs),
      user_email=VALUES(user_email),
      TS=VALUES(TS),
      proc_sap=0,
      sap_ready='N'
  `,

  load_pedido_lines: `
    SELECT
      ITEM, COD_ALFA, CANTIDAD, PRECIO, rs, TS, user_email, sap_ready, proc_sap
    FROM sap_comex
    WHERE NUMERO = ?
    ORDER BY ITEM ASC
  `,

  update_pedido_line: `
    UPDATE sap_comex
    SET CANTIDAD = ?,
        PRECIO   = ?,
        TS       = ?
    WHERE NUMERO = ? AND ITEM = ?
  `,
};
