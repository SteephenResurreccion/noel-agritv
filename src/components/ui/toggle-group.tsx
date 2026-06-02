"use client"

import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"

import { cn } from "@/lib/utils"

/**
 * Padded-pill segmented control built on Base UI's ToggleGroup + Toggle.
 *
 * The group is a padded container (`p-0.5`) with a larger radius than its items;
 * each item has a smaller radius and is inset by that padding. The active item's
 * fill therefore sits *inside* the container's rounded corners — fill-bleed past
 * the border is structurally impossible (the original hand-rolled control filled
 * square segments inside an `overflow-hidden rounded-md` box, which bled).
 *
 * Base UI specifics (differs from Radix):
 * - `ToggleGroup` is controlled with `value: readonly string[]` (an ARRAY) and
 *   `onValueChange(value: string[], details)`. `multiple` defaults to `false`.
 * - `Toggle` items take a `value` string and render a real `<button>` carrying
 *   `aria-pressed`. The group is `role="group"`.
 */

function ToggleGroup({
  className,
  ...props
}: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        "inline-flex items-center gap-[2px] rounded-full border border-brand-darkest/[0.12] bg-brand-darkest/[0.05] p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        // No transition on the background — Chromium fails to interpolate the
        // var()-based active fill, so the gold swap must be instant.
        "flex items-center justify-center rounded-full px-[13px] text-xs font-bold uppercase tracking-[0.04em] select-none",
        "bg-transparent text-text-secondary hover:text-text-primary",
        "data-pressed:bg-brand-accent data-pressed:text-surface data-pressed:hover:text-surface",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
