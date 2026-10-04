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
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>PortfolioHub</h1>
            <p style={styles.subtitle}>Track your property portfolio performance</p>
          </div>
        </header>

        <section style={styles.summaryGrid}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Total Properties</p>
            <h2 style={styles.cardValue}>{totals.totalProperties}</h2>
          </div>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Monthly Rent</p>
            <h2 style={styles.cardValue}>{formatCurrency(totals.totalMonthlyRent)}</h2>
          </div>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Monthly Expenses</p>
            <h2 style={styles.cardValue}>{formatCurrency(totals.totalMonthlyExpenses)}</h2>
          </div>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Mortgage Payments</p>
            <h2 style={styles.cardValue}>{formatCurrency(totals.totalMortgagePayments)}</h2>
          </div>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Monthly Cash Flow</p>
            <h2 style={styles.cardValue}>{formatCurrency(totals.totalMonthlyCashFlow)}</h2>
          </div>
        </section>

        <section style={styles.formSection}>
          <h2 style={styles.sectionTitle}>
            {editingId ? "Edit Property" : "Add Property"}
          </h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              name="name"
              placeholder="Property name"
              value={form.name}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              type="text"
              name="address"
              placeholder="Property address"
              value={form.address}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              type="number"
              name="monthlyRent"
              placeholder="Monthly rent"
              value={form.monthlyRent}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              type="number"
              name="monthlyExpenses"
              placeholder="Monthly expenses"
              value={form.monthlyExpenses}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              type="number"
              name="mortgagePayment"
              placeholder="Monthly mortgage payment"
              value={form.mortgagePayment}
              onChange={handleChange}
              style={styles.input}
            />
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={styles.input}
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
              style={styles.textarea}
              rows={4}
            />

            <div style={styles.buttonRow}>
              <button type="submit" style={styles.primaryButton}>
                {editingId ? "Save Changes" : "Add Property"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={styles.listSection}>
          <h2 style={styles.sectionTitle}>Properties</h2>

          {loading ? (
            <div style={styles.emptyState}>Loading properties...</div>
          ) : properties.length === 0 ? (
            <div style={styles.emptyState}>No properties added yet.</div>
          ) : (
            <div style={styles.propertyList}>
              {properties.map((property) => {
                const cashFlow =
                  Number(property.monthly_rent) -
                  Number(property.monthly_expenses) -
                  Number(property.mortgage_payment || 0);

                return (
                  <div key={property.id} style={styles.propertyCard}>
                    <div style={styles.propertyInfo}>
                      <h3 style={styles.propertyName}>{property.name}</h3>
                      <p style={styles.propertyDetail}>
                        Address: {property.address || "Not provided"}
                      </p>
                      <p style={styles.propertyDetail}>
                        Status: {property.status || "Not set"}
                      </p>
                      <p style={styles.propertyDetail}>
                        Rent: {formatCurrency(Number(property.monthly_rent))}
                      </p>
                      <p style={styles.propertyDetail}>
                        Expenses: {formatCurrency(Number(property.monthly_expenses))}
                      </p>
                      <p style={styles.propertyDetail}>
                        Mortgage: {formatCurrency(Number(property.mortgage_payment || 0))}
                      </p>
                      <p style={styles.propertyDetail}>
                        Cash Flow: {formatCurrency(cashFlow)}
                      </p>
                      <p style={styles.propertyDetail}>
                        Notes: {property.notes || "No notes"}
                      </p>
                    </div>

                    <div style={styles.buttonColumn}>
                      <button
                        onClick={() => handleEdit(property)}
                        style={styles.secondaryButton}
                      >
                        Edit Property
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        style={styles.deleteButton}
                      >
                        Delete Property
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "32px 16px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "36px",
    margin: 0,
    color: "#1f2937",
  },
  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "16px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  cardValue: {
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "28px",
    color: "#111827",
  },
  formSection: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "16px",
    color: "#111827",
  },
  form: {
    display: "grid",
    gap: "12px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    background: "#ffffff",
  },
  textarea: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  buttonColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "150px",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "15px",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#e5e7eb",
    color: "#111827",
    border: "none",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "15px",
    cursor: "pointer",
  },
  deleteButton: {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "15px",
    cursor: "pointer",
  },
  listSection: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  emptyState: {
    color: "#6b7280",
    fontSize: "16px",
  },
  propertyList: {
    display: "grid",
    gap: "16px",
  },
  propertyCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  propertyInfo: {
    flex: 1,
    minWidth: "260px",
  },
  propertyName: {
    margin: 0,
    fontSize: "20px",
    color: "#111827",
  },
  propertyDetail: {
    margin: "6px 0 0 0",
    color: "#4b5563",
    lineHeight: 1.5,
  },
};