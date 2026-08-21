import { chromium } from "playwright";
let pass=0, fail=0;
const ck=(n,ok,d="")=>{ if(ok){console.log(`  PASS  ${n}`);pass++;} else {console.log(`  FAIL  ${n}${d?" — "+d:""}`);fail++;} };
const OUT="C:/Users/Main/AppData/Local/Temp/claude/c--Users-Main-Desktop-Pyramid/19449ed7-bcc9-49d9-8fd1-f1001f64eec8/scratchpad";
const b = await chromium.launch();
const ctx = await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2});
const p = await ctx.newPage();
const errs=[]; p.on("pageerror",e=>errs.push(String(e.message).slice(0,100)));
p.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,100));});
await p.goto("http://localhost:3000",{waitUntil:"networkidle"});
await p.getByRole("button",{name:"Continue as Guest"}).click();
await p.waitForURL("**/tasks",{timeout:30000});
await p.waitForLoadState("networkidle");
await p.waitForTimeout(1900);

await p.getByRole("button",{name:/^Filter$/}).click();
await p.waitForTimeout(700);
const parent = p.locator("[data-menu-panel]").first();
ck("filter panel opened", await parent.count()>0);

const pm = await parent.evaluate(el=>{
  const r=el.getBoundingClientRect();
  return { h:Math.round(r.height), scrollH:el.scrollHeight, clientH:el.clientHeight,
           bottom:Math.round(r.bottom), vh:window.innerHeight };
});
ck("parent panel does NOT scroll (all rows fit)", pm.scrollH<=pm.clientH+2, `scroll ${pm.scrollH} vs client ${pm.clientH}`);
ck("parent inside viewport", pm.bottom<=pm.vh, `${pm.bottom} vs ${pm.vh}`);

for (const label of ["Status","Priority","Members","Due Date","Teams","Labels","Reporter"]) {
  const row = parent.getByRole("button",{name:new RegExp(`^${label}$`)});
  if (await row.count()===0){ ck(`${label}: row present`, false); continue; }
  await row.hover();
  await p.waitForTimeout(600);
  const panels = p.locator("[data-menu-panel]");
  const n = await panels.count();
  if (n < 2){ ck(`${label}: flyout opened`, false, `${n} panels`); continue; }
  const fly = panels.nth(n-1);
  const m = await fly.evaluate(el=>{const r=el.getBoundingClientRect();
    return {t:Math.round(r.top),bt:Math.round(r.bottom),l:Math.round(r.left),
      rt:Math.round(r.right),w:Math.round(r.width),h:Math.round(r.height),
      vh:window.innerHeight,vw:window.innerWidth,
      onBody:el.parentElement===document.body};});
  ck(`${label}: portalled + fully visible`,
     m.onBody && m.t>=0 && m.bt<=m.vh && m.l>=0 && m.rt<=m.vw,
     `${m.w}x${m.h} at (${m.l},${m.t}) body=${m.onBody}`);
  if(label==="Due Date") await p.screenshot({path:`${OUT}/filter-due.png`});
}

// a flyout option must actually apply
const dueRow = parent.getByRole("button",{name:/^Due Date$/});
await dueRow.hover(); await p.waitForTimeout(600);
const last = p.locator("[data-menu-panel]").last();
const opt = last.getByRole("menuitem").filter({hasText:"Overdue"});
if (await opt.count()>0){
  await opt.first().click();
  await p.waitForTimeout(1200);
  const badge = await p.getByRole("button",{name:/Filter, \d+ active/}).count();
  ck("selecting a filter applies it", badge>0);
} else ck("Overdue option present", false);

ck("no console errors", errs.length===0, JSON.stringify(errs.slice(0,2)));
console.log(`\npassed: ${pass}  failed: ${fail}`);
await b.close();
process.exit(fail>0?1:0);
