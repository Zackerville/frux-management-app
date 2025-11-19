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
    1, 'Aライン', 'TV結', 'in_progress', 1630, 0, 
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
INSERT INTO 管理者 (フルネーム, 部署, パスワード) VALUES ('tien', '情報システム', 'fruxholding');
INSERT INTO 管理者 (フルネーム, 部署, パスワード) VALUES ('tienminh', '情報システム', 'tienminh2004');
INSERT INTO 管理者 (フルネーム, 部署, パスワード) VALUES ('huy', '情報システム', 'fruxholding');

-- code from here from workbench
USE FRUX;
ALTER TABLE `frux`.`カウント履歴`
  ADD COLUMN `イベント種別` ENUM('start','pause','resume','finish','manual_inc','manual_dec') NOT NULL AFTER `予定通過時刻`,
  ADD COLUMN `差分` INT NULL AFTER `イベント種別`;
    
CREATE INDEX idx_履歴_line_time ON カウント履歴 (ライン名, 通過時刻);

DROP TRIGGER IF EXISTS 生産タスク_check_before_ins;
DELIMITER //
CREATE TRIGGER 生産タスク_check_before_ins
BEFORE INSERT ON 生産タスク
FOR EACH ROW
BEGIN
  IF NEW.`生産数` < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '生産数は0以上';
  END IF;
  IF NEW.`生産数` > NEW.`トータルPC数` THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '生産数が目標を超えています';
  END IF;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER 生産タスク_check_before_upd
BEFORE UPDATE ON 生産タスク
FOR EACH ROW
BEGIN
	IF NEW.`生産数` < 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '生産数は０以上';
	END IF;
    IF NEW.`生産数` > NEW.`トータルPC数` THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '生産数が目標を超えています';
	END IF;
END //
DELIMITER ;

ALTER TABLE カウント履歴
  ADD COLUMN `タスクID` INT NULL AFTER 履歴ID;


ALTER TABLE カウント履歴
  ADD CONSTRAINT fk_カウント履歴_生産タスク
    FOREIGN KEY (`タスクID`) REFERENCES 生産タスク(`タスクID`);

ALTER TABLE カウント履歴
  MODIFY COLUMN `開始時刻`     DATETIME NULL DEFAULT NULL,
  MODIFY COLUMN `終了時刻`     DATETIME NULL DEFAULT NULL,
  MODIFY COLUMN `中断時刻`     DATETIME NULL DEFAULT NULL,
  MODIFY COLUMN `再開時刻`     DATETIME NULL DEFAULT NULL,
  MODIFY COLUMN `通過時刻`     DATETIME NULL DEFAULT NULL,
  MODIFY COLUMN `予定通過時刻` DATETIME NULL DEFAULT NULL;

ALTER TABLE 生産タスク
	ADD COLUMN 予定開始時刻 TIME NULL AFTER ステータス;
    
USE FRUX;

UPDATE 生産タスク
SET 予定開始時刻 = '09:30'
WHERE タスクID >= 1
  AND 予定開始時刻 IS NULL;
  
UPDATE 生産タスク
SET 予定終了時刻 = '16:30'
WHERE タスクID >= 1
  AND 予定終了時刻 IS NULL;


USE FRUX;
SHOW COLUMNS FROM カウント履歴 LIKE '予定通過時刻';

USE FRUX;
DESCRIBE 生産タスク;

ALTER TABLE カウント履歴
  MODIFY COLUMN 予定通過時刻 TIME NULL;

SELECT * FROM 生産タスク;
SELECT * FROM カウント履歴;

SELECT * FROM 管理者;
DELETE FROM 生産タスク WHERE タスクID = 2; 

