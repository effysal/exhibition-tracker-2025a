import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navigation() {
  const { logout } = useAuth();

  return (
    <div className="topnav">
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <span className="brand">Opatra VeRO Tracker</span>
        <nav className="topnav-links">
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/listings">Listings</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </div>
      <button className="btn" onClick={logout}>
        Sign out
      </button>
    </div>
  );
}
