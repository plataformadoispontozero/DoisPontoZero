import { describe, expect, it, vi } from "vitest";
import {
  preferenceKey,
  safeNotificationText,
  requestDeviceNotificationPermission,
  showBrandedNotification,
} from "./appRuntime";
describe("device notifications", () => {
  it("isolates device preference by account and agency", () => {
    expect(preferenceKey("agency:a")).not.toBe(preferenceKey("agency:b"));
    expect(preferenceKey("agency:a")).not.toBe(preferenceKey("other:a"));
  });
  it("removes controls and limits OS notification payloads", () => {
    expect(safeNotificationText(" hello\nworld\u0000 ", 200)).toBe(
      "hello world",
    );
    expect(safeNotificationText("x".repeat(500), 120)).toHaveLength(120);
  });
});

const native = vi.hoisted(() => ({
  isPermissionGranted: vi.fn().mockResolvedValue(true),
  requestPermission: vi.fn().mockResolvedValue("granted"),
  sendNotification: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-notification", () => native);
describe("native notification bridge", () => {
  it("uses native permission and app notification plugin without a browser service worker", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      configurable: true,
    });
    try {
      expect(await requestDeviceNotificationPermission()).toBe("granted");
      expect(
        await showBrandedNotification("Dois.Zero", "Mensagem real", "real-id"),
      ).toBe(true);
      expect(native.sendNotification).toHaveBeenCalledWith({
        title: "Dois.Zero",
        body: "Mensagem real",
      });
    } finally {
      delete (window as Window & { __TAURI_INTERNALS__?: unknown })
        .__TAURI_INTERNALS__;
    }
  });
});
