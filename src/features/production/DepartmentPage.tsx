import {ClientKanbanBoard} from "@/features/projects/components/ClientKanbanBoard";
import {useMoveTaskGroup} from "@/features/tasks/hooks/useTasks";
import { ClientMetaPanel } from "@/features/integrations/ClientMetaPanel";
import { ClientDrivePanel } from "@/features/integrations/ClientDrivePanel";
import { useClients } from "@/features/clients/hooks/useClients";
import { useEffect,useState } from "react";
import { Link, useParams,useSearchParams } from "react-router-dom";
import {
  Plus,
  LayoutGrid,
  List,
  ArrowUpRight,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import {
  useProjects,
  useProjectBoard,
} from "@/features/projects/hooks/useProjects";
import {
  useAgencyId,
  useAuth,
  usePermission,
} from "@/features/auth/AuthProvider";
import { TaskDetailPanel } from "@/features/projects/components/TaskDetailPanel";
import { CreateTaskDialog } from "@/features/projects/components/CreateTaskDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/Dialog";
import {
  departments,
  stages,
  overdue,
  departmentTasks,
  cleanTitle,
} from "./productionWorkspace";
import type { Task } from "@/types/projects";

export function DepartmentPage() {
  const { department = "design" } = useParams();
  const agencyId = useAgencyId();
  return (
    <ProductionWorkspace
      key={agencyId + ":" + department}
      department={department}
    />
  );
}
function ProductionWorkspace({ department }: { department: string }) {
  const config = departments[department as keyof typeof departments];
  const agencyId = useAgencyId(),
    auth = useAuth();
  const canCreate = usePermission("tasks.create"),
    canEdit = usePermission("tasks.edit"),canMove=usePermission("tasks.move");
  const groupMove=useMoveTaskGroup();
  const [moveError,setMoveError]=useState("");
  const clients = useClients(agencyId);
  const [params]=useSearchParams();
  const [materialClient, setMaterialClient] = useState("");
  useEffect(()=>{const requested=params.get('clientId');if(requested&&clients.data?.some(c=>c.id===requested))setMaterialClient(requested);},[params,clients.data]);
  const query = useTasks({ search: config?.prefix || "" });
  const projects = useProjects(canCreate ? agencyId : undefined);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [assignee, setAssignee] = useState(""),
    [project, setProject] = useState("");
  const [view, setView] = useState<"board" | "list">("board"),
    [selected, setSelected] = useState<Task | null>(null);
  const [chooseProject, setChooseProject] = useState(false),
    [createProject, setCreateProject] = useState(""),
    [createOpen, setCreateOpen] = useState(false);
  const board = useProjectBoard(
    selected?.project_id ||
      (chooseProject || createOpen ? createProject : undefined),
  );
  if (!config) return <p role="alert">Área de produção não encontrada.</p>;
  const tasks = departmentTasks(query.data || [], config.prefix);
  const people = [
    ...new Map(
      tasks.flatMap((t) =>
        (t.assignees || []).map(
          (a) => [a.user_id, a.profile?.full_name || "Profissional"] as const,
        ),
      ),
    ).entries(),
  ];
  const projectOptions = [
    ...new Map(
      tasks.map((t) => [t.project_id, t.project?.name || "Projeto"] as const),
    ).entries(),
  ];
  const filtered = tasks.filter(
    (t) =>
      (!search ||
        `${t.title} ${t.description || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!status || (status === "overdue" ? overdue(t) : t.status === status)) &&
      (!project || t.project_id === project) &&
      (!assignee ||
        (t.assignees || []).some(
          (a) => a.user_id === (assignee === "me" ? auth.user?.id : assignee),
        )),
  );
  const metrics = [
    ["Demandas", tasks.length],
    ["Em produção", tasks.filter((t) => t.status === "in_progress").length],
    ["Em revisão", tasks.filter((t) => t.status === "review").length],
    ["Prazos vencidos", tasks.filter((t) => overdue(t)).length],
  ] as const;
  const card = (task: Task) => (
    <button
      type="button"
      key={task.id}
      onClick={() => setSelected(task)}
      className="w-full text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3 hover:border-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
    >
      <div className="flex justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
        <span>{task.project?.name || "Projeto"}</span>
        <span>
          {task.priority === "urgent"
            ? "Urgente"
            : task.priority === "high"
              ? "Alta prioridade"
              : task.priority === "low"
                ? "Baixa prioridade"
                : "Normal"}
        </span>
      </div>
      <h3 className="font-semibold break-words">
        {cleanTitle(task, config.prefix)}
      </h3>
      {task.description && (
        <p className="line-clamp-2 text-sm text-[var(--color-text-secondary)]">
          {task.description}
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={14} />
          {task.due_date
            ? task.due_date.slice(0, 10).split("-").reverse().join("/")
            : "Sem prazo"}
          {overdue(task) ? " · Vencido" : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <UserRound size={14} />
          {task.assignees
            ?.map((a) => a.profile?.full_name || "Profissional")
            .join(", ") || "Sem responsável"}
        </span>
      </div>
      <div className="flex justify-between text-xs">
        <span>
          {stages.find((s) => s.status === task.status)?.label || task.status}
        </span>
        <span className="text-[var(--color-primary)]">Ver demanda ↗</span>
      </div>
    </button>
  );
  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        title={config.name}
        subtitle={config.subtitle}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={() => setChooseProject(true)}>
              <Plus size={16} className="mr-2" />
              Nova demanda
            </Button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map(([label, count]) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-xs text-[var(--color-text-secondary)]">
              {label}
            </p>
            <p className="text-2xl font-semibold mt-2">
              {query.isLoading || query.isError ? "—" : count}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-40">
          <label className="text-xs" htmlFor="production-search">
            Buscar demanda
          </label>
          <Input
            id="production-search"
            placeholder="Título ou descrição…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-36">
          <label className="text-xs" htmlFor="production-status">
            Etapa
          </label>
          <Select
            id="production-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "", label: "Todas as etapas" },
              ...stages.map((s) => ({ value: s.status, label: s.label })),
              { value: "overdue", label: "Prazos vencidos" },
            ]}
          />
        </div>
        <div className="min-w-36">
          <label className="text-xs" htmlFor="production-project">
            Projeto
          </label>
          <Select
            id="production-project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            options={[
              { value: "", label: "Todos os projetos" },
              ...projectOptions.map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
        <div className="min-w-36">
          <label className="text-xs" htmlFor="production-person">
            Responsável
          </label>
          <Select
            id="production-person"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            options={[
              { value: "", label: "Toda a equipe" },
              { value: "me", label: "Minhas demandas" },
              ...people.map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            aria-label="Ver quadro"
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            variant="secondary"
            aria-label="Ver lista"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List size={16} />
          </Button>
        </div>
      </div>
      {query.isLoading && <p role="status">Carregando produção…</p>}
      {query.isError && (
        <div role="alert">
          Não foi possível carregar a produção.{" "}
          <Button variant="secondary" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {!query.isLoading && !query.isError && (
        <>
          {!filtered.length ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
              <h2 className="font-semibold">
                {tasks.length
                  ? "Nenhuma demanda corresponde aos filtros."
                  : `Sua produção de ${config.name} começa aqui.`}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {tasks.length
                  ? "Ajuste a busca, etapa ou responsável."
                  : "Crie uma demanda vinculada a um projeto ou receba as peças de um calendário aprovado."}
              </p>
              {canCreate && !tasks.length && (
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => setChooseProject(true)}
                >
                  Criar primeira demanda
                </Button>
              )}
            </div>
          ) : view === "board" ? (
            <><ClientKanbanBoard tasks={filtered} regionPrefix="Demandas de" canMove={canMove} busy={groupMove.isPending||query.isFetching} onOpen={setSelected} onMove={async(items,status)=>{setMoveError('');try{await groupMove.mutateAsync({agencyId,taskIds:items.map(t=>t.id),status})}catch{setMoveError('Não foi possível movimentar. Nenhuma demanda foi alterada.')}}}/>{moveError&&<p role="alert">{moveError}</p>}</>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map(card)}
            </div>
          )}
        </>
      )}
      {department !== "traffic" && <section className="space-y-4"><h2 className="font-semibold">Arquivos do cliente</h2><Select aria-label="Cliente dos materiais" value={materialClient} onChange={e=>setMaterialClient(e.target.value)} options={[{value:"",label:"Selecione um cliente"},...(clients.data||[]).map(c=>({value:c.id,label:c.name}))]}/>{clients.isError&&<p role="alert">Não foi possível carregar os clientes.</p>}{materialClient&&<ClientDrivePanel key={materialClient} clientId={materialClient}/>}</section>}
      {department === "traffic" && <section className="space-y-4"><h2 className="font-semibold">Resultados dos clientes</h2><Select aria-label="Cliente dos resultados Meta" value={materialClient} onChange={e=>setMaterialClient(e.target.value)} options={[{value:"",label:"Selecione um cliente"},...(clients.data||[]).map(c=>({value:c.id,label:c.name}))]}/>{materialClient&&<ClientMetaPanel key={materialClient} clientId={materialClient}/>}</section>}
      <section className="rounded-xl border border-[var(--color-border)] p-5">
        <h2 className="font-semibold">Materiais e fluxo de {config.name}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
          Abra uma demanda para organizar descrição, checklist, comentários e
          links dos materiais de trabalho.
        </p>
        <ul className="grid gap-3 md:grid-cols-3 mt-4">
          {config.deliverables.map((item) => (
            <li
              key={item}
              className="text-sm border-l-2 border-[var(--color-primary)] pl-3"
            >
              {item}
            </li>
          ))}
        </ul>

      {department === "traffic" && (
          <p className="text-xs mt-4 text-[var(--color-text-secondary)]">
            As métricas são consultadas no Meta após a autorização da conta.
            Este painel usa somente leitura e não publica anúncios.
          </p>
        )}
        <Link
          to="/editorial"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] mt-5"
        >
          Abrir calendário editorial
          <ArrowUpRight size={15} />
        </Link>
      </section>
      <Dialog open={chooseProject} onOpenChange={setChooseProject}>
        <DialogHeader>
          <DialogTitle>Nova demanda de {config.name}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm mb-4">
            Escolha o projeto que receberá esta entrega.
          </p>
          <label htmlFor="new-production-project" className="text-sm">
            Projeto da demanda
          </label>
          <Select
            id="new-production-project"
            value={createProject}
            onChange={(e) => setCreateProject(e.target.value)}
            options={[
              { value: "", label: "Selecione um projeto" },
              ...(projects.data || [])
                .filter(
                  (p) => p.status !== "archived" && p.status !== "completed",
                )
                .map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          {projects.isLoading && <p role="status">Carregando projetos…</p>}
          {projects.isError && (
            <p role="alert">Não foi possível carregar os projetos.</p>
          )}
          {createProject && board.isLoading && (
            <p role="status">Carregando quadro…</p>
          )}
          {createProject && board.isError && (
            <p role="alert">
              Não foi possível carregar o quadro deste projeto.
            </p>
          )}
          {createProject &&
            !board.isLoading &&
            !board.isError &&
            !board.data?.columns?.length && (
              <p className="mt-3 text-sm">
                Este projeto precisa de um quadro com etapas antes de receber
                demandas.
              </p>
            )}
          <Button
            variant="primary"
            className="mt-4"
            disabled={
              !createProject || !board.data?.columns?.length || board.isLoading
            }
            onClick={() => {
              setChooseProject(false);
              setCreateOpen(true);
            }}
          >
            Continuar
          </Button>
          {!projects.isLoading &&
            !projects.isError &&
            !(projects.data || []).length && (
              <p className="mt-3 text-sm">
                Cadastre um projeto em Projetos antes de criar a demanda.
              </p>
            )}
        </DialogContent>
      </Dialog>
      {createOpen && board.data && (
        <CreateTaskDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          projectId={createProject}
          boardId={board.data.id}
          agencyId={agencyId}
          columns={board.data.columns || []}
          titlePrefix={config.prefix}
        />
      )}
      {selected && canEdit && (
        <TaskDetailPanel
          taskId={selected.id}
          projectId={selected.project_id}
          agencyId={agencyId}
          columns={board.data?.columns || []}
          titlePrefix={config.prefix}
          open={true}
          onClose={() => setSelected(null)}
        />
      )}
      {selected && !canEdit && (
        <Dialog open={true} onOpenChange={() => setSelected(null)}>
          <DialogHeader>
            <DialogTitle>{cleanTitle(selected, config.prefix)}</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <p className="whitespace-pre-wrap">
              {selected.description || "Sem descrição."}
            </p>
            <p className="mt-4 text-sm">
              {selected.project?.name} ·{" "}
              {stages.find((s) => s.status === selected.status)?.label}
            </p>
            <p className="mt-3 text-sm">
              Acesso de consulta. A edição depende das permissões da equipe.
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
