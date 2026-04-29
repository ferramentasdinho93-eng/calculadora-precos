const express = require("express");
const cors = require("cors");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── banco em memória (reinicia ao reiniciar o servidor) ───────────────────
let vendedores = [
  { id: uuidv4(), nome: "Ana Ribeiro",  comissao: 7, nivel: "Sênior" },
  { id: uuidv4(), nome: "Bruno Alves",  comissao: 5, nivel: "Pleno"  },
];

let historico = []; // histórico de cálculos

// ─── ROTAS: PRECIFICAÇÃO ───────────────────────────────────────────────────

// POST /api/calcular  — calcula preço final com markup/margem, impostos e desconto
app.post("/api/calcular", (req, res) => {
  const { custo, porcentagem, tipo, desconto, impostos } = req.body;

  if (custo === undefined || porcentagem === undefined) {
    return res.status(400).json({ erro: "Informe custo e porcentagem." });
  }

  const c = parseFloat(custo);
  const pct = parseFloat(porcentagem);
  const desc = parseFloat(desconto) || 0;
  const imp = parseFloat(impostos) || 0;

  let precoBase;
  if (tipo === "margem") {
    precoBase = pct < 100 ? c / (1 - pct / 100) : c;
  } else {
    // markup padrão
    precoBase = c * (1 + pct / 100);
  }

  const comImp = precoBase * (1 + imp / 100);
  const final = comImp * (1 - desc / 100);
  const lucro = final - c;
  const margem = final > 0 ? (lucro / final) * 100 : 0;
  const markupReal = c > 0 ? (lucro / c) * 100 : 0;

  const resultado = {
    custo: round(c),
    precoBase: round(precoBase),
    comImpostos: round(comImp),
    precoFinal: round(final),
    lucro: round(lucro),
    margem: round(margem),
    markupReal: round(markupReal),
    valorMarkup: round(precoBase - c),
    valorImposto: round(comImp - precoBase),
    valorDesconto: round(comImp - final),
    criadoEm: new Date().toISOString(),
  };

  historico.unshift({ tipo: "precificacao", ...resultado });
  if (historico.length > 50) historico.pop();

  res.json(resultado);
});

// POST /api/calcular/lote  — calcula vários produtos de uma vez
app.post("/api/calcular/lote", (req, res) => {
  const { produtos } = req.body;

  if (!Array.isArray(produtos) || produtos.length === 0) {
    return res.status(400).json({ erro: "Envie um array de produtos." });
  }

  const resultado = produtos.map((p) => {
    const c = parseFloat(p.custo) || 0;
    const mk = parseFloat(p.markup) || 0;
    const q = parseInt(p.quantidade) || 1;
    const venda = c * (1 + mk / 100);
    const lucroUnit = venda - c;

    return {
      nome: p.nome || "Produto",
      custo: round(c),
      markup: round(mk),
      precoVenda: round(venda),
      lucroUnitario: round(lucroUnit),
      quantidade: q,
      totalVenda: round(venda * q),
      totalLucro: round(lucroUnit * q),
      totalCusto: round(c * q),
    };
  });

  const totais = {
    totalGeral: round(resultado.reduce((a, r) => a + r.totalVenda, 0)),
    lucroGeral: round(resultado.reduce((a, r) => a + r.totalLucro, 0)),
    custoGeral: round(resultado.reduce((a, r) => a + r.totalCusto, 0)),
  };
  totais.margemGeral = round(
    totais.totalGeral > 0 ? (totais.lucroGeral / totais.totalGeral) * 100 : 0
  );

  res.json({ produtos: resultado, totais });
});

// ─── ROTAS: COMISSÃO ───────────────────────────────────────────────────────

// POST /api/comissao  — calcula comissão de uma venda
app.post("/api/comissao", (req, res) => {
  const { valorVenda, taxaComissao, base, custoSeproduto } = req.body;

  if (valorVenda === undefined || taxaComissao === undefined) {
    return res.status(400).json({ erro: "Informe valorVenda e taxaComissao." });
  }

  const venda = parseFloat(valorVenda);
  const taxa = parseFloat(taxaComissao);
  const custo = parseFloat(custoSeproduto) || 0;

  const baseCalculo = base === "lucro" ? Math.max(0, venda - custo) : venda;
  const comissao = baseCalculo * (taxa / 100);

  res.json({
    valorVenda: round(venda),
    taxaComissao: round(taxa),
    base,
    baseCalculo: round(baseCalculo),
    comissao: round(comissao),
    empresaRecebe: round(venda - comissao),
  });
});

// ─── ROTAS: VENDEDORES ─────────────────────────────────────────────────────

// GET /api/vendedores  — lista todos
app.get("/api/vendedores", (req, res) => {
  res.json(vendedores);
});

// POST /api/vendedores  — cadastra novo
app.post("/api/vendedores", (req, res) => {
  const { nome, comissao, nivel } = req.body;

  if (!nome || comissao === undefined) {
    return res.status(400).json({ erro: "Informe nome e comissao." });
  }

  const niveisValidos = ["Júnior", "Pleno", "Sênior"];
  const nivelFinal = niveisValidos.includes(nivel) ? nivel : "Pleno";

  const novo = {
    id: uuidv4(),
    nome: nome.trim(),
    comissao: parseFloat(comissao),
    nivel: nivelFinal,
    criadoEm: new Date().toISOString(),
  };

  vendedores.push(novo);
  res.status(201).json(novo);
});

// PUT /api/vendedores/:id  — atualiza vendedor
app.put("/api/vendedores/:id", (req, res) => {
  const idx = vendedores.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: "Vendedor não encontrado." });

  const { nome, comissao, nivel } = req.body;
  if (nome)      vendedores[idx].nome = nome.trim();
  if (comissao !== undefined) vendedores[idx].comissao = parseFloat(comissao);
  if (nivel)     vendedores[idx].nivel = nivel;

  res.json(vendedores[idx]);
});

// DELETE /api/vendedores/:id  — remove
app.delete("/api/vendedores/:id", (req, res) => {
  const antes = vendedores.length;
  vendedores = vendedores.filter((v) => v.id !== req.params.id);
  if (vendedores.length === antes) {
    return res.status(404).json({ erro: "Vendedor não encontrado." });
  }
  res.json({ mensagem: "Vendedor removido com sucesso." });
});

// ─── ROTAS: HISTÓRICO ──────────────────────────────────────────────────────

// GET /api/historico
app.get("/api/historico", (req, res) => {
  res.json(historico.slice(0, 20));
});

// DELETE /api/historico
app.delete("/api/historico", (req, res) => {
  historico = [];
  res.json({ mensagem: "Histórico limpo." });
});

// ─── ROTA RAIZ (serve o frontend) ─────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── INICIAR ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Servidor rodando em http://localhost:${PORT}\n`);
});

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────
function round(n) {
  return Math.round(n * 100) / 100;
}
