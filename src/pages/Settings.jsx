import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useFetch } from "../hooks/useFetch";

const EMPTY = {
  keywords: ["Opatra", "Opatra London"],
  marketplaces: ["EBAY_GB"],
  authorizedSellers: [],
  typicalPrice: "",
  veroPortalUrl: "",
  trademark: {
    ownerName: "",
    registrationNumber: "",
    registrationCountry: "",
    contactName: "",
    contactEmail: "",
  },
};

function toLines(arr) {
  return (arr || []).join("\n");
}
function fromLines(text) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function Settings() {
  const { data, loading } = useFetch(api.getConfig);
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        ...EMPTY,
        ...data,
        trademark: { ...EMPTY.trademark, ...(data.trademark || {}) },
      });
    }
  }, [data]);

  async function handleSave(e) {
    e.preventDefault();
    await api.saveConfig({
      ...form,
      typicalPrice: form.typicalPrice ? Number(form.typicalPrice) : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Controls what the scanner searches for and how VeRO reports are pre-filled.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card" style={{ maxWidth: 640 }}>
        <div className="form-row">
          <label>Brand keywords (one per line)</label>
          <span className="hint">Searched against eBay listing titles/descriptions.</span>
          <textarea
            rows={4}
            value={toLines(form.keywords)}
            onChange={(e) => setForm({ ...form, keywords: fromLines(e.target.value) })}
          />
        </div>

        <div className="form-row">
          <label>eBay marketplaces (one per line)</label>
          <span className="hint">e.g. EBAY_GB, EBAY_US, EBAY_DE</span>
          <textarea
            rows={2}
            value={toLines(form.marketplaces)}
            onChange={(e) => setForm({ ...form, marketplaces: fromLines(e.target.value) })}
          />
        </div>

        <div className="form-row">
          <label>Authorized reseller usernames (one per line)</label>
          <span className="hint">
            eBay sellers you've approved to sell Opatra products - their listings are
            auto-tagged "Authorized reseller" instead of flagged.
          </span>
          <textarea
            rows={4}
            value={toLines(form.authorizedSellers)}
            onChange={(e) => setForm({ ...form, authorizedSellers: fromLines(e.target.value) })}
          />
        </div>

        <div className="form-row">
          <label>Typical retail price</label>
          <span className="hint">Used to flag suspiciously cheap listings (optional).</span>
          <input
            type="number"
            value={form.typicalPrice ?? ""}
            onChange={(e) => setForm({ ...form, typicalPrice: e.target.value })}
          />
        </div>

        <div className="form-row">
          <label>eBay VeRO portal URL</label>
          <span className="hint">
            Your enrolled VeRO reporting link, so "Open eBay VeRO portal" on a listing takes you
            straight there.
          </span>
          <input
            type="text"
            value={form.veroPortalUrl}
            onChange={(e) => setForm({ ...form, veroPortalUrl: e.target.value })}
          />
        </div>

        <div className="section-title" style={{ marginTop: 8 }}>
          Trademark details (used in generated reports)
        </div>
        <div className="form-row">
          <label>Rights owner legal name</label>
          <input
            type="text"
            value={form.trademark.ownerName}
            onChange={(e) =>
              setForm({ ...form, trademark: { ...form.trademark, ownerName: e.target.value } })
            }
          />
        </div>
        <div className="form-row">
          <label>Trademark registration number</label>
          <input
            type="text"
            value={form.trademark.registrationNumber}
            onChange={(e) =>
              setForm({
                ...form,
                trademark: { ...form.trademark, registrationNumber: e.target.value },
              })
            }
          />
        </div>
        <div className="form-row">
          <label>Registration country</label>
          <input
            type="text"
            value={form.trademark.registrationCountry}
            onChange={(e) =>
              setForm({
                ...form,
                trademark: { ...form.trademark, registrationCountry: e.target.value },
              })
            }
          />
        </div>
        <div className="form-row">
          <label>Contact name</label>
          <input
            type="text"
            value={form.trademark.contactName}
            onChange={(e) =>
              setForm({ ...form, trademark: { ...form.trademark, contactName: e.target.value } })
            }
          />
        </div>
        <div className="form-row">
          <label>Contact email</label>
          <input
            type="email"
            value={form.trademark.contactEmail}
            onChange={(e) =>
              setForm({ ...form, trademark: { ...form.trademark, contactEmail: e.target.value } })
            }
          />
        </div>

        <button className="btn btn-primary" type="submit">
          {saved ? "Saved!" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
