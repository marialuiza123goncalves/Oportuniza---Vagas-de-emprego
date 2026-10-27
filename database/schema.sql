CREATE DATABASE IF NOT EXISTS oportuniza
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE oportuniza;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(110) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS opportunities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('job', 'training') NOT NULL,
  organization VARCHAR(160) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  location VARCHAR(160) NULL,
  modality ENUM('onsite', 'hybrid', 'remote') NOT NULL,
  contract_type ENUM('full_time', 'part_time', 'temporary', 'internship', 'apprenticeship', 'contractor') NOT NULL DEFAULT 'full_time',
  requirements TEXT NULL,
  application_url VARCHAR(2048) NOT NULL,
  deadline DATE NULL,
  status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_opportunities_public_listing (status, type, category_id, created_at),
  KEY idx_opportunities_created_by (created_by),
  CONSTRAINT fk_opportunities_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_opportunities_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @contract_type_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'opportunities'
    AND column_name = 'contract_type'
);
SET @contract_type_ddl = IF(
  @contract_type_exists = 0,
  'ALTER TABLE opportunities ADD COLUMN contract_type ENUM(''full_time'', ''part_time'', ''temporary'', ''internship'', ''apprenticeship'', ''contractor'') NOT NULL DEFAULT ''full_time''',
  'SELECT 1'
);
PREPARE contract_type_stmt FROM @contract_type_ddl;
EXECUTE contract_type_stmt;
DEALLOCATE PREPARE contract_type_stmt;

ALTER TABLE opportunities
  MODIFY COLUMN created_by BIGINT UNSIGNED NULL;

CREATE TABLE IF NOT EXISTS courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  institution VARCHAR(160) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  modality ENUM('onsite', 'hybrid', 'remote') NOT NULL,
  workload_hours SMALLINT UNSIGNED NOT NULL,
  access_url VARCHAR(2048) NOT NULL,
  status ENUM('published', 'closed') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_courses_public_listing (status, category_id, created_at),
  CONSTRAINT chk_courses_workload_hours CHECK (workload_hours > 0),
  CONSTRAINT fk_courses_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @workload_check_exists = (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'courses'
    AND constraint_name = 'chk_courses_workload_hours'
    AND constraint_type = 'CHECK'
);
SET @workload_check_ddl = IF(
  @workload_check_exists = 0,
  'ALTER TABLE courses ADD CONSTRAINT chk_courses_workload_hours CHECK (workload_hours > 0)',
  'SELECT 1'
);
PREPARE workload_check_stmt FROM @workload_check_ddl;
EXECUTE workload_check_stmt;
DEALLOCATE PREPARE workload_check_stmt;

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Administração', 'administracao'),
  ('Atendimento', 'atendimento'),
  ('Comércio', 'comercio'),
  ('Educação', 'educacao'),
  ('Tecnologia', 'tecnologia'),
  ('Capacitação geral', 'capacitacao-geral');

INSERT INTO opportunities
  (title, description, type, organization, category_id, location, modality, contract_type,
   requirements, application_url, deadline, status, created_by)
SELECT
  'Assistente administrativo',
  'Apoio às rotinas administrativas, organização de documentos e atendimento a equipes internas.',
  'job', 'Instituto Horizonte', c.id, 'São Paulo, SP', 'hybrid', 'full_time',
  'Ensino médio completo; conhecimento básico de planilhas.',
  'https://example.org/oportunidades/assistente-administrativo',
  DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'published', NULL
FROM categories c
WHERE c.slug = 'administracao'
  AND NOT EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.title = 'Assistente administrativo'
      AND o.organization = 'Instituto Horizonte'
  );

INSERT INTO opportunities
  (title, description, type, organization, category_id, location, modality, contract_type,
   requirements, application_url, deadline, status, created_by)
