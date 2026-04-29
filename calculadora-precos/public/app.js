/* ── CONFIG ───────────────────────────────────────────────────────── */
const API = window.location.origin + "/api";

/* ── UTILITÁRIOS ──────────────────────────────────────────────────── */
const f = (v) =>
  "R$ " +
  Number(v)
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const pct = (v) => Number(v).toFixed(2).replace(".", ",") + "%";

function toast(msg, tipo = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${tipo} show`;
  setTimeout(() => (t.className = "toast"), 2800);
}

async function api(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || "Erro desconhecido");
  return data;
}

/* ── STATUS DO SERVIDOR ───────────────────────────────────────────── */
async function checkServer() {
  try {
    await fetch(API + "/vendedores");
    document.getElementById("status-dot").className = "dot online";
    document.getElementById("status-text").textContent = "Servidor online";
  } catch {
    document.getElementById("status-dot").className = "dot offline";
    document.getElementById("status-text").textContent = "Servidor offline";
  }
}

/* ── TABS ─────────────────────────────────────────────────────────── */
function showTab(id, btn) {
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + id).classList.add("active");
  btn.classList.add("active");

  if (id === "comm") carregarVendedores();
  if (id === "hist") carregarHistorico();
}

/* ── SLIDERS ──────────────────────────────────────────────────────── */
document.getElementById("c_pct_sl").addEventListener("input", function () {
  document.getElementById("c_pct_n").value = this.value;
  document.getElementById("c_pct_display").textContent = this.value + "%";
});
document.getElementById("c_pct_n").addEventListener("input", function () {
  document.getElementById("c_pct_sl").value = this.value;
  document.getElementById("c_pct_display").textContent = this.value + "%";
});

document.getElementById("v_sl").addEventListener("input", function () {
  document.getElementById("v_n").value = this.value;
  document.getElementById("v_taxa_display").textContent = this.value + "%";
});
document.getElementById("v_n").addEventListener("input", function () {
  document.getElementById("v_sl").value = this.value;
  document.getElementById("v_taxa_display").textContent = this.value + "%";
});

/* ── CALCULADORA SIMPLES ──────────────────────────────────────────── */
async function calcular() {
  const custo = document.getElementById("c_custo").value;
  const tipo = document.getElementById("c_tipo").value;
  const porcentagem = document.getElementById("c_pct_n").value;
  const desconto = document.getElementById("c_desc").value;
  const impostos = document.getElementById("c_imp").value;

  try {
    const r = await api("/calcular", "POST", { custo, tipo, porcentagem, desconto, impostos });

    document.getElementById("b_custo").textContent = f(r.custo);
    document.getElementById("b_mk").textContent = "+ " + f(r.valorMarkup);
    document.getElementById("b_imp").textContent = "+ " + f(r.valorImposto);
    document.getElementById("b_desc").textContent = "- " + f(r.valorDesconto);
    document.getElementById("b_total").textContent = f(r.precoFinal);

    document.getElementById("rh-val").textContent = f(r.precoFinal);
    document.getElementById("rh-sub").textContent =
      "Lucro: " + f(r.lucro) + " · Margem: " + pct(r.margem);

    document.getElementById("m_luc").textContent = f(r.lucro);
    document.getElementById("m_mg").textContent = pct(r.margem);
    document.getElementById("m_mk").textContent = pct(r.markupReal);
    document.getElementById("m_sd").textContent = f(r.comImpostos);

    toast("Calculado com sucesso!");
  } catch (e) {
    toast(e.message, "error");
  }
}

/* ── MÚLTIPLOS PRODUTOS ───────────────────────────────────────────── */
let produtos = [
  { nome: "Produto A", custo: 100, markup: 50, quantidade: 2 },
  { nome: "Produto B", custo: 200, markup: 30, quantidade: 1 },
];

function renderProdutos() {
  document.getElementById("prod-list").innerHTML = produtos
    .map(
      (p, i) => `
    <div class="prod-row">
      <input type="text" value="${p.nome}" placeholder="Nome" oninput="produtos[${i}].nome=this.value" />
      <input type="number" value="${p.custo}" min="0" oninput="produtos[${i}].custo=parseFloat(this.value)||0" />
      <input type="number" value="${p.markup}" min="0" oninput="produtos[${i}].markup=parseFloat(this.value)||0" />
      <input type="number" value="${p.quantidade}" min="1" oninput="produtos[${i}].quantidade=parseInt(this.value)||1" />
      <button class="del-btn" onclick="removerProd(${i})">×</button>
    </div>`
    )
    .join("");
}

function addProd() {
  produtos.push({ nome: "Novo produto", custo: 0, markup: 50, quantidade: 1 });
  renderProdutos();
}

function removerProd(i) {
  produtos.splice(i, 1);
  renderProdutos();
}

async function calcularLote() {
  if (!produtos.length) return toast("Adicione ao menos um produto.", "error");

  try {
    const r = await api("/calcular/lote", "POST", { produtos });

    const tbody = document.getElementById("multi-tbody");
    tbody.innerHTML = r.produtos
      .map(
        (p) => `
      <tr>
        <td class="name">${p.nome}</td>
        <td class="mono-td">${f(p.custo)}</td>
        <td class="mono-td">${pct(p.markup)}</td>
        <td class="mono-td">${f(p.precoVenda)}</td>
        <td class="mono-td">${p.quantidade}</td>
        <td class="g-val">${f(p.totalLucro)}</td>
        <td class="strong">${f(p.totalVenda)}</td>
      </tr>`
      )
      .join("");

    document.getElementById("summary-bar").innerHTML = `
      <div><div class="sum-lbl">Total do pedido</div><div class="sum-val">${f(r.totais.totalGeral)}</div></div>
      <div><div class="sum-lbl">Lucro total</div><div class="sum-val">${f(r.totais.lucroGeral)}</div></div>
      <div><div class="sum-lbl">Custo total</div><div class="sum-val">${f(r.totais.custoGeral)}</div></div>
      <div><div class="sum-lbl">Margem geral</div><div class="sum-val">${pct(r.totais.margemGeral)}</div></div>`;

    document.getElementById("multi-result").style.display = "block";
    toast("Lote calculado!");
  } catch (e) {
    toast(e.message, "error");
  }
}

/* ── COMISSÃO ─────────────────────────────────────────────────────── */
async function calcularComissao() {
  const valorVenda = document.getElementById("v_venda").value;
  const taxaComissao = document.getElementById("v_n").value;
  const base = document.getElementById("v_base").value;
  const custoSeproduto = document.getElementById("v_custo").value;

  try {
    const r = await api("/comissao", "POST", { valorVenda, taxaComissao, base, custoSeproduto });

    document.getElementById("c_earn").textContent = f(r.comissao);
    document.getElementById("c_keep").textContent = f(r.empresaRecebe);
    document.getElementById("comm-boxes").style.display = "grid";
    toast("Comissão calculada!");
    carregarVendedores(); // atualiza os valores na lista
  } catch (e) {
    toast(e.message, "error");
  }
}

/* ── VENDEDORES ───────────────────────────────────────────────────── */
async function carregarVendedores() {
  try {
    const lista = await api("/vendedores");
    const venda = parseFloat(document.getElementById("v_venda").value) || 0;
    const base = document.getElementById("v_base").value;
    const custo = parseFloat(document.getElementById("v_custo").value) || 0;
    const baseVal = base === "lucro" ? Math.max(0, venda - custo) : venda;

    const el = document.getElementById("sellers-list");
    if (!lista.length) {
      el.innerHTML = '<div class="empty-state">Nenhum vendedor cadastrado ainda.</div>';
      return;
    }

    const badgeClass = { Júnior: "badge-junior", Pleno: "badge-pleno", Sênior: "badge-senior" };
    const iniciais = (n) =>
      n.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("");

    el.innerHTML = lista
      .map(
        (v) => `
      <div class="seller-card">
        <div class="avatar">${iniciais(v.nome)}</div>
        <div class="seller-info">
          <div class="seller-name">${v.nome}</div>
          <div class="seller-meta">
            <span class="seller-rate">${v.comissao}% comissão</span>
            <span class="badge ${badgeClass[v.nivel] || "badge-pleno"}">${v.nivel}</span>
          </div>
          <button class="btn-danger" onclick="removerVendedor('${v.id}')">Remover</button>
        </div>
        <div class="seller-comm">
          <div class="seller-comm-val">${f((baseVal * v.comissao) / 100)}</div>
          <div class="seller-comm-sub">desta venda</div>
        </div>
      </div>`
      )
      .join("");
  } catch (e) {
    toast("Erro ao carregar vendedores.", "error");
  }
}

async function addVendedor() {
  const nome = document.getElementById("s_nome").value.trim();
  const comissao = document.getElementById("s_pct").value;
  const nivel = document.getElementById("s_nivel").value;

  if (!nome) {
    document.getElementById("s_nome").focus();
    return toast("Informe o nome do vendedor.", "error");
  }

  try {
    await api("/vendedores", "POST", { nome, comissao, nivel });
    document.getElementById("s_nome").value = "";
    toast("Vendedor adicionado!");
    carregarVendedores();
  } catch (e) {
    toast(e.message, "error");
  }
}

async function removerVendedor(id) {
  try {
    await api("/vendedores/" + id, "DELETE");
    toast("Vendedor removido.");
    carregarVendedores();
  } catch (e) {
    toast(e.message, "error");
  }
}

/* ── HISTÓRICO ────────────────────────────────────────────────────── */
async function carregarHistorico() {
  try {
    const lista = await api("/historico");
    const el = document.getElementById("historico-list");
    if (!lista.length) {
      el.innerHTML = '<div class="empty-state">Nenhum cálculo realizado ainda.</div>';
      return;
    }
    el.innerHTML = lista
      .map(
        (h) => `
      <div class="hist-item">
        <div>
          <div class="hist-label">Custo: ${f(h.custo)} · Markup: ${pct(h.markupReal)}</div>
          <div class="hist-time">${new Date(h.criadoEm).toLocaleString("pt-BR")}</div>
        </div>
        <div class="hist-val">${f(h.precoFinal)}</div>
      </div>`
      )
      .join("");
  } catch {
    /* silencioso */
  }
}

async function limparHistorico() {
  try {
    await api("/historico", "DELETE");
    toast("Histórico limpo.");
    carregarHistorico();
  } catch (e) {
    toast(e.message, "error");
  }
}

/* ── INIT ─────────────────────────────────────────────────────────── */
window.addEventListener("DOMContentLoaded", () => {
  renderProdutos();
  checkServer();
  setInterval(checkServer, 10000); // checar status a cada 10s
});
