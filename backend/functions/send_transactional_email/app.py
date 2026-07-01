import json
import os
import uuid
import secrets
import boto3
import urllib.request

SITE_NAME = "煦日之森"
FROM_EMAIL = "noreply@solisforest.com"
SES_REGION = os.environ.get("SES_REGION", "ap-southeast-1")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

SUBJECTS = {
    "event-registration-confirmation": lambda d: f"報名收到了｜{d.get('eventTitle', '活動')}・煦日之森",
    "order-payment-success": lambda d: f"付款成功｜訂單 {d.get('orderId', '')}・煦日之森",
    "contact-confirmation": lambda _: "已收到你的訊息｜煦日之森",
    "welcome-member": lambda _: "歡迎加入｜煦日之森",
    "quiz-result": lambda _: "你的測驗結果｜煦日之森",
    "blog-post-published": lambda d: f"新文章發佈｜{d.get('title', '')}・煦日之森",
    "blog-post-subscriber-notice": lambda d: f"新文章｜{d.get('title', '')}・煦日之森",
    "launch-notify": lambda d: f"你等待的「{d.get('product_name', '商品')}」現已上架｜煦日之森",
}

BODIES = {
    "event-registration-confirmation": lambda d: (
        f"{d.get('name', '')}，歡迎你\n\n"
        f"我們已收到你報名「{d.get('eventTitle', '活動')}」的訊息。\n\n"
        "Kaia 將在活動前以 Email 或 Instagram 私訊與你確認集合地點、時間與當日注意事項。\n"
        "請留意你的收件匣，若一週內未收到請來信告知。\n\n"
        "期待與你在森林相遇。\n煦日之森・Solis Forest"
    ),
    "order-payment-success": lambda d: (
        f"{d.get('name', '')}，付款成功\n\n"
        f"訂單編號：{d.get('orderId', '')}\n"
        f"總金額：NT${d.get('totalAmount', 0):,}\n\n"
        "若是課程或電子書，將由 Kaia 親自寄送觀看連結；若是實體活動，我們會在活動前與你確認細節。\n\n"
        "謝謝你的支持。\n煦日之森・Solis Forest"
    ),
    "contact-confirmation": lambda d: (
        f"{d.get('name', '')}，你好\n\n"
        "我們已收到你的訊息，會盡快回覆你。\n\n"
        "煦日之森・Solis Forest"
    ),
    "welcome-member": lambda d: (
        f"{d.get('name', '')}，歡迎加入煦日之森\n\n"
        "很高興你在這裡。\n\n"
        "煦日之森・Solis Forest"
    ),
    "blog-post-subscriber-notice": lambda d: (
        f"{d.get('name', '')}，你好\n\n"
        f"煦日之森有新文章：《{d.get('title', '')}》\n\n"
        f"{d.get('excerpt', '')}\n\n"
        f"閱讀全文：{d.get('url', 'https://www.solisforest.com/blog')}\n\n"
        "煦日之森・Solis Forest"
    ),
    "quiz-result": lambda d: _build_quiz_result_body(d),
    "launch-notify": lambda d: (
        f"{d.get('name', '')}，你好\n\n"
        f"你之前登記希望收到「{d.get('product_name', '商品')}」的上架通知。\n\n"
        f"好消息！這個商品現在已經正式上架了。\n\n"
        f"立即前往：{d.get('url', 'https://www.solisforest.com/shop')}\n\n"
        "煦日之森・Solis Forest"
    ),
}


