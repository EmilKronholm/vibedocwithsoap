import { DEFAULT_PERMISSIONS, type CommandKind } from "../commands";
import { normalizeFamily } from "./fonts";
import type { ContentAllow, ContentLevel, DocumentRules, PageRules } from "./types";

/** What each level allows before `allow` and `tags` adjust it. */
const LEVELS: Record<ContentLevel, Required<ContentAllow>> = {
  text: { images: false, links: false, tables: false, svg: false, freeform: false },
  rich: { images: true, links: true, tables: true, svg: false, freeform: false },
  free: { images: true, links: true, tables: true, svg: true, freeform: true },
};

/** The rules with every default filled in, ready to be checked against. */
export interface ResolvedRules {
  level: ContentLevel;
  allow: Required<ContentAllow>;
  /** Upper-case tag names, when `tags` was given. */
  tags: ReadonlySet<string> | null;
  /** Lower-case family names, when fonts are restricted. */
  fonts: ReadonlySet<string> | null;
  page: PageRules;
  permissions: { human: ReadonlySet<CommandKind>; ai: ReadonlySet<CommandKind> };
}

export function resolveRules(rules?: DocumentRules | null): ResolvedRules {
  const level = rules?.content ?? "free";
  return {
    level,
    allow: { ...LEVELS[level], ...withoutUndefined(rules?.allow) },
    tags: rules?.tags ? new Set(rules.tags.map((t) => t.toUpperCase())) : null,
    fonts: rules?.fonts ? new Set(rules.fonts.map(normalizeFamily)) : null,
    page: rules?.page ?? {},
    permissions: {
      human: new Set(rules?.permissions?.human ?? DEFAULT_PERMISSIONS.human),
      ai: new Set(rules?.permissions?.ai ?? DEFAULT_PERMISSIONS.ai),
    },
  };
}

function withoutUndefined<T extends object>(value: T | undefined): Partial<T> {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, v]) => v !== undefined)) as Partial<T>;
}
