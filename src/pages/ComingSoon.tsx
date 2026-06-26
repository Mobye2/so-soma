import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

const LINE_URL = "https://lin.ee/WJcPZiC";

const ComingSoon = () => (
  <Layout>
    <section className="section-padding min-h-[60vh] flex items-center">
      <div className="container-brand max-w-lg text-center space-y-6">
        <Clock className="w-12 h-12 text-secondary mx-auto" />
        <h1 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground">
          即將上架
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          這個課程正在準備中，敬請期待。<br />
          加入 LINE 空間，第一時間收到上架通知與專屬優惠。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer">加入 LINE，接收上架通知</a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/shop">瀏覽其他課程</Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);

export default ComingSoon;