def _build_quiz_result_html(d):
    state_name = d.get('stateName', '')
    state_title = d.get('stateTitle', '')
    avg_well = d.get('avgWell', '')
    plant_name = d.get('plantName', '')
    plant_tagline = d.get('plantTagline', '')
    plant_voice = d.get('plantBodyVoice', '')
    plant_share_pct = d.get('plantSharePct', '')
    top = d.get('topDim', {})
    low = d.get('lowDim', {})
    dims = d.get('dims', [])
    dim_insights = d.get('dimInsights', [])
    state_tips = d.get('stateTips', [])
    nutrients = d.get('plantNutrients', [])

    # state color map
    state_colors = {
        '備戰停不下來': {'tc': '#633806', 'bg': '#FAEEDA'},
        '低電量關機':   {'tc': '#042C53', 'bg': '#E6F1FB'},
        '安穩在線':     {'tc': '#04342C', 'bg': '#E1F5EE'},
    }
    sc = state_colors.get(state_name, {'tc': '#04342C', 'bg': '#E1F5EE'})
    tc, bg = sc['tc'], sc['bg']

    dim_colors = ['#1D9E75', '#7F77DD', '#D85A30', '#BA7517', '#378ADD']

    # dims bars
    dims_html = ''
    for i, dim in enumerate(dims):
        color = dim_colors[i] if i < len(dim_colors) else '#1D9E75'
        pct = dim.get('pct', 0)
        dims_html += f'''
        <tr>
          <td style="font-size:13px;color:#555;padding:5px 10px 5px 0;width:80px;white-space:nowrap">{dim.get("name","")}</td>
          <td style="padding:5px 0">
            <div style="background:#e8e8e8;border-radius:4px;height:6px;width:100%">
              <div style="background:{color};border-radius:4px;height:6px;width:{pct}%"></div>
            </div>
          </td>
          <td style="font-size:12px;color:#888;padding:5px 0 5px 10px;width:36px;text-align:right">{pct}%</td>
        </tr>'''

    # dim insight cards
    insights_html = ''
    for i, di in enumerate(dim_insights):
        color = dim_colors[i] if i < len(dim_colors) else '#1D9E75'
        pct = di.get('pct', 0)
        insights_html += f'''
        <div style="border-left:3px solid {color};padding:12px 14px;margin-bottom:10px;background:#fafafa;border-radius:0 8px 8px 0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:14px;font-weight:600;color:{color}">{di.get("name","")}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:{bg};color:{tc}">{di.get("level","")}</span>
          </div>
          <div style="background:#e8e8e8;border-radius:4px;height:4px;margin-bottom:8px">
            <div style="background:{color};border-radius:4px;height:4px;width:{pct}%"></div>
          </div>
          <p style="font-size:13px;color:#444;line-height:1.7;margin:0 0 8px">{di.get("insight","")}</p>
          <div style="background:#f0f0f0;border-radius:6px;padding:8px 10px;font-size:12px;color:#555;line-height:1.6">
            <span style="font-size:10px;font-weight:700;color:#888;letter-spacing:.05em;display:block;margin-bottom:3px">今日可以嘗試</span>
            {di.get("tip","")}
          </div>
        </div>'''

    # state tips
    tips_html = ''
    for tip in state_tips:
        tips_html += f'''
        <div style="background:#f7f7f5;border-radius:8px;padding:14px 16px;margin-bottom:8px">
          <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 5px">{tip.get("t","")}</p>
          <p style="font-size:13px;color:#555;line-height:1.7;margin:0">{tip.get("b","")}</p>
        </div>'''

    # nutrients
    nutrients_html = ''
    for n in nutrients:
        nutrients_html += f'''
        <div style="background:#fff;border:1px solid #e8dfcc;border-radius:10px;padding:10px 12px;margin-bottom:8px">
          <div style="font-size:11px;font-weight:700;color:#5c4a2e;letter-spacing:.04em;margin-bottom:4px">{n.get("lbl","")}</div>
          <div style="font-size:13px;color:#1a1a1a;line-height:1.6">{n.get("body","")}</div>
        </div>'''

    top_name = top.get('name', '')
    top_pct  = top.get('pct', '')
    low_name = low.get('name', '')
    low_pct  = low.get('pct', '')

    return f'''<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:-apple-system,'Helvetica Neue',Arial,'PingFang TC','Microsoft JhengHei',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">

  <!-- header -->
  <tr><td style="background:{bg};padding:28px 28px 20px;text-align:center">
    <p style="font-size:11px;font-weight:600;letter-spacing:.1em;color:{tc};margin:0 0 8px;text-transform:uppercase">KAIA · 神經系統自我覺察</p>
    <p style="font-size:26px;font-weight:800;color:{tc};margin:0 0 6px;line-height:1.2">{state_name}</p>
    <p style="font-size:14px;color:{tc};margin:0;opacity:.8">{state_title}</p>
  </td></tr>

  <!-- overall score -->
  <tr><td style="padding:20px 28px 0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:12px;background:#f7f7f5;border-radius:10px;width:30%">
          <div style="font-size:28px;font-weight:800;color:#1D9E75">{avg_well}%</div>
          <div style="font-size:11px;color:#888;margin-top:2px">整體穩定度</div>
        </td>
        <td style="width:5%"></td>
        <td style="text-align:center;padding:12px;background:#f7f7f5;border-radius:10px;width:30%">
          <div style="font-size:15px;font-weight:700;color:#1D9E75">{top_name}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">最有力 · {top_pct}%</div>
        </td>
        <td style="width:5%"></td>
        <td style="text-align:center;padding:12px;background:#f7f7f5;border-radius:10px;width:30%">
          <div style="font-size:15px;font-weight:700;color:#D85A30">{low_name}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">最需照顧 · {low_pct}%</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- plant block -->
  <tr><td style="padding:20px 28px 0">
    <div style="background:#fbf7f0;border:1px solid #d9cfbf;border-radius:14px;padding:16px 18px">
      <p style="font-size:11px;color:#888;margin:0 0 4px">你的身體目前最像哪一種植物…</p>
      <p style="font-size:22px;font-weight:900;color:{tc};margin:0 0 6px">{plant_name}</p>
      <p style="font-size:13px;color:#555;margin:0 0 12px;line-height:1.6">{plant_tagline}</p>
      <div style="background:#fff;border-left:3px solid #1D9E75;border-radius:0 8px 8px 0;padding:12px 14px">
        <p style="font-size:11px;font-weight:700;color:#0F6E56;margin:0 0 5px;letter-spacing:.05em">🌿 身體想跟你說</p>
        <p style="font-size:13px;color:#4A6741;line-height:1.75;margin:0">{plant_voice}</p>
      </div>
      {(f"<p style='font-size:12px;color:#888;margin:10px 0 0;text-align:right'>約 {plant_share_pct}% 的人和你是同款植物</p>") if plant_share_pct else ""}
    </div>
  </td></tr>

  <!-- 5 dims -->
  <tr><td style="padding:20px 28px 0">
    <p style="font-size:11px;font-weight:600;letter-spacing:.07em;color:#888;margin:0 0 12px">五向度全景</p>
    <table width="100%" cellpadding="0" cellspacing="0">{dims_html}</table>
  </td></tr>

  <!-- dim insights -->
  <tr><td style="padding:20px 28px 0">
    <p style="font-size:11px;font-weight:600;letter-spacing:.07em;color:#888;margin:0 0 12px">各向度解析與建議</p>
    {insights_html}
  </td></tr>

  <!-- state tips -->
  <tr><td style="padding:20px 28px 0">
    <p style="font-size:11px;font-weight:600;letter-spacing:.07em;color:#888;margin:0 0 12px">整體調適建議</p>
    {tips_html}
  </td></tr>

  <!-- nutrients -->
  {(f"<tr><td style='padding:20px 28px 0'><p style='font-size:11px;font-weight:600;letter-spacing:.07em;color:#888;margin:0 0 12px'>{plant_name}的養分清單</p>{nutrients_html}</td></tr>") if nutrients_html else ""}

  <!-- footer -->
  <tr><td style="padding:24px 28px;text-align:center;border-top:1px solid #eee;margin-top:20px">
    <p style="font-size:13px;color:#1a1a1a;font-weight:600;margin:0 0 4px">煦日之森・Solis Forest</p>
    <p style="font-size:12px;margin:0"><a href="https://www.solisforest.com" style="color:#1D9E75;text-decoration:none">www.solisforest.com</a></p>
  </td></tr>

</table>
</td></tr></table>
</body></html>'''


