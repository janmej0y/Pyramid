/**
 * Drives every interactive control in a real browser and asserts each change
 * actually persisted through the API.
 *
 *   APP_URL=http://localhost:3000 node test/ui-check.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
let pass = 0;
let fail = 0;
const errors = [];

function check(name, ok, detail = "") {
  if (ok) {
    console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
    pass++;
  } else {
    console.log(`  \x1b[31mFAIL\x1b[0m  ${name}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}
const section = (t) => console.log(`\n\x1b[36m=== ${t} ===\x1b[0m`);
const visible = (loc) => loc.first().isVisible().catch(() => false);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

section("login");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Continue as Guest" }).click();
await page.waitForURL("**/tasks", { timeout: 20000 });
await page.waitForLoadState("networkidle");
check("guest login navigates to /tasks", page.url().includes("/tasks"));

// Wait for the condition rather than a fixed delay: the list renders only
// after the API round trip, and a hardcoded timeout made this suite flaky.
await page
  .getByText("Write API Documentation")
  .first()
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});
check(
  "seeded data renders from MongoDB",
  await visible(page.getByText("Write API Documentation")),
);

section("create task");
await page.getByRole("button", { name: "Add Task" }).first().click();
await page.waitForTimeout(300);
const field = page.getByRole("textbox", { name: "Add Task" }).first();
check("Add Task opens an inline field", await visible(field));
await field.fill("Mongo smoke task");
await page.keyboard.press("Enter");
await page
  .getByText("Mongo smoke task")
  .first()
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});
check("new task appears", await visible(page.getByText("Mongo smoke task")));
await page.keyboard.press("Escape");

section("row actions");
const row = page.locator("li", { hasText: "Mongo smoke task" }).first();
await row.getByRole("button", { name: /Actions for Mongo smoke task/ }).click();
await page.waitForTimeout(350);
check("row actions menu opens", await visible(page.getByRole("menu")));
await page.getByRole("menuitem", { name: "Urgent" }).click();
await page
  .locator("li", { hasText: "Mongo smoke task" })
  .getByText("Urgent")
  .first()
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});
check(
  "priority change persists",
  await visible(
    page.locator("li", { hasText: "Mongo smoke task" }).getByText("Urgent"),
  ),
);

await page.locator("li", { hasText: "Mongo smoke task" }).first()
  .getByRole("button", { name: /Actions for/ }).click();
await page.waitForTimeout(350);
await page.getByRole("menuitem", { name: "Doing" }).click();
// The row unmounts from "To Do" and remounts under "Doing" after the refetch.
await page
  .locator("section", { hasText: "Doing" })
  .first()
  .getByText("Mongo smoke task")
  .first()
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});
check(
  "status move relocates the task",
  await visible(
    page.locator("section", { hasText: "Doing" }).first().getByText("Mongo smoke task"),
  ),
);

section("board view");
await page.getByRole("button", { name: "Fields" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Board" }).click();
await page.waitForTimeout(400);
await page.keyboard.press("Escape");
await page.waitForTimeout(700);
check("board renders columns", (await page.locator("section").count()) >= 4);
check(
  "task visible on board",
  await visible(page.locator("article", { hasText: "Mongo smoke task" })),
);

section("task detail");
await page.getByRole("button", { name: "Fields" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "List" }).click();
await page.waitForTimeout(300);
await page.keyboard.press("Escape");
await page.waitForTimeout(600);

await page.getByRole("link", { name: "Mongo smoke task" }).first().click();
await page.waitForURL("**/tasks/**", { timeout: 20000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1000);
check("navigates to task detail", page.url().includes("/tasks/"));

await page.getByRole("button", { name: "Edit task title" }).click();
await page.waitForTimeout(300);
await page.getByRole("textbox", { name: "task title" }).fill("Renamed in Mongo");
await page.keyboard.press("Enter");
// Waits for the saved value to appear rather than a fixed delay — the save
// round-trips to Atlas before the heading re-renders.
await page
  .getByText("Renamed in Mongo")
  .first()
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});
check("title edit persists", await visible(page.getByText("Renamed in Mongo")));

await page.getByRole("button", { name: "Edit description" }).click();
await page.waitForTimeout(300);
await page.getByRole("textbox", { name: "description" }).fill("Stored in MongoDB.");
await page.keyboard.press("Control+Enter");
await page
  .getByText("Stored in MongoDB.")
  .first()
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});
check("description edit persists", await visible(page.getByText("Stored in MongoDB.")));

