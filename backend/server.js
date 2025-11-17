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
  password: '180505huy',
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

  // 🔹 CÁC BẢNG LINE
  const lineTables = [
    'Aライン生産データ',
    'Bライン生産データ',
    'Cライン生産データ',
    'Dライン生産データ',
    'Eライン生産データ',
    'Fライン生産データ'
  ];


  // 🔹 API HIỂN THỊ LINE LÊN UI
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
        const [rows] = await db.query(`
          SELECT
          商品名 AS product,
          生産終了日 AS rawEndDate,
          予定終了時刻 AS rawPlannedTime,
          終了見込時刻 AS rawEtaEnd,
          合計数 AS total,
          生産数 AS productionCount
        FROM ${ln.table}
        ORDER BY 商品コード DESC
        LIMIT 1;
        `);
        
  
        if (rows.length === 0) {
          results.push({
            lineId: ln.id,
            product: null,
            plannedEnd: null,
            etaEnd: null,
            total: 0,
            productionCount: 0
          });
          continue;
        }
        
          const row = rows[0];
  
          let endDateStr = null;
          if (row.rawEndDate) {
            if (typeof row.rawEndDate === "string") {
              // MySQL trả string kiểu '2025-11-13'
              endDateStr = row.rawEndDate;
            } else if (row.rawEndDate instanceof Date) {
              // Nếu MySQL trả kiểu JS Date
              const y = row.rawEndDate.getFullYear();
              const m = String(row.rawEndDate.getMonth() + 1).padStart(2, "0");
              const d = String(row.rawEndDate.getDate()).padStart(2, "0");
              endDateStr = `${y}-${m}-${d}`;
            }
          }
    
          // -----------------------------------
          // 🔹 Chuẩn hoá TIME (予定終了時刻)
          // -----------------------------------
          let timeStr = null;
          if (row.rawPlannedTime) {
            if (typeof row.rawPlannedTime === "string") {
              timeStr = row.rawPlannedTime; // ex: '17:30:00'
            } else if (row.rawPlannedTime instanceof Date) {
              const hh = String(row.rawPlannedTime.getHours()).padStart(2, "0");
              const mm = String(row.rawPlannedTime.getMinutes()).padStart(2, "0");
              const ss = String(row.rawPlannedTime.getSeconds()).padStart(2, "0");
              timeStr = `${hh}:${mm}:${ss}`;
            }
          }
    
          // -----------------------------------
          // 🔹 Kết hợp thành 1 ISO datetime (FE đọc được)
          // -----------------------------------
          const plannedEndISO =
            endDateStr && timeStr ? `${endDateStr}T${timeStr}` : null;
    
          // -----------------------------------
          // 🔹 Chuẩn hoá 終了見込時刻 (datetime)
          // -----------------------------------
          let etaStr = null;
          if (row.rawEtaEnd) {
            if (typeof row.rawEtaEnd === "string") {
              etaStr = row.rawEtaEnd; // ex: '2025-11-13 17:45:00'
            } else if (row.rawEtaEnd instanceof Date) {
              const y = row.rawEtaEnd.getFullYear();
              const m = String(row.rawEtaEnd.getMonth() + 1).padStart(2, "0");
              const d = String(row.rawEtaEnd.getDate()).padStart(2, "0");
              const h = String(row.rawEtaEnd.getHours()).padStart(2, "0");
              const mi = String(row.rawEtaEnd.getMinutes()).padStart(2, "0");
              const s = String(row.rawEtaEnd.getSeconds()).padStart(2, "0");
              etaStr = `${y}-${m}-${d}T${h}:${mi}:${s}`;
            }
          }
    
          results.push({
            lineId: ln.id,
            product: row.product,
            plannedEnd: plannedEndISO,   // ex: "2025-11-13T17:30:00"
            etaEnd: etaStr,              // ex: "2025-11-13T17:45:00"
            total: row.total ?? 0,
            productionCount: row.productionCount ?? 0
          });
        }
    
        return res.json(results);
      } catch (err) {
        console.error("Error fetching line data:", err);
        res.status(500).json({ message: "サーバーエラー", error: err });
      }
    });
  
  


  // 🔹 START SERVER
  app.listen(3000, () => {
    console.log("✅ Server đang chạy tại: http://localhost:3000");
  });
})();
