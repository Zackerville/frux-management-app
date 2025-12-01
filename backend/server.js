import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối DB
const db = await mysql.createPool({
  host: '34.97.183.142',
  user: 'FruxAdmin',
  password: 'Fruxadmin#2025',
  database: 'FRUX'
});


// API LOGIN ADMIN
app.post('/admin/login', async (req, res) => {
  const { account, password } = req.body;

  try {
    // 1) Tìm admin theo フルネーム
    const [rows] = await db.query(
      "SELECT * FROM 管理者 WHERE フルネーム = ?",
      [account]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "アカウントが存在しません。" });
    }

    const admin = rows[0];

    // 2) So sánh mật khẩu dạng text
    if (password !== admin.パスワード) {
      return res.status(400).json({ message: "パスワードが違います。" });
    }

    // 3) Tạo token đăng nhập
    const token = jwt.sign(
      { adminId: admin.ID },
      "SECRET_KEY",
      { expiresIn: "2h" }
    );

    // 4) Trả về cho FE
    return res.json({
      message: "ログイン成功",
      adminId: admin.ID,
      name: admin.フルネーム,
      token
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

// app.get('', (req, res) => res.message('Server is running!'));

const LINE_TABLES = {
  'Aライン': 'Aライン生産データ',
  'Bライン': 'Bライン生産データ',
  'Cライン': 'Cライン生産データ',
  'Dライン': 'Dライン生産データ',
  'Eライン': 'Eライン生産データ',
  'Fライン': 'Fライン生産データ'
}

app.get('/api/lines', async (req, res) => {
  try {
    const tables = [
      { id: "A", table: "Aライン生産データ" },
      { id: "B", table: "Bライン生産データ" },
      { id: "C", table: "Cライン生産データ" },
      { id: "D", table: "Dライン生産データ" },
      { id: "E", table: "Eライン生産データ" },
      { id: "F", table: "Fライン生産データ" }
    ];

    const results = [];

    for (const ln of tables) {
      const [activeRows] = await db.query(`
        SELECT
          商品名 AS product,
          生産終了日 AS rawEndDate,
          予定終了時刻 AS rawPlannedTime,
          終了見込時刻 AS rawEtaEnd,
          合計数 AS total,
          生産数 AS productionCount,
          自動数 AS autoCount
        FROM ${ln.table}
        WHERE 開始時刻 IS NOT NULL
          AND 終了時刻 IS NULL
        ORDER BY 商品コード DESC
        LIMIT 1;
      `);

      let row = null;

      if (activeRows.length > 0) {
        row = activeRows[0];
      } else {
        const [latestRows] = await db.query(`
          SELECT
            商品名 AS product,
            生産終了日 AS rawEndDate,
            予定終了時刻 AS rawPlannedTime,
            終了見込時刻 AS rawEtaEnd,
            合計数 AS total,
            生産数 AS productionCount,
            自動数 AS autoCount
          FROM ${ln.table}
          ORDER BY 商品コード DESC
          LIMIT 1;
        `);

        if (latestRows.length === 0) {
          results.push({
            lineId: ln.id,
            product: null,
            plannedEnd: null,
            etaEnd: null,
            total: 0,
            productionCount: 0,
            autoCount: 0
          });
          continue;
        }

        row = latestRows[0];
      }

      let endDateStr = null;
      if (row.rawEndDate) {
        if (typeof row.rawEndDate === "string") {
          endDateStr = row.rawEndDate;
        } else if (row.rawEndDate instanceof Date) {
          const y = row.rawEndDate.getFullYear();
          const m = String(row.rawEndDate.getMonth() + 1).padStart(2, "0");
          const d = String(row.rawEndDate.getDate()).padStart(2, "0");
          endDateStr = `${y}-${m}-${d}`;
        }
      }

      let timeStr = null;
      if (row.rawPlannedTime) {
        if (typeof row.rawPlannedTime === "string") {
          timeStr = row.rawPlannedTime;
        } else if (row.rawPlannedTime instanceof Date) {
          const hh = String(row.rawPlannedTime.getHours()).padStart(2, "0");
          const mm = String(row.rawPlannedTime.getMinutes()).padStart(2, "0");
          const ss = String(row.rawPlannedTime.getSeconds()).padStart(2, "0");
          timeStr = `${hh}:${mm}:${ss}`;
        }
      }

      const plannedEndISO = endDateStr && timeStr ? `${endDateStr}T${timeStr}` : null;

      let etaStr = null;
      if (row.rawEtaEnd && endDateStr && timeStr) {
        let etaDate = null;
        if (row.rawEtaEnd instanceof Date) {
          etaDate = row.rawEtaEnd;
        } else if (typeof row.rawEtaEnd === "string") {
          const s = row.rawEtaEnd.replace(" ", "T");
          const d0 = new Date(s);
          if (!isNaN(d0.getTime())) {
            etaDate = d0;
          }
        }
        if (etaDate) {
          const parts = timeStr.split(":");
          const ph = parseInt(parts[0] || "0", 10);
          const pm = parseInt(parts[1] || "0", 10);
          const ps = parseInt(parts[2] || "0", 10);
          const dailyPlan = new Date(
            etaDate.getFullYear(),
            etaDate.getMonth(),
            etaDate.getDate(),
            ph,
            pm,
            ps || 0,
            0
          );
          const delayMs = etaDate.getTime() - dailyPlan.getTime();
          const shippingPlan = new Date(`${endDateStr}T${timeStr}`);
          const etaFinal = new Date(shippingPlan.getTime() + delayMs);
          const y = etaFinal.getFullYear();
          const m = String(etaFinal.getMonth() + 1).padStart(2, "0");
          const d = String(etaFinal.getDate()).padStart(2, "0");
          const h = String(etaFinal.getHours()).padStart(2, "0");
          const mi = String(etaFinal.getMinutes()).padStart(2, "0");
          const s2 = String(etaFinal.getSeconds()).padStart(2, "0");
          etaStr = `${y}-${m}-${d}T${h}:${mi}:${s2}`;
        }
      }
      if (!etaStr && row.rawEtaEnd) {
        if (row.rawEtaEnd instanceof Date) {
          const y = row.rawEtaEnd.getFullYear();
          const m = String(row.rawEtaEnd.getMonth() + 1).padStart(2, "0");
          const d = String(row.rawEtaEnd.getDate()).padStart(2, "0");
          const h = String(row.rawEtaEnd.getHours()).padStart(2, "0");
          const mi = String(row.rawEtaEnd.getMinutes()).padStart(2, "0");
          const s = String(row.rawEtaEnd.getSeconds()).padStart(2, "0");
          etaStr = `${y}-${m}-${d}T${h}:${mi}:${s}`;
        } else if (typeof row.rawEtaEnd === "string") {
          const s = row.rawEtaEnd.replace(" ", "T");
          etaStr = s;
        }
      }

      results.push({
        lineId: ln.id,
        product: row.product,
        plannedEnd: plannedEndISO,
        etaEnd: etaStr,
        total: row.total ?? 0,
        productionCount: row.productionCount ?? 0,
        autoCount: row.autoCount ?? 0
      });
    }

    return res.json(results);
  } catch (err) {
    console.error("Error fetching line data:", err);
    res.status(500).json({ message: "サーバーエラー", error: err });
  }
});


async function withTx(fn) {
  const conn = await db.getConnection();
  try { await conn.beginTransaction(); const r = await fn(conn); await conn.commit(); return r; }
  catch(e){ await conn.rollback(); throw e; } finally { conn.release(); }
}

function getLineTable(line)
{
  const table = LINE_TABLES[line];
  if (!table) throw new Error(`Unknow line: ${line}`);

  return table;
}

app.get("/staff/lines/:line/products", async (req, res) => {
  try {
    const line = req.params.line;
    const table = getLineTable(line);

    const [row] = await db.query(
      `SELECT クール AS section, 商品名 AS name
       FROM ${table}
       WHERE 商品名 IS NOT NULL AND 商品名 <> '' 
       GROUP BY クール, 商品名
       ORDER BY MIN(商品コード)`
    );

    const map = {};
    for (const r of row)
    {
      const key = r.section || 'その他';
      if (!map[key]) map[key] = [];
      map[key].push(r.name);
    }

    const section = Object.keys(map).map(title => ({
      title, 
      items: map[title],
    }));
    
    res.json(section);
  }
  catch (err)
  {
    console.error('Error fetching products: ', err);
    res.status(500).json({message: 'サーバーエラー'});
  }
});

app.get("/staff/lines/:line/current", async (req, res) => {
  const line = req.params.line;
  const product = req.query.product ? String(req.query.product) : null;

  if (!product) {
    return res.status(404).json({ message: "no task" });
  }

  const table = getLineTable(line);

  const [rows] = await db.query(
    `SELECT
       商品コード, 商品名, 合計数, 生産数, 残数, 生産進捗率, 予定開始時刻, 予定終了時刻, 予定通過時刻, 終了見込時刻, 更新回避, 終了時刻, 自動数
     FROM ${table}
     WHERE 商品名 = ?
     ORDER BY 商品コード DESC
     LIMIT 1`,
    [product]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "no task" });
  }

  const t = rows[0];

  const totalTarget = t.合計数 || 0;
  const produced = t.生産数 || 0;
  const remaining = typeof t.残数 === "number" ? t.残数 : Math.max(totalTarget - produced, 0);
  const progressPct = typeof t.生産進捗率 === 'number' ? t.生産進捗率 :totalTarget > 0 ? Math.floor((produced / totalTarget) * 100) : 0;
  const autoCount = t.自動数 || 0;

  const plannedStartTime = formatTimeField(t.予定開始時刻);
  const plannedEndTime = formatTimeField(t.予定終了時刻);
  const plannedPassTime = formatTimeField(t.予定通過時刻);
  const expectedFinishTime = formatTimeField(t.終了見込時刻)

  let status = "in_progress";
  if (t.更新回避) status = "paused";
  if (t.終了時刻) status = 'done';
  if (remaining <= 0) status = "done";

  res.json({
    lineName: line,
    productName: t.商品名,
    totalTarget,
    produced,
    autoCount,
    remaining,
    progressPct,
    plannedStartTime,
    plannedEndTime,
    plannedPassTime,
    expectedFinishTime,
    status,
    now: new Date().toISOString()
  });
});


app.post("/staff/lines/:line/planned-finish", async (req,res) => {
  const iso = req.body.plannedFinishAt;
  const d = iso.split("T")[0];
  const h = iso.split("T")[1] + ":00";
  const [row] = await db.query("SELECT タスクID \
                                FROM 生産タスク \
                                WHERE ライン名=? AND ステータス IN ('in_progress','pending') \
                                ORDER BY タスクID DESC LIMIT 1",
                                [req.params.line]);

  if(!row.length) return res.status(404).json({message:"no task"});
  await db.query("UPDATE 生産タスク SET 予定終了日=?, 予定終了時刻=? WHERE タスクID=?", [d, h, row[0].タスクID]);
  res.json({ok:true});
});


app.post("/staff/lines/:line/counters/manual", async (req, res, next) => {
  try {
    const delta = Number(req.body?.delta || 0);
    const product = req.body?.product ? String(req.body.product) : null;
    const now = new Date();

    if (!delta || !product) {
      return res.json({ ok: true });
    }

    const line = req.params.line;
    const table = getLineTable(line);
    let historyPayload = null;

    await withTx(async (conn) => {
      const [rows] = await conn.query(
        `SELECT
           商品コード,
           商品名,
           合計数,
           生産数,
           更新回避,
           生産開始日,
           予定開始時刻,
           生産終了日,
           予定終了時刻,
           開始時刻,
           終了時刻,
           休憩min
         FROM ${table}
         WHERE 商品名 = ?
         ORDER BY 商品コード DESC
         LIMIT 1 FOR UPDATE`,
        [product]
      );

      if (!rows.length) {
        return;
      }

      const t = rows[0];

      const plannedStart = buildDateTime(t.生産開始日, t.予定開始時刻);
      const plannedEnd = buildDateTime(t.生産終了日, t.予定終了時刻);

      if (t.終了時刻) {
        const err = new Error("finished");
        err.status = 409;
        err.payload = { message: "finished" };
        throw err;
      }

      if (t.更新回避) {
        const err = new Error("paused");
        err.status = 409;
        err.payload = { message: "paused" };
        throw err;
      }

      const total = t.合計数 || 0;
      const currentProduced = t.生産数 || 0;

      if (delta > 0 && currentProduced >= total) {
        const err = new Error("finished");
        err.status = 409;
        err.payload = { message: "finished" };
        throw err;
      }

      const np = Math.min(total, Math.max(0, currentProduced + delta));
      const remaining = Math.max(total - np, 0);
      const eventType = delta >= 0 ? "manual_inc" : "manual_dec";

      const calc = computeProductionTimes({
        plannedStart,
        plannedEnd,
        totalCount: total,
        producedCount: np,
        breakMinutes: t.休憩min || 0,
        now: new Date()
      });

      await conn.query(
        `UPDATE ${table}
           SET 生産数 = ?,
               生産時間_min単位 = ?,
               生産性セットmin = ?,
               準備セット数min = ?,
               予定通過時刻 = ?,
               終了見込時刻 = ?,
               カウント数 = カウント数 + ?,
               打刻記録 = ?
         WHERE 商品コード = ?`,
        [
          np,
          calc.netPlannedMinutes,
          calc.minutesPerSetPlan,
          calc.minutesPerTenSetsPlan,
          calc.plannedPassAt,
          calc.expectedFinishAt,
          delta,
          now,
          t.商品コード
        ]
      );

      historyPayload = {
        taskId: t.商品コード,
        line,
        plannedPassAt: calc.plannedPassAt,
        produced: np,
        remaining,
        eventType,
        delta,
        timestamp: now,
      };
    });

    if (historyPayload) 
    {
      try {
        await db.query(
          `INSERT INTO カウント履歴
             (タスクID, ライン名, 通過時刻, 予定通過時刻, 生産数, 残数, イベント種別, 差分)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyPayload.taskId,
            historyPayload.line,
            historyPayload.timestamp,
            historyPayload.plannedPassAt,
            historyPayload.produced,
            historyPayload.remaining,
            historyPayload.eventType,
            historyPayload.delta
          ]
        );
      } catch (err) {
        console.error("Insert カウント履歴 failed:", err);
      }
    }

    res.json({ ok: true, now: new Date().toISOString() });
  } 
  catch (e) 
  {
    if (e.status) return res.status(e.status).json(e.payload);
    console.error(e);
    next(e);
  }
});



app.post("/staff/lines/:line/actions/:type", async (req, res, next) => {
  try {
    const type = req.params.type;
    const now = new Date();
    const col =
      type === "start" ? "開始時刻" :
      type === "pause" ? "中断時刻" :
      type === "resume" ? "再開時刻" :
      type === "finish" ? "終了時刻" : null;

    if (!col) 
      return res.status(400).json({ message: "bad type" });

    const line = req.params.line;
    const product = req.body?.product ? String(req.body.product) : null;
    const table = getLineTable(line);

    let hasRow = false;

    await withTx(async (conn) => {
      const [rows] = await conn.query(
        `SELECT
           商品コード,
           商品名,
           合計数,
           生産数,
           更新回避
         FROM ${table}
         WHERE 商品名 = ?
         ORDER BY 商品コード DESC
         LIMIT 1 FOR UPDATE`,
        [product]
      );

      if (!rows.length) return;

      hasRow = true;
      const t = rows[0];

      if (type === "start") 
      {
        await conn.query(
          `UPDATE ${table}
             SET 生産数 = 0,
                 カウント数 = 0,
                 更新回避 = FALSE,
                 開始時刻 = ?,
                 中断時刻 = NULL,
                 再開時刻 = NULL,
                 終了時刻 = NULL
           WHERE 商品コード = ?`,
          [now, t.商品コード]
        );
      } 
      else if (type === "pause") 
      {
        await conn.query(
          `UPDATE ${table}
             SET 更新回避 = TRUE,
                 中断時刻 = ?
           WHERE 商品コード = ?`,
          [now, t.商品コード]
        );
      } 
      else if (type === "resume") 
      {
        await conn.query(
          `UPDATE ${table}
             SET 更新回避 = FALSE,
                 再開時刻 = ?
           WHERE 商品コード = ?`,
          [now, t.商品コード]
        );
      } 
      else if (type === "finish") 
      {
        await conn.query(
          `UPDATE ${table}
             SET 終了時刻 = ?,
                 自動数 = 0
           WHERE 商品コード = ?`,
          [now, t.商品コード]
        );
      }

      const producedForHistory = type === "start" ? 0 : (t.生産数 || 0);

      await conn.query(
        `INSERT INTO カウント履歴
           (タスクID, ライン名, ${col}, 生産数, 残数, イベント種別)
         VALUES (?, ?, ?, ?, GREATEST(? - ?, 0), ?)`,
        [t.商品コード, line, now,  producedForHistory, t.合計数 || 0, producedForHistory, type]
      );
    });

    res.json({ ok: true, now: new Date().toISOString(), noop: !hasRow });
  } catch (e) {
    next(e);
  }
});


app.get("/staff/lines/:line/counter-history", async (req, res, next) => {
  const line = req.params.line;
  const product = req.query.product ? String(req.query.product) : null;
  const limit = Number(req.query.limit || 100);
  const conn = await db.getConnection();

  try 
  {
    const table = getLineTable(line);
    const params = [line];
    let where = "WHERE h.ライン名 = ?";

    if (product) {
      where += " AND t.商品名 = ?";
      params.push(product);
    }

    params.push(limit);

    const [rows] = await conn.query(
      `SELECT
         h.生産数 AS 生産数,
         DATE_FORMAT(h.通過時刻, '%H:%i')      AS 通過時刻,
         DATE_FORMAT(h.予定通過時刻, '%H:%i')  AS 予定通過時刻,
         h.残数 AS 残数,
         DATE_FORMAT(h.開始時刻, '%H:%i')      AS 開始時刻,
         DATE_FORMAT(h.終了時刻, '%H:%i')      AS 終了時刻,
         DATE_FORMAT(h.中断時刻, '%H:%i')      AS 中断時刻,
         DATE_FORMAT(h.再開時刻, '%H:%i')      AS 再開時刻
       FROM カウント履歴 h
       JOIN ${table} t ON h.タスクID = t.商品コード
       ${where}
       ORDER BY COALESCE(
         h.通過時刻,
         h.開始時刻,
         h.終了時刻,
         h.中断時刻,
         h.再開時刻
       ) DESC
       LIMIT ?`,
      params
    );

    res.json(rows);
  } 
  catch (e) {
    next(e);
  } 
  finally {
    conn.release();
  }
});

app.post('/auto_count', async (req, res) => {
  try {
    const { line, delta } = req.body;
    if (!line || !delta) return res.status(400).json({message: 'Invalid payload'});

    let table;
    if (line === 'A') table = 'Aライン生産データ';
    else if (line === 'B') table = 'Bライン生産データ';
    else if (line === 'C') table = 'Cライン生産データ';
    else if (line === 'D') table = 'Dライン生産データ';
    else if (line === 'E') table = 'Eライン生産データ';
    else if (line === 'F') table = 'Fライン生産データ';
    else return res.status(400).json({message: 'unknow line'});

    const [result] = await db.query(
      `UPDATE ${table}
      SET 自動数 = 自動数 + ?
      WHERE 開始時刻 IS NOT NULL AND 終了時刻 IS NULL
      ORDER BY 商品コード DESC
      LIMIT 1`,
      [delta]
    );

    return res.json({ok: true, affectedRows: result.affectedRows});
  } 
  catch (err)
  {
    console.error(err);
    return res.status(500).json({message: 'server error'});
  }
});


// Implement the hours (予定通過時刻, 終了見込み時刻) calculate algorithm
function toDateTime(value, baseDate) 
{
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") 
  {
    const v = value.trim();
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(v)) 
    {
      const base = baseDate ? new Date(baseDate) : new Date();
      const result = new Date(base);
      const parts = v.split(":");
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const s = parts[2] ? parseInt(parts[2], 10) || 0 : 0;
      result.setHours(h, m, s, 0);
      if (baseDate && result < base) {
        result.setDate(result.getDate() + 1);
      }
      return result;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) 
    {
      const norm = v.replace(" ", "T");
      const d = new Date(norm);
      if (!isNaN(d.getTime())) return d;
    }
    const d2 = new Date(v);
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
}


function diffMinutes(start, end) 
{

  return (end.getTime() - start.getTime()) / 60000;
}

function workingMinutesBetween(startInput, endInput, extraBreakMinutes) 
{
  const start = toDateTime(startInput);
  const end = toDateTime(endInput, start);
  if (!start || !end || end <= start) return 0;
  const total = diffMinutes(start, end);
  const extra = extraBreakMinutes ? Number(extraBreakMinutes) : 0;
  const net = total - extra;
  return net > 0 ? net : 0;
}



function addMinutes(dateInput, minutes) 
{
  const date = toDateTime(dateInput);
  if (!date) return null;
  const d = new Date(date);
  const m = Number(minutes || 0);
  d.setTime(d.getTime() + m * 60000);
  return d;
}


// function addWorkingMinutesSkippingLunch(startInput, minutesInput) {
//   return addMinutes(startInput, minutesInput);
// }

function buildDateTime(dateValue, timeValue) {
  const d = toDateTime(dateValue);
  if (!d && !timeValue) return null;
  if (!d) return toDateTime(timeValue);
  const base = new Date(d);
  const t = toDateTime(timeValue, base);
  if (t instanceof Date) {
    base.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), 0);
  }
  return base;
}


function computeProductionTimes(params) {
  const start = toDateTime(params.plannedStart);
  const end = toDateTime(params.plannedEnd, start);
  const totalCount = Number(params.totalCount || 0);
  const producedRaw = Number(params.producedCount || 0);
  const breakMinutes = Number(params.breakMinutes || 0);
  const extraBreakMinutes = Number(params.extraBreakMinutes || 0);
  const now = params.now ? toDateTime(params.now, start) : new Date();

  const producedCount = producedRaw < 0 ? 0 : producedRaw;
  const breakTotal = breakMinutes + extraBreakMinutes;

  let netPlannedMinutes = 0;
  if (start && end && end > start) {
    netPlannedMinutes = workingMinutesBetween(start, end, breakTotal);
  }

  let minutesPerSetPlan = null;
  let minutesPerTenSetsPlan = null;
  if (netPlannedMinutes > 0 && totalCount > 0) {
    const setsPerMinute = totalCount / netPlannedMinutes;
    minutesPerSetPlan = setsPerMinute;
    minutesPerTenSetsPlan = setsPerMinute > 0 ? 10 / setsPerMinute : null;
  }


  let plannedPassAt = null;
  if (start && netPlannedMinutes > 0 && totalCount > 0) {
    if (producedCount <= 0) {
      plannedPassAt = start;
    } else {
      let ratio = producedCount / totalCount;
      if (ratio > 1) ratio = 1;
      const targetMinutes = netPlannedMinutes * ratio;
      plannedPassAt = addMinutes(start, targetMinutes);
    }
  }


  let expectedFinishAt = null;
  if (end && plannedPassAt && producedCount > 0) {
    const delayMs = now.getTime() - plannedPassAt.getTime();
    expectedFinishAt = new Date(end.getTime() + delayMs);
  } else if (end) {
    expectedFinishAt = end;
  }

  return {
    plannedPassAt,
    expectedFinishAt,
    netPlannedMinutes: Math.round(netPlannedMinutes),
    minutesPerSetPlan: minutesPerSetPlan != null ? Math.round(minutesPerSetPlan) : null,
    minutesPerTenSetsPlan: minutesPerTenSetsPlan != null ? Math.round(minutesPerTenSetsPlan) : null,
    minutesPerSetActual: null
  };
}


function formatTimeField(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const v = value.trim();
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(v)) return v;
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(11, 19);
    if (/^\d{4}-\d{2}-\d{2} /.test(v)) return v.slice(11, 19);
    return v;
  }
  if (value instanceof Date) {
    const h = String(value.getHours()).padStart(2, "0");
    const m = String(value.getMinutes()).padStart(2, "0");
    const s = String(value.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  const s = String(value);
  return s.length >= 5 ? s.slice(0, 5) : s;
}


const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});