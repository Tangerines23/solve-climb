import pandas as pd

# Data compilation based on the image analysis
data = []

# Helper function to add items
def add_items(group, category, sub_type, specs):
    for spec in specs:
        # Try to split spec into diameter and length if possible (e.g., "3x50")
        try:
            if 'x' in spec.lower():
                d, l = spec.lower().split('x')
                size_d = d.strip()
                size_l = l.strip()
            elif 'm' in spec.lower(): # For nuts
                size_d = spec.strip()
                size_l = ""
            else:
                size_d = spec
                size_l = ""
        except:
            size_d = spec
            size_l = ""
        
        data.append({
            "Group": group,
            "Category": category,
            "Sub_Type": sub_type,
            "Spec_Raw": spec,
            "Size_Diameter": size_d,
            "Size_Length": size_l
        })

# A: NI 렌지
add_items("A", "NI 렌지", "일반", 
          ["3x50", "4x12", "5x55", "5x60", "6x15", "6x35", "8x45", "8x50", 
           "12x20", "12x40", "12x45", "16x45", "16x50", "20x60"])

# B: NI 렌지
add_items("B", "NI 렌지", "일반", 
          ["2.5x10", "3x25", "3x35", "3x40", "4x12", "4x50", "8x18", "8x20", "8x10"])

# C: NI 렌지
add_items("C", "NI 렌지", "일반", 
          ["2.5x6", "2.5x15", "4x25", "4x30", "5x65", "6x30", "8x25", "8x30", 
           "8x40", "8x15", "10x40", "10x90", "12x40"])

# D: NI 렌지
add_items("D", "NI 렌지", "일반", 
          ["5x20", "5x25", "5x35", "5x45", "5x50", "5x85"])

# E: NI 렌지, 접시
add_items("E", "NI 렌지", "일반", 
          ["5x25", "5x30", "5x40", "5x45", "6x40", "12x30", "12x35", "12x45", "12x50", "12x140"])
add_items("E", "NI 렌지", "접시", 
          ["6x20", "12x45"]) # 12x45 next to "Dish D" notation

# F: SUS 렌지
add_items("F", "SUS 렌지", "일반", 
          ["5x12", "5x20", "5x30", "5x45", "6x15", "6x10", "8x15", "8x20", "8x30", "8x40"])
add_items("F", "SUS 렌지", "전산", 
          ["10x40", "10x50", "10x100"])

# G: SUS
add_items("G", "SUS", "일반", 
          ["6x18", "6x20", "6x25", "10x15", "10x20"])
add_items("G", "SUS", "전산", 
          ["8x35", "8x40", "8x55", "6x80"])

# H: SUS 렌지, 기타
add_items("H", "SUS 렌지", "일반", ["12x50"])
add_items("H", "SUS 렌지", "전산", ["12x130"])
add_items("H", "SUS 렌지", "육각머리", ["12x55"])
add_items("H", "SUS 렌지", "둥근렌지", ["5x20", "6x12", "6x20", "6x18", "6x15"]) # Corrected based on image flow
add_items("H", "SUS 렌지", "접시렌지", ["10x15", "3x6", "4x8"])
add_items("H", "SUS 렌지", "접시셈라", ["4x6", "4x32", "4x40", "5x8", "6x5"])

# I: 트러스
add_items("I", "트러스", "일반", ["4x10", "4x16", "5x16", "6x16"])

# J: 셈스 렌지
add_items("J", "셈스 렌지", "둥근셈라", ["6x10"])
add_items("J", "셈스 렌지", "일반", 
          ["4x12", "4x13", "5x15", "5x25", "6x15", "6x16", "6x25", "6x30"])

# K: 별렌지
add_items("K", "별렌지", "일반", 
          ["4x8", "4x10", "4x12", "4x35", "4x40", "5x8", "5x12", "5x25", "6x8", "6x12"])
add_items("K", "별렌지", "접시별렌지", ["6x8"])
add_items("K", "별렌지", "셈스별렌지", ["4x10", "6x15", "6x20"])
add_items("K", "별렌지", "낮은머리별렌지", ["4x45"])

# L: 너트
add_items("L", "너트", "플랜지 너트", ["M5", "M6", "M8"])
add_items("L", "너트", "캡 너트", ["M3", "M4", "M5", "M8"]) # Based on user input text
add_items("L", "너트", "작 너트", ["M4"])
add_items("L", "너트", "일반", ["M2", "M12", "M16", "M18", "M20"])

# Create DataFrame
df = pd.DataFrame(data)

# Save to CSV
csv_filename = "parts_list_v2.csv"
df.to_csv(csv_filename, index=False, encoding='utf-8-sig')

print(f"CSV file created: {csv_filename}")
print(df.head())