CREATE TABLE Aライン生産データ (
    商品コード INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品コード',
    商品名 VARCHAR(100) NOT NULL COMMENT '商品名',
    ラインコード INT NOT NULL COMMENT 'ラインコード (例: 1 = Aライン)',
    盛付ライン VARCHAR(50) NOT NULL COMMENT '盛付ライン名 (例: Aライン)',
    
    合計数 INT NOT NULL COMMENT '合計生産数',
    生産数 INT DEFAULT 0 COMMENT '現在までの生産数',
    残数 INT GENERATED ALWAYS AS (合計数 - 生産数) STORED COMMENT '残り数',
    
    生産性セットmin INT COMMENT '生産性セット（分）',
    開始時刻 DATETIME COMMENT '生産開始時刻',
    終了時刻 DATETIME COMMENT '生産終了時刻',
    終了見込時刻 DATETIME COMMENT '終了見込時刻',
    生産時間_min単位 INT COMMENT '生産にかかった時間（分単位）',
    準備セット数min INT COMMENT '準備時間（分）',
    予定通過時刻 DATETIME COMMENT '予定通過時刻',
    準備セット数 INT COMMENT '準備セット数',
    
    生産開始日 DATE COMMENT '生産開始日',
    予定開始時刻 TIME COMMENT '予定開始時刻',
    生産終了日 DATE COMMENT '生産終了日',
    予定終了時刻 TIME COMMENT '予定終了時刻',
    
    打刻記録 DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打刻記録',
    休憩min INT DEFAULT 0 COMMENT '休憩時間（分）',
    休憩反映 BOOLEAN DEFAULT FALSE COMMENT '休憩反映',
    中断時刻 DATETIME COMMENT '中断時刻',
    再開時刻 DATETIME COMMENT '再開時刻',
    作業開始前min INT COMMENT '作業開始前準備（分）',
    
    休憩２min INT DEFAULT 0,
    休憩２反映 BOOLEAN DEFAULT FALSE,
    休憩3min INT DEFAULT 0,
    休憩３反映 BOOLEAN DEFAULT FALSE,
    休憩4min INT DEFAULT 0,
    休憩４反映 BOOLEAN DEFAULT FALSE,
    休憩5min INT DEFAULT 0,
    休憩５反映 BOOLEAN DEFAULT FALSE,
    休憩６min INT DEFAULT 0,
    休憩６反映 BOOLEAN DEFAULT FALSE,
    休憩７min INT DEFAULT 0,
    休憩７反映 BOOLEAN DEFAULT FALSE,

    生産進捗率 DECIMAL(5,2) GENERATED ALWAYS AS ((生産数 / 合計数) * 100) STORED COMMENT '進捗率 (%)',

    Aライン表示 BOOLEAN DEFAULT FALSE,
    Bライン表示 BOOLEAN DEFAULT FALSE,
    Cライン表示 BOOLEAN DEFAULT FALSE,
    Dライン表示 BOOLEAN DEFAULT FALSE,
    Eライン表示 BOOLEAN DEFAULT FALSE,
    Fライン表示 BOOLEAN DEFAULT FALSE,

    更新回避 BOOLEAN DEFAULT FALSE COMMENT '自動更新を避ける',
    カウント数 INT DEFAULT 0 COMMENT 'カウント数',
    クリックして追加 VARCHAR(255) DEFAULT NULL COMMENT '追加情報',

    FOREIGN KEY (盛付ライン) REFERENCES 生産ライン(ライン名) ON DELETE CASCADE
);

