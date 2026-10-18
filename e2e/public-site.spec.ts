import { test, expect, type Page } from "@playwright/test";
const agency = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const uid = "11111111-1111-4111-8111-111111111111";
const user = {
  id: uid,
  aud: "authenticated",
  role: "authenticated",
  email: "test@example.invalid",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated", aud: "authenticated" })).toString("base64url")}.test-only`;
async function intercept(page: Page, owner = true) {
  await page.route("https://audit-auth.supabase.co/**", async (route) => {
    const u = new URL(route.request().url()),
      table = u.pathname.split("/").at(-1);
    const respond = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(data),
      });
    if (table === "token")
      return respond({
        access_token: token,
        refresh_token: "test-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user,
      });
    if (table === "user") return respond(user);
    if (table === "profiles") return respond([{ full_name: "Test owner" }]);
    if (table === "agency_members")
      return respond([
        {
          agency_id: agency,
          role_id: "22222222-2222-4222-8222-222222222222",
          agencies: { id: agency, name: "Dois.Zero", status: "active" },
          roles: {
            id: "22222222-2222-4222-8222-222222222222",
            name: owner ? "OWNER" : "VIEWER",
          },
        },
      ]);
    if (table === "agency_public_sites")
      return respond({ code: "PGRST205", message: "not activated" }, 404);
    if (table === "role_permissions")
      return respond([
        { allowed: true, permissions: { permission_key: "dashboard.view" } },
      ]);
    return respond([]);
  });
}
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("test@example.invalid");
  await page.getByLabel("Senha", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}
test("public home renders independently of login, serves assets and links to a quick brief", async ({
  page,
}, info) => {
  await intercept(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Sua marca merece",
  );
  await expect(page.locator(".dz-hero-logo").first()).toBeVisible();
  expect(
    await page
      .locator(".dz-hero-logo").first()
      .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
  ).toBe(true);
  await expect(page.locator(".dz-client-logo").first()).toBeAttached();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `/private/tmp/doiszero-home-${info.project.name.split(" ")[0]}.png`,
  });
  await page.getByRole("link", { name: "Começar meu projeto" }).click();
  await expect(page).toHaveURL(/brief/);
  await expect(page.getByLabel("Seu nome")).toBeVisible();
});
test("mobile menu and FAQ are accessible and do not lose the contact route", async ({
  page,
}) => {
  await intercept(page);
  await page.goto("/");
  if (page.viewportSize()!.width < 768) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(
      page.getByRole("button", { name: "Fechar menu" }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("link", { name: "Contato", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Abrir menu" }),
    ).toBeVisible();
  }
  await page
    .locator("summary")
    .filter({ hasText: "Por onde começamos?" })
    .click();
  await expect(
    page.getByText("Pelo seu negócio.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Enviar meu briefing" }).click();
  await expect(page).toHaveURL(/brief/);
});
test("scroll changes camera on desktop; mobile and reduced motion show every project", async ({
  page,
}, info) => {
  await intercept(page);
  await page.goto("/");
  const panels = page.locator("[data-scene-panel]");
  await expect(panels).toHaveCount(3);
  if (page.viewportSize()!.width >= 768) {
    const initial = await panels.first().getAttribute("style");
    await page.evaluate(() => {
      const el = document.querySelector(".dz-gallery") as HTMLElement;
      window.scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * 0.5);
    });
    await expect
      .poll(() => panels.first().getAttribute("style"))
      .not.toBe(initial);
    await page.screenshot({
      path: `/private/tmp/doiszero-gallery-${info.project.name.split(" ")[0]}.png`,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let i = 0; i < 3; i++) {
    await panels.nth(i).scrollIntoViewIfNeeded();
    await expect(panels.nth(i)).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
test("brief validates contact, keeps values between steps, and never fakes reception", async ({
  page,
}) => {
  await intercept(page);
  let writes = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("supabase")) writes++;
  });
  await page.goto("/brief");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByLabel("Seu nome")).toBeVisible();
  await page.getByLabel("Seu nome").fill("Cliente de teste");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("cliente@example.invalid");
  await page.getByLabel("WhatsApp com DDD").fill("84999999999");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Branding & identidade").check();
  await page
    .getByLabel("O que você quer alcançar?")
    .fill("Precisamos criar uma identidade para nossa nova marca.");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByText("Cliente de teste · cliente@example.invalid"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enviar briefing", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Enviar pelo WhatsApp" }),
  ).toHaveCount(0);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Enviar briefing", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("ainda não foi ativado");
  await expect(
    page.getByRole("link", { name: "Enviar pelo WhatsApp" }),
  ).toHaveAttribute("href", /wa.me\/5584999542292/);
  expect(writes).toBe(0);
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.getByLabel("O que você quer alcançar?")).toHaveValue(
    "Precisamos criar uma identidade para nossa nova marca.",
  );
});
test("owner can edit a local draft; preview is scoped to agency and remote publish is gated", async ({
  page,
}) => {
  await intercept(page);
  await login(page);
  await page.goto("/settings/public-site");
  await expect(
    page.getByRole("heading", { name: "Site público da agência", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Uma marca inesquecível");
  await page
    .getByRole("textbox", { name: "Texto da hero", exact: true })
    .fill("Texto editorial preparado pela agência para o preview.");
  await page.getByRole("button", { name: "Salvar rascunho local" }).click();
  await expect(page.getByRole("status").last()).toContainText("Rascunho salvo");
  await expect(
    page.getByRole("button", { name: "Salvar no Supabase" }),
  ).toBeDisabled();
  await page.goto(`/?draft=${agency}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Uma marca inesquecível",
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Sua marca merece",
  );
  await page.goto("/settings/public-site");
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(
    "Uma marca inesquecível",
  );
});
test("viewer cannot enter public site management", async ({ page }) => {
  await intercept(page, false);
  await login(page);
  await page.goto("/settings/public-site");
  await expect(
    page.getByRole("heading", { name: "Acesso negado" }),
  ).toBeVisible();
});

test("portfolio details, hero loop and footer branding preserve the public contact flow", async ({ page }) => {
  await intercept(page);
  await page.goto("/");
  await expect(page.locator(".dz-hero-loop-group")).toHaveCount(2);
  await expect(page.locator("footer .dz-brand-logo")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Solicitar briefing de/ })).toHaveCount(0);
  const href = await page.locator(".dz-scene-copy a").first().getAttribute("href");
  await page.goto(href!);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Presença que fica.");
  await expect(page.getByRole("heading", { name: "A ideia por trás do projeto." })).toBeVisible();
  await page.getByRole("link", { name: "Começar meu projeto" }).click();
  await expect(page).toHaveURL(/\/brief$/);
  await page.goto("/portfolio/project-that-does-not-exist");
  await expect(page.getByRole("heading", { name: "Projeto indisponível" })).toBeVisible();
});
