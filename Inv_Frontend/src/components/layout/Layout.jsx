import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "react-hot-toast";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen">
        <Outlet />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            fontSize: "13px",
            borderRadius: "10px",
            padding: "10px 14px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </div>
  );
}