"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { AdminVideo } from "@/lib/admin-store";
import { compressImage } from "@/lib/compress-image";
import {
  saveVideos,
  removeVideo,
  toggleVideoVisibility,
  addVideo,
  moveVideo,
} from "../actions";

export function VideoManager({
  initialVideos,
}: {
  initialVideos: AdminVideo[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mt-6">
      {/* Add button */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {initialVideos.filter((v) => v.visible).length} of{" "}
          {initialVideos.length} videos visible
        </p>
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

      {/* Initialize button — shown only when Blob has no videos yet */}
      {initialVideos[0]?.id === "v1" && (
        <div className="mb-4 rounded-lg border border-brand-accent/30 bg-brand-accent/5 p-4">
          <p className="text-sm text-text-primary">
            Video list is using defaults. Click below to save them to your admin
            config so you can start managing them.
          </p>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await saveVideos(initialVideos);
                router.refresh();
              })
            }
            className="mt-2 rounded-md bg-brand-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Initialize Video List"}
          </button>
        </div>
      )}

      {/* Video list */}
      <p className="mb-2 text-xs text-text-secondary">
        Use arrows to reorder. Videos display left-to-right on the storefront.
      </p>
      <div className="space-y-2">
        {initialVideos.map((video, index) => (
          <VideoRow
            key={video.id}
            video={video}
            index={index}
            isFirst={index === 0}
            isLast={index === initialVideos.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function VideoRow({
  video,
  index,
  isFirst,
  isLast,
}: {
  video: AdminVideo;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleMove(direction: "up" | "down") {
    if (isPending) return;
    startTransition(async () => {
      await moveVideo(video.id, direction);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 ${
        !video.visible ? "opacity-50" : ""
      } ${isPending ? "pointer-events-none opacity-30" : ""}`}
    >
      {/* Position number */}
      <span className="w-6 shrink-0 text-center text-xs font-bold text-text-secondary">
        {index + 1}
      </span>

      {/* Up/Down arrows */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <button
          disabled={isPending || isFirst}
          onClick={() => handleMove("up")}
          className={`flex h-5 w-5 items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg hover:text-text-primary ${
            isFirst ? "invisible" : ""
          }`}
          title="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          disabled={isPending || isLast}
          onClick={() => handleMove("down")}
          className={`flex h-5 w-5 items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg hover:text-text-primary ${
            isLast ? "invisible" : ""
          }`}
          title="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

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

    // Compress thumbnail before upload
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
