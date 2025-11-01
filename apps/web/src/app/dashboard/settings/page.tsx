"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCurrentUser, deleteAccount, exportUserData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface UserInfo {
  id: string;
  email: string;
  clerk_id: string | null;
  created_at: string;
  team_count: number;
  owned_teams_count: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error: any) {
        toast.error("Failed to load user data", {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handleExportData() {
    setExporting(true);
    try {
      const data = await exportUserData();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `explain-my-game-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully!");
    } catch (error: any) {
      toast.error("Failed to export data", {
        description: error.message,
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      toast.error("Please type 'DELETE MY ACCOUNT' to confirm");
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account deleted successfully");
      // Clear local storage
      localStorage.clear();
      // Redirect to home
      router.push("/");
    } catch (error: any) {
      toast.error("Failed to delete account", {
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-2 h-10 w-48" />
        <Skeleton className="mb-8 h-6 w-96" />
        <Skeleton className="mb-4 h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="mb-8 text-muted-foreground">
          Manage your account settings and preferences.
        </p>

        {/* Account Info */}
        <section className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-foreground">{user?.email || "Not available"}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Member Since
              </label>
              <p className="text-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not available"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                <p className="text-2xl font-bold">{user?.team_count || 0}</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                <p className="text-2xl font-bold">{user?.owned_teams_count || 0}</p>
                <p className="text-sm text-muted-foreground">Owned Teams</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Export */}
        <section className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-2 text-lg font-semibold">Export Your Data</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Download all your data including teams, games, stats, and reports in JSON format.
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export Data
              </>
            )}
          </button>
        </section>

        {/* Danger Zone */}
        <section className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Danger Zone
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Account
            </button>
          ) : (
            <div className="space-y-4 rounded-lg border border-destructive/30 bg-background p-4">
              <p className="text-sm font-medium text-destructive">
                ⚠️ This will permanently delete:
              </p>
              <ul className="ml-4 list-disc text-sm text-muted-foreground">
                <li>All teams you own ({user?.owned_teams_count || 0} teams)</li>
                <li>All games, stats, and reports in those teams</li>
                <li>Your memberships in other teams</li>
                <li>Your account and profile</li>
              </ul>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Type <span className="font-mono text-destructive">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== "DELETE MY ACCOUNT"}
                  className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Permanently Delete Account"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

