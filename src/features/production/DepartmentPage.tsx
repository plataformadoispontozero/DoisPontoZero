import { Link, useParams } from "react-router-dom";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { PageHeader } from "@/components/ui/PageHeader";
const names: Record<string, string> = {
  design: "Design",
  video: "Videomaker",
  traffic: "Tráfego Pago",
};
export function DepartmentPage() {
  const { department = "design" } = useParams();
  const name = names[department] || "Design";
  const prefix = `[${name}]`;
  const query = useTasks({ search: prefix });
  const tasks = query.data?.filter((t) => t.title.startsWith(prefix)) || [];
  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        subtitle="Fila de demandas da especialidade, integrada aos projetos e calendários aprovados."
      />
      <div className="flex flex-wrap gap-4">
        <Link
          className="rounded-lg bg-[#C74410] px-4 py-3 text-white"
          to="/editorial"
        >
          Calendário editorial
        </Link>
        <Link
          className="rounded-lg border border-white/20 px-4 py-3"
          to="/tasks"
        >
          Gerenciar tarefas
        </Link>
      </div>
      <p className="text-[#B8B8C0]">
        Calendários aprovados geram tarefas com a identificação {prefix}. Para
        incluir uma tarefa manual nesta fila, use essa identificação no início
        do título em Tarefas.
      </p>
      {department === "traffic" && (
        <p className="text-sm text-[#B8B8C0]">
          Organize planejamento, orçamento e revisão das campanhas. Anúncios não
          são publicados automaticamente.
        </p>
      )}
      {query.isLoading && <p role="status">Carregando demandas…</p>}
      {query.isError && (
        <p role="alert">
          Não foi possível carregar as demandas. Verifique suas permissões.
        </p>
      )}
      {!query.isLoading && !query.isError && !tasks.length && (
        <p className="rounded-xl border border-white/10 p-8">
          Nenhuma demanda de {name} registrada.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {tasks.map((t) => (
          <Link
            className="rounded-xl border border-white/15 p-5 hover:border-orange-400/60"
            to={"/tasks/" + t.id}
            key={t.id}
          >
            <h2 className="text-lg">{t.title.slice(prefix.length).trim()}</h2>
            <p className="text-sm text-[#B8B8C0]">
              {t.status} — {t.due_date || "Prazo a definir"}
            </p>
            <p className="mt-3 text-orange-300">Abrir tarefa →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
