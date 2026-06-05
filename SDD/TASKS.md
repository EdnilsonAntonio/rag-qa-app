# TASKS.md

## Objetivo

Este documento define a ordem lógica de execução para expandir o projeto RAG·QA de forma segura, incremental e com baixo risco de regressões.

---

# Roadmap de Implementação

## Fase 1: Estabilização e Persistência (Core) ✅ (Concluído)

### Objetivo

Introduzir persistência de dados e histórico de conversação antes de adicionar autenticação e monetização.

### Tarefas

#### 1. Configurar Supabase

Criar a infraestrutura base no PostgreSQL.

**Tabelas:**

* Users
* Documents
* Messages

**Critérios de Aceitação:**

* Base de dados operacional.
* Migrações versionadas.
* Conexão integrada com a aplicação.

---

#### 2. Migrar Metadados dos Documentos

Alterar o fluxo de upload para persistir informações após a vetorização.

**Fluxo Atual**

```text
Upload
 ↓
PDF Parse
 ↓
Chunking
 ↓
Embeddings
 ↓
Pinecone
```

**Novo Fluxo**

```text
Upload
 ↓
PDF Parse
 ↓
Chunking
 ↓
Embeddings
 ↓
Pinecone
 ↓
Documents Table
```

**Dados Persistidos:**

* ID do documento
* Nome do ficheiro
* Namespace Pinecone
* Data de upload
* Proprietário do documento

**Critérios de Aceitação:**

* Todo documento processado gera um registo em `Documents`.
* Namespace Pinecone associado ao documento.

---

#### 3. Implementar Histórico de Chat

Guardar todos os turnos da conversa.

**Dados Persistidos:**

* Pergunta do utilizador
* Resposta do assistente
* Citações utilizadas
* Documento associado

**Critérios de Aceitação:**

* Todas as mensagens são armazenadas.
* Histórico recuperável por documento.
* Estrutura preparada para futuras funcionalidades de dashboard.

---

### Resultado Esperado

Ao final da Fase 1:

* Documentos persistidos.
* Histórico persistido.
* Base de dados preparada para autenticação.

---

# Fase 2: Autenticação e Segurança

### Objetivo

Garantir isolamento dos dados entre utilizadores.

### Tarefas

#### 1. Integrar KindeAuth

Configurar autenticação completa.

**Funcionalidades:**

* Login
* Registo
* Logout
* Gestão de sessão

**Rotas Protegidas:**

* Upload
* Chat
* Dashboard
* APIs privadas

**Critérios de Aceitação:**

* Apenas utilizadores autenticados podem utilizar funcionalidades protegidas.

---

#### 2. Associar Dados ao Utilizador

Todos os documentos devem possuir proprietário explícito.

**Relacionamentos:**

```text
User
 └── Documents
      └── Messages
```

**Critérios de Aceitação:**

* Cada documento pertence a um utilizador.
* Cada mensagem pertence a um utilizador.

---

#### 3. Proteger Namespaces Pinecone

Implementar validação antes de qualquer consulta vetorial.

**Fluxo de Validação**

```text
Pedido de Chat
 ↓
Verificar Utilizador
 ↓
Verificar Documento
 ↓
Verificar Proprietário
 ↓
Consultar Pinecone
```

**Critérios de Aceitação:**

* Um utilizador nunca consegue consultar documentos de terceiros.
* Todas as verificações realizadas via metadados armazenados no Supabase.

---

### Resultado Esperado

Ao final da Fase 2:

* Sistema autenticado.
* Dados isolados por utilizador.
* Consultas seguras ao Pinecone.

---

# Fase 3: Monetização e Limites

### Objetivo

Introduzir planos pagos e controlo de utilização.

### Tarefas

#### 1. Configurar Stripe

Criar a infraestrutura de pagamentos.

**Implementações:**

* Produtos
* Preços
* Assinaturas
* Portal do cliente
* Webhooks

**Eventos Monitorizados:**

* checkout.session.completed
* customer.subscription.created
* customer.subscription.updated
* customer.subscription.deleted

**Critérios de Aceitação:**

* Alterações de plano refletidas automaticamente na aplicação.

---

#### 2. Persistir Estado da Subscrição

Atualizar a tabela de utilizadores.

**Campos Relevantes:**

* stripe_customer_id
* plano_atual

**Critérios de Aceitação:**

* Plano sincronizado via webhook.

---

#### 3. Implementar Limites de Utilização

Criar middleware para validação de quotas.

**Exemplos de Limites:**

| Recurso     | Free    | Pro       |
| ----------- | ------- | --------- |
| Uploads     | 5       | Ilimitado |
| Perguntas   | 100/mês | Ilimitado |
| Tamanho PDF | 10 MB   | 100 MB    |

**Validações:**

* Antes de uploads.
* Antes de chamadas à OpenAI.
* Antes de criação de embeddings.

**Critérios de Aceitação:**

* Limites aplicados corretamente.
* Mensagens claras quando o limite é atingido.

---

### Resultado Esperado

Ao final da Fase 3:

* Sistema monetizado.
* Controlo de custos da OpenAI.
* Gestão automática de subscrições.

---

# Fase 4: Polimento e Experiência do Utilizador

### Objetivo

Melhorar usabilidade e retenção.

### Tarefas

#### 1. Dashboard do Utilizador

Criar uma área privada para gestão dos documentos.

**Funcionalidades:**

* Listar PDFs carregados.
* Visualizar data de upload.
* Abrir conversas anteriores.
* Eliminar documentos.
* Retomar sessões existentes.

**Critérios de Aceitação:**

* Histórico totalmente navegável.
* Acesso rápido aos documentos anteriores.

---

#### 2. Histórico de Conversação

Melhorar a experiência de continuidade.

**Funcionalidades:**

* Conversas persistentes.
* Recuperação automática do contexto.
* Paginação de mensagens.

**Critérios de Aceitação:**

* Conversas recuperadas sem perda de informação.

---

#### 3. Tratamento de Erros

Melhorar feedback visual para falhas operacionais.

**Cenários Cobertos:**

* Upload inválido.
* PDF corrompido.
* Limite de plano atingido.
* Erro da OpenAI.
* Falha de rede.
* Timeout de processamento.

**Critérios de Aceitação:**

* Mensagens compreensíveis.
* Possibilidade de recuperação quando aplicável.

---

#### 4. Observabilidade

Adicionar monitorização básica.

**Sugestões:**

* Logs estruturados.
* Métricas de utilização.
* Alertas para falhas críticas.

**Critérios de Aceitação:**

* Erros rastreáveis.
* Diagnóstico simplificado.

---

### Resultado Esperado

Ao final da Fase 4:

* Experiência de utilização consistente.
* Histórico navegável.
* Feedbacks claros.
* Sistema preparado para crescimento.

---

# Ordem Recomendada de Execução

```text
Fase 1
Persistência
    ↓
Fase 2
Autenticação e Segurança
    ↓
Fase 3
Monetização e Limites
    ↓
Fase 4
Polimento e UX
```

Esta sequência minimiza retrabalho, reduz riscos de segurança e garante que a monetização é implementada apenas após a consolidação da infraestrutura principal.
