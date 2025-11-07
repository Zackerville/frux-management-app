CREATE DATABASE FRUX;
CREATE TABLE 管理者 (
ID INT PRIMARY KEY AUTO_INCREMENT,
フルネーム VARCHAR (100) NOT NULL,
部署 VARCHAR (100) NOT NULL,
パスワード VARCHAR (255) NOT NULL,
CONSTRAINT check_password_length CHECK (CHAR_LENGTH(パスワード) >= 8)
);
-- Trigger kiểm tra độ dài パスワード trước khi INSERT
DELIMITER //
CREATE TRIGGER 管理者_before_insert
BEFORE INSERT ON 管理者
FOR EACH ROW
BEGIN
    IF CHAR_LENGTH(NEW.パスワード) < 8 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'パスワードは8文字以上である必要があります';
    END IF;
END;//
DELIMITER ;

-- Trigger kiểm tra độ dài パスワード trước khi UPDATE
DELIMITER //
CREATE TRIGGER 管理者_before_update
BEFORE UPDATE ON 管理者
FOR EACH ROW
BEGIN
    IF CHAR_LENGTH(NEW.パスワード) < 8 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'パスワードは8文字以上である必要があります';
    END IF;
END;//
DELIMITER ;
CREATE TABLE 生産ライン(
ライン名 VARCHAR(10) PRIMARY KEY,
管理者ID INT NOT NULL,
FOREIGN KEY (管理者ID) REFERENCES 管理者(ID) ON DELETE CASCADE
);
 CREATE TABLE 生産タスク (
    タスクID INT PRIMARY KEY AUTO_INCREMENT,
    管理者ID INT NOT NULL,
    ライン名 VARCHAR(10) NOT NULL,
    会社名 VARCHAR(100) NOT NULL,
    ステータス ENUM('done', 'pending', 'in_progress') NOT NULL DEFAULT 'pending' COMMENT '生産の進行状況',
    トータルPC数 INT NOT NULL COMMENT '目標生産数',
    生産数 INT DEFAULT 0 COMMENT '現在の生産数',
    最終入力時刻 DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最後に更新された時間',
    予定終了時刻 TIME,
    予定終了日 DATE,
    終了見込時刻 TIME,
    終了見込日 DATE,
    FOREIGN KEY (管理者ID) REFERENCES 管理者(ID) ON DELETE CASCADE,
    FOREIGN KEY (ライン名) REFERENCES 生産ライン(ライン名) ON DELETE CASCADE
);
CREATE TABLE 作業歴史(
	ログID INT PRIMARY KEY AUTO_INCREMENT,
    タスクID INT NOT NULL,
    メモ VARCHAR(200) NOT NULL DEFAULT 'なし',
    タイムライン DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (タスクID) REFERENCES 生産タスク(タスクID) ON DELETE CASCADE
);
CREATE TABLE カウント履歴 (
    履歴ID INT PRIMARY KEY AUTO_INCREMENT,
    ライン名 VARCHAR(10) NOT NULL,
    
    開始時刻 DATETIME NOT NULL COMMENT '生産を開始した時間（BeginTime）',
    中断時刻 DATETIME DEFAULT NULL COMMENT '昼休みなどで一時停止した時間（PauseTime）',
    再開時刻 DATETIME DEFAULT NULL COMMENT '再開した時間（RestartTime）',
    通過時刻 DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '記録された現在時刻（CurrentTime）',
    予定通過時刻 DATETIME DEFAULT NULL COMMENT '予定完了時間（PlannedTime）',
    
    生産数 INT NOT NULL DEFAULT 0 COMMENT '現在までに生産された数量（CurrentQuantity）',
    残数 INT DEFAULT NULL COMMENT '残りの生産数量（RemainingQuantity）',

    FOREIGN KEY (ライン名) REFERENCES 生産ライン(ライン名) ON DELETE CASCADE
);

-- ---------------------------------
-- Sample data                     
-- ---------------------------------

INSERT INTO 管理者 VALUES (1 ,'福嶋','情報システム','fruxholding');
INSERT INTO 生産ライン VALUES ('Aライン', 1 );
-- 生産タスク
INSERT INTO 生産タスク (
    管理者ID, ライン名, 会社名, ステータス, トータルPC数, 生産数, 
    予定終了時刻, 予定終了日, 終了見込時刻, 終了見込日
) VALUES (
    1, 'Aライン', 'TV結', 'in_progress', 1630, 550, 
    '16:30', '2025-12-27', '20:00', '2025-12-31'
);

-- 作業歴史
INSERT INTO 作業歴史 (タスクID)
VALUES (1);

-- カウント履歴
INSERT INTO カウント履歴 (
    ライン名, 開始時刻, 中断時刻, 再開時刻, 生産数, 残数
) VALUES (
    'Aライン', '2025-12-27 09:30:00', '2025-12-27 12:00:00', '2025-12-25 13:00:00', 500, 1130
);
INSERT INTO 管理者 (フルネーム, 部署, パスワード) VALUES ('フィ', '情報システム', 'fruxholding');
INSERT INTO 管理者 (フルネーム, 部署, パスワード) VALUES ('ティエン', '情報システム', 'fruxholding');
INSERT INTO 管理者 (フルネーム, 部署, パスワード) VALUES ('ヒュウ', '情報システム', 'fruxholding');