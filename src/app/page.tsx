"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Property = {
  id: string;
  name: string;
  address: string | null;
  monthly_rent: number;
  monthly_expenses: number;
  mortgage_payment: number;
  notes: string | null;
  status: string | null;
};

type FormData = {
  name: string;
  address: string;
  monthlyRent: string;
  monthlyExpenses: string;
  mortgagePayment: string;
  notes: string;
  status: string;
};

const emptyForm: FormData = {
  name: "",
  address: "",
  monthlyRent: "",
  monthlyExpenses: "",
  mortgagePayment: "",
  notes: "",
  status: "Occupied",
};

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error.message);
      alert("Failed to load properties from Supabase.");
      setLoading(false);
      return;
    }

    setProperties(data || []);
    setLoading(false);
  }

  const totals = useMemo(() => {
    const totalProperties = properties.length;
    const totalMonthlyRent = properties.reduce((sum, p) => sum + Number(p.monthly_rent), 0);
    const totalMonthlyExpenses = properties.reduce(
      (sum, p) => sum + Number(p.monthly_expenses),
      0
    );
    const totalMortgagePayments = properties.reduce(
      (sum, p) => sum + Number(p.mortgage_payment || 0),
      0
    );
    const totalMonthlyCashFlow =
      totalMonthlyRent - totalMonthlyExpenses - totalMortgagePayments;

    return {
      totalProperties,
      totalMonthlyRent,
      totalMonthlyExpenses,
      totalMortgagePayments,
      totalMonthlyCashFlow,
    };
  }, [properties]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = form.name.trim();
    const address = form.address.trim();
    const monthlyRent = Number(form.monthlyRent);
    const monthlyExpenses = Number(form.monthlyExpenses);
    const mortgagePayment = Number(form.mortgagePayment || 0);
    const notes = form.notes.trim();
    const status = form.status;

    if (!name) {
      alert("Please enter a property name.");
      return;
    }

    if (Number.isNaN(monthlyRent) || monthlyRent < 0) {
      alert("Please enter a valid monthly rent.");
      return;
    }

    if (Number.isNaN(monthlyExpenses) || monthlyExpenses < 0) {
      alert("Please enter a valid monthly expenses amount.");
      return;
    }

    if (Number.isNaN(mortgagePayment) || mortgagePayment < 0) {
      alert("Please enter a valid monthly mortgage payment.");
      return;
    }

    const payload = {
      name,
      address,
      monthly_rent: monthlyRent,
      monthly_expenses: monthlyExpenses,
      mortgage_payment: mortgagePayment,
      notes,
      status,
    };

    if (editingId) {
      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Error updating property:", error.message);
        alert("Failed to update property.");
        return;
      }
    } else {
      const { error } = await supabase.from("properties").insert([payload]);

      if (error) {
        console.error("Error adding property:", error.message);
        alert("Failed to add property.");
        return;
      }
    }

    resetForm();
    fetchProperties();
  }

  function handleEdit(property: Property) {
    setEditingId(property.id);
    setForm({
      name: property.name || "",
      address: property.address || "",
      monthlyRent: String(property.monthly_rent ?? ""),
      monthlyExpenses: String(property.monthly_expenses ?? ""),
      mortgagePayment: String(property.mortgage_payment ?? ""),
      notes: property.notes || "",
      status: property.status || "Occupied",
    });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this property?");
    if (!confirmed) return;

    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      console.error("Error deleting property:", error.message);
      alert("Failed to delete property.");
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    fetchProperties();
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <main className="ph-page">
      <div className="ph-container">
        <header className="ph-header">
          <div>
            <h1 className="ph-title">PortfolioHub</h1>
            <p className="ph-subtitle">Track your property portfolio performance</p>
          </div>
        </header>

        <section className="ph-summary-grid">
          <div className="ph-card">
            <p className="ph-card-label">Total Properties</p>
            <h2 className="ph-card-value">{totals.totalProperties}</h2>
          </div>
          <div className="ph-card">
            <p className="ph-card-label">Monthly Rent</p>
            <h2 className="ph-card-value">{formatCurrency(totals.totalMonthlyRent)}</h2>
          </div>
          <div className="ph-card">
            <p className="ph-card-label">Monthly Expenses</p>
            <h2 className="ph-card-value">{formatCurrency(totals.totalMonthlyExpenses)}</h2>
          </div>
          <div className="ph-card">
            <p className="ph-card-label">Mortgage Payments</p>
            <h2 className="ph-card-value">{formatCurrency(totals.totalMortgagePayments)}</h2>
          </div>
          <div className="ph-card">
            <p className="ph-card-label">Monthly Cash Flow</p>
            <h2 className="ph-card-value">{formatCurrency(totals.totalMonthlyCashFlow)}</h2>
          </div>
        </section>

        <section className="ph-section">
          <h2 className="ph-section-title">
            {editingId ? "Edit Property" : "Add Property"}
          </h2>

          <form onSubmit={handleSubmit} className="ph-form">
            <input
              type="text"
              name="name"
              placeholder="Property name"
              value={form.name}
              onChange={handleChange}
              className="ph-input"
            />
            <input
              type="text"
              name="address"
              placeholder="Property address"
              value={form.address}
              onChange={handleChange}
              className="ph-input"
            />
            <input
              type="number"
              name="monthlyRent"
              placeholder="Monthly rent"
              value={form.monthlyRent}
              onChange={handleChange}
              className="ph-input"
            />
            <input
              type="number"
              name="monthlyExpenses"
              placeholder="Monthly expenses"
              value={form.monthlyExpenses}
              onChange={handleChange}
              className="ph-input"
            />
            <input
              type="number"
              name="mortgagePayment"
              placeholder="Monthly mortgage payment"
              value={form.mortgagePayment}
              onChange={handleChange}
              className="ph-input"
            />
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="ph-input"
            >
              <option value="Occupied">Occupied</option>
              <option value="Vacant">Vacant</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
            <textarea
              name="notes"
              placeholder="Notes"
              value={form.notes}
              onChange={handleChange}
              className="ph-textarea"
              rows={4}
            />

            <div className="ph-button-row">
              <button type="submit" className="ph-btn ph-btn-primary">
                {editingId ? "Save Changes" : "Add Property"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ph-btn ph-btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="ph-section">
          <h2 className="ph-section-title">Properties</h2>

          {loading ? (
            <div className="ph-empty-state">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="ph-empty-state">No properties added yet.</div>
          ) : (
            <div className="ph-property-list">
              {properties.map((property) => {
                const cashFlow =
                  Number(property.monthly_rent) -
                  Number(property.monthly_expenses) -
                  Number(property.mortgage_payment || 0);

                return (
                  <div key={property.id} className="ph-property-card">
                    <div className="ph-property-info">
                      <div className="ph-property-top">
                        <h3 className="ph-property-name">{property.name}</h3>
                        <span className="ph-status-badge">
                          {property.status || "Not set"}
                        </span>
                      </div>

                      <p className="ph-property-detail">
                        <strong>Address:</strong> {property.address || "Not provided"}
                      </p>
                      <p className="ph-property-detail">
                        <strong>Rent:</strong>{" "}
                        {formatCurrency(Number(property.monthly_rent))}
                      </p>
                      <p className="ph-property-detail">
                        <strong>Expenses:</strong>{" "}
                        {formatCurrency(Number(property.monthly_expenses))}
                      </p>
                      <p className="ph-property-detail">
                        <strong>Mortgage:</strong>{" "}
                        {formatCurrency(Number(property.mortgage_payment || 0))}
                      </p>
                      <p className="ph-property-detail ph-cashflow">
                        <strong>Cash Flow:</strong> {formatCurrency(cashFlow)}
                      </p>
                      <p className="ph-property-detail">
                        <strong>Notes:</strong> {property.notes || "No notes"}
                      </p>
                    </div>

                    <div className="ph-card-actions">
                      <button
                        onClick={() => handleEdit(property)}
                        className="ph-btn ph-btn-secondary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="ph-btn ph-btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}