CREATE TABLE Bライン生産データ (

    商品コード INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品コード',
    商品名 VARCHAR(100) NOT NULL COMMENT '商品名',
    ラインコード INT NOT NULL COMMENT 'ラインコード (例: 1 = Aライン)',
    盛付ライン VARCHAR(50) NOT NULL COMMENT '盛付ライン名 (例: Aライン)',
    
    合計数 INT NOT NULL COMMENT '合計生産数',
    生産数 INT DEFAULT 0 COMMENT '現在までの生産数',
    残数 INT GENERATED ALWAYS AS (合計数 - 生産数) STORED COMMENT '残り数',
    
    生産性セットmin INT COMMENT '生産性セット（分）',
    開始時刻 DATETIME COMMENT '生産開始時刻',
    終了時刻 DATETIME COMMENT '生産終了時刻',
    終了見込時刻 DATETIME COMMENT '終了見込時刻',
    生産時間_min単位 INT COMMENT '生産にかかった時間（分単位）',
    準備セット数min INT COMMENT '準備時間（分）',
    予定通過時刻 DATETIME COMMENT '予定通過時刻',
    準備セット数 INT COMMENT '準備セット数',
    
    生産開始日 DATE COMMENT '生産開始日',
    予定開始時刻 TIME COMMENT '予定開始時刻',
    生産終了日 DATE COMMENT '生産終了日',
    予定終了時刻 TIME COMMENT '予定終了時刻',
    
    打刻記録 DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打刻記録',
    休憩min INT DEFAULT 0 COMMENT '休憩時間（分）',
    休憩反映 BOOLEAN DEFAULT FALSE COMMENT '休憩反映',
    中断時刻 DATETIME COMMENT '中断時刻',
    再開時刻 DATETIME COMMENT '再開時刻',
    作業開始前min INT COMMENT '作業開始前準備（分）',
    
    休憩２min INT DEFAULT 0,
    休憩２反映 BOOLEAN DEFAULT FALSE,
    休憩3min INT DEFAULT 0,
    休憩３反映 BOOLEAN DEFAULT FALSE,
    休憩4min INT DEFAULT 0,
    休憩４反映 BOOLEAN DEFAULT FALSE,
    休憩5min INT DEFAULT 0,
    休憩５反映 BOOLEAN DEFAULT FALSE,
    休憩６min INT DEFAULT 0,
    休憩６反映 BOOLEAN DEFAULT FALSE,
    休憩７min INT DEFAULT 0,
    休憩７反映 BOOLEAN DEFAULT FALSE,

    生産進捗率 DECIMAL(5,2) GENERATED ALWAYS AS ((生産数 / 合計数) * 100) STORED COMMENT '進捗率 (%)',

    Aライン表示 BOOLEAN DEFAULT FALSE,
    Bライン表示 BOOLEAN DEFAULT FALSE,
    Cライン表示 BOOLEAN DEFAULT FALSE,
    Dライン表示 BOOLEAN DEFAULT FALSE,
    Eライン表示 BOOLEAN DEFAULT FALSE,
    Fライン表示 BOOLEAN DEFAULT FALSE,

    更新回避 BOOLEAN DEFAULT FALSE COMMENT '自動更新を避ける',
    カウント数 INT DEFAULT 0 COMMENT 'カウント数',
    クリックして追加 VARCHAR(255) DEFAULT NULL COMMENT '追加情報',

    FOREIGN KEY (盛付ライン) REFERENCES 生産ライン(ライン名) ON DELETE CASCADE
);

CREATE TABLE Cライン生産データ (

    商品コード INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品コード',
    商品名 VARCHAR(100) NOT NULL COMMENT '商品名',
    ラインコード INT NOT NULL COMMENT 'ラインコード (例: 1 = Aライン)',
    盛付ライン VARCHAR(50) NOT NULL COMMENT '盛付ライン名 (例: Aライン)',
    
    合計数 INT NOT NULL COMMENT '合計生産数',
    生産数 INT DEFAULT 0 COMMENT '現在までの生産数',
    残数 INT GENERATED ALWAYS AS (合計数 - 生産数) STORED COMMENT '残り数',
    
    生産性セットmin INT COMMENT '生産性セット（分）',
    開始時刻 DATETIME COMMENT '生産開始時刻',
    終了時刻 DATETIME COMMENT '生産終了時刻',
    終了見込時刻 DATETIME COMMENT '終了見込時刻',
    生産時間_min単位 INT COMMENT '生産にかかった時間（分単位）',
    準備セット数min INT COMMENT '準備時間（分）',
    予定通過時刻 DATETIME COMMENT '予定通過時刻',
    準備セット数 INT COMMENT '準備セット数',
    
    生産開始日 DATE COMMENT '生産開始日',
    予定開始時刻 TIME COMMENT '予定開始時刻',
    生産終了日 DATE COMMENT '生産終了日',
    予定終了時刻 TIME COMMENT '予定終了時刻',
    
    打刻記録 DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打刻記録',
    休憩min INT DEFAULT 0 COMMENT '休憩時間（分）',
    休憩反映 BOOLEAN DEFAULT FALSE COMMENT '休憩反映',
    中断時刻 DATETIME COMMENT '中断時刻',
    再開時刻 DATETIME COMMENT '再開時刻',
    作業開始前min INT COMMENT '作業開始前準備（分）',
    
    休憩２min INT DEFAULT 0,
    休憩２反映 BOOLEAN DEFAULT FALSE,
    休憩3min INT DEFAULT 0,
    休憩３反映 BOOLEAN DEFAULT FALSE,
    休憩4min INT DEFAULT 0,
    休憩４反映 BOOLEAN DEFAULT FALSE,
    休憩5min INT DEFAULT 0,
    休憩５反映 BOOLEAN DEFAULT FALSE,
    休憩６min INT DEFAULT 0,
    休憩６反映 BOOLEAN DEFAULT FALSE,
    休憩７min INT DEFAULT 0,
    休憩７反映 BOOLEAN DEFAULT FALSE,

    生産進捗率 DECIMAL(5,2) GENERATED ALWAYS AS ((生産数 / 合計数) * 100) STORED COMMENT '進捗率 (%)',

    Aライン表示 BOOLEAN DEFAULT FALSE,
    Bライン表示 BOOLEAN DEFAULT FALSE,
    Cライン表示 BOOLEAN DEFAULT FALSE,
    Dライン表示 BOOLEAN DEFAULT FALSE,
    Eライン表示 BOOLEAN DEFAULT FALSE,
    Fライン表示 BOOLEAN DEFAULT FALSE,

    更新回避 BOOLEAN DEFAULT FALSE COMMENT '自動更新を避ける',
    カウント数 INT DEFAULT 0 COMMENT 'カウント数',
    クリックして追加 VARCHAR(255) DEFAULT NULL COMMENT '追加情報',

    FOREIGN KEY (盛付ライン) REFERENCES 生産ライン(ライン名) ON DELETE CASCADE
);

