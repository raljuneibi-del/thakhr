/* SADEEM Hangar · entry. Loads the design system, the shell, every zone, then opens the building. */
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import.meta.glob("./styles/zones/*.css", { eager: true });

import { loadJSON, show, lang, type ZoneId, ZONES } from "@/core";
import { setLangValue } from "@/core/i18n";
import { mountShell } from "@/shell/shell";

// every zone registers itself on import
import.meta.glob("./zones/*.ts", { eager: true });
import.meta.glob("./scenes/*.ts", { eager: true });

async function boot() {
  setLangValue(lang());
  mountShell();
  await Promise.all([loadJSON("quotes"), loadJSON("radar"), loadJSON("library")]);
  const h = location.hash.slice(1) as ZoneId;
  await show(ZONES.includes(h) ? h : "arrival");
  document.body.classList.add("ready");
}
void boot();
