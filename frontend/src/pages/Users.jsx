import { useState, useEffect } from "react";
import { api } from "../services/api";
import InfoCard from "../components/InfoCard";
import "./Users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admins
      .list()
      .then((data) => setUsers(data.admins || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="users-page">
      <header className="page-header">
        <h1>Users</h1>
      </header>

      {error && (
        <div className="alert alert-error" onClick={() => setError("")}>
          {error}
        </div>
      )}

      <div className="users-section">
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="user-name">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`role-badge role-${
                        u.role === "owner" ? "admin" : u.role
                      }`}
                    >
                      {u.role === "admin" || u.role === "owner"
                        ? "Admin"
                        : "User"}
                    </span>
                  </td>
                  <td className="user-date">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && <div className="empty-state">No users yet.</div>}
      </div>
    </div>
  );
}