def _build_quiz_result_body(d):
    lines = []
    lines.append(f"你的神經系統測驗結果出來了！")
    lines.append(f"")
    lines.append(f"【整體狀態】{d.get('stateName', '')}")
    lines.append(f"{d.get('stateTitle', '')}")
    lines.append(f"整體穩定度：{d.get('avgWell', '')}%")
    lines.append(f"")

    plant_name = d.get('plantName', '')
    plant_tagline = d.get('plantTagline', '')
    plant_voice = d.get('plantBodyVoice', '')
    if plant_name:
        lines.append(f"【你的身體植物】{plant_name}")
        lines.append(plant_tagline)
        lines.append(f"")
        lines.append("身體想跟你說：")
        lines.append(plant_voice)
        lines.append(f"")

    top = d.get('topDim', {})
    low = d.get('lowDim', {})
    if top.get('name'):
        lines.append(f"最有力的部分：{top['name']}（{top.get('pct', '')}% 穩定）")
    if low.get('name'):
        lines.append(f"最需要被照顧：{low['name']}（{low.get('pct', '')}% 穩定）")
    lines.append(f"")

    dims = d.get('dims', [])
    if dims:
        lines.append("【五向度全景】")
        for dim in dims:
            lines.append(f"  {dim.get('name', '')}：{dim.get('pct', '')}%")
        lines.append(f"")

    dim_insights = d.get('dimInsights', [])
    if dim_insights:
        lines.append("【各向度解析與建議】")
        for di in dim_insights:
            lines.append(f"")
            lines.append(f"▍{di.get('name', '')}（{di.get('level', '')}，{di.get('pct', '')}%）")
            lines.append(di.get('insight', ''))
            lines.append(f"今日可以嘗試：{di.get('tip', '')}")
        lines.append(f"")

    state_tips = d.get('stateTips', [])
    if state_tips:
        lines.append("【整體調適建議】")
        for tip in state_tips:
            lines.append(f"")
            lines.append(f"◎ {tip.get('t', '')}")
            lines.append(tip.get('b', ''))
        lines.append(f"")

    nutrients = d.get('plantNutrients', [])
    if nutrients:
        lines.append(f"【{plant_name}的養分清單】")
        for n in nutrients:
            lines.append(f"  {n.get('lbl', '')}：{n.get('body', '')}")
        lines.append(f"")

    lines.append("煦日之森・Solis Forest")
    lines.append("https://www.solisforest.com")
    return "\n".join(lines)


