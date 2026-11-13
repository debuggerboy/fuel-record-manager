import { createResource, Show } from "solid-js";
import { A, useParams, useNavigate } from "@solidjs/router";
import { rupees } from "~/lib/money";

export default function BillDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [record] = createResource(() => params.id, async (id) => {
    const response = await fetch(`/api/bills/${id}`);
    if (!response.ok) throw new Error("Record not found");
    return response.json();
  });
  async function remove() {
    if (!confirm("Delete this saved record? This cannot be undone.")) return;
    const response = await fetch(`/api/bills/${params.id}`, { method: "DELETE" });
    if (response.ok) navigate("/bills");
  }
  return <main class="page-shell"><header class="page-header"><div><p class="eyebrow">SAVED RECORD</p><h1>Fuel record details</h1></div><div class="header-actions"><A class="button secondary" href="/bills">← History</A><button class="button danger" onClick={remove}>Delete</button></div></header>
    <Show when={record()} fallback={<section class="panel empty-state">{record.loading ? "Loading…" : "Record not found."}</section>}>
      {(item) => <section class="panel detail-card"><div class="detail-title"><div><h2>{item().stationName}</h2><p>{item().recordNumber}</p></div><strong>{rupees(item().totalAmountPaise)}</strong></div>
        <div class="detail-grid"><div><small>Purchase date</small><b>{item().purchaseDate} {item().purchaseTime || ""}</b></div><div><small>Fuel type</small><b>{item().fuelType}</b></div><div><small>Quantity</small><b>{item().quantityLitres} L</b></div><div><small>Rate per litre</small><b>{rupees(item().fuelRatePaise)}</b></div><div><small>Vehicle</small><b>{item().vehicleNumber || "—"}</b></div><div><small>Payment method</small><b>{item().paymentMethod || "—"}</b></div></div>
        <div class="detail-address"><small>Station address</small><p>{item().stationAddress}</p></div>
        <Show when={item().pumpLogoSnapshot}><img class="detail-logo" src={`data:${item().pumpLogoMimeTypeSnapshot};base64,${item().pumpLogoSnapshot}`} alt="Saved pump logo snapshot" /></Show>
        <p class="muted">This is a personal record, not an official fuel receipt.</p>
        <button class="button secondary" onClick={() => window.print()}>Print / Save PDF</button>
      </section>}
    </Show>
  </main>;
}
