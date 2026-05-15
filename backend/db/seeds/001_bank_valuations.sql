-- Sample Bank Valuation Data for RealPrice
-- Ho Chi Minh City districts

INSERT INTO bank_valuations (district, ward, street_name, land_type, bank_name, valuation_per_m2, ltv_ratio, effective_from, effective_to)
VALUES
-- Quan 1
('Quan 1', 'Phuong Ben Nghe',   'Dong Khoi',       'residential', 'Vietcombank',  220000000, 0.700, '2024-01-01', NULL),
('Quan 1', 'Phuong Ben Nghe',   'Dong Khoi',       'commercial',  'Vietcombank',  280000000, 0.650, '2024-01-01', NULL),
('Quan 1', 'Phuong Ben Thanh',  'Le Loi',          'residential', 'BIDV',         200000000, 0.700, '2024-01-01', NULL),
('Quan 1', 'Phuong Ben Thanh',  'Le Loi',          'commercial',  'BIDV',         260000000, 0.650, '2024-01-01', NULL),
('Quan 1', 'Phuong Nguyen Thai Binh', 'Nguyen Hue', 'residential','Techcombank', 210000000, 0.700, '2024-01-01', NULL),
('Quan 1', NULL,                 NULL,              'residential', 'VPBank',       180000000, 0.700, '2024-01-01', NULL),

-- Quan 3
('Quan 3', 'Phuong 4',          'Vo Van Tan',      'residential', 'Vietcombank',  150000000, 0.700, '2024-01-01', NULL),
('Quan 3', 'Phuong 5',          'Nguyen Thi Minh Khai', 'residential', 'BIDV',   140000000, 0.700, '2024-01-01', NULL),
('Quan 3', NULL,                 NULL,              'residential', 'Techcombank',  130000000, 0.700, '2024-01-01', NULL),
('Quan 3', NULL,                 NULL,              'commercial',  'VPBank',       160000000, 0.650, '2024-01-01', NULL),

-- Quan 7
('Quan 7', 'Phuong Tan Phong',  'Nguyen Thi Thap', 'residential', 'Vietcombank',   90000000, 0.700, '2024-01-01', NULL),
('Quan 7', 'Phuong Tan Phong',  'Phu My Hung',     'residential', 'BIDV',         110000000, 0.750, '2024-01-01', NULL),
('Quan 7', 'Phuong Tan Hung',   NULL,              'residential', 'Techcombank',   85000000, 0.700, '2024-01-01', NULL),
('Quan 7', NULL,                 NULL,              'commercial',  'VPBank',       100000000, 0.650, '2024-01-01', NULL),

-- Binh Thanh
('Binh Thanh', 'Phuong 25',     'Dien Bien Phu',   'residential', 'Vietcombank',   80000000, 0.700, '2024-01-01', NULL),
('Binh Thanh', 'Phuong 22',     'Xo Viet Nghe Tinh', 'residential', 'BIDV',        75000000, 0.700, '2024-01-01', NULL),
('Binh Thanh', NULL,             NULL,              'residential', 'Techcombank',   70000000, 0.700, '2024-01-01', NULL),
('Binh Thanh', NULL,             NULL,              'agricultural','VPBank',         30000000, 0.600, '2024-01-01', NULL),

-- Thu Duc
('Thu Duc', 'Phuong Linh Trung', 'Vo Van Ngan',    'residential', 'Vietcombank',   55000000, 0.700, '2024-01-01', NULL),
('Thu Duc', 'Phuong Hiep Binh Chanh', NULL,        'residential', 'BIDV',           48000000, 0.700, '2024-01-01', NULL),
('Thu Duc', NULL,                 NULL,             'residential', 'Techcombank',    50000000, 0.700, '2024-01-01', NULL),
('Thu Duc', NULL,                 NULL,             'commercial',  'VPBank',         65000000, 0.650, '2024-01-01', NULL),

-- Quan Binh Tan
('Binh Tan', 'Phuong An Lac',   'Kinh Duong Vuong','residential', 'Vietcombank',   45000000, 0.700, '2024-01-01', NULL),
('Binh Tan', NULL,               NULL,             'residential', 'BIDV',           40000000, 0.700, '2024-01-01', NULL),
('Binh Tan', NULL,               NULL,             'industrial',  'VPBank',          35000000, 0.600, '2024-01-01', NULL),

-- Nha Be
('Nha Be',   'Phuong Phu Xuan', NULL,              'residential', 'Vietcombank',   35000000, 0.700, '2024-01-01', NULL),
('Nha Be',   NULL,               NULL,             'residential', 'BIDV',          32000000, 0.700, '2024-01-01', NULL),
('Nha Be',   NULL,               NULL,             'residential', 'Techcombank',   34000000, 0.750, '2024-01-01', NULL),
('Nha Be',   NULL,               NULL,             'residential', 'VPBank',        30000000, 0.650, '2024-01-01', NULL),
('Nha Be',   NULL,               NULL,             'agricultural','BIDV',            12000000, 0.600, '2024-01-01', NULL),

-- Can Gio
('Can Gio',  NULL,               NULL,             'residential', 'Vietcombank',   18000000, 0.650, '2024-01-01', NULL),
('Can Gio',  NULL,               NULL,             'agricultural','BIDV',             8000000, 0.500, '2024-01-01', NULL),

-- Ha Noi - Hoan Kiem
('Hoan Kiem', 'Phuong Hang Bong', 'Hang Bong',     'residential', 'Vietcombank',  200000000, 0.700, '2024-01-01', NULL),
('Hoan Kiem', 'Phuong Hang Gai',  'Hang Gai',      'commercial',  'BIDV',         240000000, 0.650, '2024-01-01', NULL),
('Hoan Kiem', NULL,                NULL,            'residential', 'Techcombank',  180000000, 0.700, '2024-01-01', NULL),

-- Ha Noi - Cau Giay
('Cau Giay', 'Phuong Dich Vong', NULL,             'residential', 'Vietcombank',   70000000, 0.700, '2024-01-01', NULL),
('Cau Giay', 'Phuong Mai Dich',  NULL,             'residential', 'BIDV',           65000000, 0.700, '2024-01-01', NULL),
('Cau Giay', NULL,                NULL,            'commercial',  'VPBank',          85000000, 0.650, '2024-01-01', NULL),

-- Ha Noi - Dong Da
('Dong Da',  'Phuong Lang Thuong', 'Tay Son',      'residential', 'Vietcombank',   90000000, 0.700, '2024-01-01', NULL),
('Dong Da',  NULL,                  NULL,           'residential', 'BIDV',           85000000, 0.700, '2024-01-01', NULL);
