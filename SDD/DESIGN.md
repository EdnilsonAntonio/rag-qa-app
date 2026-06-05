# DESIGN.md

## Objetivo

Este documento define as decisões técnicas, a stack tecnológica e a arquitetura do sistema RAG·QA.

---

# Stack Técnica

## Framework

**Next.js**

* Frontend e backend na mesma aplicação.
* API Routes para endpoints de upload, ingestão e chat.
* Suporte a Server Components e streaming de respostas.

## Orquestração

**LangChain**

* Gestão do pipeline RAG.
* Construção de chains de recuperação e geração.
* Integração entre OpenAI, Pinecone e histórico de conversação.

## IA e Embeddings

### Modelo de Resposta

* **GPT-4o**
* Responsável pela geração das respostas finais.

### Modelo de Embeddings

* **text-embedding-3-small**
* Utilizado para geração de vetores semânticos dos documentos.

## Base de Dados Vetorial

**Pinecone**

* Armazena embeddings dos chunks.
* Utiliza namespaces independentes por documento.
* Permite pesquisa semântica eficiente.

## Base de Dados Relacional

**PostgreSQL (Supabase)**

* Gestão de utilizadores.
* Metadados dos documentos.
* Histórico de conversações.
* Informação de subscrições.

## Autenticação

**KindeAuth**

* Login.
* Registo.
* Gestão de sessões.
* Integração com utilizadores da aplicação.

## Pagamentos

**Stripe**

* Gestão de subscrições.
* Cobranças recorrentes.
* Limites de utilização por plano.

---

# Arquitetura do Sistema

```text
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Next.js   │
│ Front + API │
└──────┬──────┘
       │
 ┌─────┼─────────────┐
 │     │             │
 ▼     ▼             ▼
Kinde Supabase    LangChain
Auth PostgreSQL   Orchestrator
                     │
             ┌───────┼────────┐
             │                │
             ▼                ▼
         OpenAI           Pinecone
      GPT-4o +            Vector DB
      Embeddings
```

---

# Esquema de Dados

## Users

Representa os utilizadores autenticados.

| Campo              | Tipo              |
| ------------------ | ----------------- |
| id                 | string (Kinde ID) |
| email              | string            |
| stripe_customer_id | string            |
| plano_atual        | string            |
| created_at         | timestamp         |

---

## Documents

Representa os PDFs carregados.

| Campo              | Tipo      |
| ------------------ | --------- |
| id                 | uuid      |
| user_id            | string    |
| pinecone_namespace | string    |
| nome_ficheiro      | string    |
| data_upload        | timestamp |

---

## Messages

Representa o histórico de conversação.

| Campo      | Tipo                  |
| ---------- | --------------------- |
| id         | uuid                  |
| doc_id     | uuid                  |
| user_id    | string                |
| role       | enum(user, assistant) |
| content    | text                  |
| citations  | jsonb                 |
| created_at | timestamp             |

---

# Pipeline RAG

## 1. Ingestão

Fluxo de processamento do documento:

```text
PDF
 ↓
pdf-parse
 ↓
Extração de texto
 ↓
Chunking com overlap
 ↓
OpenAI Embeddings
 ↓
Pinecone Namespace
```

### Passos

1. Upload do PDF.
2. Extração do texto com `pdf-parse`.
3. Divisão em chunks sobrepostos.
4. Geração dos embeddings.
5. Armazenamento dos vetores no Pinecone.

---

## 2. Recuperação

Fluxo de pesquisa:

```text
Pergunta
 +
Histórico recente
 ↓
Reescrita da query
 ↓
Embedding da pergunta
 ↓
Pesquisa semântica
 ↓
Top-K Chunks
```

### Passos

1. Receção da pergunta do utilizador.
2. Inclusão do histórico relevante da conversa.
3. Reescrita da query para otimizar recuperação.
4. Pesquisa vetorial no Pinecone.
5. Recuperação dos chunks mais relevantes.

---

## 3. Geração da Resposta

Fluxo de resposta:

```text
Pergunta
 +
Chunks Recuperados
 ↓
GPT-4o
 ↓
Resposta Final
 +
Citações
```

### Regras

* O GPT-4o deve responder apenas com base no contexto recuperado.
* Não deve utilizar conhecimento externo quando não suportado pelos documentos.
* Todas as respostas devem incluir referências aos chunks utilizados.
* Caso não exista contexto suficiente, o sistema deve informar explicitamente que a informação não foi encontrada no documento.

---

# Estratégia de Namespaces

Cada documento possui um namespace exclusivo no Pinecone.

Exemplo:

```text
document_123
document_456
document_789
```

Benefícios:

* Isolamento total entre documentos.
* Pesquisa mais rápida.
* Simplicidade operacional.
* Menor risco de contaminação de contexto.

---

# Escalabilidade Futura

## Curto Prazo

* Persistência completa do histórico.
* Gestão de limites por plano.
* Dashboard de documentos.

## Médio Prazo

* Suporte a múltiplos documentos por conversa.
* Pesquisa híbrida (vetorial + keyword).
* Re-ranking dos resultados recuperados.

## Longo Prazo

* OCR para PDFs digitalizados.
* Processamento assíncrono via filas.
* Multi-tenant enterprise.
* Analytics e observabilidade avançada.
