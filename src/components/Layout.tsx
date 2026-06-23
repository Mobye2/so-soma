import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingLineButton from "@/components/FloatingLineButton";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <Footer />
      <FloatingLineButton />
    </div>
  );
};

export default Layout;
