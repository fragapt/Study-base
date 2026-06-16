import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-5 pb-24 pt-6 md:px-9 md:py-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
