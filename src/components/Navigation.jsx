import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export function Navigation() {
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
      <button className="btn" onClick={() => signOut(auth)}>
        Sign out
      </button>
    </div>
  );
}
