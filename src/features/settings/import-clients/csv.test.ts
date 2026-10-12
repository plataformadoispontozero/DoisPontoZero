import { describe, it, expect } from "vitest";
import { parseCsv, autoMapping, previewCsv } from "./csv";
describe("CSV de clientes", () => {
  it("aceita BOM, ponto e vírgula, acentos e aspas escapadas", () => {
    const d = parseCsv('\uFEFFNome;Slug\r\n"Agência ""Dois""";agencia-dois');
    expect(d.delimiter).toBe(";");
    expect(d.records[0].cells[0]).toBe('Agência "Dois"');
    expect(autoMapping(d.headers)).toEqual({ name: 0, slug: 1 });
  });
  it("preserva quebras e vírgulas dentro de aspas", () =>
    expect(
      parseCsv('name,slug\n"Nome,\ncompleto",nome').records[0].cells[0],
    ).toBe("Nome,\ncompleto"));
  it.each([
    "",
    "nome,nome\nx,y",
    'name,slug\n"x,y',
    'name,slug\nx"z,y',
    'name,slug\n"x"z,y',
    "name,slug\nx,\u0000",
  ])("rejeita CSV inválido %s", (v) => expect(() => parseCsv(v)).toThrow());
  it("bloqueia duplicados por slug, sem confundir nomes iguais", () => {
    const d = parseCsv("name,slug\nNome,um\nOutro,um\nNome,dois");
    const rows = previewCsv(d, autoMapping(d.headers), [
      { id: "1", name: "Nome", slug: "um" },
    ]);
    expect(rows[0].duplicate?.id).toBe("1");
    expect(rows[1].errors.length).toBeGreaterThan(0);
    expect(rows[2].duplicate).toBeUndefined();
    expect(rows[2].possibleSameName).toBe("Nome");
  });
  it("valida URL, status e campos obrigatórios", () => {
    const d = parseCsv(
      "name,slug,status,logo_url\nNome,ABC,inventado,javascript:alert(1)",
    );
    expect(previewCsv(d, autoMapping(d.headers), [])[0].errors).toHaveLength(3);
  });
  it("limita registros e tamanho", () => {
    expect(() =>
      parseCsv(
        "name,slug\n" +
          Array.from({ length: 501 }, (_, i) => `Nome,n-${i}`).join("\n"),
      ),
    ).toThrow();
    expect(() => parseCsv("x".repeat(2097153))).toThrow();
  });
});
