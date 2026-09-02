import { readFileSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
};

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

async function main() {
  console.log("Connexion à MySQL (WAMP)...");

  const connection = await mysql.createConnection(config);

  const schemaPath = join(process.cwd(), "database", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");

  console.log("Création de la base et des tables...");
  await connection.query(schema);

  await connection.changeUser({ database: process.env.DB_NAME || "commercial" });

  const [adminRows] = await connection.execute(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
  );

  if (Number(adminRows[0].count) === 0) {
    const pinHash = bcrypt.hashSync("0000", 10);
    await connection.execute(
      `INSERT INTO users (id, phone, pin_hash, name, role, balance, monthly_target, monthly_achieved)
       VALUES (?, '0000000000', ?, 'Administrateur', 'admin', 0, 0, 0)`,
      [generateId("admin"), pinHash]
    );
    console.log("Compte admin créé : 0000000000 / PIN 0000");
  } else {
    console.log("Compte admin déjà présent.");
  }

  await connection.end();
  console.log("Base de données initialisée avec succès !");
}

main().catch((err) => {
  console.error("Erreur d'initialisation MySQL :", err.message);
  console.error("\nVérifiez que WAMP/MySQL est démarré et que les identifiants dans .env.local sont corrects.");
  process.exit(1);
});
