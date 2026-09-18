import { afterEach, beforeEach, expect, test } from "bun:test";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import CookieConsent from "../src/components/CookieConsent";
import PrivacyPolicy from "../src/components/PrivacyPolicy";

const KEY = "ditto_cookie_consent";
let host: HTMLDivElement;
let root: Root;
const storage = globalThis.localStorage;
const wait = async (ms: number) => { await act(async () => { await Bun.sleep(ms); }); };
const click = async (element: Element) => { await act(async () => { (element as HTMLElement).click(); }); };
const button = (text: string) => {
  const result = [...host.querySelectorAll("button")].find((el) => el.textContent?.trim() === text);
  expect(result).toBeDefined();
  return result!;
};
const consent = () => host.querySelector('[aria-label="Cookie consent"]');
const policy = () => host.querySelector('[aria-label="Privacy Policy"]');

function App() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Open privacy</button><CookieConsent onOpenPrivacy={() => setOpen(true)} /><PrivacyPolicy open={open} onClose={() => setOpen(false)} /></>;
}
async function mount() { await act(async () => { root.render(<App />); }); }
async function key(key: string, shiftKey = false) {
  const event = new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });
  await act(async () => { document.activeElement!.dispatchEvent(event); });
  return event;
}
beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  storage.clear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
});

for (const [label, value] of [["Accept", "accepted"], ["Decline", "declined"]]) {
  test(`${label} persists, dismisses, and suppresses a remounted banner`, async () => {
    await mount();
    expect(consent()).toBeNull();
    await wait(1300);
    expect(consent()).not.toBeNull();
    await click(button(label));
    expect(storage.getItem(KEY)).toBe(value);
    await wait(650);
    expect(consent()).toBeNull();
    await act(async () => root.unmount());
    root = createRoot(host);
    await mount();
    await wait(1300);
    expect(consent()).toBeNull();
  });
  test(`${label} still dismisses when storage getter throws`, async () => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new DOMException("Blocked", "SecurityError"); } });
    await mount();
    await wait(1300);
    await click(button(label));
    await wait(650);
    expect(consent()).toBeNull();
  });
}
test("a failed storage write does not prevent dismissal", async () => {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null, setItem() { throw new Error("Quota exceeded"); } } });
  await mount(); await wait(1300);
  await click(button("Accept")); await wait(650);
  expect(consent()).toBeNull();
});
test("privacy button opens real policy without recording consent; body clicks stay open", async () => {
  await mount(); await wait(1300);
  await click(button("Privacy Policy"));
  expect(policy()?.textContent).toContain("Data we handle");
  expect(storage.getItem(KEY)).toBeNull();
  await click(host.querySelector("h2")!);
  expect(policy()).not.toBeNull();
});
for (const mode of ["Escape", "backdrop", "close button", "Back to Ditto"]) {
  test(`privacy closes using ${mode}`, async () => {
    storage.setItem(KEY, "accepted");
    await mount(); await click(button("Open privacy"));
    expect(policy()).not.toBeNull();
    if (mode === "Escape") await key("Escape");
    else if (mode === "backdrop") await click(policy()!);
    else if (mode === "close button") await click(host.querySelector('[aria-label="Close privacy policy"]')!);
    else await click(button(mode));
    await wait(500);
    expect(policy()).toBeNull();
  });
}
test("privacy moves, contains, and restores keyboard focus", async () => {
  storage.setItem(KEY, "accepted");
  await mount();
  const trigger = button("Open privacy");
  trigger.focus();
  await click(trigger);
  const first = host.querySelector('[aria-label="Close privacy policy"]') as HTMLButtonElement;
  const last = button("Back to Ditto");
  expect(document.activeElement === first).toBe(true);
  expect((await key("Tab", true)).defaultPrevented).toBe(true);
  expect(document.activeElement === last).toBe(true);
  expect((await key("Tab")).defaultPrevented).toBe(true);
  expect(document.activeElement === first).toBe(true);
  trigger.focus();
  expect(document.activeElement === first).toBe(true);
  await key("Escape"); await wait(500);
  expect(document.activeElement === trigger).toBe(true);
});
test("unmount cancels the delayed banner and removes the Escape listener", async () => {
  await mount(); await click(button("Open privacy"));
  await act(async () => root.unmount());
  root = createRoot(host);
  await wait(1300);
  await key("Escape");
  expect(host.childElementCount).toBe(0);
});