CREATE TABLE Dライン生産データ (

    商品コード INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品コード',
    商品名 VARCHAR(100) NOT NULL COMMENT '商品名',
    ラインコード INT NOT NULL COMMENT 'ラインコード (例: 1 = Aライン)',
    盛付ライン VARCHAR(50) NOT NULL COMMENT '盛付ライン名 (例: Aライン)',
    
    合計数 INT NOT NULL COMMENT '合計生産数',
    生産数 INT DEFAULT 0 COMMENT '現在までの生産数',
    残数 INT GENERATED ALWAYS AS (合計数 - 生産数) STORED COMMENT '残り数',
    
    生産性セットmin INT COMMENT '生産性セット（分）',
    開始時刻 DATETIME COMMENT '生産開始時刻',
    終了時刻 DATETIME COMMENT '生産終了時刻',
    終了見込時刻 DATETIME COMMENT '終了見込時刻',
    生産時間_min単位 INT COMMENT '生産にかかった時間（分単位）',
    準備セット数min INT COMMENT '準備時間（分）',
    予定通過時刻 DATETIME COMMENT '予定通過時刻',
    準備セット数 INT COMMENT '準備セット数',
    
    生産開始日 DATE COMMENT '生産開始日',
    予定開始時刻 TIME COMMENT '予定開始時刻',
    生産終了日 DATE COMMENT '生産終了日',
    予定終了時刻 TIME COMMENT '予定終了時刻',
    
    打刻記録 DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打刻記録',
    休憩min INT DEFAULT 0 COMMENT '休憩時間（分）',
    休憩反映 BOOLEAN DEFAULT FALSE COMMENT '休憩反映',
    中断時刻 DATETIME COMMENT '中断時刻',
    再開時刻 DATETIME COMMENT '再開時刻',
    作業開始前min INT COMMENT '作業開始前準備（分）',
    
    休憩２min INT DEFAULT 0,
    休憩２反映 BOOLEAN DEFAULT FALSE,
    休憩3min INT DEFAULT 0,
    休憩３反映 BOOLEAN DEFAULT FALSE,
    休憩4min INT DEFAULT 0,
    休憩４反映 BOOLEAN DEFAULT FALSE,
    休憩5min INT DEFAULT 0,
    休憩５反映 BOOLEAN DEFAULT FALSE,
    休憩６min INT DEFAULT 0,
    休憩６反映 BOOLEAN DEFAULT FALSE,
    休憩７min INT DEFAULT 0,
    休憩７反映 BOOLEAN DEFAULT FALSE,

    生産進捗率 DECIMAL(5,2) GENERATED ALWAYS AS ((生産数 / 合計数) * 100) STORED COMMENT '進捗率 (%)',

    Aライン表示 BOOLEAN DEFAULT FALSE,
    Bライン表示 BOOLEAN DEFAULT FALSE,
    Cライン表示 BOOLEAN DEFAULT FALSE,
    Dライン表示 BOOLEAN DEFAULT FALSE,
    Eライン表示 BOOLEAN DEFAULT FALSE,
    Fライン表示 BOOLEAN DEFAULT FALSE,

    更新回避 BOOLEAN DEFAULT FALSE COMMENT '自動更新を避ける',
    カウント数 INT DEFAULT 0 COMMENT 'カウント数',
    クリックして追加 VARCHAR(255) DEFAULT NULL COMMENT '追加情報',

    FOREIGN KEY (盛付ライン) REFERENCES 生産ライン(ライン名) ON DELETE CASCADE
);

