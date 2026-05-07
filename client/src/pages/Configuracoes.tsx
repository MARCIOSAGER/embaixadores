import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import {
  useListasConfig,
  useUpsertListaItem,
  useDeleteListaItem,
  useToggleListaItem,
  type ListaConfigCategoria,
  type ListaConfigItem,
} from "@/hooks/useSupabase";
import { Settings, Shield, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type TabKey = "programa" | "abertura_pais";

const TABS: { key: TabKey; label: string; categoria: ListaConfigCategoria }[] = [
  { key: "programa", label: "Programas", categoria: "programa" },
  { key: "abertura_pais", label: "Aberturas (Países)", categoria: "abertura_pais" },
];

export default function Configuracoes() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<TabKey>("programa");

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-[#FF453A]" />
          <h2 className="text-xl font-bold text-white">{t("admin.acessoNegado")}</h2>
          <p className="text-[#86868b]">{t("admin.acessoNegadoDesc")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#FF6B00]" />
            Configurações
          </h1>
          <p className="text-[#86868b] mt-1">Gerencie listas usadas nos formulários (programas, países das aberturas).</p>
        </div>

        <div className="flex gap-2">
          {TABS.map((it) => (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === it.key
                  ? "bg-[#FF6B00] text-white"
                  : "bg-white/[0.04] text-[#d2d2d7] hover:bg-white/[0.08]"
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>

        <ListaConfigManager
          categoria={tab}
          titulo={tab === "programa" ? "Programas participados" : "Países das aberturas"}
          placeholderValor={tab === "programa" ? "Ex: NEST Europa" : "Ex: França"}
          placeholderRotulo={tab === "programa" ? "Ex: NEST Europa" : "Ex: França"}
        />
      </div>
    </DashboardLayout>
  );
}

function ListaConfigManager({
  categoria,
  titulo,
  placeholderValor,
  placeholderRotulo,
}: {
  categoria: ListaConfigCategoria;
  titulo: string;
  placeholderValor: string;
  placeholderRotulo: string;
}) {
  const { data: items, isLoading } = useListasConfig(categoria);
  const upsert = useUpsertListaItem();
  const remove = useDeleteListaItem();
  const toggle = useToggleListaItem();

  const [newValor, setNewValor] = useState("");
  const [newRotulo, setNewRotulo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValor, setEditValor] = useState("");
  const [editRotulo, setEditRotulo] = useState("");
  const [editOrdem, setEditOrdem] = useState<number>(0);

  const nextOrdem = (items ?? []).reduce((max, it) => Math.max(max, it.ordem), 0) + 10;

  const handleAdd = () => {
    const valor = newValor.trim();
    const rotulo = newRotulo.trim() || valor;
    if (!valor) { toast.error("Informe o valor"); return; }
    upsert.mutate(
      { categoria, valor, rotulo, ordem: nextOrdem, ativo: true },
      {
        onSuccess: () => { toast.success("Item adicionado"); setNewValor(""); setNewRotulo(""); },
        onError: (e: any) => toast.error(e.message),
      },
    );
  };

  const startEdit = (it: ListaConfigItem) => {
    setEditingId(it.id);
    setEditValor(it.valor);
    setEditRotulo(it.rotulo);
    setEditOrdem(it.ordem);
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = (it: ListaConfigItem) => {
    const valor = editValor.trim();
    const rotulo = editRotulo.trim() || valor;
    if (!valor) { toast.error("Informe o valor"); return; }
    upsert.mutate(
      { id: it.id, categoria, valor, rotulo, ordem: editOrdem, ativo: it.ativo },
      {
        onSuccess: () => { toast.success("Item atualizado"); setEditingId(null); },
        onError: (e: any) => toast.error(e.message),
      },
    );
  };

  const handleDelete = (it: ListaConfigItem) => {
    if (!confirm(`Excluir "${it.rotulo}"? Esta ação não pode ser desfeita.`)) return;
    remove.mutate(
      { id: it.id, categoria },
      {
        onSuccess: () => toast.success("Item excluído"),
        onError: (e: any) => toast.error(e.message),
      },
    );
  };

  const handleToggle = (it: ListaConfigItem) => {
    toggle.mutate({ id: it.id, categoria, ativo: !it.ativo });
  };

  return (
    <div className="space-y-4">
      <div className="apple-card p-5 space-y-3">
        <h2 className="text-base font-semibold text-white">Adicionar a "{titulo}"</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="apple-input-label">Valor (chave)</label>
            <input className="apple-input" value={newValor} onChange={(e) => setNewValor(e.target.value)} placeholder={placeholderValor} />
          </div>
          <div>
            <label className="apple-input-label">Rótulo (exibido)</label>
            <input className="apple-input" value={newRotulo} onChange={(e) => setNewRotulo(e.target.value)} placeholder={placeholderRotulo} />
          </div>
          <button onClick={handleAdd} disabled={upsert.isPending} className="apple-btn apple-btn-filled px-4 py-2.5">
            {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>
      </div>

      <div className="apple-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">{titulo}</h2>
          <p className="text-xs text-[#86868b] mt-0.5">{(items ?? []).length} item(ns)</p>
        </div>
        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-[#86868b]">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {(items ?? []).map((it) => {
              const isEditing = editingId === it.id;
              return (
                <div key={it.id} className="px-5 py-3 flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <input className="apple-input flex-1" value={editValor} onChange={(e) => setEditValor(e.target.value)} placeholder="Valor" />
                      <input className="apple-input flex-1" value={editRotulo} onChange={(e) => setEditRotulo(e.target.value)} placeholder="Rótulo" />
                      <input type="number" className="apple-input w-20" value={editOrdem} onChange={(e) => setEditOrdem(Number(e.target.value))} title="Ordem" />
                      <button onClick={() => saveEdit(it)} className="apple-btn apple-btn-filled px-3 py-2" disabled={upsert.isPending}>
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="apple-btn apple-btn-gray px-3 py-2">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{it.rotulo}</p>
                        <p className="text-xs text-[#86868b] truncate">
                          <span className="font-mono">{it.valor}</span>
                          <span className="mx-2">·</span>
                          ordem {it.ordem}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle(it)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          it.ativo
                            ? "bg-[#34C759]/15 text-[#34C759]"
                            : "bg-white/[0.06] text-[#86868b]"
                        }`}
                      >
                        {it.ativo ? "Ativo" : "Inativo"}
                      </button>
                      <button onClick={() => startEdit(it)} className="apple-btn apple-btn-tinted px-3 py-2">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(it)} className="apple-btn apple-btn-destructive px-3 py-2" disabled={remove.isPending}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
            {(items ?? []).length === 0 && (
              <div className="p-8 text-center text-[#86868b] text-sm">Nenhum item cadastrado.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
