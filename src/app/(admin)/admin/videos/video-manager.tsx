"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Trash2,
  Plus,
  GripVertical,
  Loader2,
} from "lucide-react";
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
import type { AdminVideo } from "@/lib/admin-store";
import { compressImage } from "@/lib/compress-image";
import {
  saveVideos,
  removeVideo,
  toggleVideoVisibility,
  addVideo,
} from "../actions";

export function VideoManager({
  initialVideos,
}: {
  initialVideos: AdminVideo[];
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [showAddForm, setShowAddForm] = useState(false);
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

    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);
    const reordered = arrayMove(videos, oldIndex, newIndex);

    // Optimistic update
    setVideos(reordered);
    setIsSaving(true);

    // Save to server
    startTransition(async () => {
      await saveVideos(reordered);
      router.refresh();
      setIsSaving(false);
    });
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-text-secondary">
            {videos.filter((v) => v.visible).length} of {videos.length} visible
          </p>
          {isSaving && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-accent">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving order...
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-darkest px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Video
        </button>
      </div>

      {/* Add form */}
      {showAddForm && <AddVideoForm onDone={() => setShowAddForm(false)} />}

      {/* Initialize button */}
      {videos[0]?.id === "v1" && (
        <div className="mb-4 rounded-lg border border-brand-accent/30 bg-brand-accent/5 p-4">
          <p className="text-sm text-text-primary">
            Video list is using defaults. Click below to save them to your admin
            config so you can start managing them.
          </p>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await saveVideos(videos);
                router.refresh();
              })
            }
            className="mt-2 rounded-md bg-brand-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Initialize Video List"}
          </button>
        </div>
      )}

      {/* Drag hint */}
      <p className="mb-2 text-xs text-text-secondary">
        Drag to reorder. Top = leftmost on storefront.
      </p>

      {/* Sortable video list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={videos.map((v) => v.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {videos.map((video, index) => (
              <SortableVideoRow key={video.id} video={video} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableVideoRow({
  video,
  index,
}: {
  video: AdminVideo;
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
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-surface px-4 py-3 ${
        isDragging
          ? "z-50 border-brand-accent shadow-lg"
          : "border-border"
      } ${!video.visible ? "opacity-50" : ""} ${
        isPending ? "pointer-events-none opacity-30" : ""
      }`}
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

      {/* Title + URL */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">
          {video.title}
        </p>
        <p className="truncate text-xs text-text-secondary">{video.href}</p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-accent" />
        )}
        <button
          disabled={isPending}
          onClick={() => {
            if (isPending) return;
            startTransition(async () => {
              await toggleVideoVisibility(video.id);
              router.refresh();
            });
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg hover:text-text-primary ${isPending ? "cursor-wait opacity-60" : ""}`}
          title={video.visible ? "Hide" : "Show"}
        >
          {video.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          disabled={isPending}
          onClick={() => {
            if (isPending) return;
            if (confirm("Remove this video?")) {
              startTransition(async () => {
                await removeVideo(video.id);
                router.refresh();
              });
            }
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 ${isPending ? "cursor-wait opacity-60" : ""}`}
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddVideoForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const thumbnailFile = formData.get("thumbnail") as File;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const compressed = await compressImage(thumbnailFile, 400, 0.75);
      formData.set("thumbnail", compressed);
    }

    startTransition(async () => {
      await addVideo(formData);
      router.refresh();
      form.reset();
      onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-border bg-surface p-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            Title *
          </label>
          <input
            name="title"
            required
            placeholder="Video title"
            className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            Facebook Video URL *
          </label>
          <input
            name="href"
            required
            type="url"
            placeholder="https://www.facebook.com/..."
            className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            Thumbnail Image *
          </label>
          <input
            name="thumbnail"
            type="file"
            required
            accept="image/*"
            className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand-accent/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-accent hover:file:bg-brand-accent/20"
          />
          <p className="mt-1 text-xs text-text-secondary/60">
            Image will be compressed automatically before upload.
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-darkest px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add Video"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
