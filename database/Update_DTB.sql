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
    終了見込時刻 DATETIME COMMENT '終了見込時刻',--1
    生産時間_min単位 INT COMMENT '生産にかかった時間（分単位）',
    準備セット数min INT COMMENT '準備時間（分）',
    予定通過時刻 DATETIME COMMENT '予定通過時刻',
    準備セット数 INT COMMENT '準備セット数',
    
    生産開始日 DATE COMMENT '生産開始日',
    予定開始時刻 TIME COMMENT '予定開始時刻',
    生産終了日 DATE COMMENT '生産終了日',--2
    予定終了時刻 TIME COMMENT '予定終了時刻',--3
    
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