SELECT
  'Desenvolvedor(a) web júnior',
  'Participação em projetos web com acompanhamento de uma equipe multidisciplinar.',
  'job', 'Cooperativa Aurora', c.id, 'Brasil', 'remote', 'internship',
  'Noções de HTML, CSS e JavaScript; interesse em desenvolvimento de software.',
  'https://example.org/oportunidades/desenvolvimento-web-junior',
  DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 'published', NULL
FROM categories c
WHERE c.slug = 'tecnologia'
  AND NOT EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.title = 'Desenvolvedor(a) web júnior'
      AND o.organization = 'Cooperativa Aurora'
  );

INSERT INTO opportunities
  (title, description, type, organization, category_id, location, modality, contract_type,
   requirements, application_url, deadline, status, created_by)
SELECT
  samples.title, samples.description, 'job', samples.organization, c.id,
  samples.location, samples.modality, samples.contract_type, samples.requirements,
  CONCAT('https://example.org/oportuniza-demo/vagas/', samples.slug),
  DATE_ADD(CURRENT_DATE, INTERVAL samples.deadline_days DAY), 'published', NULL
FROM (
  SELECT
    'Auxiliar de atendimento' AS title,
    'Apoio no atendimento a clientes, esclarecimento de dúvidas e encaminhamento de solicitações.' AS description,
    'Central Conecta' AS organization, 'atendimento' AS category_slug,
    'Belo Horizonte, MG' AS location, 'onsite' AS modality, 'full_time' AS contract_type,
    'Ensino médio completo; boa comunicação e organização.' AS requirements,
    'auxiliar-atendimento-central-conecta' AS slug, 28 AS deadline_days
  UNION ALL SELECT
    'Assistente de logística',
    'Acompanhamento de pedidos, atualização de planilhas e apoio à organização de entregas.',
    'Rota Sul Distribuição', 'comercio', 'Curitiba, PR', 'hybrid', 'full_time',
    'Ensino médio completo; conhecimentos básicos de informática.',
    'assistente-logistica-rota-sul', 32
  UNION ALL SELECT
    'Analista de dados júnior',
    'Apoio à preparação de relatórios e à análise de indicadores para diferentes equipes.',
    'Núcleo Dados Abertos', 'tecnologia', 'Brasil', 'remote', 'full_time',
    'Conhecimentos iniciais de planilhas e SQL; interesse em análise de dados.',
    'analista-dados-junior-nucleo', 35
  UNION ALL SELECT
    'Auxiliar de estoque',
    'Conferência de mercadorias, organização do estoque e suporte ao controle de entradas e saídas.',
    'Mercado Estação', 'comercio', 'Recife, PE', 'onsite', 'part_time',
    'Atenção a detalhes e disponibilidade para trabalho presencial.',
    'auxiliar-estoque-mercado-estacao', 24
  UNION ALL SELECT
    'Assistente de recursos humanos',
    'Suporte a rotinas de recrutamento, organização de documentos e atendimento interno.',
    'Grupo Caminhos', 'administracao', 'São Paulo, SP', 'hybrid', 'full_time',
    'Ensino superior em andamento ou concluído em áreas relacionadas; organização.',
    'assistente-recursos-humanos-grupo-caminhos', 30
  UNION ALL SELECT
    'Suporte técnico de informática',
    'Atendimento inicial a chamados, orientação a usuários e registro das soluções aplicadas.',
    'Oficina Digital', 'tecnologia', 'Porto Alegre, RS', 'hybrid', 'temporary',
    'Noções de sistemas operacionais, redes e atendimento ao usuário.',
    'suporte-tecnico-oficina-digital', 21
  UNION ALL SELECT
    'Auxiliar de produção',
    'Apoio às etapas de produção, organização do posto de trabalho e conferência de materiais.',
    'Cooperativa Vale Vivo', 'capacitacao-geral', 'Campinas, SP', 'onsite', 'full_time',
    'Ensino médio completo; atenção a procedimentos de segurança.',
    'auxiliar-producao-vale-vivo', 26
  UNION ALL SELECT
    'Assistente financeiro',
    'Apoio à conferência de documentos, lançamentos e organização de rotinas financeiras.',
    'Horizonte Serviços', 'administracao', 'Brasil', 'remote', 'part_time',
    'Conhecimentos básicos de planilhas e interesse em rotinas financeiras.',
    'assistente-financeiro-horizonte', 33
) AS samples
INNER JOIN categories c ON c.slug = samples.category_slug
WHERE NOT EXISTS (
  SELECT 1 FROM opportunities o
  WHERE o.title = samples.title AND o.organization = samples.organization
);

