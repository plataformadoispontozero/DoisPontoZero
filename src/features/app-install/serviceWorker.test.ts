import worker from "../../../public/service-worker.js?raw";
import { describe, expect, it, vi } from "vitest";
const runInNewContext = (
  script: string,
  context: { self: unknown; caches?: unknown; URL: typeof URL },
) =>
  new Function("self", "caches", "URL", script)(
    context.self,
    context.caches,
    context.URL,
  );
describe("private workspace service worker", () => {
  it("does not intercept network requests or open caches", () => {
    const handlers = new Map<string, Function>();
    const caches = { open: vi.fn() };
    runInNewContext(worker, {
      self: {
        addEventListener: (name: string, handler: Function) =>
          handlers.set(name, handler),
      },
      caches,
      URL,
    });
    expect(handlers.has("fetch")).toBe(false);
    expect(handlers.has("push")).toBe(false);
    expect(caches.open).not.toHaveBeenCalled();
  });
  it("ignores untrusted notification destinations and opens only own notifications route", async () => {
    const handlers = new Map<string, Function>();
    const openWindow = vi.fn().mockResolvedValue(undefined);
    runInNewContext(worker, {
      self: {
        location: { origin: "https://agency.example" },
        clients: { matchAll: async () => [], openWindow },
        addEventListener: (name: string, handler: Function) =>
          handlers.set(name, handler),
      },
      URL,
    });
    let pending: Promise<unknown> = Promise.resolve();
    handlers.get("notificationclick")!({
      notification: {
        close: vi.fn(),
        data: { route: "https://attacker.example" },
      },
      waitUntil: (promise: Promise<unknown>) => {
        pending = promise;
      },
    });
    await pending;
    expect(openWindow).toHaveBeenCalledWith(
      "https://agency.example/notifications",
    );
  });
});