CREATE TABLE Eライン生産データ (

    商品コード INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品コード',
    商品名 VARCHAR(100) NOT NULL COMMENT '商品名',
    ラインコード INT NOT NULL COMMENT 'ラインコード (例: 1 = Aライン)',
    盛付ライン VARCHAR(50) NOT NULL COMMENT '盛付ライン名 (例: Aライン)',
    
    合計数 INT NOT NULL COMMENT '合計生産数',
    生産数 INT DEFAULT 0 COMMENT '現在までの生産数',
    残数 INT GENERATED ALWAYS AS (合計数 - 生産数) STORED COMMENT '残り数',
    
    生産性セットmin INT COMMENT '生産性セット（分）',
    開始時刻 DATETIME COMMENT '生産開始時刻',
    終了時刻 DATETIME COMMENT '生産終了時刻',
    終了見込時刻 DATETIME COMMENT '終了見込時刻',
    生産時間_min単位 INT COMMENT '生産にかかった時間（分単位）',
    準備セット数min INT COMMENT '準備時間（分）',
    予定通過時刻 DATETIME COMMENT '予定通過時刻',
    準備セット数 INT COMMENT '準備セット数',
    
    生産開始日 DATE COMMENT '生産開始日',
    予定開始時刻 TIME COMMENT '予定開始時刻',
    生産終了日 DATE COMMENT '生産終了日',
    予定終了時刻 TIME COMMENT '予定終了時刻',
    
    打刻記録 DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打刻記録',
    休憩min INT DEFAULT 0 COMMENT '休憩時間（分）',
    休憩反映 BOOLEAN DEFAULT FALSE COMMENT '休憩反映',
    中断時刻 DATETIME COMMENT '中断時刻',
    再開時刻 DATETIME COMMENT '再開時刻',
    作業開始前min INT COMMENT '作業開始前準備（分）',
    
    休憩２min INT DEFAULT 0,
    休憩２反映 BOOLEAN DEFAULT FALSE,
    休憩3min INT DEFAULT 0,
    休憩３反映 BOOLEAN DEFAULT FALSE,
    休憩4min INT DEFAULT 0,
    休憩４反映 BOOLEAN DEFAULT FALSE,
    休憩5min INT DEFAULT 0,
    休憩５反映 BOOLEAN DEFAULT FALSE,
    休憩６min INT DEFAULT 0,
    休憩６反映 BOOLEAN DEFAULT FALSE,
    休憩７min INT DEFAULT 0,
    休憩７反映 BOOLEAN DEFAULT FALSE,

    生産進捗率 DECIMAL(5,2) GENERATED ALWAYS AS ((生産数 / 合計数) * 100) STORED COMMENT '進捗率 (%)',

    Aライン表示 BOOLEAN DEFAULT FALSE,
    Bライン表示 BOOLEAN DEFAULT FALSE,
    Cライン表示 BOOLEAN DEFAULT FALSE,
    Dライン表示 BOOLEAN DEFAULT FALSE,
    Eライン表示 BOOLEAN DEFAULT FALSE,
    Fライン表示 BOOLEAN DEFAULT FALSE,

    更新回避 BOOLEAN DEFAULT FALSE COMMENT '自動更新を避ける',
    カウント数 INT DEFAULT 0 COMMENT 'カウント数',
    クリックして追加 VARCHAR(255) DEFAULT NULL COMMENT '追加情報',

    FOREIGN KEY (盛付ライン) REFERENCES 生産ライン(ライン名) ON DELETE CASCADE
);