def sb_get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def sb_post(table, data, prefer="return=minimal"):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}",
        method="POST",
        data=json.dumps(data).encode(),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": prefer,
        }
    )
    with urllib.request.urlopen(req) as r:
        return r.status


def get_or_create_token(email):
    rows = sb_get("email_unsubscribe_tokens", f"select=token,used_at&email=eq.{email}")
    if rows and not rows[0].get("used_at"):
        return rows[0]["token"]
    # Delete old token and create fresh one
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/email_unsubscribe_tokens?email=eq.{email}",
        method="DELETE",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Prefer": "return=minimal",
        }
    )
    with urllib.request.urlopen(req): pass
    token = secrets.token_hex(32)
    sb_post("email_unsubscribe_tokens", {"token": token, "email": email})
    return token


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, content-type",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
        }

    try:
        body = json.loads(event.get("body", "{}"))
        template_name = body.get("templateName") or body.get("template_name")
        recipient_email = (body.get("recipientEmail") or body.get("recipient_email") or "").lower().strip()
        template_data = body.get("templateData", {})

        if not template_name or not recipient_email:
            return _resp(400, {"error": "templateName and recipientEmail required"})

        subject_fn = SUBJECTS.get(template_name)
        if not subject_fn:
            return _resp(404, {"error": f"Template '{template_name}' not found"})

        subject = subject_fn(template_data)
        body_fn = BODIES.get(template_name)
        text_body = body_fn(template_data) if body_fn else "來自煦日之森的通知"

        # Add unsubscribe footer
        unsub_token = get_or_create_token(recipient_email)
        unsub_url = f"https://www.solisforest.com/unsubscribe?token={unsub_token}"
        text_body += f"\n\n---\n如果你不想再收到信件：{unsub_url}"

        # Build HTML body for templates that support it
        html_body = None
        if template_name == "quiz-result":
            html_body = _build_quiz_result_html(template_data)
            html_body = html_body.replace(
                "</body>",
                f'<p style="font-size:11px;color:#aaa;text-align:center;padding:0 28px 20px">如果你不想再收到信件：<a href="{unsub_url}" style="color:#aaa">{unsub_url}</a></p></body>'
            )

        # Send via SES
        ses = boto3.client("ses", region_name=SES_REGION)
        email_body = {"Text": {"Data": text_body, "Charset": "UTF-8"}}
        if html_body:
            email_body["Html"] = {"Data": html_body, "Charset": "UTF-8"}
        ses.send_email(
            Source=f"{SITE_NAME} <{FROM_EMAIL}>",
            Destination={"ToAddresses": [recipient_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": email_body,
            },
        )

        # Log
        message_id = str(uuid.uuid4())
        sb_post("email_send_log", {
            "message_id": message_id,
            "template_name": template_name,
            "recipient_email": recipient_email,
            "status": "sent",
        })

        return _resp(200, {"success": True})

    except Exception as e:
        print(f"send-transactional-email error: {e}")
        return _resp(500, {"error": "Internal server error"})


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps(body),
    }
