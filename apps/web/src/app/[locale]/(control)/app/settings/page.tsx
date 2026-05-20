"use client";

import { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((d) => {
        setName(d.name ?? "");
        setEmail(d.email ?? "");
        setBusinessContext(d.businessContext ?? "");
      });
  }, []);

  const save = async () => {
    setLoading(true);
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, businessContext }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Settings saved");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 overflow-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Workspace preferences stored in your local SQLite database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account on this deployment</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-name">Display name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={email} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI & sales context</CardTitle>
          <CardDescription>
            Used for Smart Reviews, Smart Emails, and the assistant across all leads.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-context">Default business context</Label>
            <Textarea
              id="settings-context"
              rows={4}
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="What you sell, ICP, tone…"
            />
          </div>
          <Button onClick={save} disabled={loading}>
            <Save data-icon="inline-start" />
            {loading ? "Saving…" : "Save settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import leads (CSV)</CardTitle>
          <CardDescription>
            Columns: name, lat, lng, address, email, phone, category, status. Duplicates
            skipped by external_id or name+address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const res = await fetch("/api/leads/import", {
                method: "POST",
                headers: { "Content-Type": "text/csv" },
                body: text,
              });
              const data = await res.json();
              if (!res.ok) {
                toast.error(data.error ?? "Import failed");
                return;
              }
              toast.success(`Imported ${data.imported}, skipped ${data.skipped ?? 0}`);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data export</CardTitle>
          <CardDescription>Download all CRM leads as CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="/api/leads/export" download />}
          >
            <Download data-icon="inline-start" />
            Export leads CSV
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-muted-foreground text-xs">
        Area To Monitor (AM2) is open source and self-hosted. There is no cloud sync — back up your{" "}
        <code className="bg-muted rounded px-1">data/am2.db</code> file regularly.
      </p>
    </div>
  );
}
