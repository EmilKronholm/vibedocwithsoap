import type { Tab } from "../context";
import { aiTab } from "./ai";
import { editTab } from "./edit";
import { exportTab } from "./export";
import { historyTab } from "./history";
import { reviewTab } from "./review";
import { rolesTab } from "./roles";
import { rulesTab } from "./rules-tab";
import { saveTab } from "./save";
import { settingsTab } from "./settings";
import { structureTab } from "./structure";
import { styleTab } from "./style";

/** In the order a visitor should meet them. */
export const TABS: Tab[] = [editTab, styleTab, structureTab, settingsTab, aiTab, reviewTab, rulesTab, historyTab, saveTab, exportTab, rolesTab];
