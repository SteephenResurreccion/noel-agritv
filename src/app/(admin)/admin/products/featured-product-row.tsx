"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, GripVertical, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AdminProduct } from "@/lib/admin-store";
import { saveFeaturedOrder, toggleFeaturedProduct } from "../actions";

export function FeaturedProductList({
  products,
}: {
  products: AdminProduct[];
}) {
  const [items, setItems] = useState(products);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);
    setIsSaving(true);

    startTransition(async () => {
      await saveFeaturedOrder(reordered.map((p) => p.id));
      router.refresh();
      setIsSaving(false);
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <p className="text-xs text-text-secondary">
          Drag to reorder. Top = first on homepage.
        </p>
        {isSaving && (
          <span className="inline-flex items-center gap-1 text-xs text-brand-accent">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving order...
          </span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((product, index) => (
              <SortableFeaturedRow
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableFeaturedRow({
  product,
  index,
}: {
  product: AdminProduct;
  index: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleRemove() {
    if (isPending) return;
    startTransition(async () => {
      await toggleFeaturedProduct(product.id);
      router.refresh();
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        isDragging
          ? "z-50 border-brand-accent bg-brand-accent/5 shadow-lg"
          : "border-brand-accent/20 bg-brand-accent/5"
      } ${isPending ? "pointer-events-none opacity-30" : ""}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex shrink-0 cursor-grab items-center gap-1 touch-none active:cursor-grabbing"
        tabIndex={0}
      >
        <span className="w-5 text-center text-xs font-bold text-text-secondary">
          {index + 1}
        </span>
        <GripVertical className="h-4 w-4 text-text-secondary/50" />
      </button>

      {/* Star + Name */}
      <Star className="h-4 w-4 shrink-0 fill-brand-accent text-brand-accent" />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
        {product.name}
      </p>

      {/* Remove */}
      <div className="flex shrink-0 items-center gap-1">
        {isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-accent" />
        )}
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
          title="Remove from Top Picks"
        >
          <Star className="h-4 w-4 fill-brand-accent text-brand-accent" />
        </button>
      </div>
    </div>
  );
}
