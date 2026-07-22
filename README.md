# 🧹 LeadClean v3.0

## 📸 Imagens do sistema
<img width="907" height="849" alt="image" src="https://github.com/user-attachments/assets/3b52e6d4-a938-4f43-8ee6-bd8083810ccd" />

<img width="969" height="1119" alt="image" src="https://github.com/user-attachments/assets/ccfffbfd-19b3-47dd-9094-e8b9b1cccb2b" />

## 📌 Sobre o Projeto

O **LeadClean** é uma aplicação web desenvolvida para **limpeza e análise de dados de leads**, funcionando 100% no navegador (client-side), sem necessidade de upload para servidores.

A ferramenta permite:

* Remover duplicatas de forma inteligente
* Analisar leads por DDD e identificar estados brasileiros
* Exportar dados tratados em formato `.xlsx`

Ideal para quem trabalha com **bases de leads, marketing, vendas ou análise de dados**.

---

## 🚀 Funcionalidades

### 🧹 Remoção de Duplicatas

* Seleção de colunas para identificar duplicidade
* Escolha entre manter:

  * Primeira ocorrência
  * Última ocorrência
* Visualização das duplicatas destacadas
* Estatísticas automáticas:

  * Total de linhas
  * Quantidade de duplicatas
  * Dados únicos
  * % de redução
* Exportação do arquivo limpo

---

### 📍 Análise por DDD

* Leitura de planilhas (.xlsx, .xls, .csv)
* Identificação automática de coluna de telefone
* Extração de DDD mesmo com dados sujos
* Mapeamento de DDD → Estado (Brasil)
* Relatório com:

  * Quantidade de leads por estado
  * Percentual de distribuição
  * Estado com maior volume
* Exportação do relatório em Excel

---

## 🛠️ Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript (Vanilla)
* [XLSX.js](https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js)

---

## ⚙️ Como Executar

### 1. Clone o repositório

```bash
git clone https://github.com/Patrickx7/Sistema-de-remover-duplicatas.git
```

### 2. Acesse a pasta

```bash
cd Sistema-de-remover-duplicatas
```

### 3. Execute o projeto

Dê duplo clique em `index.html`, ou sirva a pasta localmente:

```bash
python -m http.server 8000
```

---

## 📂 Estrutura do Projeto

```
📁 LeadClean
 ┣ 📄 index.html         # Interface principal
 ┣ 📄 style.css          # Estilização (temas claro e escuro)
 ┣ 📄 splash.js          # Tela de abertura
 ┣ 📄 app.js             # Utilitários, abas e tema
 ┣ 📄 duplicata.js       # Lógica de remoção de duplicatas
 ┣ 📄 ddd.js             # Análise de DDD, estados e gráficos
 ┗ 📄 README.md
```

---

## 💡 Diferenciais

* ⚡ Processamento 100% local (segurança de dados)
* 🧠 Lógica eficiente para deduplicação
* 📊 Interface moderna e intuitiva
* 📁 Suporte a múltiplos formatos de arquivo
* 🇧🇷 Mapeamento completo de DDDs do Brasil

---

## 🎯 Objetivo

Este projeto foi desenvolvido com foco em:

* Prática de manipulação de dados
* Lógica de programação aplicada
* Experiência com leitura e exportação de arquivos
* Criação de interfaces interativas sem frameworks

---

## 🆕 Novidades da v3.0

* **Tela de abertura** com saudação por horário e assinatura do autor
* **Tema escuro** com alternância no cabeçalho (preferência salva)
* **Cartograma do Brasil**, gráfico de barras e donut por região na aba de DDD
* **Correção crítica**: telefones com código do país (`+55`) eram lidos como DDD 55
  e contabilizados como Rio Grande do Sul — agora o prefixo é removido corretamente
* Normalização opcional de acentos, espaços e máscaras de telefone na comparação
* Exportação das duplicatas removidas, para auditoria
* Leitura de CSV em Windows-1252 (acentos de planilhas salvas em ANSI)
* Navegação completa por teclado e conteúdo da planilha sempre escapado

---

## ⚠️ Limitações conhecidas

* A build community do SheetJS **não aplica estilos de célula** (negrito, cores) no
  arquivo exportado — apenas a largura das colunas é preservada.
* Apenas a primeira aba (worksheet) da planilha é lida.
* O preview em tela mostra até 80 linhas e 8 colunas; o arquivo exportado é sempre completo.

---

## 📈 Melhorias Futuras

* Upload de arquivos maiores com otimização (Web Worker)
* Seletor de aba/worksheet da planilha
* Filtros avançados de análise
* API backend opcional
* Versão em React

---

## 👨‍💻 Autor

Desenvolvido por **Patrick Moura**

---

## ⭐ Contribuição

Contribuições são bem-vindas!
Sinta-se à vontade para abrir issues ou enviar pull requests.

---


