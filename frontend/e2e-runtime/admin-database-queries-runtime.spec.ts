import { test, expect } from "@playwright/test";

const FRONTEND_BASE = "http://127.0.0.1:5173";
const BACKEND_BASE = "http://127.0.0.1:8000/api";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  const response = await page.request.post(`${BACKEND_BASE}/auth/login`, {
    data: { identifier: "admin", password: "admin" },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();

  await page.addInitScript(
    ([token, user]) => {
      window.localStorage.setItem("tyda.accessToken", token);
      window.localStorage.setItem("tyda.activeUser", JSON.stringify(user));
    },
    [payload.access_token as string, payload.user as Record<string, unknown>]
  );
}

test.describe("Admin Databasfrågor runtime", () => {
  test("loads query list and runs select + stored procedure", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto(`${FRONTEND_BASE}/admin/databasfragor`, { waitUntil: "load", timeout: 15000 });

    await expect(page.getByRole("heading", { name: "Databasfrågor" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/kunde inte ladda frågelistan/i)).not.toBeVisible();

    const allUsersButton = page.getByRole("button", { name: /^Alla användare\b(?! även)/i });
    const procedureButton = page.getByRole("button", { name: /Rapport per kategori \(stored procedure\)/i });

    await expect(allUsersButton).toBeVisible({ timeout: 10000 });
    await expect(procedureButton).toBeVisible({ timeout: 10000 });

    await allUsersButton.click();
    await expect(page.locator("pre")).toContainText("FROM Anvandare");

    await page.getByRole("button", { name: /visa resultat/i }).click();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("table thead")).toContainText("AnvandarID");
    await expect(page.getByText(/Resultat \(/)).toBeVisible();

    await procedureButton.click();
    await expect(page.locator("pre")).toContainText("CALL hamta_poster_per_kategori");

    await page.getByRole("button", { name: /visa resultat/i }).click();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("table thead")).toContainText("KategoriID");
  });
});
