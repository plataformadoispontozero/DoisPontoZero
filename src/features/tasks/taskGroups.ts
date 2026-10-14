export interface ClientTaskProject { client_id?: string | null; client?: { id: string; name: string } | null }
export function groupTasksByClient<T extends { project?: ClientTaskProject | null }>(tasks: T[]) {
  const groups = new Map<string, { id: string; name: string; tasks: T[] }>();
  for (const task of tasks) {
    const id = task.project?.client_id || task.project?.client?.id || 'without-client';
    const group = groups.get(id) || { id, name: task.project?.client?.name || (id === 'without-client' ? 'Projetos sem cliente' : 'Cliente vinculado'), tasks: [] };
    group.tasks.push(task);
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
