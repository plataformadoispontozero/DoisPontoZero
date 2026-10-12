import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  data: [] as Array<Record<string, unknown>>,
  show: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user" },
    activeAgency: { agencyId: "agency" },
    isDemo: false,
  }),
}));
vi.mock("@/features/notifications/hooks/useNotifications", () => ({
  useNotifications: () => ({ data: state.data }),
}));
vi.mock("./appRuntime", () => ({
  preferenceKey: (scope: string) => scope,
  showBrandedNotification: state.show,
}));
import { BrandedNotificationController } from "./BrandedNotificationController";
const notice = (id: string, recipient = "user", agency = "agency") => ({
  id,
  recipient_id: recipient,
  agency_id: agency,
  title: "Aviso",
  body: "Mensagem",
  read_at: null,
});
describe("recipient device notifications", () => {
  beforeEach(() => {
    state.show.mockClear();
    state.data = [];
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      clear: () => store.clear(),
    });
    localStorage.setItem("agency:user", "enabled");
  });
  it("does not announce initial history or another agency/recipient", async () => {
    state.data = [notice("old")];
    const view = render(<BrandedNotificationController />);
    expect(state.show).not.toHaveBeenCalled();
    state.data = [
      notice("old"),
      notice("other", "other"),
      notice("agency-other", "user", "other"),
    ];
    view.rerender(<BrandedNotificationController />);
    expect(state.show).not.toHaveBeenCalled();
    state.data = [notice("old"), notice("new")];
    await act(async () => view.rerender(<BrandedNotificationController />));
    expect(state.show).toHaveBeenCalledExactlyOnceWith(
      "Aviso",
      "Mensagem",
      "doiszero:new",
    );
  });
  it("respects disabled preference", () => {
    localStorage.clear();
    const view = render(<BrandedNotificationController />);
    state.data = [notice("new")];
    view.rerender(<BrandedNotificationController />);
    expect(state.show).not.toHaveBeenCalled();
  });
});
