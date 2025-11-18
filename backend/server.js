import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

(async () => {
  // 🔹 Kết nối DB
  const db = await mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'fruxholding',
  database: 'FRUX'
});

  // 🔹 LOGIN ADMIN
  app.post('/admin/login', async (req, res) => {
    const { account, password } = req.body;

    try {
      const [rows] = await db.query("SELECT * FROM 管理者 WHERE フルネーム = ?", [account]);

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

app.listen(3000, () => {
  console.log("✅ Server đang chạy: http://localhost:3000");
});


