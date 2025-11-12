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
  password: '180505huy',
  database: 'FRUX'
});

// API LOGIN ADMIN
app.post('/admin/login', async (req, res) => {
  const { account, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM 管理者 WHERE フルネーム = ?",
      [account]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "アカウントが存在しません。" });
    }

    const admin = rows[0];

    if (password !== admin.パスワード) {
      return res.status(400).json({ message: "パスワードが違います。" });
    }

    const token = jwt.sign({ adminId: admin.ID }, "SECRET_KEY", { expiresIn: "2h" });

    return res.json({
      message: "ログイン成功",
      adminId: admin.ID,
      name: admin.フルネーム,
      token
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

// API SAVE LINE
app.post('/api/saveLine', async (req, res) => {
  try {
    const { lineName, plannedEnd, target, productionCount } = req.body;

    // Chuyển plannedEnd thành ngày và giờ
    const d = new Date(plannedEnd);
    const datePart = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const timePart = d.toISOString().slice(11, 16); // HH:mm

    const sql = `
      INSERT INTO 生産タスク (
        管理者ID, ライン名, 会社名, ステータス,
        トータルPC数, 生産数, 予定終了時刻, 予定終了日
      ) VALUES (?, ?, ?, 'in_progress', ?, ?, ?, ?)
    `;

    await db.execute(sql, [1, lineName, "TV結", target, productionCount, timePart, datePart]);

    res.json({ ok: true, message: "保存しました ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "保存失敗 ❌" });
  }
});

app.listen(3000, () => {
  console.log("✅ Server đang chạy: http://localhost:3000");
});