INSERT INTO courses
  (title, description, institution, category_id, modality, workload_hours, access_url, status)
SELECT
  'Introdução à programação web',
  'Fundamentos de HTML, CSS e JavaScript para criar páginas acessíveis e responsivas.',
  'Escola Virtual Fundação Bradesco', c.id, 'remote', 20,
  'https://www.ev.org.br/cursos/linguagem-de-programacao-html-css-javascript',
  'published'
FROM categories c
WHERE c.slug = 'tecnologia'
  AND NOT EXISTS (
    SELECT 1 FROM courses
    WHERE title = 'Introdução à programação web'
      AND institution = 'Escola Virtual Fundação Bradesco'
  );

INSERT INTO courses
  (title, description, institution, category_id, modality, workload_hours, access_url, status)
SELECT
  'Atendimento ao público',
  'Boas práticas de comunicação, escuta ativa e atendimento humanizado.',
  'Escola Virtual Gov.br', c.id, 'remote', 20,
  'https://www.escolavirtual.gov.br/',
  'published'
FROM categories c
WHERE c.slug = 'atendimento'
  AND NOT EXISTS (
    SELECT 1 FROM courses
    WHERE title = 'Atendimento ao público'
      AND institution = 'Escola Virtual Gov.br'
  );

INSERT INTO courses
  (title, description, institution, category_id, modality, workload_hours, access_url, status)
SELECT
  samples.title, samples.description, samples.institution, c.id,
  samples.modality, samples.workload_hours, samples.access_url, 'published'
FROM (
  SELECT
    'Excel para o dia a dia' AS title,
    'Prática com planilhas, fórmulas e organização de dados para rotinas profissionais.' AS description,
    'Escola Virtual Fundação Bradesco' AS institution, 'administracao' AS category_slug,
    'remote' AS modality, 20 AS workload_hours, 'https://www.ev.org.br/' AS access_url
  UNION ALL SELECT
    'Comunicação e atendimento humanizado',
    'Conteúdos introdutórios sobre comunicação, escuta e relacionamento com o público.',
    'Escola Virtual Gov.br', 'atendimento', 'remote', 20, 'https://www.escolavirtual.gov.br/'
  UNION ALL SELECT
    'Fundamentos de gestão de projetos',
    'Introdução ao planejamento de tarefas, organização de etapas e acompanhamento de projetos.',
    'Escola Virtual Fundação Bradesco', 'administracao', 'remote', 10, 'https://www.ev.org.br/'
  UNION ALL SELECT
    'Noções de vendas e relacionamento com clientes',
    'Conceitos básicos de vendas, relacionamento com clientes e apresentação de produtos.',
    'Escola Virtual Gov.br', 'comercio', 'remote', 20, 'https://www.escolavirtual.gov.br/'
  UNION ALL SELECT
    'Tecnologia e cidadania digital',
    'Noções de segurança, comunicação e uso responsável de serviços digitais.',
    'Escola Virtual Gov.br', 'capacitacao-geral', 'remote', 20, 'https://www.escolavirtual.gov.br/'
) AS samples
INNER JOIN categories c ON c.slug = samples.category_slug
WHERE NOT EXISTS (
  SELECT 1 FROM courses course
  WHERE course.title = samples.title AND course.institution = samples.institution
);
