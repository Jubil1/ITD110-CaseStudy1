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
const DOCUMENT_TYPES = ["All", "ISO Form", "Special Order", "Calendar", "Memo", "Guide"];

const initialForm = {
  title: "",
  description: "",
  office: "",
  category: "",
  documentType: "ISO Form",
  tags: "",
  fileUrl: "",
};

export default function App() {
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("intro");
  const [stats, setStats] = useState({ totalForms: 0, byCategory: [], topDownloaded: [] });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  const loadForms = async (q = "", docType = "All") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (docType && docType !== "All") params.set("documentType", docType);
    const qs = params.toString();
    const res = await axios.get(qs ? `${API_BASE}?${qs}` : API_BASE);
    setForms(res.data);
  };

  const loadStats = async () => {
    const res = await axios.get(`${API_BASE}/dashboard/stats`);
    setStats(res.data);
  };

  const refreshAll = async (q = "", docType = "All") => {
    setLoading(true);
    try {
      await Promise.all([loadForms(q, docType), loadStats()]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const buildPayload = () => ({
    ...formData,
    tags: formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/${editingId}`, buildPayload());
        showToast("success", "Form updated successfully.");
      } else {
        await axios.post(API_BASE, buildPayload());
        showToast("success", "Form saved successfully.");
      }

      setFormData(initialForm);
      setEditingId("");
      refreshAll(search, documentTypeFilter);
    } catch (_error) {
      showToast("error", "Unable to save form. Please check your input.");
    }
  };

  const onDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      if (editingId === id) {
        setFormData(initialForm);
        setEditingId("");
      }
      showToast("success", "Form deleted.");
      refreshAll(search, documentTypeFilter);
    } catch (_error) {
      showToast("error", "Unable to delete form.");
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    try {
      await refreshAll(search, documentTypeFilter);
      showToast("success", "Search completed.");
    } catch (_error) {
      showToast("error", "Search failed.");
    }
  };

  const onEdit = (form) => {
    setEditingId(form._id);
    setFormData({
      title: form.title || "",
      description: form.description || "",
      office: form.office || "",
      category: form.category || "",
      documentType: form.documentType || "ISO Form",
      tags: Array.isArray(form.tags) ? form.tags.join(", ") : "",
      fileUrl: form.fileUrl || "",
    });
  };

  const onCancelEdit = () => {
    setEditingId("");
    setFormData(initialForm);
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
      <header className="hero">
        <div>
          <p className="eyebrow">ITD110 - NoSQL Databases - Case Study #1</p>
          <h1>Student Document Repository</h1>
          <p className="subtitle">
            Centralized form management for student academic transactions.
          </p>
        </div>
        <div className="pill">{loading ? "Syncing..." : "Live Data"}</div>
      </header>

      {toast.message && (
        <div className={toast.type === "error" ? "toast error" : "toast success"}>{toast.message}</div>
      )}

      <nav className="tabs">
        <button
          type="button"
          className={activeTab === "intro" ? "tab active" : "tab"}
          onClick={() => setActiveTab("intro")}
        >
          Introduction
        </button>
        <button
          type="button"
          className={activeTab === "repository" ? "tab active" : "tab"}
          onClick={() => setActiveTab("repository")}
        >
          File Repository
        </button>
        <button
          type="button"
          className={activeTab === "manage" ? "tab active" : "tab"}
          onClick={() => setActiveTab("manage")}
        >
          Manage Forms (CRUD)
        </button>
      </nav>

      <main className="tab-panel">
        <section className="stats-row">
          <article className="stat-card">
            <p>Total Forms</p>
            <h3>{stats.totalForms}</h3>
          </article>
          <article className="stat-card">
            <p>Categories</p>
            <h3>{stats.byCategory.length}</h3>
          </article>
          <article className="stat-card">
            <p>Top Downloaded</p>
            <h3>{stats.topDownloaded.length}</h3>
          </article>
        </section>

        {activeTab === "intro" && (
          <>
            <section className="card intro-card">
              <h2>Project Context</h2>
              <p>
                Many students experience delays and confusion when looking for official university
                forms on the school website because documents are scattered, difficult to locate, or
                not grouped clearly by office and purpose. This case study proposes a Student
                Document Repository System that centralizes frequently used student-related forms
                such as subject withdrawal, INC completion, and course shifting requests in one
                searchable web platform. The system is intended for students as the primary users,
                with support for administrators who manage form records.
              </p>
            </section>

            <section className="card intro-card">
              <h2>Solution Highlights</h2>
              <ul className="intro-list">
                <li>MongoDB NoSQL backend for flexible form data storage.</li>
                <li>Student-friendly file repository with keyword search.</li>
                <li>Admin management area for Create, Read, Update, Delete.</li>
                <li>Dashboard view to summarize stored form data.</li>
                <li>JSON backup download for data portability and safety.</li>
              </ul>
            </section>
          </>
        )}

        {activeTab === "repository" && (
          <>
          <section className="card">
            <h2>Search + Backup</h2>
            <form onSubmit={onSearch} className="row">
              <select
                value={documentTypeFilter}
                onChange={(e) => {
                  const next = e.target.value;
                  setDocumentTypeFilter(next);
                  refreshAll(search, next);
                }}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                placeholder="Search title/description/tag"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="primary">
                Search
              </button>
              <a
                className="backup-link"
                href={`${API_BASE}/backup/json`}
                target="_blank"
                rel="noreferrer"
              >
                Download JSON Backup
              </a>
            </form>
          </section>

          <section className="card">
            <h2>Dashboard</h2>
            <p className="muted">Total Forms: {stats.totalForms}</p>
            <Bar data={chartData} />
            {stats.topDownloaded.length > 0 && (
              <div className="top-list">
                <h3>Most Downloaded Forms</h3>
                <ul>
                  {stats.topDownloaded.map((item) => (
                    <li key={item._id}>
                      <span>{item.title}</span>
                      <strong>{item.downloadCount}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Available Forms {loading ? "(Loading...)" : ""}</h2>
            {forms.length === 0 ? (
              <p className="empty">No forms found. Try a different keyword.</p>
            ) : (
              <ul className="list">
                {forms.map((f) => (
                  <li key={f._id}>
                    <div className="item-details">
                      <strong>{f.title}</strong>
                      <div className="badges">
                        <span className="badge">{f.documentType || "ISO Form"}</span>
                        <span className="badge">{f.office}</span>
                        <span className="badge">{f.category}</span>
                      </div>
                      <p className="meta">
                        Last Updated: {new Date(f.updatedAt).toLocaleDateString()}
                      </p>
                      <small>{f.description}</small>
                      <br />
                      <a href={`${API_BASE}/${f._id}/open`} target="_blank" rel="noreferrer">
                        Open Form
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </>
        )}

        {activeTab === "manage" && (
          <>
          <section className="card">
            <h2>{editingId ? "Edit Form" : "Add New Form"}</h2>
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
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              >
                {DOCUMENT_TYPES.filter((type) => type !== "All").map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
              <button type="submit" className="primary">
                {editingId ? "Update Form" : "Save Form"}
              </button>
              {editingId && (
                <button type="button" className="secondary" onClick={onCancelEdit}>
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <section className="card">
            <h2>Manage Existing Forms</h2>
            {forms.length === 0 ? (
              <p className="empty">No forms found. Add your first document above.</p>
            ) : (
              <ul className="list">
                {forms.map((f) => (
                  <li key={f._id}>
                    <div className="item-details">
                      <strong>{f.title}</strong>
                      <div className="badges">
                        <span className="badge">{f.documentType || "ISO Form"}</span>
                        <span className="badge">{f.office}</span>
                        <span className="badge">{f.category}</span>
                      </div>
                      <p className="meta">
                        Last Updated: {new Date(f.updatedAt).toLocaleDateString()}
                      </p>
                      <small>{f.description}</small>
                    </div>
                    <div className="actions">
                      <button type="button" className="secondary" onClick={() => onEdit(f)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(f._id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </>
        )}
      </main>
    </div>
  );
}
