# Oportuniza — documentação final para apresentação

## Identificação e resumo

**Oportuniza** é uma aplicação web para consultar vagas de emprego e oportunidades de capacitação profissional. Visitantes podem pesquisar oportunidades publicadas e cursos; uma pessoa administradora autenticada pode cadastrar, consultar, editar e excluir vagas e cursos. Os registros são armazenados em MySQL por meio de uma API REST.

Esta entrega é um projeto acadêmico funcional. Os dados iniciais servem para demonstrar a aplicação e não representam vagas confirmadas nem resultados de empregabilidade.

## Problema, justificativa e objetivos

### Problema

Informações sobre trabalho e qualificação podem estar dispersas em diferentes páginas e serviços. Isso pode tornar mais difícil para uma pessoa encontrar alternativas pertinentes à sua trajetória. O projeto aborda esse problema oferecendo um ponto único de consulta para vagas e cursos.

### Justificativa

O acesso a oportunidades de trabalho e aprendizagem é relevante para a participação econômica e o desenvolvimento profissional. Uma plataforma simples que reúne essas informações pode facilitar sua consulta e demonstra, em um projeto concreto, como uma aplicação web integra interface, API e banco de dados.

### Objetivo geral

Desenvolver uma aplicação web que permita consultar vagas e cursos e ofereça à administração CRUD de vagas e cursos integrado ao MySQL.

### Objetivos específicos

- Apresentar vagas publicadas com busca e filtros.
- Disponibilizar consulta e filtragem de cursos publicados.
- Permitir que uma pessoa administradora autenticada cadastre, liste, edite e exclua vagas e cursos.
- Validar dados no backend e apresentar estados de carregamento, erro e lista vazia na interface.
- Persistir os registros em banco relacional e proteger operações administrativas.
- Documentar a instalação, execução e demonstração do sistema.

## Público-alvo, ODS e impacto

O público a que a plataforma se destina são **pessoas maiores de 18 anos** que buscam oportunidades profissionais ou de capacitação. A aplicação informa esse público-alvo, mas **não implementa verificação de idade**.

O projeto se alinha ao **ODS 8 — Trabalho Decente e Crescimento Econômico**, que trata de trabalho digno e crescimento econômico. A relação está no propósito de ampliar o acesso à consulta de oportunidades de trabalho e aprendizagem; o software, por si só, não garante emprego nem qualificação.

### Impacto social esperado

Espera-se que a reunião de vagas e cursos em uma interface acessível facilite a descoberta de possibilidades profissionais e de capacitação. Esse é um impacto pretendido, não um resultado medido: não foram realizados estudos com usuários, nem há dados que comprovem aumento de empregabilidade, renda ou participação em cursos.

## Tecnologias e arquitetura

- **Frontend:** React e JavaScript, com Vite.
- **Backend:** Node.js e Express, em JavaScript, expondo API REST.
- **Banco de dados:** MySQL, acessado com `mysql2`.
- **Autenticação administrativa:** senha armazenada como hash com `bcryptjs`; token JWT com validade de oito horas.
- **Outros recursos:** `cors` para controlar a origem do frontend; `helmet` para cabeçalhos HTTP; `express-rate-limit` para limitar tentativas de login; `dotenv` para configuração local.

### Fluxo da aplicação

```text
Navegador
  └── React (client/)
        └── requisições HTTP/JSON
              └── API REST Express (server/)
                    ├── rotas e validação
                    ├── autenticação administrativa
                    └── consultas parametrizadas via mysql2
                          └── MySQL (oportuniza)
```

A interface pública usa rotas de leitura para vagas, cursos, categorias e indicadores. As operações administrativas de vagas exigem autenticação. O segredo JWT e as credenciais MySQL ficam no `.env` do servidor; não devem ser colocados no frontend nem versionados.

### Organização do projeto

```text
database/schema.sql
client/
  src/components/     Componentes reutilizáveis da interface
  src/pages/          Páginas públicas, formulário, login e painel
  src/services/       Comunicação com a API
server/
  scripts/            Inicialização/verificação do banco e criação de admin
  src/config/         Configuração MySQL
  src/controllers/    Validação e controle do CRUD de vagas
  src/middleware/     Autenticação administrativa
  src/repositories/   Consultas MySQL de vagas
  src/routes/         Rotas REST
docs/
  documentacao-final-arandue.md
```

## Modelo de dados MySQL

O esquema está em [`database/schema.sql`](../database/schema.sql). Ele cria o banco `oportuniza`, as tabelas abaixo, índices e dados iniciais de demonstração. Não contém senhas de conexão.

