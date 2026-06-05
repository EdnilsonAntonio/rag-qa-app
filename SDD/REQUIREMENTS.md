# REQUIREMENTS.md

## Visão Geral

O **RAG·QA** é uma plataforma de Retrieval-Augmented Generation (RAG) que permite aos utilizadores conversar com os seus documentos PDF em linguagem natural, obtendo respostas fundamentadas em citações diretas do ficheiro.

---

## Funcionalidades Atuais

### Landing Page
Interface inicial apresentando o produto.

### Upload de Ficheiros
Processamento de PDFs com:
- Parsing de texto;
- Divisão do conteúdo em chunks sobrepostos.

### Conversa com Agente
Chat em tempo real (streaming) com respostas baseadas exclusivamente nos trechos recuperados do PDF.

### Citações
As respostas devem incluir referências aos chunks de origem, por exemplo:

```text
[Chunk #12]
[Chunk #34]
```

### Persistência (Supabase/PostgreSQL)
Armazenamento de:
- Metadados de ficheiros;
- Histórico de conversas.

---

## Funcionalidades Futuras (Prioridade)

### Autenticação (KindeAuth)
Sistema de login e registo para associar ficheiros e histórico a utilizadores.

### Subscrições (Stripe)
Implementação de limites de utilização baseados em planos, por exemplo:
- Número máximo de uploads;
- Número máximo de perguntas.

---

## O que NÃO faz (Out of Scope)

- Não utiliza memória do modelo para responder sem contexto proveniente do PDF.
- Não suporta múltiplos ficheiros num único namespace.
- Atualmente, existe um namespace por ficheiro.