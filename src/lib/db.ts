import type { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";
import { getPool } from "./mysql";
import type { Activity, Prospect, User, WeeklyPerformance, Withdrawal } from "./types";
import { generateId, generatePromoCode } from "./utils";

const WEEK_DAYS = [
  { label: "L", order: 0 },
  { label: "M", order: 1 },
  { label: "M", order: 2 },
  { label: "J", order: 3 },
  { label: "V", order: 4 },
  { label: "S", order: 5 },
  { label: "D", order: 6 },
];

type UserRow = RowDataPacket & {
  id: string;
  phone: string;
  pin_hash: string;
  name: string;
  promo_code: string | null;
  role: "admin" | "agent";
  balance: number;
  monthly_target: number;
  monthly_achieved: number;
  created_at: Date;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    phone: row.phone,
    pinHash: row.pin_hash,
    name: row.name,
    promoCode: row.promo_code,
    role: row.role,
    balance: Number(row.balance),
    monthlyTarget: Number(row.monthly_target),
    monthlyAchieved: Number(row.monthly_achieved),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getUserByPromoCode(code: string): Promise<User | undefined> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE promo_code = ? AND role = 'agent' LIMIT 1",
    [code.toUpperCase()]
  );
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function getUserByPhone(phone: string): Promise<User | undefined> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE phone = ? LIMIT 1",
    [phone]
  );
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function getAllAgents(): Promise<User[]> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE role = 'agent' ORDER BY created_at DESC"
  );
  return rows.map(mapUser);
}