| Tabela | Conteúdo e campos principais |
|---|---|
| `users` | Contas administrativas: `id`, `name`, `email` único, `password_hash`, `is_active` e datas de criação/atualização. |
| `categories` | Categorias compartilhadas: `id`, `name` e `slug`, ambos únicos. |
| `opportunities` | Vagas e oportunidades: `id`, título, descrição, tipo (`job`/`training`), organização, categoria, localidade, modalidade, tipo de contratação, requisitos, link, prazo, situação (`draft`/`published`/`closed`), administrador criador e datas. |
| `courses` | Cursos: `id`, título, descrição, instituição, categoria, modalidade, carga horária, link de acesso, situação e data de cadastro. A carga horária deve ser positiva. |

### Relacionamentos

- Uma categoria pode estar associada a várias oportunidades; cada oportunidade tem uma categoria (`opportunities.category_id` → `categories.id`).
- Uma categoria pode estar associada a vários cursos; cada curso tem uma categoria (`courses.category_id` → `categories.id`).
- Uma pessoa administradora pode criar várias oportunidades (`opportunities.created_by` → `users.id`). Esse campo permite `NULL` para registros de demonstração.
- As chaves estrangeiras impedem remover categorias ou administradores referenciados enquanto existirem oportunidades dependentes.
- Não há relacionamento de cursos com usuários, candidaturas ou administradores nesta versão.

## Funcionalidades implementadas

- Página inicial com vagas publicadas, busca, filtros e indicadores de vagas e cursos.
- Detalhes de uma vaga publicada.
- Página de cursos publicados, com busca e filtros; cada cartão oferece um link externo.
- Página “Sobre” com a proposta do site, público-alvo, alinhamento ao ODS 8 e uma nota sobre registros de demonstração.
- Login administrativo e painel de vagas.
- Formulário para cadastrar e editar vagas; modal para confirmar exclusão.
- Painel administrativo de cursos com cadastro, listagem, edição e exclusão.
- Componentes reutilizáveis, interface responsiva e estados de carregamento, erro e lista vazia.
- Validação de campos, datas, categorias, modalidades, URLs e tipos de contratação no backend.
- Consultas parametrizadas ao MySQL para as operações de dados.

### API principal

Os caminhos abaixo são prefixados por `/api`. As rotas administrativas de consulta e as operações de escrita de vagas e cursos exigem autenticação por token administrativo. O token é obtido pelo endpoint de login.

| Método e caminho | Ação | Acesso |
|---|---|---|
| `GET /api/health` | Verifica API e conexão com o MySQL. | Público |
| `POST /api/auth/login` | Autentica com `email` e `password`; em caso de sucesso retorna token e dados administrativos. | Público, com limitação de tentativas |
| `GET /api/categories` | Lista categorias disponíveis. | Público |
| `GET /api/stats` | Retorna totais de vagas e cursos publicados. | Público |
| `GET /api/vagas?q=&categoryId=&modality=` | Lista vagas publicadas, com filtros opcionais. | Público |
| `GET /api/vagas/:id` | Consulta uma vaga publicada. | Público |
| `GET /api/vagas/admin` | Lista vagas para o painel. | Administrativo |
| `GET /api/vagas/admin/:id` | Consulta uma vaga no painel. | Administrativo |
| `POST /api/vagas` | Cadastra uma vaga. Retorna `201` quando criada. | Administrativo |
| `PUT /api/vagas/:id` | Atualiza uma vaga. | Administrativo |
| `DELETE /api/vagas/:id` | Exclui uma vaga. Retorna `204` quando excluída. | Administrativo |
| `GET /api/courses?q=&categoryId=&modality=` | Lista cursos publicados e permite filtrá-los. | Público |
| `GET /api/courses/admin` | Lista todos os cursos para administração. | Administrativo |
| `GET /api/courses/admin/:id` | Consulta um curso para edição. | Administrativo |
| `POST /api/courses` | Cadastra um curso. Retorna `201` quando criado. | Administrativo |
| `PUT /api/courses/:id` | Atualiza um curso. | Administrativo |
| `DELETE /api/courses/:id` | Exclui um curso. Retorna `204` quando excluído. | Administrativo |

Os campos aceitos na API de vagas incluem `titulo`, `descricao`, `empresa`, `categoria_id`, `modalidade`, `localizacao`, `tipo_contratacao`, `requisitos`, `link_candidatura`, `prazo_candidatura` e `status`. Os campos dos cursos incluem `title`, `description`, `institution`, `categoryId`, `modality`, `workloadHours`, `accessUrl` e `status`. As modalidades são `onsite`, `hybrid` e `remote`; os tipos de contratação incluem tempo integral, parcial, temporário, estágio, aprendizagem e prestação de serviço. Os cursos de demonstração são carregados pelo esquema SQL e também podem ser administrados pela interface.

