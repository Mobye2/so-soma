import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import RouteAnalytics from "@/components/RouteAnalytics";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Shop from "./pages/Shop.tsx";
import Courses from "./pages/Courses.tsx";
import Events from "./pages/Events.tsx";
import Ebooks from "./pages/Ebooks.tsx";
import Blog from "./pages/Blog.tsx";
import ForestTherapy from "./pages/ForestTherapy.tsx";
import YinYoga from "./pages/YinYoga.tsx";
import YinYogaFreeTrial from "./pages/YinYogaFreeTrial.tsx";
import SelfCare from "./pages/SelfCare.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import BlogCategory from "./pages/BlogCategory.tsx";
import Quiz from "./pages/Quiz.tsx";
import Contact from "./pages/Contact.tsx";
import Checkout from "./pages/Checkout.tsx";
import OrderSuccess from "./pages/OrderSuccess.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import Member from "./pages/Member.tsx";
import MemberCourse from "./pages/MemberCourse.tsx";
import MemberCourses from "./pages/MemberCourses.tsx";
import ShopProduct from "./pages/ShopProduct.tsx";
import ComingSoon from "./pages/ComingSoon.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteAnalytics />
          <CartDrawer />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:slug" element={<ShopProduct />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/events" element={<Events />} />
            <Route path="/ebooks" element={<Ebooks />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/forest-therapy" element={<ForestTherapy />} />
            <Route path="/mindful-yin-yoga" element={<YinYoga />} />
            <Route path="/yin-yoga" element={<Navigate to="/mindful-yin-yoga" replace />} />
            <Route path="/yin-yoga-free-trial" element={<YinYogaFreeTrial />} />
            <Route path="/self-care" element={<SelfCare />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/category/:slug" element={<BlogCategory />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/member" element={<Member />} />
            <Route path="/member-courses" element={<MemberCourses />} />
            <Route path="/member/courses/:slug" element={<MemberCourse />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
