import mysql from "mysql2/promise";

export function makePool() {
  const {
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    MYSQL_PORT,
  } = process.env;

  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error("Faltan credenciales MySQL (env vars).");
  }

  return mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    port: MYSQL_PORT ? Number(MYSQL_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    // importante: no convertir DATETIME a Date automáticamente
    dateStrings: true,
    charset: "utf8mb4",
  });
}
