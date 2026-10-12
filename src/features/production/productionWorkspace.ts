import type { Task, TaskStatus } from "@/types/projects";
export const departments = {
  design: {
    name: "Design",
    prefix: "[Design]",
    subtitle:
      "Da direção visual à entrega final: organize peças, referências e revisões.",
    deliverables: [
      "Identidade visual e peças de campanha",
      "Posts, carrosséis e apresentações",
      "Referências, arquivos finais e revisão de arte",
    ],
  },
  video: {
    name: "Vídeo & Motion",
    prefix: "[Videomaker]",
    subtitle:
      "Do roteiro ao corte final: acompanhe gravação, edição e revisão.",
    deliverables: [
      "Roteiro e referências de gravação",
      "Reels, vídeos e animações",
      "Links de cortes, feedback e entrega final",
    ],
  },
  traffic: {
    name: "Tráfego Pago",
    prefix: "[Tráfego Pago]",
    subtitle:
      "Organize o planejamento de mídia, criativos e acompanhamento das campanhas.",
    deliverables: [
      "Objetivo, público e orçamento no briefing",
      "Criativos, copy e planejamento de mídia",
      "Links de relatórios e revisão de campanha",
    ],
  },
};
export const stages: { status: TaskStatus; label: string }[] = [
  { status: "open", label: "A fazer" },
  { status: "in_progress", label: "Em produção" },
  { status: "review", label: "Em revisão" },
  { status: "done", label: "Concluído" },
];
export function overdue(task: Task, today = localDate()) {
  return (
    !!task.due_date &&
    task.status !== "done" &&
    task.status !== "archived" &&
    task.due_date.slice(0, 10) < today
  );
}
export function departmentTasks(tasks: Task[], prefix: string) {
  return tasks.filter((t) => t.title.startsWith(prefix) && !t.archived_at);
}
export function cleanTitle(task: Task, prefix: string) {
  return task.title.slice(prefix.length).trim();
}

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
