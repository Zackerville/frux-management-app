import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối DB
const db = await mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'fruxholding',
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

async function withTx(fn) {
  const conn = await db.getConnection();
  try { await conn.beginTransaction(); const r = await fn(conn); await conn.commit(); return r; }
  catch(e){ await conn.rollback(); throw e; } finally { conn.release(); }
}

const LINE_TABLES = {
  'Aライン': 'Aライン生産データ',
  'Bライン': 'Bライン生産データ',
  'Cライン': 'Cライン生産データ',
  'Dライン': 'Dライン生産データ',
  'Eライン': 'Eライン生産データ',
  'Fライン': 'Fライン生産データ'
}

function getLineTable(line)
{
  const table = LINE_TABLES[line];
  if (!table) throw new Error(`Unknow line: ${line}`);

  return table;
}

app.get("/staff/lines/:line/current", async (req, res) => {
  const line = req.params.line;
  const product = req.query.product ? String(req.query.product) : null;

  if (!product) {
    return res.status(404).json({ message: "no task" });
  }

  const table = getLineTable(line);

  const [rows] = await db.query(
    `SELECT
       商品コード, 商品名, 合計数, 生産数, 残数, 生産進捗率, 予定開始時刻, 予定終了時刻, 予定通過時刻, 終了見込時刻, 更新回避, 終了時刻
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
  const progressPct = totalTarget > 0 ? Math.floor((produced / totalTarget) * 100) : 0;

  const plannedStartTime = t.予定開始時刻 || null;
  const plannedEndTime = t.予定終了時刻 || null;

  const plannedPassTime = computePlannedPassTime(
    totalTarget,
    produced,
    plannedStartTime,
    plannedEndTime
  );

  const expectedFinishTime = computeExpectedFinishTime(
    totalTarget,
    produced,
    plannedStartTime,
    plannedEndTime,
    new Date()
  );

  let status = "in_progress";
  if (t.更新回避) status = "paused";
  if (t.終了時刻) status = 'done';
  if (remaining <= 0) status = "done";

  res.json({
    lineName: line,
    productName: t.商品名,
    totalTarget,
    produced,
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

    if (!delta || !product) {
      return res.json({ ok: true });
    }

    const line = req.params.line;
    const table = getLineTable(line);

    await withTx(async (conn) => {
      const [rows] = await conn.query(
        `SELECT 商品コード, 商品名, 合計数, 生産数, 更新回避, 予定開始時刻, 予定終了時刻, 終了時刻
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

      if (t.終了時刻)
      {
        const err = new Error('finished');
        err.status = 409;
        err.payload = {message : 'finished'};
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

      const plannedPassTime = computePlannedPassTime(
        total,
        np,
        t.予定開始時刻,
        t.予定終了時刻
      );

      await conn.query(
        `UPDATE ${table}
           SET 生産数 = ?, カウント数 = カウント数 + ?, 打刻記録 = NOW()
         WHERE 商品コード = ?`,
        [np, delta, t.商品コード]
      );

      await conn.query(
        `INSERT INTO カウント履歴
           (タスクID, ライン名, 通過時刻, 予定通過時刻, 生産数, 残数, イベント種別, 差分)
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
        [t.商品コード, line, plannedPassTime, np, remaining, eventType, delta]
      );
    });

    res.json({ ok: true, now: new Date().toISOString() });
  } catch (e) {
    if (e.status) return res.status(e.status).json(e.payload);
    next(e);
  }
});



app.post("/staff/lines/:line/actions/:type", async (req, res, next) => {
  try {
    const type = req.params.type;
    const col =
      type === "start" ? "開始時刻" :
      type === "pause" ? "中断時刻" :
      type === "resume" ? "再開時刻" :
      type === "finish" ? "終了時刻" : null;

    if (!col) {
      return res.status(400).json({ message: "bad type" });
    }

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

      if (!rows.length) {
        return;
      }

      hasRow = true;
      const t = rows[0];

      if (type === "start") {
        await conn.query(
          `UPDATE ${table}
             SET 生産数 = 0,
                 カウント数 = 0,
                 更新回避 = FALSE,
                 開始時刻 = NOW(),
                 中断時刻 = NULL,
                 再開時刻 = NULL,
                 終了時刻 = NULL
           WHERE 商品コード = ?`,
          [t.商品コード]
        );
      } else if (type === "pause") {
        await conn.query(
          `UPDATE ${table}
             SET 更新回避 = TRUE,
                 中断時刻 = NOW()
           WHERE 商品コード = ?`,
          [t.商品コード]
        );
      } else if (type === "resume") {
        await conn.query(
          `UPDATE ${table}
             SET 更新回避 = FALSE,
                 再開時刻 = NOW()
           WHERE 商品コード = ?`,
          [t.商品コード]
        );
      } else if (type === "finish") {
        await conn.query(
          `UPDATE ${table}
             SET 終了時刻 = NOW()
           WHERE 商品コード = ?`,
          [t.商品コード]
        );
      }

      const producedForHistory = type === "start" ? 0 : (t.生産数 || 0);

      await conn.query(
        `INSERT INTO カウント履歴
           (タスクID, ライン名, ${col}, 生産数, 残数, イベント種別)
         VALUES (?, ?, NOW(), ?, GREATEST(? - ?, 0), ?)`,
        [t.商品コード, line, producedForHistory, t.合計数 || 0, producedForHistory, type]
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

  try {
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
  } catch (e) {
    next(e);
  } finally {
    conn.release();
  }
});


// Implement the hours (予定通過時刻, 終了見込み時刻) calculate algorithm
const BREAK_START = 12 * 3600;
const BREAK_END = 13 * 3600;

const timeStr2Sec = (t) => {
  if (!t) return null;
  const parts = String(t).split(':');
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const s = Number((parts[2] || '0').split('.')[0] || '0');
  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) return null;
  return h * 3600 + m * 60 + s;
};

const sec2timeStr = (sec) => {
  let s = Math.round(sec);
  const oneDay = 24 * 3600;
  s = ((s % oneDay) + oneDay) % oneDay;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n) => n.toString().padStart(2, '0');
  return pad(h) + ':' + pad(m);
};

const workTotalSec = (startSec, endSec) => {
  const base = Math.max(endSec - startSec, 0);
  const start = Math.max(startSec, BREAK_START);
  const end = Math.min(endSec, BREAK_END);
  const breakSec = Math.max(end - start, 0);
  return Math.max(base - breakSec, 0);
};

const mapWorkToClock = (startSec, endSec, workSec) => {
  const total = workTotalSec(startSec, endSec);
  if (!total) return null;
  const w = Math.max(0, Math.min(workSec, total));
  const s = Math.max(startSec, BREAK_START);
  const e = Math.min(endSec, BREAK_END);
  const hasBreak = e > s;
  if (!hasBreak) return sec2timeStr(startSec + w);
  const preBreak = Math.max(0, Math.min(BREAK_START, endSec) - startSec);
  if (w <= preBreak) return sec2timeStr(startSec + w);
  return sec2timeStr(BREAK_END + (w - preBreak));
};

const computePlannedPassTime = (totalTarget, produced, startTime, endTime) => {
  const startSec = timeStr2Sec(startTime);
  const endSec = timeStr2Sec(endTime);
  if (startSec == null || endSec == null || totalTarget <= 0) return null;
  const total = workTotalSec(startSec, endSec);
  if (!total) return null;
  const p = Math.max(0, Math.min(totalTarget, produced));
  const rate = totalTarget / total;
  const workSec = p / rate;
  return mapWorkToClock(startSec, endSec, workSec);
};

const computeElapsedWorkSec = (startSec, endSec, nowSec) => {
  const b = Math.min(nowSec, endSec);
  if (b <= startSec) return 0;
  const base = b - startSec;
  const s = Math.max(startSec, BREAK_START);
  const e = Math.min(b, BREAK_END);
  const breakSec = Math.max(e - s, 0);
  const w = base - breakSec;
  return w > 0 ? w : 0;
};

const addWorkingFromNow = (nowSec, workSec) => {
  let sec = nowSec;
  let rem = workSec;
  if (rem <= 0) return sec;
  if (sec < BREAK_START) {
    const untilBreak = BREAK_START - sec;
    if (rem <= untilBreak) return sec + rem;
    rem -= untilBreak;
    sec = BREAK_END;
  } else if (sec < BREAK_END) {
    sec = BREAK_END;
  }
  return sec + rem;
};

const computeExpectedFinishTime = (totalTarget, produced, startTime, endTime, now) => {
  const startSec = timeStr2Sec(startTime);
  const endSec = timeStr2Sec(endTime);
  if (startSec == null || endSec == null || totalTarget <= 0) return null;
  const p = Math.max(0, Math.min(totalTarget, produced));
  const remaining = Math.max(totalTarget - p, 0);
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  if (remaining === 0) return sec2timeStr(nowSec);
  const elapsed = computeElapsedWorkSec(startSec, endSec, nowSec);
  if (!elapsed || !p) return sec2timeStr(endSec);
  const rate = p / elapsed;
  const workSec = remaining / rate;
  const finishSec = addWorkingFromNow(nowSec, workSec);
  return sec2timeStr(finishSec);
};

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});