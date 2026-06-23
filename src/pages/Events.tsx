import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Clock, Leaf, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import eventForestHealing from "@/assets/event-forest-healing.webp";
import eventYogaWorkshop from "@/assets/event-yoga-workshop.webp";

const events = [
  {
    id: "event-forest-healing",
    title: "Green Prescription｜煦日森林半日沈浸體驗",
    description: "由 ANFT 國際森林療癒師親自引領。透過五感邀請、靜默漫步與自然冥想，在純粹的林間卸下數位焦慮，找回失落的專注與深層平靜。",
    icon: Leaf,
    image: eventForestHealing,
    details: [
      { icon: MapPin, label: "自然場域" },
      { icon: Users, label: "限額 12 人" },
      { icon: Clock, label: "半日（約3小時）" },
    ],
    launchLabel: "預計 2026 秋天上架",
  },
  {
    id: "event-yoga-workshop",
    title: "實體瑜珈一日工作坊",
    description: "由 Kaia 帶領的小班制瑜珈工作坊，結合正念陰瑜珈與神經系統調節技巧，適合所有程度的練習者。",
    icon: Heart,
    image: eventYogaWorkshop,
    details: [
      { icon: MapPin, label: "台中市區" },
      { icon: Users, label: "小班制" },
    ],
    launchLabel: "預計 2026 秋天上架",
  },
];

const Events = () => {
  return (
    <Layout>
      <SEO
        title="Green Prescription｜煦日森林半日沈浸體驗・台中瑜珈工作坊 | 煦日之森"
        description="ANFT 認證森林療癒師 Kaia 帶領的半日森林療癒體驗，與結合正念陰瑜珈、神經系統調節的台中實體瑜珈工作坊。"
        canonicalPath="/events"
      />
      <section className="section-padding">
        <div className="container-brand">
          <div className="text-center mb-12">
            <h1 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground mb-2">實體活動</h1>
            <p className="heading-en text-sm text-muted-foreground tracking-wider">In-Person Events</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event) => (
              <div key={event.id} id={event.id} className="bg-mist rounded-lg border border-border overflow-hidden scroll-mt-24">
                <div className="h-52 overflow-hidden">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" loading="lazy" width={640} height={512} />
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="font-serif-tc text-xl font-semibold text-foreground">{event.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {event.details.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <d.icon className="w-4 h-4 text-sage" /> {d.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="inline-block text-sm font-medium text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
                      {event.launchLabel}
                    </span>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground text-xs"
                    >
                      <Link to={`/contact?subject=${encodeURIComponent(`上架通知：${event.title}`)}`}>
                        上架通知我
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            活動尚未開放報名，點擊「上架通知我」留下你的 Email，我們會在開放時通知你。
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Events;
