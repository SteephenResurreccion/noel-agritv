"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Trash2, UserPlus, Shield } from "lucide-react";
import { addManager, removeManager } from "../actions";

export function TeamManager({
  owners,
  managers,
}: {
  owners: string[];
  managers: string[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {owners.length + managers.length} team member
          {owners.length + managers.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-darkest px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add Manager
        </button>
      </div>

      {showAddForm && <AddManagerForm onDone={() => setShowAddForm(false)} />}

      <div className="space-y-2">
        {/* Owners */}
        {owners.map((email) => (
          <div
            key={email}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
          >
            <Crown className="h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">
                {email}
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Owner
            </span>
          </div>
        ))}

        {/* Managers */}
        {managers.map((email) => (
          <ManagerRow key={email} email={email} />
        ))}
      </div>
    </div>
  );
}

function ManagerRow({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 ${
        isPending ? "pointer-events-none opacity-30" : ""
      }`}
    >
      <Shield className="h-4 w-4 shrink-0 text-brand-accent" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">
          {email}
        </p>
      </div>
      <span className="rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-semibold text-brand-accent">
        Manager
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-accent" />
        )}
        <button
          disabled={isPending}
          onClick={() => {
            if (confirm(`Remove ${email} as a manager?`)) {
              startTransition(async () => {
                await removeManager(email);
                router.refresh();
              });
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
          title="Remove manager"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddManagerForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = new FormData(form).get("email") as string;

    startTransition(async () => {
      try {
        await addManager(email);
        router.refresh();
        form.reset();
        onDone();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to add manager."
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-border bg-surface p-4"
    >
      <label className="mb-1 block text-xs font-semibold text-text-secondary">
        Google account email *
      </label>
      <p className="mb-2 text-xs text-text-secondary/60">
        The person must sign in with this Google account to access the admin
        panel.
      </p>
      <input
        name="email"
        required
        type="email"
        placeholder="manager@gmail.com"
        className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
      />
      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-darkest px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add Manager"}
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
