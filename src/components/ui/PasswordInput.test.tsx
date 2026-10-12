import { fireEvent, render, screen } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { PasswordInput } from "./PasswordInput";
it("reveals and hides the same password without submitting the form", () => {
  const submit = vi.fn();
  render(
    <form onSubmit={submit}>
      <PasswordInput id="test-password" defaultValue="example-only" />
    </form>,
  );
  const input = screen.getByDisplayValue("example-only");
  expect(input).toHaveAttribute("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(input).toHaveAttribute("type", "text");
  fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
  expect(input).toHaveAttribute("type", "password");
  expect(submit).not.toHaveBeenCalled();
});
