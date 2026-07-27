import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";


function AppLayout() {
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster position="bottom-right" />
    </>
  );
}

export default AppLayout;