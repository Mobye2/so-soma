import os
import glob
import chardet

csv_dir = r"c:\Users\user\OneDrive\DESKTOP\Solis & Somatic\supabase\db-export"

for filepath in glob.glob(os.path.join(csv_dir, "*.csv")):
    with open(filepath, "rb") as f:
        raw = f.read(1000)
    detected = chardet.detect(raw)
    print(f"{os.path.basename(filepath)}: {detected}")
