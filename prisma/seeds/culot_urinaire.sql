-- =====================================================
-- Configuration complète du test Culot Urinaire (CU)
-- Structure hiérarchique à 3 niveaux
-- =====================================================

-- ÉTAPE 1 : Créer le groupe principal "Culot Urinaire"
INSERT INTO tests (id, code, name, category, resultType, isGroup, createdAt, updatedAt)
VALUES (
  'cu_main_' || hex(randomblob(8)),
  'CU',
  'Culot Urinaire',
  'Urologie',
  'text',
  1,
  datetime('now'),
  datetime('now')
);

-- Variables pour stocker les IDs (SQLite utilise last_insert_rowid())
-- Note: Dans SQLite, nous devons utiliser les codes pour faire les liens

-- ÉTAPE 2A : Créer le sous-groupe "Cytochimie Urinaire (Bandelette)"
INSERT INTO tests (id, code, name, category, resultType, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_cyto_' || hex(randomblob(8)),
  'CU_CYTO',
  'Cytochimie Urinaire (Bandelette)',
  'Urologie',
  'text',
  1,
  (SELECT id FROM tests WHERE code = 'CU' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- ÉTAPE 2B : Créer le sous-groupe "Examen Direct"
INSERT INTO tests (id, code, name, category, resultType, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_ed_' || hex(randomblob(8)),
  'CU_ED',
  'Examen Direct',
  'Urologie',
  'text',
  1,
  (SELECT id FROM tests WHERE code = 'CU' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- =====================================================
-- ÉTAPE 3 : Paramètres de la Cytochimie Urinaire (5)
-- =====================================================

-- 3.1 pH (Numérique)
INSERT INTO tests (id, code, name, category, resultType, unit, minValue, maxValue, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_ph_' || hex(randomblob(8)),
  'CU_PH',
  'pH',
  'Urologie',
  'numeric',
  NULL,
  4.5,
  8.0,
  0,
  (SELECT id FROM tests WHERE code = 'CU_CYTO' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- 3.2 Sang (Dropdown)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_sang_' || hex(randomblob(8)),
  'CU_SANG',
  'Sang',
  'Urologie',
  'dropdown',
  'Négatif, Traces, +, ++, +++',
  0,
  (SELECT id FROM tests WHERE code = 'CU_CYTO' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- 3.3 Acétonurie (Dropdown)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_acet_' || hex(randomblob(8)),
  'CU_ACET',
  'Acétonurie',
  'Urologie',
  'dropdown',
  'Négatif, Traces, +, ++, +++',
  0,
  (SELECT id FROM tests WHERE code = 'CU_CYTO' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- 3.4 Protéinurie (Dropdown)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_prot_' || hex(randomblob(8)),
  'CU_PROT',
  'Protéinurie',
  'Urologie',
  'dropdown',
  'Négatif, Traces, +, ++, +++',
  0,
  (SELECT id FROM tests WHERE code = 'CU_CYTO' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- 3.5 Leucocyturie (Dropdown)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_leuc_bandel_' || hex(randomblob(8)),
  'CU_LEUC_BANDEL',
  'Leucocyturie',
  'Urologie',
  'dropdown',
  'Négatif, Traces, +, ++, +++',
  0,
  (SELECT id FROM tests WHERE code = 'CU_CYTO' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- =====================================================
-- ÉTAPE 4 : Paramètres de l'Examen Direct (5)
-- TOUS EN QUALITATIF (Dropdown)
-- =====================================================

-- 4.1 Leucocytes (Qualitatif)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_leuc_ed_' || hex(randomblob(8)),
  'CU_LEUC_ED',
  'Leucocytes',
  'Urologie',
  'dropdown',
  'Absents, Rares, Quelques, Nombreux, Très nombreux',
  0,
  (SELECT id FROM tests WHERE code = 'CU_ED' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- 4.2 Hématies (Qualitatif)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_hem_' || hex(randomblob(8)),
  'CU_HEM',
  'Hématies',
  'Urologie',
  'dropdown',
  'Absents, Rares, Quelques, Nombreux, Très nombreux',
  0,
  (SELECT id FROM tests WHERE code = 'CU_ED' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- 4.3 Cellules Épithéliales (Qualitatif)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_cel_epi_' || hex(randomblob(8)),
  'CU_CEL_EPI',
  'Cellules Épithéliales',
  'Urologie',
  'dropdown',
  'Absentes, Rares, Quelques, Nombreuses',
  0,
  (SELECT id FROM tests WHERE code = 'CU_ED' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- 4.4 Cylindres (Qualitatif)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_cyl_' || hex(randomblob(8)),
  'CU_CYL',
  'Cylindres',
  'Urologie',
  'dropdown',
  'Absents, Cylindres hyalins, Cylindres granuleux, Cylindres leucocytaires, Cylindres hématiques',
  0,
  (SELECT id FROM tests WHERE code = 'CU_ED' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- 4.5 Cristaux (Qualitatif)
INSERT INTO tests (id, code, name, category, resultType, options, isGroup, parentId, createdAt, updatedAt)
VALUES (
  'cu_crist_' || hex(randomblob(8)),
  'CU_CRIST',
  'Cristaux',
  'Urologie',
  'dropdown',
  'Absents, Oxalate de calcium, Urate amorphe, Phosphate amorphe, Acide urique, Autres',
  0,
  (SELECT id FROM tests WHERE code = 'CU_ED' LIMIT 1),
  datetime('now'),
  datetime('now')
);

-- =====================================================
-- VÉRIFICATION : Afficher la structure créée
-- =====================================================
SELECT 
  CASE 
    WHEN parentId IS NULL THEN '📋 '
    WHEN isGroup = 1 THEN '  📊 '
    ELSE '    ▫️ '
  END || name AS "Structure",
  code AS "Code",
  CASE 
    WHEN isGroup = 1 THEN 'GROUPE'
    WHEN resultType = 'numeric' THEN 'Numérique'
    WHEN resultType = 'dropdown' THEN 'Liste de choix'
    ELSE resultType
  END AS "Type"
FROM tests 
WHERE code LIKE 'CU%' 
ORDER BY 
  CASE WHEN code = 'CU' THEN 1 WHEN code = 'CU_CYTO' THEN 2 WHEN code = 'CU_ED' THEN 3 ELSE 4 END,
  code;
