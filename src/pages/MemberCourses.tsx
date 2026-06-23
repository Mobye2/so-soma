import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  description: string | null;
}

const MemberCourses = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id,title,slug,cover_image,description")
        .order("created_at", { ascending: false });
      setCourses((data as CourseRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20 md:py-28">
        <div className="container-brand max-w-5xl px-4">
          <h1 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-2">
            會員課程
          </h1>
          <p className="text-muted-foreground mb-8">
            觀看您的專屬線上課程影片。
          </p>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                目前尚無課程。
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c) => (
                <Card key={c.id} className="overflow-hidden">
                  {c.cover_image && (
                    <img src={c.cover_image} alt={c.title} className="w-full h-44 object-cover" />
                  )}
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-serif-tc text-lg font-semibold">{c.title}</h3>
                    {c.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    )}
                    <Button asChild className="w-full">
                      <Link to={`/member/courses/${c.slug}`}>
                        <PlayCircle className="w-4 h-4 mr-1" /> 開始觀看
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MemberCourses;
