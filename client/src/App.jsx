import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const API_BASE = "http://localhost:5000/api/forms";
const AUTH_BASE = "http://localhost:5000/api/auth";
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
  /* ───── Auth State ───── */
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const [authForm, setAuthForm] = useState({ username: "", password: "", role: "student" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  /* ───── App State ───── */
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("intro");
  const [stats, setStats] = useState({ totalForms: 0, byCategory: [], topDownloaded: [] });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  /* ───── Auth helpers ───── */
  const authHeaders = useCallback(() => {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await axios.post(`${AUTH_BASE}/login`, {
        username: authForm.username,
        password: authForm.password,
      });
      setUser({ _id: res.data._id, username: res.data.username, role: res.data.role });
      setToken(res.data.token);
      localStorage.setItem("user", JSON.stringify({ _id: res.data._id, username: res.data.username, role: res.data.role }));
      localStorage.setItem("token", res.data.token);
      setAuthForm({ username: "", password: "", role: "student" });
    } catch (err) {
      setAuthError(err.response?.data?.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await axios.post(`${AUTH_BASE}/register`, {
        username: authForm.username,
        password: authForm.password,
        role: authForm.role,
      });
      setUser({ _id: res.data._id, username: res.data.username, role: res.data.role });
      setToken(res.data.token);
      localStorage.setItem("user", JSON.stringify({ _id: res.data._id, username: res.data.username, role: res.data.role }));
      localStorage.setItem("token", res.data.token);
      setAuthForm({ username: "", password: "", role: "student" });
    } catch (err) {
      setAuthError(err.response?.data?.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setActiveTab("intro");
  };

  /* ───── Data fetching ───── */
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
        await axios.put(`${API_BASE}/${editingId}`, buildPayload(), authHeaders());
        showToast("success", "Form updated successfully.");
      } else {
        await axios.post(API_BASE, buildPayload(), authHeaders());
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
      await axios.delete(`${API_BASE}/${id}`, authHeaders());
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

  const CHART_COLORS = [
    "rgba(59, 130, 246, 0.7)",
    "rgba(16, 185, 129, 0.7)",
    "rgba(245, 158, 11, 0.7)",
    "rgba(239, 68, 68, 0.7)",
    "rgba(139, 92, 246, 0.7)",
    "rgba(236, 72, 153, 0.7)",
    "rgba(20, 184, 166, 0.7)",
    "rgba(249, 115, 22, 0.7)",
  ];

  const downloadDoughnutData = useMemo(
    () => ({
      labels: stats.topDownloaded.map((x) => x.title),
      datasets: [
        {
          data: stats.topDownloaded.map((x) => x.downloadCount),
          backgroundColor: CHART_COLORS.slice(0, stats.topDownloaded.length),
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    }),
    [stats.topDownloaded]
  );

  const downloadBarData = useMemo(
    () => ({
      labels: stats.topDownloaded.map((x) => x.title),
      datasets: [
        {
          label: "Downloads",
          data: stats.topDownloaded.map((x) => x.downloadCount),
          backgroundColor: CHART_COLORS.slice(0, stats.topDownloaded.length),
          borderRadius: 6,
        },
      ],
    }),
    [stats.topDownloaded]
  );

  /* ───── Auth Page ───── */
  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">ITD110 - NoSQL Databases - Case Study #1</p>
            <h1 className="auth-title">Student Document Repository</h1>
            <p className="auth-subtitle">Sign in to access the platform</p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={authTab === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => { setAuthTab("login"); setAuthError(""); }}
            >
              Login
            </button>
            <button
              type="button"
              className={authTab === "register" ? "auth-tab active" : "auth-tab"}
              onClick={() => { setAuthTab("register"); setAuthError(""); }}
            >
              Register
            </button>
          </div>

          {authError && <div className="auth-error">{authError}</div>}

          <form onSubmit={authTab === "login" ? handleLogin : handleRegister} className="auth-form">
            <div className="auth-field">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                placeholder="Enter your username"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                placeholder="Enter your password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            {authTab === "register" && (
              <div className="auth-field">
                <label htmlFor="auth-role">Role</label>
                <select
                  id="auth-role"
                  value={authForm.role}
                  onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <button type="submit" className="auth-submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : authTab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            {authTab === "login" ? (
              <>Don&apos;t have an account? <button type="button" className="link-btn" onClick={() => { setAuthTab("register"); setAuthError(""); }}>Register</button></>
            ) : (
              <>Already have an account? <button type="button" className="link-btn" onClick={() => { setAuthTab("login"); setAuthError(""); }}>Login</button></>
            )}
          </p>
        </div>
      </div>
    );
  }

  /* ───── Main App ───── */
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
        <div className="hero-right">
          <div className="user-info">
            <span className="user-badge">{user.role === "admin" ? "👑 Admin" : "🎓 Student"}</span>
            <span className="user-name">{user.username}</span>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
          <div className="pill">{loading ? "Syncing..." : "Live Data"}</div>
        </div>
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
          className={activeTab === "dashboard" ? "tab active" : "tab"}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        {isAdmin && (
          <button
            type="button"
            className={activeTab === "manage" ? "tab active" : "tab"}
            onClick={() => setActiveTab("manage")}
          >
            Manage Forms (CRUD)
          </button>
        )}
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

        {activeTab === "dashboard" && (
          <>
          <section className="card">
            <h2>Forms by Category</h2>
            <p className="muted">Total Forms: {stats.totalForms}</p>
            <Bar data={chartData} />
          </section>

          {stats.topDownloaded.length > 0 && (
            <section className="card">
              <h2>Download Analytics</h2>
              <p className="muted">Showing how many times each form has been viewed/downloaded by students</p>
              <div className="charts-row">
                <div className="chart-half">
                  <h3>Top Downloaded Forms</h3>
                  <Bar
                    data={downloadBarData}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          ticks: { stepSize: 1 },
                          title: { display: true, text: "Download Count" },
                        },
                      },
                    }}
                  />
                </div>
                <div className="chart-half">
                  <h3>Download Distribution</h3>
                  <Doughnut
                    data={downloadDoughnutData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { padding: 14, usePointStyle: true, pointStyle: "circle" },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </section>
          )}
          </>
        )}

        {activeTab === "manage" && isAdmin && (
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
