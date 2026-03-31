import { useState, useMemo, useRef } from "react";
import { useProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Search, Edit2, Trash2, ShoppingBag, Package, PackageX,
  DollarSign, Loader2, Download, FileDown, ImageIcon, Upload, X,
} from "lucide-react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf } from "@/lib/exportGenericPdf";
import ConfirmDialog from "@/components/ConfirmDialog";
import { supabase } from "@/lib/supabase";

const CATEGORIAS = ["bones", "patches", "camisas", "balaclava", "segunda_pele", "casacos", "acessorios"] as const;

const CATEGORIA_I18N: Record<string, string> = {
  bones: "prod.bones",
  patches: "prod.patches",
  camisas: "prod.camisas",
  balaclava: "prod.balaclava",
  segunda_pele: "prod.segundaPele",
  casacos: "prod.casacos",
  acessorios: "prod.acessorios",
};

const STATUS_MAP: Record<string, { color: string; bg: string }> = {
  disponivel: { color: "#30D158", bg: "rgba(48,209,88,0.14)" },
  esgotado: { color: "#FF453A", bg: "rgba(255,69,58,0.14)" },
  pre_venda: { color: "#0A84FF", bg: "rgba(10,132,255,0.14)" },
};

function formatBRL(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function stockColor(qty: number): string {
  if (qty === 0) return "#FF453A";
  if (qty <= 10) return "#FF9F0A";
  return "#30D158";
}

export default function Produtos() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    categoria: "bones" as string,
    sku: "",
    preco: "",
    estoque: "0",
    tamanhos: "",
    cores: "",
    status: "disponivel" as string,
    imagemUrl: "",
  });

  const { data: produtos, isLoading } = useProdutos();
  const createMut = useCreateProduto();
  const updateMut = useUpdateProduto();
  const deleteMut = useDeleteProduto();

  function resetForm() {
    setForm({
      nome: "", descricao: "", categoria: "bones", sku: "", preco: "",
      estoque: "0", tamanhos: "", cores: "", status: "disponivel", imagemUrl: "",
    });
    setEditingId(null);
  }

  function openEdit(prod: any) {
    setEditingId(prod.id);
    setForm({
      nome: prod.nome || "",
      descricao: prod.descricao || "",
      categoria: prod.categoria || "bones",
      sku: prod.sku || "",
      preco: prod.preco || "",
      estoque: String(prod.estoque ?? 0),
      tamanhos: prod.tamanhos?.join(", ") || "",
      cores: prod.cores?.join(", ") || "",
      status: prod.status || "disponivel",
      imagemUrl: prod.imagemUrl || "",
    });
    setDialogOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("produtos")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("produtos").getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, imagemUrl: urlData.publicUrl }));
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit() {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");

    const tamanhos = form.tamanhos
      ? form.tamanhos.split(",").map((s) => s.trim()).filter(Boolean)
      : null;
    const cores = form.cores
      ? form.cores.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    const data = {
      nome: form.nome,
      descricao: form.descricao || null,
      categoria: form.categoria,
      sku: form.sku || null,
      preco: form.preco || "0",
      estoque: parseInt(form.estoque) || 0,
      tamanhos,
      cores,
      status: form.status as "disponivel" | "esgotado" | "pre_venda",
      imagemUrl: form.imagemUrl || null,
    };

    const onSuccess = () => {
      toast.success(editingId ? "Produto atualizado!" : "Produto criado!");
      setDialogOpen(false);
      resetForm();
    };
    const onError = (e: any) => toast.error(e.message);

    if (editingId) updateMut.mutate({ id: editingId, ...data }, { onSuccess, onError });
    else createMut.mutate(data, { onSuccess, onError });
  }

  const filtered = useMemo(() => {
    if (!produtos) return [];
    let list = produtos;
    if (filter !== "all") {
      list = list.filter((p: any) => p.categoria === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p: any) =>
          p.nome?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [produtos, filter, search]);

  // Stats
  const stats = useMemo(() => {
    if (!produtos) return { total: 0, emEstoque: 0, esgotados: 0, valorTotal: 0 };
    return {
      total: produtos.length,
      emEstoque: produtos.filter((p: any) => p.estoque > 0).length,
      esgotados: produtos.filter((p: any) => p.estoque === 0 || p.status === "esgotado").length,
      valorTotal: produtos.reduce((acc: number, p: any) => acc + (parseFloat(p.preco) || 0) * (p.estoque || 0), 0),
    };
  }, [produtos]);

  function handleExport() {
    const data = filtered.map((p: any) => ({
      Nome: p.nome,
      SKU: p.sku || "",
      Categoria: p.categoria,
      "Preço": formatBRL(p.preco),
      Estoque: p.estoque,
      Status: p.status,
      Tamanhos: p.tamanhos?.join(", ") || "",
      Cores: p.cores?.join(", ") || "",
    }));
    exportToXlsx(data, `produtos-${new Date().toISOString().split("T")[0]}`);
  }

  function handleExportPdf() {
    const statusPt: Record<string, string> = {
      disponivel: "Disponível",
      esgotado: "Esgotado",
      pre_venda: "Pré-venda",
    };
    const rows = filtered.map((p: any) => [
      p.nome || "",
      p.sku || "—",
      p.categoria || "",
      formatBRL(p.preco),
      String(p.estoque ?? 0),
      statusPt[p.status] || p.status || "",
    ]);
    exportGenericPdf(
      "Catálogo de Produtos",
      "Embaixadores dos Legendários",
      ["Nome", "SKU", "Categoria", "Preço", "Estoque", "Status"],
      rows,
      "produtos"
    );
  }

  const filters = [
    { key: "all", label: t("common.todos") },
    ...CATEGORIAS.map((c) => ({ key: c, label: t(CATEGORIA_I18N[c]) })),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("prod.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("prod.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2 shrink-0"
              title="Exportar PDF"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleExport}
              className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2 shrink-0"
              title="Exportar XLSX"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">XLSX</span>
            </button>
            <button
              onClick={() => { resetForm(); setDialogOpen(true); }}
              className="apple-btn apple-btn-filled text-[0.8125rem] py-2 px-4"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">{t("prod.novo")}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {[
            { icon: ShoppingBag, val: stats.total, label: t("prod.total"), color: "#FF6B00" },
            { icon: Package, val: stats.emEstoque, label: t("prod.emEstoque"), color: "#30D158" },
            { icon: PackageX, val: stats.esgotados, label: t("prod.esgotados"), color: "#FF453A" },
            { icon: DollarSign, val: formatBRL(stats.valorTotal), label: t("prod.valorEstoque"), color: "#FF9F0A" },
          ].map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="apple-card p-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} strokeWidth={1.5} />
              <p className="text-lg font-bold text-white">{val}</p>
              <p className="text-[0.625rem] text-[#6e6e73]">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter tabs */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48484a]" strokeWidth={1.5} />
            <input
              placeholder={t("prod.buscar")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="apple-input pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`apple-btn text-[0.75rem] py-1.5 px-3.5 shrink-0 ${
                  filter === f.key ? "apple-btn-filled" : "apple-btn-gray"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="apple-skeleton h-[260px] rounded-2xl" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#86868b]">{t("prod.nenhum")}</p>
            <p className="text-[0.75rem] text-[#48484a] mt-1">{t("prod.nenhumDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "150ms" }}>
            {filtered.map((prod: any) => {
              const sc = STATUS_MAP[prod.status] || STATUS_MAP.disponivel;
              return (
                <div
                  key={prod.id}
                  className="apple-card overflow-hidden group hover:border-white/[0.12] transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-square bg-white/[0.03] flex items-center justify-center overflow-hidden relative">
                    {prod.imagemUrl ? (
                      <img
                        src={prod.imagemUrl}
                        alt={prod.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-[#3a3a3c]" strokeWidth={1} />
                    )}
                    {/* Action buttons overlay */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEdit(prod)}
                        className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(prod.id)}
                        className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-[#FF453A] hover:bg-black/80 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-[0.8125rem] font-semibold text-white truncate flex-1">{prod.nome}</h3>
                    </div>
                    {prod.sku && (
                      <p className="text-[0.6875rem] text-[#6e6e73] font-mono">SKU: {prod.sku}</p>
                    )}
                    <p className="text-[0.9375rem] font-bold text-[#FF6B00]">{formatBRL(prod.preco)}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-[0.6875rem] font-medium"
                        style={{ color: stockColor(prod.estoque) }}
                      >
                        {t("prod.estoque")}: {prod.estoque}
                      </span>
                      <span
                        className="apple-badge text-[0.625rem]"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {prod.status === "disponivel"
                          ? t("prod.disponivel")
                          : prod.status === "esgotado"
                          ? t("prod.esgotado")
                          : t("prod.preLancamento")}
                      </span>
                    </div>
                    <span className="inline-block apple-badge apple-badge-orange text-[0.625rem]">
                      {t(CATEGORIA_I18N[prod.categoria] || "prod.acessorios")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-lg font-bold text-white tracking-[-0.02em]">
                {editingId ? t("prod.editar") : t("prod.novo")}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4 space-y-4">
              {/* Nome */}
              <div>
                <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.nome")} *</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="apple-input"
                  placeholder={t("prod.nome")}
                />
              </div>

              {/* Descricao */}
              <div>
                <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.descricao")}</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="apple-input min-h-[80px] resize-none"
                  placeholder={t("prod.descricao")}
                  rows={3}
                />
              </div>

              {/* Categoria + SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.categoria")}</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="apple-input"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{t(CATEGORIA_I18N[c])}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.sku")}</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="apple-input"
                    placeholder="EX: BN-001"
                  />
                </div>
              </div>

              {/* Preco + Estoque */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.preco")} (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    className="apple-input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.estoque")}</label>
                  <input
                    type="number"
                    min="0"
                    value={form.estoque}
                    onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                    className="apple-input"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Tamanhos */}
              <div>
                <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.tamanhos")}</label>
                <input
                  value={form.tamanhos}
                  onChange={(e) => setForm({ ...form, tamanhos: e.target.value })}
                  className="apple-input"
                  placeholder="PP, P, M, G, GG, XG"
                />
              </div>

              {/* Cores */}
              <div>
                <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.cores")}</label>
                <input
                  value={form.cores}
                  onChange={(e) => setForm({ ...form, cores: e.target.value })}
                  className="apple-input"
                  placeholder="Preto, Branco, Cinza"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.status")}</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="apple-input"
                >
                  <option value="disponivel">{t("prod.disponivel")}</option>
                  <option value="esgotado">{t("prod.esgotado")}</option>
                  <option value="pre_venda">{t("prod.preLancamento")}</option>
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-[0.75rem] font-medium text-[#86868b] mb-1 block">{t("prod.imagem")}</label>
                {form.imagemUrl ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-white/[0.03] mb-2">
                    <img src={form.imagemUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setForm({ ...form, imagemUrl: "" })}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
                <label className="apple-btn apple-btn-gray py-2.5 px-4 text-[0.8125rem] cursor-pointer flex items-center gap-2 justify-center w-full">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploading ? "Enviando..." : "Enviar imagem"}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                  className="apple-btn apple-btn-gray flex-1 py-2.5 text-[0.8125rem]"
                >
                  {t("confirm.cancelar")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMut.isPending || updateMut.isPending}
                  className="apple-btn apple-btn-filled flex-1 py-2.5 text-[0.8125rem]"
                >
                  {(createMut.isPending || updateMut.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingId ? t("common.salvar") : t("prod.novo")}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={confirmDelete !== null}
          onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
          onConfirm={() => {
            if (confirmDelete !== null) {
              deleteMut.mutate(confirmDelete, {
                onSuccess: () => toast.success("Produto excluído!"),
                onError: (e: any) => toast.error(e.message),
              });
              setConfirmDelete(null);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
