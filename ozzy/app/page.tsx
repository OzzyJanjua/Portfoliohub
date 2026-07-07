"use client";
 
import { useState ,useEffect } from "react";
 
type Property = {
  id: number;
  name: string;
  rent: string;
  expenses: string;
};
 
export default function Page() {
  const [properties, setProperties] = useState<Property[]>([]);
const [form, setForm] = useState({
  name: "",
  rent: "",
  expenses: "",
});
 
useEffect(() => {
  const savedProperties = localStorage.getItem("properties");
 
  if (savedProperties) {
    setProperties(JSON.parse(savedProperties));
  }
}, []);
 
useEffect(() => {
  localStorage.setItem("properties", JSON.stringify(properties));
}, [properties]);
 
const totalRent = properties.reduce(
  (sum, p) => sum + Number(p.rent),
  0
);
 
const totalExpenses = properties.reduce(
  (sum, p) => sum + Number(p.expenses),
  0
);
 
const netProfit = totalRent - totalExpenses;
 
function handleAddProperty() {
  if (!form.name || !form.rent || !form.expenses) return;
 
  setProperties([
    ...properties,
    {
      ...form,
      id: Date.now(),
    },
  ]);
 
  setForm({
    name: "",
    rent: "",
    expenses: "",
  });
}
 
  return (
    <div style={{ padding: 30 }}>
      <h1>Property Portfolio Dashboard</h1>
 
      <h2>Overview</h2>
 
      <p>Total Properties: {properties.length}</p>
      <p>Total Rent: £{totalRent}</p>
      <p>Total Expenses: £{totalExpenses}</p>
      <p>Net Profit: £{netProfit}</p>
 
      <hr />
 
      <h2>Add Property</h2>
 
      <input
        placeholder="Property Name"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />
 
      <br />
      <br />
 
      <input
        placeholder="Monthly Rent"
        value={form.rent}
        onChange={(e) =>
          setForm({ ...form, rent: e.target.value })
        }
      />
 
      <br />
      <br />
            <input
        placeholder="Monthly Expenses"
        value={form.expenses}
        onChange={(e) =>
          setForm({ ...form, expenses: e.target.value })
        }
      />
 
      <br />
      <br />
 
      <button onClick={handleAddProperty}>
        Add Property
      </button>
 
      <hr />
 
      <h2>Properties</h2>
 
      {properties.length === 0 ? (
        <p>No properties added yet.</p>
      ) : (
        <ul>
          {properties.map((property) => (
            <li key={property.id}>
              <strong>{property.name}</strong> - Rent £{property.rent},
              Expenses £{property.expenses}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
 