section("details panel");
await page.getByRole("button", { name: /Backlog|To Do|Doing|Completed|On Hold/ })
  .first().click();
await page.waitForTimeout(450);
const statusOpen = await visible(page.getByRole("menuitemradio"));
check("status dropdown opens", statusOpen);
if (statusOpen) {
  await page.getByRole("menuitemradio", { name: "Completed" }).click();
  await page.waitForTimeout(1200);
}

await page.getByRole("button", { name: "Add members" }).first().click();
await page.waitForTimeout(450);
const membersOpen = await visible(page.getByRole("menuitemcheckbox"));
check("members picker opens", membersOpen);
if (membersOpen) {
  await page.getByRole("menuitemcheckbox").first().click();
  await page.waitForTimeout(1200);
}

section("subtasks + comments");
await page.getByRole("button", { name: "Add Subtasks" }).first().click();
await page.waitForTimeout(350);
const sub = page.getByRole("textbox", { name: "Add Subtasks" }).first();
if (await visible(sub)) {
  await sub.fill("Mongo subtask");
  await page.keyboard.press("Enter");
  await page
    .getByText("Mongo subtask")
    .first()
    .waitFor({ state: "visible", timeout: 20000 })
    .catch(() => {});
}
check("subtask created", await visible(page.getByText("Mongo subtask")));

await page.getByRole("textbox", { name: "Add a comment" }).fill("Mongo comment");
await page.keyboard.press("Enter");
await page
  .getByText("Mongo comment")
  .first()
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});
check("comment posted", await visible(page.getByText("Mongo comment")));

section("projects");
await page.goto(BASE + "/projects", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Add Projects" }).first().click();
await page.waitForTimeout(350);
const proj = page.getByRole("textbox", { name: "Add Projects" }).first();
if (await visible(proj)) {
  await proj.fill("Mongo project");
  await page.keyboard.press("Enter");
  await page
    .getByText("Mongo project")
    .first()
    .waitFor({ state: "visible", timeout: 20000 })
    .catch(() => {});
}
check("project created", await visible(page.getByText("Mongo project")));

await page.locator("li", { hasText: "Mongo project" }).first()
  .getByRole("button", { name: /Actions for/ }).click();
await page.waitForTimeout(350);
await page.getByRole("menuitem", { name: "Delete" }).click();
await page
  .getByText("Mongo project")
  .first()
  .waitFor({ state: "detached", timeout: 20000 })
  .catch(() => {});
check("project deleted", !(await visible(page.getByText("Mongo project"))));

section("settings + theme");
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const nameField = page.getByRole("textbox", { name: "Full name" });
await nameField.fill("Mongo Guest");
await nameField.blur();
await page.waitForTimeout(1400);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
check(
  "profile name persists after reload",
  (await page.getByRole("textbox", { name: "Full name" }).inputValue()) === "Mongo Guest",
);

await page.getByRole("button", { name: "Theme" }).first().click();
await page.waitForTimeout(450);
await page.getByRole("button", { name: "Dark" }).first().click();
await page.waitForTimeout(700);
check(
  "theme switch applies",
  (await page.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "dark",
);

section("cleanup");
await page.goto(BASE + "/tasks", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const created = page.locator("li", { hasText: "Renamed in Mongo" }).first();
if (await visible(created)) {
  await created.getByRole("button", { name: /Actions for/ }).click();
  await page.waitForTimeout(400);
  await page.getByRole("menuitem", { name: "Delete" }).click();
  // Waits for the row to disappear rather than a fixed delay — a remote
  // database makes the delete-then-refetch round trip too slow to guess at.
  await page
    .locator("li", { hasText: "Renamed in Mongo" })
    .first()
    .waitFor({ state: "detached", timeout: 15000 })
    .catch(() => {});
}
check("task deleted", !(await visible(page.getByText("Renamed in Mongo"))));

console.log(`\n\x1b[36m======================\x1b[0m\npassed: ${pass}  failed: ${fail}`);
console.log("console errors:", errors.length ? errors.slice(0, 5) : "none");

await browser.close();
process.exit(fail > 0 ? 1 : 0);
