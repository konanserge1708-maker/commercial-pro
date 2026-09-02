import { readFileSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";
import { randomBytes } from "crypto";

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
};

function generatePromoCode(name) {
  const prefix = (name || "AGT").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "AGT";
  const suffix = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `${prefix}${suffix}`;
}

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME || "commercial", table, column]
  );
  return Number(rows[0].count) > 0;
}

async function tableExists(connection, table) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [process.env.DB_NAME || "commercial", table]
  );
  return Number(rows[0].count) > 0;
}

async function main() {
  console.log("Migration prospects & codes promo...");
  const connection = await mysql.createConnection(config);
  await connection.changeUser({ database: process.env.DB_NAME || "commercial" });

  if (!(await columnExists(connection, "users", "promo_code"))) {
    await connection.execute(
      "ALTER TABLE users ADD COLUMN promo_code VARCHAR(20) NULL UNIQUE AFTER name"
    );
    console.log("Colonne promo_code ajoutée.");
  }

  if (!(await tableExists(connection, "prospects"))) {
    await connection.execute(`
      CREATE TABLE prospects (
        id VARCHAR(36) PRIMARY KEY,
        agent_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        payment_ref VARCHAR(100) NULL,
        reward_amount DECIMAL(15, 2) NOT NULL DEFAULT 250,
        status ENUM('qualified') NOT NULL DEFAULT 'qualified',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uk_payment_ref (payment_ref),
        UNIQUE KEY uk_agent_prospect_phone (agent_id, phone),
        INDEX idx_prospects_agent (agent_id),
        INDEX idx_prospects_created (created_at)
      )
    `);
    console.log("Table prospects créée.");
  }

  if (!(await tableExists(connection, "settings"))) {
    await connection.execute(`
      CREATE TABLE settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Table settings créée.");
  }

  await connection.execute(
    "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('prospect_reward_amount', '250')"
  );
  await connection.execute(
    "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('api_key', ?)",
    [process.env.API_KEY || "commercial-api-key-change-me"]
  );

  try {
    await connection.execute(
      "ALTER TABLE activities MODIFY COLUMN type ENUM('commission', 'withdrawal', 'bonus', 'prospect') NOT NULL"
    );
    console.log("Type activity étendu.");
  } catch {
    /* déjà migré */
  }

  const [agents] = await connection.execute(
    "SELECT id, name, promo_code FROM users WHERE role = 'agent'"
  );

  for (const agent of agents) {
    if (!agent.promo_code) {
      let code = generatePromoCode(agent.name);
      let attempts = 0;
      while (attempts < 5) {
        try {
          await connection.execute("UPDATE users SET promo_code = ? WHERE id = ?", [
            code,
            agent.id,
          ]);
          console.log(`Code promo pour ${agent.name}: ${code}`);
          break;
        } catch {
          code = generatePromoCode(agent.name);
          attempts++;
        }
      }
    }
  }

  await connection.end();
  console.log("Migration terminée !");
}

main().catch((err) => {
  console.error("Erreur migration :", err.message);
  process.exit(1);
});