O backend também mantém rotas legadas em `/api/opportunities` e `/api/admin/opportunities`; a interface atual usa `/api/vagas`.

## Instalação e execução

Pré-requisitos: Node.js com npm, MySQL Server ativo e credenciais de uma conta MySQL com acesso ao banco. Os comandos abaixo são para PowerShell no terminal integrado do VS Code e pressupõem que o projeto está em `C:\Projeto-Final`.

1. Na raiz do projeto, crie a configuração local a partir do exemplo:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

2. Edite `server\.env` localmente. Preencha `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_DATABASE`. Defina também:
   - `JWT_SECRET`: segredo aleatório com no mínimo 32 bytes.
   - `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`: credenciais para criar a conta administrativa; a senha deve ter pelo menos 12 caracteres.

   Para gerar uma chave JWT localmente, execute `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e copie o resultado diretamente para `JWT_SECRET` em `server\.env`. **Não compartilhe a chave, a senha nem o arquivo.**

3. Em um terminal, instale e configure o backend:

   ```powershell
   cd C:\Projeto-Final\server
   npm install
   npm run db:init
   npm run db:check
   npm run admin:create
   ```

   `db:init` cria/atualiza as tabelas e insere os dados iniciais. `db:check` confirma a conexão e as tabelas. `admin:create` cria o administrador configurado no `.env`; se o e-mail já estiver cadastrado, o script informa que não altera a conta existente.

4. Inicie a API no primeiro terminal e deixe-o aberto:

   ```powershell
   npm start
   ```

   Endereço padrão: `http://localhost:3000`. Para verificar, abra `http://localhost:3000/api/health`; a resposta esperada informa `status: ok` e `database: connected`.

5. Em outro terminal, instale e inicie o frontend:

   ```powershell
   cd C:\Projeto-Final\client
   npm install
   npm run dev
   ```

6. Abra o endereço indicado pelo Vite, normalmente `http://localhost:5173`. Os dois terminais (API e frontend) precisam permanecer abertos durante a demonstração.

Para verificação de build, execute `npm run build` na pasta `client`. O painel também oferece CRUD de cursos; durante a apresentação, priorize o CRUD de vagas solicitado.

## Testes realizados e resultados

Os testes abaixo foram executados no ambiente local de desenvolvimento com MySQL 8.0.46:

- `npm run db:init` foi executado e repetido; `npm run db:check` confirmou a conexão e as quatro tabelas, incluindo colunas essenciais.
- Foram consultadas as tabelas e os dados de demonstração. Os registros temporários de teste de vagas e de cursos foram removidos após os fluxos de persistência.
- A API foi exercitada para cadastro, listagem, edição e exclusão de vagas, além de autenticação, filtros, validações e casos de registro inexistente. Consultas ao MySQL confirmaram a persistência e a remoção.
- Na interface, o CRUD de vagas foi demonstrado: cadastro de uma vaga, presença na listagem, edição de campos (incluindo contratação e prazo), e exclusão pela confirmação do modal. A vaga de teste foi confirmada no MySQL após criar/editar e ausente após excluir.
- Na interface, o CRUD administrativo de cursos também foi percorrido: cadastro, atualização de título e carga horária e exclusão com modal. O curso de teste foi removido e sua ausência foi confirmada no MySQL.
- A API de cursos foi exercitada com autenticação, validação de entrada, cadastro, listagem pública e administrativa, edição confirmada por consulta MySQL, exclusão e resposta `404` para o registro removido.
- Foram verificados campos obrigatórios e dados inválidos, respostas para registros inexistentes, token de conta administrativa inativa e JSON malformado.
- A API respondeu com sucesso no health check e o login administrativo emitiu token após a configuração de `JWT_SECRET`.
- O build de produção do frontend concluiu com sucesso (`vite build`).
- `npm audit --audit-level=moderate` informou zero vulnerabilidades conhecidas para as dependências do frontend e do backend no momento da execução.
- A interface foi observada em viewport móvel de 390 px; as páginas inicial e de cursos não apresentaram rolagem horizontal. Não houve erros JavaScript na verificação final do navegador.

**Observação de teste:** a automação do navegador registrou `net::ERR_ABORTED` na requisição DELETE durante a navegação/atualização da interface. A linha desapareceu do painel e a consulta direta confirmou que o registro foi removido do MySQL. Esse evento da automação deve ser tratado como uma observação de teste, não como prova de falha ou de ausência de falha em outros ambientes.

### Limites do que foi verificado

