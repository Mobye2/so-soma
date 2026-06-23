import os
import glob

csv_dir = r"c:\Users\user\OneDrive\DESKTOP\Solis & Somatic\supabase\db-export"

for filepath in glob.glob(os.path.join(csv_dir, "*.csv")):
    with open(filepath, "r", encoding="big5", errors="ignore") as f:
        content = f.read()
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"converted: {os.path.basename(filepath)}")

print("done")
