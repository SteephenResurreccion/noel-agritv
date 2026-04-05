import { AdminShell } from "@/components/admin-shell";
import { getAdminConfig, type AdminVideo } from "@/lib/admin-store";
import { defaultVideos } from "@/data/videos";
import { VideoManager } from "./video-manager";

export default async function AdminVideosPage() {
  let videos: AdminVideo[];

  try {
    const config = await getAdminConfig();
    videos = config.videos ?? defaultVideos;
  } catch {
    videos = defaultVideos;
  }

  return (
    <AdminShell>
      <div>
        <h1 className="text-2xl font-bold text-brand-darkest">Videos</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the video reel shown on the homepage. Add Facebook video links
          or toggle visibility.
        </p>
      </div>

      <VideoManager initialVideos={videos} />
    </AdminShell>
  );
}
