import { createResource, createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";

type Pump = { id: number; pumpName: string; logoMimeType: string; originalFilename: string; createdAt: string };

export default function PumpsPage() {
  const [pumps, { refetch }] = createResource<Pump[]>(async () => {
    const response = await fetch("/api/pumps");
    return response.json();
  });
  const [name, setName] = createSignal("");
  const [file, setFile] = createSignal<File>();
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function upload(event: SubmitEvent) {
    event.preventDefault();
    setError(""); setSuccess("");
    if (!file()) { setError("Choose a logo image."); return; }
    const form = new FormData();
    form.set("pumpName", name());
    form.set("logo", file()!);
    setBusy(true);
    try {
      const response = await fetch("/api/pumps", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      setName(""); setFile(undefined);
      const input = document.getElementById("logo-file") as HTMLInputElement;
      if (input) input.value = "";
      setSuccess(`${result.pumpName} was added.`);
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  async function remove(pump: Pump) {
    if (!confirm(`Delete ${pump.pumpName}?`)) return;
    const response = await fetch(`/api/pumps/${pump.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Unable to delete pump."); return; }
    await refetch();
  }

  return <main class="page-shell"><header class="page-header"><div><p class="eyebrow">REUSABLE BRAND ASSETS</p><h1>Pump logo library</h1><p>Upload and manage pump names and logos stored in SQLite.</p></div><A class="button secondary" href="/">← Create record</A></header>
    <div class="management-grid"><section class="panel"><h2>Add a pump logo</h2><p class="muted">PNG, JPG or WebP · Maximum 3 MB.</p><form onSubmit={upload} class="upload-form">
      <label>Pump name<input required value={name()} onInput={(e) => setName(e.currentTarget.value)} placeholder="e.g. Example Fuel Station" /></label>
      <label>Logo image<input id="logo-file" required type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.currentTarget.files?.[0])} /></label>
      <Show when={file()}>{(selected) => <p class="muted">Selected: {selected().name}</p>}</Show>
      <Show when={error()}><p class="alert error">{error()}</p></Show><Show when={success()}><p class="alert success">{success()}</p></Show>
      <button class="button primary" type="submit" disabled={busy()}>{busy() ? "Uploading…" : "Upload pump logo"}</button>
    </form></section>
    <section class="panel"><div class="section-heading"><div><h2>Saved pump logos</h2><p>Available in the fuel record form.</p></div><span class="local-pill">SQLite</span></div>
      <Show when={(pumps() || []).length} fallback={<p class="empty-state">No pump logos uploaded yet.</p>}>
        <div class="pump-list"><For each={pumps() || []}>{(pump) => <div class="pump-list-item"><img src={`/api/pumps/${pump.id}/logo`} alt={pump.pumpName} /><span><b>{pump.pumpName}</b><small>{pump.originalFilename}</small></span><button class="icon-button" title="Delete pump logo" onClick={() => remove(pump)}>×</button></div>}</For></div>
      </Show>
    </section></div>
  </main>;
}
