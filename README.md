# 🧹 LeadClean v2.0

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

Basta abrir o arquivo:

```bash
leads-dedup.html
```

Ou dê duplo clique no arquivo.

---

## 📂 Estrutura do Projeto

```
📁 LeadClean
 ┣ 📄 leads-dedup.html   # Interface principal
 ┣ 📄 style.css          # Estilização
 ┣ 📄 app.js             # Controle de abas
 ┣ 📄 duplicata.js       # Lógica de remoção de duplicatas
 ┣ 📄 ddd.js             # Análise de DDD e estados
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

## 📈 Melhorias Futuras

* Upload de arquivos maiores com otimização
* Filtros avançados de análise
* Gráficos (charts) de distribuição
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

<img width="907" height="849" alt="image" src="https://github.com/user-attachments/assets/3b52e6d4-a938-4f43-8ee6-bd8083810ccd" />

<img width="969" height="1119" alt="image" src="https://github.com/user-attachments/assets/ccfffbfd-19b3-47dd-9094-e8b9b1cccb2b" />


