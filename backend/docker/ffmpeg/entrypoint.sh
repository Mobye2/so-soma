#!/bin/sh
set -e

echo "[ffmpeg-hls] Starting job"
echo "  SRC_BUCKET=$SRC_BUCKET"
echo "  SRC_KEY=$SRC_KEY"
echo "  DST_BUCKET=$DST_BUCKET"
echo "  DST_PREFIX=$DST_PREFIX"
echo "  CHAPTER_ID=$CHAPTER_ID"

# Validate required env vars
for var in SRC_BUCKET SRC_KEY DST_BUCKET DST_PREFIX CHAPTER_ID SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
  eval val=\$$var
  if [ -z "$val" ]; then
    echo "[ffmpeg-hls] ERROR: $var is not set"
    exit 1
  fi
done

mkdir -p /tmp/hls

# 1. Download source video from S3
echo "[ffmpeg-hls] Downloading s3://$SRC_BUCKET/$SRC_KEY"
aws s3 cp "s3://$SRC_BUCKET/$SRC_KEY" /tmp/input.mp4

# 2. Transcode to HLS with multiple quality levels (360p + 720p)
echo "[ffmpeg-hls] Transcoding to HLS..."

ffmpeg -i /tmp/input.mp4 \
  -filter_complex \
    "[0:v]split=2[v1][v2]; \
     [v1]scale=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2[v720]; \
     [v2]scale=w=640:h=360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2[v360]" \
  -map "[v720]" -map 0:a -c:v:0 libx264 -crf 22 -preset fast -b:v:0 2800k -c:a:0 aac -b:a:0 128k \
    -hls_time 6 -hls_playlist_type vod \
    -hls_segment_filename "/tmp/hls/720p_%03d.ts" \
    /tmp/hls/720p.m3u8 \
  -map "[v360]" -map 0:a -c:v:1 libx264 -crf 24 -preset fast -b:v:1 800k  -c:a:1 aac -b:a:1 96k \
    -hls_time 6 -hls_playlist_type vod \
    -hls_segment_filename "/tmp/hls/360p_%03d.ts" \
    /tmp/hls/360p.m3u8

# 3. Write master playlist
cat > /tmp/hls/index.m3u8 << 'EOF'
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2928000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360
360p.m3u8
EOF

echo "[ffmpeg-hls] Transcoding complete"

# 4. Upload HLS to S3
echo "[ffmpeg-hls] Uploading to s3://$DST_BUCKET/$DST_PREFIX"
aws s3 sync /tmp/hls/ "s3://$DST_BUCKET/$DST_PREFIX" \
  --content-type "application/x-mpegURL" \
  --exclude "*" --include "*.m3u8"
aws s3 sync /tmp/hls/ "s3://$DST_BUCKET/$DST_PREFIX" \
  --content-type "video/MP2T" \
  --exclude "*" --include "*.ts"

echo "[ffmpeg-hls] Upload complete"

# 5. Notify Supabase: mark chapter as hls_ready
echo "[ffmpeg-hls] Updating Supabase chapter $CHAPTER_ID"
HTTP_STATUS=$(curl -s -o /tmp/supabase_resp.txt -w "%{http_code}" \
  -X PATCH "$SUPABASE_URL/rest/v1/course_chapters?id=eq.$CHAPTER_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"video_url\": \"$DST_PREFIX\", \"hls_ready\": true}")

if [ "$HTTP_STATUS" != "204" ]; then
  echo "[ffmpeg-hls] WARNING: Supabase update returned HTTP $HTTP_STATUS"
  cat /tmp/supabase_resp.txt
else
  echo "[ffmpeg-hls] Supabase updated successfully"
fi

# 6. Cleanup raw file (optional, lifecycle rule handles it too)
echo "[ffmpeg-hls] Done"
