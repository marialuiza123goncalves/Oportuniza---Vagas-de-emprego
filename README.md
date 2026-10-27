# Oportuniza

[Documentação final para apresentação à Aranduê, incluindo modelo de dados, API, resultados de teste e roteiro oral](docs/documentacao-final-arandue.md).

Plataforma de consulta a vagas de emprego e oportunidades de capacitação profissional, com foco em ampliar o acesso ao trabalho decente e à qualificação (ODS 8).

## Tecnologias

- Frontend: ReactJS e JavaScript (Vite).
- Backend: Node.js, JavaScript e API REST (Express).
- Banco de dados: MySQL.

## Configuração local

1. Instale e inicie o MySQL Server.
2. Na raiz do projeto, copie o exemplo de configuração e preencha a conexão MySQL:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

   `DB_USER` precisa poder criar o banco na inicialização (`npm run db:init`); se o banco já existir, basta conceder acesso a esse banco e às tabelas.
3. Configure `JWT_SECRET` com pelo menos 32 bytes. Gere um valor localmente no PowerShell:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Copie o resultado diretamente para `JWT_SECRET` em `server/.env`; não o compartilhe nem o versione. Preencha também `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` nesse arquivo para criar o primeiro administrador. A senha deve ter pelo menos 12 caracteres.
4. Na pasta `server`, instale as dependências, inicialize o banco e crie o administrador:

   ```powershell
   cd server
   npm install
   npm run db:init
   npm run db:check
   npm run admin:create
   ```

   `npm run db:init` executa o esquema em `database/schema.sql`, aplica alterações compatíveis ao banco já existente e inclui categorias, vagas e cursos iniciais. `npm run db:check` verifica a conexão e as quatro tabelas principais. `npm run admin:create` cria a conta indicada no `.env`; se o e-mail já existir, o comando falha sem alterar a conta. Remova `ADMIN_PASSWORD` do `.env` após a criação da conta.
5. Inicie a API em um terminal:

   ```powershell
   cd server
   npm start
   ```

   Ela fica disponível em `http://localhost:3000`.
6. Copie `client/.env.example` para `client/.env` se a API estiver em outro endereço. Em outro terminal, inicie o frontend:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

   Abra o endereço indicado pelo Vite (normalmente `http://localhost:5173`).

## API disponível

- `GET /api/health` — verifica a API e a conexão com o banco.
- `GET /api/categories` — lista categorias.
- `GET /api/stats` — retorna a quantidade de vagas e cursos publicados.
- `GET /api/vagas` e `GET /api/vagas/:id` — consulta vagas publicadas; aceita os filtros `q`, `categoryId` e `modality`.
- `GET /api/vagas/admin` e `GET /api/vagas/admin/:id` — lista e consulta todas as vagas no painel; exige token administrativo.
- `POST /api/vagas`, `PUT /api/vagas/:id` e `DELETE /api/vagas/:id` — CRUD de vagas, protegido por token administrativo.
- `GET /api/courses` — consulta cursos publicados; aceita `q`, `categoryId` e `modality`.
- `GET /api/courses/admin` e `GET /api/courses/admin/:id` — lista e consulta cursos no painel; exige token administrativo.
- `POST /api/courses`, `PUT /api/courses/:id` e `DELETE /api/courses/:id` — CRUD de cursos, protegido por token administrativo.
- `POST /api/auth/login` — autentica o administrador e retorna um token com validade de 8 horas.

`/api/vagas` recebe campos em português, por exemplo `titulo`, `descricao`, `empresa`, `categoria_id`, `modalidade`, `localizacao`, `tipo_contratacao`, `requisitos`, `link_candidatura` e `status`. As modalidades são `onsite`, `hybrid` e `remote`; os tipos de contratação são `full_time`, `part_time`, `temporary`, `internship`, `apprenticeship` e `contractor`. O backend valida os campos, usa consultas parametrizadas, limita tentativas de login e fornece mensagens de erro sem expor detalhes do banco na resposta. `CLIENT_ORIGIN` restringe a origem autorizada para o frontend.

As alterações administrativas de vagas e cursos exigem o cabeçalho `Authorization: Bearer <token>`. Obtenha um token em `POST /api/auth/login` enviando `{"email":"...","password":"..."}`. Cursos podem ser cadastrados, listados, editados e excluídos no painel; os cursos demonstrativos continuam sendo carregados pelo script SQL.

## Conteúdo de demonstração e página Sobre

O esquema SQL inclui registros de demonstração idempotentes: executá-lo novamente não duplica os registros com o mesmo título e organização/instituição. Esses exemplos não são anúncios confirmados; os links das vagas que usam `example.org` são ilustrativos e não recebem candidaturas. A interface informa que disponibilidade e condições devem ser confirmadas diretamente com a empresa ou instituição.

A página **Sobre** em `/sobre` apresenta a proposta da plataforma, seu público-alvo, o alinhamento ao ODS 8 e a ressalva de que o impacto social é esperado, não medido.

O esquema também pode ser executado diretamente pelo MySQL Workbench: abra `database/schema.sql`, conecte-se ao servidor MySQL e execute o script. Ele cria o banco `oportuniza` sem incluir senhas ou outros segredos. Para a configuração por `.env` e a inicialização idempotente, prefira `npm run db:init`.

## Demonstração

1. Entre na área administrativa, publique uma oportunidade com uma categoria existente e confirme que ela aparece na listagem pública.
2. Edite título, situação ou descrição e confirme a atualização no painel.
3. Encerre a oportunidade ou exclua-a; somente oportunidades publicadas aparecem para o público.
4. Use os filtros de tipo e categoria e abra os detalhes para conferir a descrição e o link externo de candidatura.

Para gerar os arquivos de produção do frontend, execute `npm run build` dentro de `client`.

## Organização

```text
database/
  schema.sql                  Banco, tabelas e registros de demonstração
client/
  src/components/             Componentes reutilizáveis e formulário
  src/pages/                  Consulta pública, login e painel administrativo
  src/services/               Comunicação com a API REST
server/
  scripts/                    Inicialização do banco e criação do administrador
  src/config/                 Configuração da conexão MySQL
  src/middleware/             Autenticação administrativa
  src/routes/                 Endpoints REST
  src/controllers/            Validação e controle das vagas
  src/repositories/           Consultas SQL parametrizadas das vagas
```

O banco relaciona administradores (`users`) e categorias (`categories`) a oportunidades (`opportunities`). Todas as alterações administrativas passam pela API e são persistidas no MySQL.
