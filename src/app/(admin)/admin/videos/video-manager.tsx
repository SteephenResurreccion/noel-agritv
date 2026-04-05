"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2, Plus } from "lucide-react";
import type { AdminVideo } from "@/lib/admin-store";
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

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
      {showAddForm && (
        <AddVideoForm
          onDone={() => setShowAddForm(false)}
          existingCount={initialVideos.length}
        />
      )}

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
              })
            }
            className="mt-2 rounded-md bg-brand-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Initialize Video List"}
          </button>
        </div>
      )}

      {/* Video list */}
      <div className="space-y-2">
        {initialVideos.map((video) => (
          <VideoRow key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}

function VideoRow({ video }: { video: AdminVideo }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 ${
        !video.visible ? "opacity-50" : ""
      } ${isPending ? "pointer-events-none opacity-30" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">
          {video.title}
        </p>
        <p className="truncate text-xs text-text-secondary">{video.href}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() =>
            startTransition(() => toggleVideoVisibility(video.id))
          }
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
          title={video.visible ? "Hide" : "Show"}
        >
          {video.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => {
            if (confirm("Remove this video?")) {
              startTransition(() => removeVideo(video.id));
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddVideoForm({
  onDone,
  existingCount,
}: {
  onDone: () => void;
  existingCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      await addVideo({
        title: data.get("title") as string,
        href: data.get("href") as string,
        thumbnail: (data.get("thumbnail") as string) || "/images/NewLogo.png",
        visible: true,
      });
      form.reset();
      onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-border bg-surface p-4"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            Title
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
            Facebook Video URL
          </label>
          <input
            name="href"
            required
            type="url"
            placeholder="https://www.facebook.com/..."
            className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            Thumbnail Path (optional)
          </label>
          <input
            name="thumbnail"
            placeholder="/images/videos/my-video.jpg"
            className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
          />
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
