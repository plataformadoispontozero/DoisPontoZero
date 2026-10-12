import { describe, it, expect } from "vitest";
import type { Task } from "@/types/projects";
import {
  overdue,
  departmentTasks,
  cleanTitle,
  departments,
} from "./productionWorkspace";
const task = (overrides: Partial<Task>): Task =>
  ({
    title: "[Design] Peça",
    status: "open",
    due_date: "2026-10-10",
    archived_at: null,
    ...overrides,
  }) as Task;
describe("Production workspace", () => {
  it("separates real department queues and excludes archived or unrelated tasks", () => {
    const tasks = [
      task({}),
      task({ title: "[Videomaker] Reel" }),
      task({ title: "[Design] Antiga", archived_at: "2026-10-10" }),
      task({ title: "Referência [Design]" }),
    ];
    expect(departmentTasks(tasks, departments.design.prefix)).toHaveLength(1);
    expect(departmentTasks(tasks, departments.video.prefix)).toHaveLength(1);
    expect(cleanTitle(tasks[0], departments.design.prefix)).toBe("Peça");
  });
  it("counts overdue only before today and for unfinished demands", () => {
    expect(overdue(task({}), "2026-10-12")).toBe(true);
    expect(overdue(task({ status: "done" }), "2026-10-12")).toBe(false);
    expect(overdue(task({ due_date: null }), "2026-10-12")).toBe(false);
    expect(overdue(task({ due_date: "2026-10-12" }), "2026-10-12")).toBe(false);
  });
});
