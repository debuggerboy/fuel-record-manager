import {
  createResource,
  createSignal,
  For,
  Show,
} from "solid-js";
import { isServer } from "solid-js/web";
import { A, useNavigate } from "@solidjs/router";
import { toPng } from "html-to-image";
import { rupees } from "~/lib/money";

type Pump = {
  id: number;
  pumpName: string;
  logoMimeType: string;
};

type Bill = {
  id: number;
  recordNumber: string;
  purchaseDate: string;
  stationName: string;
  fuelType: string;
  quantityLitres: number;
  totalAmountPaise: number;
  vehicleNumber?: string | null;
};

const today = new Date().toISOString().slice(0, 10);

const textures = [
  { id: "texture-1.jpeg", name: "Texture 1" },
  { id: "texture-2.jpeg", name: "Texture 2" },
  { id: "texture-3.avif", name: "Texture 3" },
  { id: "texture-4.avif", name: "Texture 4" },
  { id: "texture-5.avif", name: "Texture 5" },
  { id: "texture-6.jpeg", name: "Texture 6" },
];

export default function Home() {
  const navigate = useNavigate();

  const [pumps] = createResource(
    () => !isServer,
    async () => {
      const response = await fetch("/api/pumps");

      if (!response.ok) {
        throw new Error("Unable to load pump logos");
      }

      return (await response.json()) as Pump[];
    }
  );

  const [recent] = createResource(
    () => !isServer,
    async () => {
      const response = await fetch("/api/bills");

      if (!response.ok) {
        throw new Error("Unable to load recent records");
      }

      return (await response.json()) as Bill[];
    }
  );

  const [purchaseDate, setPurchaseDate] = createSignal(today);
  const [purchaseTime, setPurchaseTime] = createSignal("");
  const [stationName, setStationName] = createSignal("");
  const [stationAddress, setStationAddress] = createSignal("");
  const [pumpLogoId, setPumpLogoId] = createSignal("");
  const [fuelType, setFuelType] = createSignal("Petrol");
  const [fuelRate, setFuelRate] = createSignal("100");
  const [quantity, setQuantity] = createSignal("10");
  const [vehicleNumber, setVehicleNumber] = createSignal("");
  const [paymentMethod, setPaymentMethod] = createSignal("UPI");
  const [notes, setNotes] = createSignal("");

  const [templateId, setTemplateId] = createSignal("classic");
  const [paperTexture, setPaperTexture] = createSignal(
    "texture-1.jpeg"
  );

  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal("");
  const [error, setError] = createSignal("");

  const total = () =>
    Math.round(
      Number(fuelRate() || 0) *
        Number(quantity() || 0) *
        100
    );

  const selectedPump = () =>
    pumps()?.find(
      (pump) => String(pump.id) === pumpLogoId()
    );

  async function saveRecord() {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseDate: purchaseDate(),
          purchaseTime: purchaseTime(),
          stationName: stationName(),
          stationAddress: stationAddress(),
          pumpLogoId: pumpLogoId() || null,
          fuelType: fuelType(),
          fuelRateRupees: Number(fuelRate()),
          quantityLitres: Number(quantity()),
          vehicleNumber: vehicleNumber(),
          paymentMethod: paymentMethod(),
          notes: notes(),
          templateId: templateId(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to save record."
        );
      }

      setMessage(`Saved as ${result.recordNumber}.`);
      navigate(`/bills/${result.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to save record."
      );
    } finally {
      setSaving(false);
    }
  }

  async function exportPng() {
    const node = document.getElementById("bill-preview");

    if (!node) {
      setError("Receipt preview was not found.");
      return;
    }

    setError("");

    try {
      const { width, height } = node.getBoundingClientRect();

      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        width,
        height,
        /*
         * The preview is centered inside the panel with `margin: 0 auto`,
         * which resolves to a concrete left margin (e.g. 117px) in the live
         * layout. html-to-image copies that computed margin onto the cloned
         * node, so the drawing lands offset to the right of a canvas that is
         * only as wide as the receipt itself, clipping the right edge.
         */
        style: { margin: "0" },
      });

      const link = document.createElement("a");
      link.download = "fuel-record.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to export receipt."
      );
    }
  }

  return (
    <main class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">FR</span>
          <span>
            Fuel Records
            <small>Personal record manager</small>
          </span>
        </div>

        <nav>
          <A href="/" activeClass="active" end>
            ＋ <span>Create record</span>
          </A>

          <A href="/bills">
            ▤ <span>Previous records</span>
          </A>

          <A href="/pumps">
            ◉ <span>Pump logos</span>
          </A>
        </nav>

        <div class="sidebar-note">
          Local-first · SQLite storage
        </div>
      </aside>

      <section class="main-area">
        <header class="topbar">
          <div>
            <p class="eyebrow">FUEL RECORD MANAGER</p>
            <h1>Create fuel record</h1>
          </div>

          <span class="local-pill">● Local database</span>
        </header>

        <div class="dashboard-grid">
          {/* Purchase form */}

          <section class="panel form-panel">
            <div class="section-heading">
              <div>
                <h2>Purchase details</h2>
                <p>
                  Enter the details for your personal fuel record.
                </p>
              </div>

              <span class="step">01 / DETAILS</span>
            </div>

            <div class="form-grid">
              <label>
                Purchase date
                <input
                  type="date"
                  value={purchaseDate()}
                  onInput={(e) =>
                    setPurchaseDate(e.currentTarget.value)
                  }
                />
              </label>

              <label>
                Purchase time
                <input
                  type="time"
                  value={purchaseTime()}
                  onInput={(e) =>
                    setPurchaseTime(e.currentTarget.value)
                  }
                />
              </label>

              <label class="span-2">
                Station name
                <input
                  value={stationName()}
                  onInput={(e) =>
                    setStationName(e.currentTarget.value)
                  }
                  placeholder="Enter station name"
                />
              </label>

              <label class="span-2">
                Station address
                <textarea
                  rows={3}
                  value={stationAddress()}
                  onInput={(e) =>
                    setStationAddress(e.currentTarget.value)
                  }
                  placeholder="Enter station address (multiple lines supported)"
                />
              </label>

              <label class="span-2">
                Select Pump Logo

                <div class="inline-select">
                  <select
                    value={pumpLogoId()}
                    onChange={(e) =>
                      setPumpLogoId(e.currentTarget.value)
                    }
                  >
                    <option value="">
                      No pump logo selected
                    </option>

                    <For each={pumps() || []}>
                      {(pump) => (
                        <option value={pump.id}>
                          {pump.pumpName}
                        </option>
                      )}
                    </For>
                  </select>

                  <A class="small-link" href="/pumps">
                    + Add new pump
                  </A>
                </div>
              </label>

              <Show when={selectedPump()}>
                {(pump) => (
                  <div class="pump-chip span-2">
                    <img
                      src={`/api/pumps/${pump().id}/logo`}
                      alt=""
                    />

                    <span>{pump().pumpName}</span>
                    <small>Selected logo</small>
                  </div>
                )}
              </Show>

              <label>
                Fuel type
                <select
                  value={fuelType()}
                  onChange={(e) =>
                    setFuelType(e.currentTarget.value)
                  }
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>CNG</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Payment method
                <select
                  value={paymentMethod()}
                  onChange={(e) =>
                    setPaymentMethod(e.currentTarget.value)
                  }
                >
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Rate per litre (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fuelRate()}
                  onInput={(e) =>
                    setFuelRate(e.currentTarget.value)
                  }
                />
              </label>

              <label>
                Quantity (litres)
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={quantity()}
                  onInput={(e) =>
                    setQuantity(e.currentTarget.value)
                  }
                />
              </label>

              <label class="span-2">
                Vehicle registration
                <input
                  value={vehicleNumber()}
                  onInput={(e) =>
                    setVehicleNumber(e.currentTarget.value)
                  }
                  placeholder="e.g. TS 09 AB 1234"
                />
              </label>

              <label class="span-2">
                Notes (optional)
                <textarea
                  rows={2}
                  value={notes()}
                  onInput={(e) =>
                    setNotes(e.currentTarget.value)
                  }
                  placeholder="Additional notes"
                />
              </label>
            </div>

            <Show when={error()}>
              <p class="alert error">{error()}</p>
            </Show>

            <Show when={message()}>
              <p class="alert success">{message()}</p>
            </Show>

            <div class="form-actions">
              <button
                class="button secondary"
                onClick={() => window.location.reload()}
              >
                Reset form
              </button>

              <button
                class="button primary"
                disabled={saving()}
                onClick={saveRecord}
              >
                {saving()
                  ? "Saving…"
                  : "Save fuel record →"}
              </button>
            </div>
          </section>

          {/* Preview column */}

          <section class="preview-column">
            <section class="panel preview-panel">
              <div class="section-heading preview-heading">
                <div>
                  <h2>Live preview</h2>
                  <p>Preview updates as you type.</p>
                </div>

                <span class="preview-dot">● LIVE</span>
              </div>

              {/* Preview controls are outside the heading */}

              <div class="receipt-options">
                <label>
                  Paper texture
                  <select
                    value={paperTexture()}
                    onChange={(e) =>
                      setPaperTexture(e.currentTarget.value)
                    }
                  >
                    <For each={textures}>
                      {(texture) => (
                        <option value={texture.id}>
                          {texture.name}
                        </option>
                      )}
                    </For>
                  </select>
                </label>

                <label>
                  Bill template
                  <select
                    value={templateId()}
                    onChange={(e) =>
                      setTemplateId(e.currentTarget.value)
                    }
                  >
                    <option value="classic">Template 1</option>
                    <option value="bold">Template 2</option>
                    <option value="compact">Template 3</option>
                  </select>
                </label>
              </div>

              {/* Actual receipt */}

              <div
                id="bill-preview"
                class={`receipt receipt-${templateId()}`}
                style={{
                  "background-image": `url("/images/textures/${paperTexture()}")`,
                }}
              >
                <div class="receipt-header">
                  <Show
                    when={selectedPump()}
                    fallback={
                      <div class="receipt-logo-placeholder">
                        PUMP
                        <br />
                        LOGO
                      </div>
                    }
                  >
                    {(pump) => (
                      <img
                        class="receipt-logo"
                        src={`/api/pumps/${pump().id}/logo`}
                        alt={pump().pumpName}
                      />
                    )}
                  </Show>

                  <div class="receipt-station">
                    <h2>
                      {stationName() || "FUEL STATION"}
                    </h2>

                    <p>
                      {stationAddress() || "Station address"}
                    </p>
                  </div>
                </div>

                <div class="receipt-divider" />

                <div class="receipt-title">
                  <h3>FUEL PURCHASE</h3>
                  <span>PERSONAL COPY</span>
                </div>

                <div class="receipt-meta">
                  <div>
                    <span>DATE</span>
                    <strong>{purchaseDate()}</strong>
                  </div>

                  <Show when={purchaseTime()}>
                    <div>
                      <span>TIME</span>
                      <strong>{purchaseTime()}</strong>
                    </div>
                  </Show>
                </div>

                <div class="receipt-divider" />

                <div class="receipt-section-title">
                  PURCHASE DETAILS
                </div>

                <div class="receipt-table">
                  <div class="receipt-table-row">
                    <span>Fuel type</span>
                    <strong>{fuelType()}</strong>
                  </div>

                  <div class="receipt-table-row">
                    <span>Rate / litre</span>
                    <strong>
                      {rupees(
                        Math.round(
                          Number(fuelRate() || 0) * 100
                        )
                      )}
                    </strong>
                  </div>

                  <div class="receipt-table-row">
                    <span>Quantity</span>
                    <strong>
                      {Number(quantity() || 0).toFixed(3)} L
                    </strong>
                  </div>

                  <div class="receipt-table-row">
                    <span>Payment</span>
                    <strong>{paymentMethod()}</strong>
                  </div>

                  <Show when={vehicleNumber()}>
                    <div class="receipt-table-row">
                      <span>Vehicle</span>
                      <strong>{vehicleNumber()}</strong>
                    </div>
                  </Show>
                </div>

                <div class="receipt-divider" />

                <div class="receipt-amount">
                  <span>TOTAL AMOUNT</span>
                  <strong>{rupees(total())}</strong>
                </div>

                <Show when={notes()}>
                  <div class="receipt-notes">
                    <span>NOTES</span>
                    <p>{notes()}</p>
                  </div>
                </Show>

                <div class="receipt-divider" />

                <div class="receipt-footer">
                  <strong>THANK YOU</strong>
                  <p>
                    PERSONAL RECORD · NOT AN OFFICIAL FUEL RECEIPT
                  </p>
                </div>
              </div>

              <Show when={error()}>
                <p class="alert error">{error()}</p>
              </Show>

              <div class="preview-actions">
                <button
                  class="button secondary"
                  onClick={() => window.print()}
                >
                  Print / Save PDF
                </button>

                <button
                  class="button secondary"
                  onClick={exportPng}
                >
                  Export PNG
                </button>
              </div>
            </section>

            {/* Recent records */}

            <section class="panel recent-panel">
              <div class="section-heading">
                <div>
                  <h2>Recent records</h2>
                  <p>Your latest saved entries.</p>
                </div>

                <A href="/bills">View all →</A>
              </div>

              <Show
                when={(recent() || []).length}
                fallback={
                  <p class="empty-small">
                    No saved records yet.
                  </p>
                }
              >
                <For each={(recent() || []).slice(0, 4)}>
                  {(bill) => (
                    <A
                      class="recent-item"
                      href={`/bills/${bill.id}`}
                    >
                      <span>
                        <b>{bill.stationName}</b>
                        <small>
                          {bill.purchaseDate} · {bill.recordNumber}
                        </small>
                      </span>

                      <strong>
                        {rupees(bill.totalAmountPaise)}
                      </strong>
                    </A>
                  )}
                </For>
              </Show>
            </section>
          </section>
        </div>

        <footer class="footer-note">
          Your records and uploaded pump logos stay in the mounted
          SQLite data volume.
        </footer>
      </section>
    </main>
  );
}
