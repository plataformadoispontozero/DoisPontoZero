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
  it("aceita exportação portuguesa sem slug, preservando campos entre aspas", () => {
    const d = parseCsv('\uFEFFID;Nome do cliente;Status;Público-alvo\r\nexterno;Agência São José;ativo;"Empresas\nLocais"');
    const mapping = autoMapping(d.headers);
    expect(mapping).toEqual({name:1,status:2,source_id:0,target_audience:3});
    const row = previewCsv(d, mapping, [])[0];
    expect(row.errors).toEqual([]);
    expect(row.data).toEqual({row:2,name:"Agência São José",slug:"agencia-sao-jose",status:"active",profile:{source_id:"externo",target_audience:"Empresas\nLocais"}});
    expect(d.records[0].cells[3]).toBe("Empresas\nLocais");
  });
  it("bloqueia colisões de slug gerado e não corrige slug explicitamente inválido", () => {
    const d = parseCsv("Nome do cliente;Status\nSão José;ativo\nSao Jose;inativo");
    expect(previewCsv(d,autoMapping(d.headers),[])[1].errors.join()).toContain("Slug repetido");
    const explicit = parseCsv("nome;slug\nNome;INVALIDO");
    expect(previewCsv(explicit,autoMapping(explicit.headers),[])[0].errors.join()).toContain("Slug obrigatório");
  });
  it("aceita mais de 500 registros e mantém validação", () => {
    expect(parseCsv("name,slug\n" + Array.from({ length: 501 }, (_, i) => `Nome,n-${i}`).join("\n")).records).toHaveLength(501);
    expect(() => parseCsv("x".repeat(2097153))).toThrow();
  });
});