- Os testes de fluxo foram manuais e locais; não foi configurada uma suíte automatizada de testes de unidade ou de ponta a ponta.
- Não foram realizados ensaios de carga, implantação em produção, testes com usuários, medições de acessibilidade ou avaliação de impacto social.
- O workspace não era um repositório Git, portanto não foi possível validar arquivos rastreados ou staged pelo Git.
- As rotas de administração exigem uma conta cadastrada e ativa.

## Conclusão e melhorias futuras

O Oportuniza entrega uma aplicação web integrada em que vagas e cursos são consultados e administrados por interface React, API REST em Express e persistência real em MySQL. A validação local confirmou os fluxos do CRUD de vagas e cursos na API e percorreu ambos os CRUDs pela interface. Isso não demonstra impacto social mensurado.

Melhorias futuras possíveis, ainda não implementadas:

- Gestão administrativa das categorias.
- Fluxo de candidatura e acompanhamento de candidaturas, se fizer parte do escopo de uma próxima versão.
- Paginação na listagem principal de vagas, além dos filtros atuais.
- Testes automatizados de API e interface, testes de acessibilidade e avaliação com usuários.
- Preparação para produção: implantação, monitoramento, backups, política de retenção e revisão de segurança.
- Mecanismos apropriados para comunicar o público-alvo maior de 18 anos e avaliar se alguma verificação etária é necessária.

## Roteiro de apresentação oral — 5 minutos

### 0:00–0:40 | Apresentação

> Olá, vou apresentar o Oportuniza, uma plataforma web para consulta de vagas de emprego e oportunidades de capacitação. O público-alvo são pessoas maiores de 18 anos. O projeto foi desenvolvido como uma aplicação completa: a interface conversa com uma API, que consulta e altera dados persistidos em MySQL.

### 0:40–1:20 | Problema, propósito e ODS 8

> A proposta parte da dificuldade de encontrar oportunidades profissionais e cursos em diferentes fontes. O Oportuniza reúne essas informações para facilitar sua consulta. A iniciativa se relaciona ao ODS 8, Trabalho Decente e Crescimento Econômico. Esse é o propósito do projeto; não afirmo que a aplicação já tenha aumentado a empregabilidade, pois não foi realizado um estudo de impacto.

### 1:20–2:00 | Tecnologias e dados

> O frontend foi feito em React e JavaScript. O backend usa Node.js, Express e uma API REST. O MySQL guarda usuários administrativos, categorias, oportunidades e cursos. As oportunidades e os cursos se relacionam com categorias; as oportunidades também podem registrar qual administrador as criou. As operações administrativas usam autenticação, validação e consultas parametrizadas.

### 2:00–2:30 | Consulta pública

**Demonstração:** abra a página inicial, mostre a listagem de vagas, aplique busca ou filtro e, em seguida, abra a página de cursos.

> Aqui estão as vagas publicadas e seus filtros. A página de cursos também pesquisa os registros publicados no banco e encaminha à instituição responsável pelo curso. No painel administrativo, também é possível cadastrar, editar e excluir cursos.

### 2:30–4:25 | Demonstração do CRUD de vagas

**Cadastro e listagem (aprox. 45 s):**

1. Entre em “Área administrativa” com a conta configurada.
2. Abra “Nova oportunidade” e preencha título, descrição, empresa, categoria, modalidade, tipo de contratação e link.
3. Salve e mostre a vaga no painel; se estiver publicada, mostre-a também na página inicial.

> O cadastro é enviado à API e gravado no MySQL; a interface atualiza a listagem com a resposta do servidor.

**Edição (aprox. 35 s):**

4. No painel, clique em “Editar”, altere o título ou a descrição e salve.
5. Mostre a informação atualizada na tabela.

> A edição também é persistida no banco; não é apenas uma alteração visual local.

**Exclusão (aprox. 35 s):**

6. Clique em “Excluir”, leia a confirmação e confirme a remoção.
7. Mostre que a vaga saiu do painel. Se houver tempo, atualize a listagem.

> A exclusão chama o endpoint DELETE e remove o registro do banco. Na auditoria, confirmei a remoção consultando o MySQL.

### 4:25–5:00 | Resultados, limites e encerramento

> Na auditoria local, verifiquei conexão com MySQL, endpoints, validações e os CRUDs de vagas e cursos pela interface, além do build de produção. Também confirmei que os dados temporários de teste foram removidos. Como próximos passos, proponho testes automatizados e preparação para produção. O impacto social permanece uma expectativa a ser avaliada com usuários e dados futuros. Obrigada.

**Dica de preparação:** inicie MySQL e os dois terminais antes da apresentação, confirme `http://localhost:3000/api/health`, tenha a conta administrativa pronta e faça um cadastro de demonstração que possa ser editado e excluído durante a fala.
