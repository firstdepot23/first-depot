"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MAX_OPTION_GROUPS, MAX_OPTIONS_PER_GROUP } from "@repo/types";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { normalizeLabel, parsePastedItems } from "../lib/productExtras";

export type OptionRow = {
  id?: number;
  name: string;
  extraPrice: number;
  available: boolean;
};

export type GroupRow = {
  id?: number;
  name: string;
  selection: "SINGLE" | "MULTIPLE";
  required: boolean;
  options: OptionRow[];
};

const newOption = (): OptionRow => ({
  name: "",
  extraPrice: 0,
  available: true,
});

// Ready-made starting points that match how the menu is usually set up.
const PRESETS: { button: string; group: Omit<GroupRow, "options"> }[] = [
  {
    button: "+ Accompaniment",
    group: {
      name: "Choose an accompaniment",
      selection: "SINGLE",
      required: true,
    },
  },
  {
    button: "+ Drink",
    group: { name: "Choose a drink", selection: "SINGLE", required: true },
  },
  {
    button: "+ Add-ons",
    group: { name: "Add extras", selection: "MULTIPLE", required: false },
  },
];

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

type Props = {
  value: GroupRow[];
  onChange: (groups: GroupRow[]) => void;
  issues?: string[];
};

// The extra things a customer can pick on a fast-food product. Each group is
// one question ("Choose an accompaniment", "Add a sauce") with a list of
// choices; a choice can cost extra (Masala chips +6,500) or be free.
const OptionGroupsEditor = ({ value, onChange, issues = [] }: Props) => {
  const groups = value;
  const [pasteFor, setPasteFor] = useState<number | null>(null);
  const [pasteText, setPasteText] = useState("");

  const updateGroup = (index: number, patch: Partial<GroupRow>) =>
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)));

  const updateOption = (gi: number, oi: number, patch: Partial<OptionRow>) =>
    updateGroup(gi, {
      options: (groups[gi]?.options ?? []).map((o, i) =>
        i === oi ? { ...o, ...patch } : o,
      ),
    });

  const addGroup = (preset?: Omit<GroupRow, "options">) => {
    if (groups.length >= MAX_OPTION_GROUPS) return;
    onChange([
      ...groups,
      {
        name: preset?.name ?? "",
        selection: preset?.selection ?? "SINGLE",
        required: preset?.required ?? false,
        options: [newOption()],
      },
    ]);
  };

  const removeGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
    setPasteFor(null);
  };

  const addOption = (gi: number) => {
    const current = groups[gi]?.options ?? [];
    if (current.length >= MAX_OPTIONS_PER_GROUP) return;
    updateGroup(gi, { options: [...current, newOption()] });
  };

  const removeOption = (gi: number, oi: number) =>
    updateGroup(gi, {
      options: (groups[gi]?.options ?? []).filter((_, i) => i !== oi),
    });

  const importPasted = (gi: number) => {
    const parsed = parsePastedItems(pasteText);
    if (parsed.length === 0) return;

    // Drop the empty placeholder rows, and skip names the group already has.
    const kept = (groups[gi]?.options ?? []).filter((o) => o.name.trim());
    const have = new Set(kept.map((o) => normalizeLabel(o.name)));
    const added: OptionRow[] = [];
    for (const item of parsed) {
      const key = normalizeLabel(item.name);
      if (have.has(key)) continue;
      have.add(key);
      added.push({
        name: item.name,
        extraPrice: item.extraPrice,
        available: true,
      });
    }

    updateGroup(gi, {
      options: [...kept, ...added].slice(0, MAX_OPTIONS_PER_GROUP),
    });
    setPasteText("");
    setPasteFor(null);
  };

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Nothing to choose from yet. Add an accompaniment, a drink or add-ons
          below. Customers pick from them when they order this product.
        </p>
      )}

      {groups.map((group, gi) => (
        <div
          key={group.id ?? `new-${gi}`}
          className="space-y-3 rounded-md border p-3"
        >
          <div className="flex items-start gap-2">
            <label className="flex-1 space-y-1 text-xs font-medium">
              <span>Question shown to the customer *</span>
              <Input
                value={group.name}
                placeholder="e.g. Choose an accompaniment"
                onChange={(e) => updateGroup(gi, { name: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              className="mt-5 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={`Remove group ${gi + 1}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 items-end gap-3">
            <label className="space-y-1 text-xs font-medium">
              <span>Customer can</span>
              <select
                className={SELECT_CLASS}
                value={group.selection}
                onChange={(e) =>
                  updateGroup(gi, {
                    selection:
                      e.target.value === "MULTIPLE" ? "MULTIPLE" : "SINGLE",
                  })
                }
              >
                <option value="SINGLE">Pick one (dropdown)</option>
                <option value="MULTIPLE">Pick several (tick boxes)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pb-2 text-xs font-medium">
              <Checkbox
                checked={group.required}
                onCheckedChange={(checked) =>
                  updateGroup(gi, { required: checked === true })
                }
              />
              Must choose before ordering
            </label>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_7.5rem_4.5rem_1.75rem] gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Item</span>
              <span>Extra (UGX)</span>
              <span>In stock</span>
              <span />
            </div>

            {group.options.map((option, oi) => (
              <div
                key={option.id ?? `new-${oi}`}
                className="grid grid-cols-[1fr_7.5rem_4.5rem_1.75rem] items-center gap-2"
              >
                <Input
                  className="h-9"
                  value={option.name}
                  placeholder="e.g. Chips"
                  aria-label={`Group ${gi + 1}, item ${oi + 1} name`}
                  onChange={(e) =>
                    updateOption(gi, oi, { name: e.target.value })
                  }
                />
                <Input
                  className="h-9"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={option.extraPrice ? option.extraPrice : ""}
                  placeholder="0 = included"
                  aria-label={`Group ${gi + 1}, item ${oi + 1} extra price`}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    updateOption(gi, oi, {
                      extraPrice:
                        e.target.value.trim() === "" || !Number.isFinite(n)
                          ? 0
                          : n,
                    });
                  }}
                />
                <label className="flex items-center justify-center">
                  <Checkbox
                    checked={option.available}
                    onCheckedChange={(checked) =>
                      updateOption(gi, oi, { available: checked === true })
                    }
                    aria-label={`Group ${gi + 1}, item ${oi + 1} available`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeOption(gi, oi)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={`Remove group ${gi + 1}, item ${oi + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addOption(gi)}
              >
                + Add item
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPasteFor(pasteFor === gi ? null : gi);
                  setPasteText("");
                }}
              >
                Paste a list
              </Button>
            </div>

            {pasteFor === gi && (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  One item per line, with the extra price after a comma, tab or
                  “+”. Items with no price are included free.
                </p>
                <Textarea
                  rows={6}
                  value={pasteText}
                  placeholder={
                    "Chips\nMexican rice\nReplace chips with masala chips, 6500\nAdd mayonnaise +4000"
                  }
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => importPasted(gi)}
                  >
                    Add these items
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPasteFor(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.button}
            type="button"
            variant="outline"
            onClick={() => addGroup(preset.group)}
          >
            {preset.button}
          </Button>
        ))}
        <Button type="button" variant="ghost" onClick={() => addGroup()}>
          + Other
        </Button>
      </div>

      {issues.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-destructive">
          {issues.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OptionGroupsEditor;
