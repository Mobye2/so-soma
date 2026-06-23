// Runs on a cron schedule. Finds blog posts whose published_at has passed and
// have not yet been notified, then:
//   1) emails the admin a summary
//   2) emails all blog subscribers (newsletter_subscribers where source='blog')
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_EMAIL = 'believe.chuan@gmail.com'
const SITE_URL = 'https://www.solisforest.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const nowIso = new Date().toISOString()

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id,title,slug,category,excerpt,author,published_at')
    .eq('published', true)
    .lte('published_at', nowIso)
    .is('publish_notified_at', null)
    .order('published_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[notify-published-posts] query error', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!posts || posts.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const results: Array<{ slug: string; ok: boolean; subscribers?: number; error?: string }> = []

  for (const post of posts) {
    const publishedAtStr = post.published_at
      ? new Date(post.published_at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
      : 'unknown'
    const url = `${SITE_URL}/blog/${post.slug}`

    try {
      // 1) Admin notice
      const { error: adminErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'blog-post-published',
          recipientEmail: ADMIN_EMAIL,
          idempotencyKey: `blog-published-${post.id}`,
          templateData: {
            title: post.title,
            slug: post.slug,
            category: post.category,
            excerpt: post.excerpt,
            author: (post as any).author ?? 'Kaia',
            publishedAt: publishedAtStr,
            url,
          },
        },
      })
      if (adminErr) throw adminErr

      // 2) Fan-out to blog subscribers
      const { data: subs } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('source', 'blog')

      let sent = 0
      if (subs && subs.length > 0) {
        for (const s of subs) {
          if (!s.email) continue
          const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(s.email)}`
          const { error: subErr } = await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'blog-post-subscriber-notice',
              recipientEmail: s.email,
              idempotencyKey: `blog-sub-${post.id}-${s.email}`,
              templateData: {
                title: post.title,
                url,
                author: (post as any).author ?? 'Kaia',
                category: post.category,
                excerpt: post.excerpt,
                unsubscribeUrl,
              },
            },
          })
          if (subErr) {
            console.error('[notify-published-posts] sub send fail', s.email, subErr)
          } else {
            sent++
          }
        }
      }

      const { error: updErr } = await supabase
        .from('blog_posts')
        .update({ publish_notified_at: nowIso })
        .eq('id', post.id)
      if (updErr) throw updErr

      results.push({ slug: post.slug, ok: true, subscribers: sent })
    } catch (e: any) {
      console.error('[notify-published-posts] failed for', post.slug, e)
      results.push({ slug: post.slug, ok: false, error: String(e?.message ?? e) })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
