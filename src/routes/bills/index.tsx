import { createResource, createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { rupees } from "~/lib/money";

type Bill = {
  id: number; recordNumber: string; purchaseDate: string; stationName: string;
  fuelType: string; quantityLitres: number; totalAmountPaise: number; vehicleNumber?: string | null;
};

export default function BillsPage() {
  const [search, setSearch] = createSignal("");
  const [bills, { refetch }] = createResource(search, async (q) => {
    const response = await fetch(`/api/bills?q=${encodeURIComponent(q)}`);
    return response.json() as Promise<Bill[]>;
  });
  return <main class="page-shell"><header class="page-header"><div><p class="eyebrow">YOUR ARCHIVE</p><h1>Previous records</h1><p>Search and reopen records saved in SQLite.</p></div><A class="button primary" href="/">＋ New record</A></header>
    <section class="panel"><div class="toolbar"><input class="search-input" placeholder="Search station, vehicle or record number…" value={search()} onInput={(e) => setSearch(e.currentTarget.value)} /><span class="muted">{bills()?.length || 0} records</span></div>
      <Show when={!bills.loading} fallback={<p class="empty-state">Loading records…</p>}>
        <Show when={(bills() || []).length} fallback={<p class="empty-state">No matching records. Create your first fuel record.</p>}>
          <div class="table-wrap"><table><thead><tr><th>Record</th><th>Date</th><th>Station</th><th>Fuel</th><th>Quantity</th><th>Amount</th><th></th></tr></thead><tbody>
            <For each={bills() || []}>{(bill) => <tr><td><b>{bill.recordNumber}</b><small>{bill.vehicleNumber || "No vehicle"}</small></td><td>{bill.purchaseDate}</td><td>{bill.stationName}</td><td>{bill.fuelType}</td><td>{bill.quantityLitres.toFixed(3)} L</td><td><b>{rupees(bill.totalAmountPaise)}</b></td><td><A class="small-link" href={`/bills/${bill.id}`}>Open →</A></td></tr>}</For>
          </tbody></table></div>
        </Show>
      </Show>
    </section><A class="back-link" href="/">← Back to dashboard</A>
  </main>;
}