export async function createUser(user: User): Promise<User> {
  const pool = getPool();
  const existing = await getUserByPhone(user.phone);
  if (existing) throw new Error("Ce numéro est déjà utilisé");

  let promoCode = user.promoCode;
  if (user.role === "agent" && !promoCode) {
    promoCode = await generateUniquePromoCode();
  }

  await pool.execute(
    `INSERT INTO users (id, phone, pin_hash, name, promo_code, role, balance, monthly_target, monthly_achieved, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.phone,
      user.pinHash,
      user.name,
      promoCode ?? null,
      user.role,
      user.balance,
      user.monthlyTarget,
      user.monthlyAchieved,
      user.createdAt,
    ]
  );
  return { ...user, promoCode: promoCode ?? null };
}

async function generateUniquePromoCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generatePromoCode();
    const existing = await getUserByPromoCode(code);
    if (!existing) return code;
  }
  // Filet de sécurité si jamais les 20 tirages aléatoires collisionnent tous
  // (très improbable avec peu d'agents, mais on ne bloque jamais la création).
  return `${generatePromoCode()}${Math.floor(Math.random() * 10)}`;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const pool = getPool();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.phone !== undefined) {
    fields.push("phone = ?");
    values.push(updates.phone);
  }
  if (updates.pinHash !== undefined) {
    fields.push("pin_hash = ?");
    values.push(updates.pinHash);
  }
  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.role !== undefined) {
    fields.push("role = ?");
    values.push(updates.role);
  }
  if (updates.balance !== undefined) {
    fields.push("balance = ?");
    values.push(updates.balance);
  }
  if (updates.monthlyTarget !== undefined) {
    fields.push("monthly_target = ?");
    values.push(updates.monthlyTarget);
  }
  if (updates.monthlyAchieved !== undefined) {
    fields.push("monthly_achieved = ?");
    values.push(updates.monthlyAchieved);
  }

  if (fields.length === 0) {
    const user = await getUserById(id);
    if (!user) throw new Error("Utilisateur introuvable");
    return user;
  }

  values.push(id);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) throw new Error("Utilisateur introuvable");

  const user = await getUserById(id);
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

export async function getWeeklyPerformance(userId: string): Promise<WeeklyPerformance[]> {
  const pool = getPool();
  type PerfRow = RowDataPacket & {
    id: string;
    user_id: string;
    day_label: string;
    day_order: number;
    amount: number;
  };

  const [rows] = await pool.execute<PerfRow[]>(
    "SELECT * FROM weekly_performance WHERE user_id = ? ORDER BY day_order",
    [userId]
  );

  if (rows.length === 0) {
    return WEEK_DAYS.map(({ label, order }) => ({
      id: `wp-${userId}-${order}`,
      userId,
      day: label,
      amount: 0,
    }));
  }

  return WEEK_DAYS.map(({ label, order }) => {
    const found = rows.find((r) => r.day_order === order);
    return found
      ? {
          id: found.id,
          userId: found.user_id,
          day: found.day_label,
          amount: Number(found.amount),
        }
      : { id: `wp-${userId}-${order}`, userId, day: label, amount: 0 };
  });
}

export async function setWeeklyPerformance(
  userId: string,
  performances: { day: string; amount: number }[]
): Promise<void> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("DELETE FROM weekly_performance WHERE user_id = ?", [userId]);

    for (let i = 0; i < performances.length; i++) {
      const p = performances[i];
      const dayMeta = WEEK_DAYS[i] ?? { label: p.day, order: i };
      await conn.execute(
        `INSERT INTO weekly_performance (id, user_id, day_label, day_order, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [generateId("wp"), userId, dayMeta.label, dayMeta.order, p.amount]
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<Withdrawal> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO withdrawals (id, user_id, amount, status, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      withdrawal.id,
      withdrawal.userId,
      withdrawal.amount,
      withdrawal.status,
      withdrawal.createdAt,
    ]
  );
  return withdrawal;
}

export async function getWithdrawalsByUser(userId: string): Promise<Withdrawal[]> {
  const pool = getPool();
  type WdRow = RowDataPacket & {
    id: string;
    user_id: string;
    amount: number;
    status: Withdrawal["status"];
    created_at: Date;
  };

  const [rows] = await pool.execute<WdRow[]>(
    "SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    amount: Number(r.amount),
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function getAllWithdrawals(): Promise<Withdrawal[]> {
  const pool = getPool();
  type WdRow = RowDataPacket & {
    id: string;
    user_id: string;
    amount: number;
    status: Withdrawal["status"];
    created_at: Date;
  };

  const [rows] = await pool.execute<WdRow[]>(
    "SELECT * FROM withdrawals ORDER BY created_at DESC"
  );

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    amount: Number(r.amount),
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function addActivity(activity: Activity): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO activities (id, user_id, type, label, amount, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      activity.id,
      activity.userId,
      activity.type,
      activity.label,
      activity.amount,
      activity.createdAt,
    ]
  );
}

export async function getActivitiesByUser(userId: string): Promise<Activity[]> {
  const pool = getPool();
  type ActRow = RowDataPacket & {
    id: string;
    user_id: string;
    type: Activity["type"];
    label: string;
    amount: number;
    created_at: Date;
  };

  const [rows] = await pool.execute<ActRow[]>(
    "SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
    [userId]
  );

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    label: r.label,
    amount: Number(r.amount),
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

/** Retrait : débite immédiatement, statut en attente jusqu'à validation admin */
export async function processWithdrawal(
  userId: string,
  amount: number,
  withdrawalId: string,
  activityId: string
): Promise<Withdrawal> {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [userRows] = await conn.execute<UserRow[]>(
      "SELECT * FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    const user = userRows[0];
    if (!user) throw new Error("Utilisateur introuvable");
    if (Number(user.balance) < amount) throw new Error("Solde insuffisant");

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await conn.execute("UPDATE users SET balance = balance - ? WHERE id = ?", [
      amount,
      userId,
    ]);

    await conn.execute(
      `INSERT INTO withdrawals (id, user_id, amount, status, created_at)
       VALUES (?, ?, ?, 'pending', ?)`,
      [withdrawalId, userId, amount, now]
    );

    await conn.execute(
      `INSERT INTO activities (id, user_id, type, label, amount, created_at)
       VALUES (?, ?, 'withdrawal', 'Retrait demandé (en attente)', ?, ?)`,
      [activityId, userId, -amount, now]
    );

    await conn.commit();

    return {
      id: withdrawalId,
      userId,
      amount,
      status: "pending",
      createdAt: new Date(now).toISOString(),
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** Admin : valider (argent envoyé) ou rejeter (rembourse le solde) */
export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: "completed" | "rejected"
): Promise<Withdrawal> {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    type WdRow = RowDataPacket & {
      id: string;
      user_id: string;
      amount: number;
      status: Withdrawal["status"];
      created_at: Date;
    };

    const [rows] = await conn.execute<WdRow[]>(
      "SELECT * FROM withdrawals WHERE id = ? FOR UPDATE",
      [withdrawalId]
    );
    const wd = rows[0];
    if (!wd) throw new Error("Retrait introuvable");
    if (wd.status !== "pending") {
      throw new Error("Ce retrait a déjà été traité");
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await conn.execute("UPDATE withdrawals SET status = ? WHERE id = ?", [
      status,
      withdrawalId,
    ]);

    if (status === "rejected") {
      await conn.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [
        Number(wd.amount),
        wd.user_id,
      ]);
      await conn.execute(
        `INSERT INTO activities (id, user_id, type, label, amount, created_at)
         VALUES (?, ?, 'bonus', 'Retrait refusé — solde remboursé', ?, ?)`,
        [generateId("act"), wd.user_id, Number(wd.amount), now]
      );
    } else {
      await conn.execute(
        `INSERT INTO activities (id, user_id, type, label, amount, created_at)
         VALUES (?, ?, 'withdrawal', 'Retrait validé — argent envoyé', ?, ?)`,
        [generateId("act"), wd.user_id, 0, now]
      );
    }

    await conn.commit();

    return {
      id: wd.id,
      userId: wd.user_id,
      amount: Number(wd.amount),
      status,
      createdAt: new Date(wd.created_at).toISOString(),
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function seedAdminIfNeeded(): Promise<void> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
  );
  if (Number(rows[0].count) > 0) return;

  const id = generateId("admin");
  const pinHash = bcrypt.hashSync("0000", 10);
  await pool.execute(
    `INSERT INTO users (id, phone, pin_hash, name, promo_code, role, balance, monthly_target, monthly_achieved)
     VALUES (?, '0000000000', ?, 'Administrateur', NULL, 'admin', 0, 0, 0)`,
    [id, pinHash]
  );

  await pool.execute(
    "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('prospect_reward_amount', '250')"
  );
  await pool.execute(
    "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('api_key', ?)",
    [process.env.API_KEY || "commercial-api-key-change-me"]
  );
}

// ─── Paramètres ───────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const pool = getPool();
  type SettingRow = RowDataPacket & { setting_value: string };
  const [rows] = await pool.execute<SettingRow[]>(
    "SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1",
    [key]
  );
  return rows[0]?.setting_value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, value]
  );
}

export async function getProspectRewardAmount(): Promise<number> {
  const val = await getSetting("prospect_reward_amount");
  return val ? Number(val) : 250;
}

export async function getAppSettings(): Promise<{ prospectRewardAmount: number; apiKey: string }> {
  const prospectRewardAmount = await getProspectRewardAmount();
  const apiKey =
    (await getSetting("api_key")) || process.env.API_KEY || "commercial-api-key-change-me";
  return { prospectRewardAmount, apiKey };
}

// ─── Prospects ────────────────────────────────────────────────

function mapProspect(row: RowDataPacket & {
  id: string;
  agent_id: string;
  name: string;
  phone: string;
  payment_ref: string | null;
  reward_amount: number;
  status: "qualified";
  created_at: Date;
}): Prospect {
  return {
    id: row.id,
    agentId: row.agent_id,
    name: row.name,
    phone: row.phone,
    paymentRef: row.payment_ref,
    rewardAmount: Number(row.reward_amount),
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getProspectsByAgent(agentId: string): Promise<Prospect[]> {
  const pool = getPool();
  type ProspectRow = RowDataPacket & {
    id: string;
    agent_id: string;
    name: string;
    phone: string;
    payment_ref: string | null;
    reward_amount: number;
    status: "qualified";
    created_at: Date;
  };
  const [rows] = await pool.execute<ProspectRow[]>(
    "SELECT * FROM prospects WHERE agent_id = ? ORDER BY created_at DESC",
    [agentId]
  );
  return rows.map(mapProspect);
}

export async function getProspectByPaymentRef(paymentRef: string): Promise<Prospect | undefined> {
  const pool = getPool();
  type ProspectRow = RowDataPacket & {
    id: string;
    agent_id: string;
    name: string;
    phone: string;
    payment_ref: string | null;
    reward_amount: number;
    status: "qualified";
    created_at: Date;
  };
  const [rows] = await pool.execute<ProspectRow[]>(
    "SELECT * FROM prospects WHERE payment_ref = ? LIMIT 1",
    [paymentRef]
  );
  return rows[0] ? mapProspect(rows[0]) : undefined;
}

export async function registerQualifiedProspect(params: {
  promoCode: string;
  name?: string;
  phone: string;
  paymentRef?: string;
}): Promise<{ prospect: Prospect; rewardAmount: number; agentName: string }> {
  const pool = getPool();
  const cleanPhone = params.phone.replace(/\D/g, "");
  const code = params.promoCode.toUpperCase().trim();
  const displayName = params.name?.trim() || cleanPhone;

  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error("Numéro de prospect invalide");
  }

  const agent = await getUserByPromoCode(code);
  if (!agent) throw new Error("Code promo invalide");

  if (params.paymentRef) {
    const existing = await getProspectByPaymentRef(params.paymentRef);
    if (existing) {
      throw new Error("Paiement déjà enregistré");
    }
  }

  const rewardAmount = await getProspectRewardAmount();
  const prospectId = generateId("prospect");
  const activityId = generateId("act");
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [dupRows] = await conn.execute<RowDataPacket[]>(
      "SELECT id FROM prospects WHERE agent_id = ? AND phone = ? LIMIT 1",
      [agent.id, cleanPhone]
    );
    if (dupRows.length > 0) {
      throw new Error("Ce prospect est déjà enregistré pour cet agent");
    }

    await conn.execute(
      `INSERT INTO prospects (id, agent_id, name, phone, payment_ref, reward_amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'qualified', ?)`,
      [
        prospectId,
        agent.id,
        displayName,
        cleanPhone,
        params.paymentRef || null,
        rewardAmount,
        now,
      ]
    );

    await conn.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [
      rewardAmount,
      agent.id,
    ]);

    await conn.execute(
      `INSERT INTO activities (id, user_id, type, label, amount, created_at)
       VALUES (?, ?, 'prospect', ?, ?, ?)`,
      [
        activityId,
        agent.id,
        `Prospect qualifié : ${displayName}`,
        rewardAmount,
        now,
      ]
    );

    await conn.commit();

    return {
      prospect: {
        id: prospectId,
        agentId: agent.id,
        name: displayName,
        phone: cleanPhone,
        paymentRef: params.paymentRef || null,
        rewardAmount,
        status: "qualified",
        createdAt: new Date(now).toISOString(),
      },
      rewardAmount,
      agentName: agent.name,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
