import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE = "http://localhost:5000/api/forms";

const initialForm = {
  title: "",
  description: "",
  office: "",
  category: "",
  tags: "",
  fileUrl: "",
};

export default function App() {
  const [formData, setFormData] = useState(initialForm);
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalForms: 0, byCategory: [], topDownloaded: [] });
  const [loading, setLoading] = useState(false);

  const loadForms = async (q = "") => {
    const res = await axios.get(`${API_BASE}?q=${encodeURIComponent(q)}`);
    setForms(res.data);
  };

  const loadStats = async () => {
    const res = await axios.get(`${API_BASE}/dashboard/stats`);
    setStats(res.data);
  };

  const refreshAll = async (q = "") => {
    setLoading(true);
    try {
      await Promise.all([loadForms(q), loadStats()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    await axios.post(API_BASE, {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setFormData(initialForm);
    refreshAll(search);
  };

  const onDelete = async (id) => {
    await axios.delete(`${API_BASE}/${id}`);
    refreshAll(search);
  };

  const onSearch = async (e) => {
    e.preventDefault();
    refreshAll(search);
  };

  const chartData = useMemo(
    () => ({
      labels: stats.byCategory.map((x) => x.category),
      datasets: [
        {
          label: "Forms per Category",
          data: stats.byCategory.map((x) => x.count),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
      ],
    }),
    [stats.byCategory]
  );

  return (
    <div className="container">
      <h1>Student Document Repository</h1>

      <section className="card">
        <h2>Add New Form</h2>
        <form onSubmit={onSubmit} className="grid">
          <input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <input
            placeholder="Office (e.g. Registrar)"
            value={formData.office}
            onChange={(e) => setFormData({ ...formData, office: e.target.value })}
            required
          />
          <input
            placeholder="Category (e.g. Academic)"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
          <input
            placeholder="File URL"
            value={formData.fileUrl}
            onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
            required
          />
          <input
            placeholder="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <button type="submit">Save Form</button>
        </form>
      </section>

      <section className="card">
        <h2>Search + Backup</h2>
        <form onSubmit={onSearch} className="row">
          <input
            placeholder="Search title/description/tag"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
          <a href={`${API_BASE}/backup/json`} target="_blank" rel="noreferrer">
            <button type="button">Download JSON Backup</button>
          </a>
        </form>
      </section>

      <section className="card">
        <h2>Dashboard</h2>
        <p>Total Forms: {stats.totalForms}</p>
        <Bar data={chartData} />
      </section>

      <section className="card">
        <h2>Form List {loading ? "(Loading...)" : ""}</h2>
        {forms.length === 0 ? (
          <p>No forms found.</p>
        ) : (
          <ul className="list">
            {forms.map((f) => (
              <li key={f._id}>
                <div>
                  <strong>{f.title}</strong> - {f.office} - {f.category}
                  <br />
                  <small>{f.description}</small>
                  <br />
                  <a href={f.fileUrl} target="_blank" rel="noreferrer">
                    Open Form
                  </a>
                </div>
                <button onClick={() => onDelete(f._id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
