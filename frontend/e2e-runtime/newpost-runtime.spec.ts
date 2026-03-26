import { test, expect } from "@playwright/test";

async function openNewPostAsNewUser(page: import("@playwright/test").Page) {
  const stamp = Date.now();
  const pwd = `Rt${stamp}Rt9`;
  await page.goto("/", { waitUntil: "load", timeout: 15000 });
  await page.getByRole("button", { name: /^skapa konto$/i }).click();
  await page.getByPlaceholder("Ditt namn").fill(`Runtime ${stamp}`);
  await page.getByPlaceholder("du@example.com").fill(`runtime.${stamp}@example.com`);
  await page.locator('input[type="password"]').nth(0).fill(pwd);
  await page.locator('input[type="password"]').nth(1).fill(pwd);
  await page.getByRole("button", { name: /skapa konto och öppna mitt rum/i }).click();
  await expect(page).toHaveURL(/\/mitt-rum/, { timeout: 15000 });
  await page.goto("/new-post", { waitUntil: "load", timeout: 15000 });
  await expect(page.getByRole("heading", { name: /ny post/i })).toBeVisible({ timeout: 15000 });
}

test.describe("NewPostPage runtime verification", () => {
  test("1-2-3: Onboarding reaches new post and categories load", async ({ page }) => {
    await openNewPostAsNewUser(page);
    const categorySelect = page.locator("select").first();
    await expect(categorySelect).toBeVisible();
    const categoryOptions = await categorySelect.locator("option").allTextContents();
    expect(categoryOptions.length).toBeGreaterThan(0);
  });

  test("4-5: Content matching shows concepts in side panel with badges", async ({ page }) => {
    await openNewPostAsNewUser(page);
    await page.getByPlaceholder(/börja skriva/i).waitFor({ state: "visible", timeout: 10000 });
    await page.getByPlaceholder(/börja skriva/i).fill("Jag drömde om en orm och vatten. Det var mörkt.");
    await page.waitForTimeout(600);

    const insightsPanel = page.locator("aside").getByText(/det här ser systemet nu/i);
    await expect(insightsPanel).toBeVisible();
    await expect(page.locator("aside").getByText("orm", { exact: true }).first()).toBeVisible();
  });

  test("6-7-8: Create post and verify navigation and content", async ({ page }) => {
    await openNewPostAsNewUser(page);
    await page.getByPlaceholder(/ge din post en titel/i).waitFor({ state: "visible", timeout: 15000 });
    const title = `Runtime test ${Date.now()}`;
    const content = "Ormen kröp genom vattnet. Mörkret föll.";

    await page.getByPlaceholder(/ge din post en titel/i).fill(title);
    await page.getByPlaceholder(/börja skriva/i).fill(content);
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /spara i mitt rum|spara och publicera/i }).click();
    await expect(page).toHaveURL(/\/posts\/\d+/, { timeout: 8000 });

    await expect(page.getByText(title)).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(content)).toBeVisible();
  });

  test("9a: Empty title/content blocks submit", async ({ page }) => {
    await openNewPostAsNewUser(page);
    await page.getByPlaceholder(/ge din post en titel/i).waitFor({ state: "visible", timeout: 15000 });
    await page.getByPlaceholder(/ge din post en titel/i).fill("");
    await page.getByPlaceholder(/börja skriva/i).fill("");
    const btn = page.getByRole("button", { name: /spara i mitt rum|spara och publicera/i });
    await btn.click();
    await expect(page).toHaveURL("/new-post");
  });

  test("9b: HTML5 validation on empty submit", async ({ page }) => {
    await openNewPostAsNewUser(page);
    await page.getByPlaceholder(/ge din post en titel/i).waitFor({ state: "visible", timeout: 15000 });
    const form = page.locator("form");
    const submitBtn = form.getByRole("button", { name: /spara i mitt rum|spara och publicera/i });
    await submitBtn.click();
    const invalidInputs = await page.locator("input:invalid, textarea:invalid").count();
    expect(invalidInputs).toBeGreaterThan(0);
  });

  test("10: Mobile drawer exposes authed navigation and sign-out", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNewPostAsNewUser(page);

    await page.getByRole("button", { name: /öppna meny/i }).click();
    const drawer = page.getByRole("dialog", { name: /navigering/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: /mitt rum/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /mina poster/i })).toBeVisible();

    await drawer.getByRole("link", { name: /mina poster/i }).click();
    await expect(page).toHaveURL(/\/posts$/, { timeout: 10000 });
    await expect(drawer).not.toBeVisible();

    await page.getByRole("button", { name: /öppna meny/i }).click();
    const reopenedDrawer = page.getByRole("dialog", { name: /navigering/i });
    await expect(reopenedDrawer.getByRole("button", { name: /logga ut/i })).toBeVisible();
    await reopenedDrawer.getByRole("button", { name: /logga ut/i }).click();

    await expect(page).toHaveURL(/\/\?mode=login&session=switch#kom-igang$/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /kom in i tyda/i })).toBeVisible();
  });

  test("11: Category selection flows into AI contract and model UI", async ({ page }) => {
    await openNewPostAsNewUser(page);
    const categorySelect = page.locator("select").first();
    const options = await categorySelect.locator("option").evaluateAll((nodes) =>
      nodes.map((node) => ({
        value: (node as HTMLOptionElement).value,
        label: (node as HTMLOptionElement).label,
      }))
    );
    const poemOption = options.find((option) => /dikt/i.test(option.label));
    if (poemOption) {
      await categorySelect.selectOption(poemOption.value);
      await expect(categorySelect).toHaveValue(poemOption.value);
    }

    await page.getByPlaceholder(/ge din post en titel/i).fill(`AI contract ${Date.now()}`);
    await page.getByPlaceholder(/börja skriva/i).fill("Vattnet ligger stilla. Ett fönster andas skymning.");
    await page.getByRole("button", { name: /spara i mitt rum|spara och publicera/i }).click();
    await expect(page).toHaveURL(/\/posts\/\d+/, { timeout: 8000 });

    await page.getByRole("button", { name: /ai-tolkning/i }).click();
    await expect(page.getByText(/diktnärläsning|drömläsning|reflektionsläsning/i).last()).toBeVisible();

    const modelSelect = page.locator("select:visible").last();
    await expect(modelSelect).toBeVisible();
    const modelOptions = await modelSelect.locator("option").allTextContents();
    expect(modelOptions.length).toBeGreaterThanOrEqual(4);

    await page.getByRole("button", { name: /generera tolkning/i }).click();
    await expect(page).toHaveURL(/\/posts\/\d+\/tolkning/, { timeout: 25000 });
    await expect(page.getByRole("heading", { name: /möjlig läsning/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/försiktighet/i).first()).toBeVisible();
  });

  test("12: Desktop nav and runbook link are visible", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openNewPostAsNewUser(page);

    await expect(page.getByRole("link", { name: /ny post/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /utforska/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /konto/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /logga ut/i }).first()).toBeVisible();

    const runbookLink = page.getByRole("link", { name: /runbook/i }).first();
    await expect(runbookLink).toBeVisible();
    await expect(runbookLink).toHaveAttribute("href", "/runbook.md");
  });

  test("13: About page reflects current database truth", async ({ page }) => {
    await page.goto("/about", { waitUntil: "load", timeout: 15000 });
    await expect(page.getByRole("heading", { name: /om tyda/i })).toBeVisible();
    await expect(page.getByText(/6 tabeller, 2 triggers och 1 lagrad procedur/i)).toBeVisible();
    await expect(page.getByText(/inte en full historik över alla ändringar/i)).toBeVisible();
    await expect(page.getByText(/ON DELETE CASCADE/i).first()).toBeVisible();
  });
});