CREATE TABLE Fライン生産データ (

    商品コード INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品コード',
    商品名 VARCHAR(100) NOT NULL COMMENT '商品名',
    ラインコード INT NOT NULL COMMENT 'ラインコード (例: 1 = Aライン)',
    盛付ライン VARCHAR(50) NOT NULL COMMENT '盛付ライン名 (例: Aライン)',
    
    合計数 INT NOT NULL COMMENT '合計生産数',
    生産数 INT DEFAULT 0 COMMENT '現在までの生産数',
    残数 INT GENERATED ALWAYS AS (合計数 - 生産数) STORED COMMENT '残り数',
    
    生産性セットmin INT COMMENT '生産性セット（分）',
    開始時刻 DATETIME COMMENT '生産開始時刻',
    終了時刻 DATETIME COMMENT '生産終了時刻',
    終了見込時刻 DATETIME COMMENT '終了見込時刻',
    生産時間_min単位 INT COMMENT '生産にかかった時間（分単位）',
    準備セット数min INT COMMENT '準備時間（分）',
    予定通過時刻 DATETIME COMMENT '予定通過時刻',
    準備セット数 INT COMMENT '準備セット数',
    
    生産開始日 DATE COMMENT '生産開始日',
    予定開始時刻 TIME COMMENT '予定開始時刻',
    生産終了日 DATE COMMENT '生産終了日',
    予定終了時刻 TIME COMMENT '予定終了時刻',
    
    打刻記録 DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打刻記録',
    休憩min INT DEFAULT 0 COMMENT '休憩時間（分）',
    休憩反映 BOOLEAN DEFAULT FALSE COMMENT '休憩反映',
    中断時刻 DATETIME COMMENT '中断時刻',
    再開時刻 DATETIME COMMENT '再開時刻',
    作業開始前min INT COMMENT '作業開始前準備（分）',
    
    休憩２min INT DEFAULT 0,
    休憩２反映 BOOLEAN DEFAULT FALSE,
    休憩3min INT DEFAULT 0,
    休憩３反映 BOOLEAN DEFAULT FALSE,
    休憩4min INT DEFAULT 0,
    休憩４反映 BOOLEAN DEFAULT FALSE,
    休憩5min INT DEFAULT 0,
    休憩５反映 BOOLEAN DEFAULT FALSE,
    休憩６min INT DEFAULT 0,
    休憩６反映 BOOLEAN DEFAULT FALSE,
    休憩７min INT DEFAULT 0,
    休憩７反映 BOOLEAN DEFAULT FALSE,

    生産進捗率 DECIMAL(5,2) GENERATED ALWAYS AS ((生産数 / 合計数) * 100) STORED COMMENT '進捗率 (%)',

    Aライン表示 BOOLEAN DEFAULT FALSE,
    Bライン表示 BOOLEAN DEFAULT FALSE,
    Cライン表示 BOOLEAN DEFAULT FALSE,
    Dライン表示 BOOLEAN DEFAULT FALSE,
    Eライン表示 BOOLEAN DEFAULT FALSE,
    Fライン表示 BOOLEAN DEFAULT FALSE,

    更新回避 BOOLEAN DEFAULT FALSE COMMENT '自動更新を避ける',
    カウント数 INT DEFAULT 0 COMMENT 'カウント数',
    クリックして追加 VARCHAR(255) DEFAULT NULL COMMENT '追加情報',

    FOREIGN KEY (盛付ライン) REFERENCES 生産ライン(ライン名) ON DELETE CASCADE
);

SELECT * FROM 生産ライン;

SELECT * FROM aライン生産データ;

SELECT * FROM bライン生産データ;

SELECT * FROM Cライン生産データ;

SELECT * FROM dライン生産データ;

SELECT * FROM eライン生産データ;

SELECT * FROM fライン生産データ;

ALTER TABLE カウント履歴
  DROP FOREIGN KEY fk_カウント履歴_生産タスク;
  
ALTER TABLE Fライン生産データ
    ADD COLUMN 自動数 INT DEFAULT 0 AFTER 生産数;
    
ALTER TABLE fライン生産データ
	MODIFY COLUMN 生産終了日 DATE COMMENT '生産終了日'  AFTER 予定終了時刻;

予定開始時刻 TIME COMMENT '予定開始時刻'
予定終了時刻 TIME COMMENT '予定終了時刻'
生産終了日 DATE COMMENT '生産終了日' 