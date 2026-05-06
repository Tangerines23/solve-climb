import os
import re

src_dir = r'c:\Users\ghkdd\gemini-projects\solve-climb\src'

replacements = [
    (r"(['\"])@/constants/tiers(['\"])", r"\1@/features/quiz\2"),
    (r"(['\"])@/utils/MathProblemGenerator(['\"])", r"\1@/features/quiz/utils/MathProblemGenerator\2"),
    (r"(['\"])@/utils/StatsProblemGenerator(['\"])", r"\1@/features/quiz/utils/StatsProblemGenerator\2"),
    (r"(['\"])@/utils/LogicProblemGenerator(['\"])", r"\1@/features/quiz/utils/LogicProblemGenerator\2"),
    (r"(['\"])@/utils/AlgebraAdvancedGenerator(['\"])", r"\1@/features/quiz/utils/AlgebraAdvancedGenerator\2"),
    (r"(['\"])@/utils/CalculusProblemGenerator(['\"])", r"\1@/features/quiz/utils/CalculusProblemGenerator\2"),
    (r"(['\"])@/utils/CSProblemGenerator(['\"])", r"\1@/features/quiz/utils/CSProblemGenerator\2"),
]

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file)
            try:
                # Try UTF-8 first, then CP949
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    encoding = 'utf-8'
                except UnicodeDecodeError:
                    with open(path, 'r', encoding='cp949') as f:
                        content = f.read()
                    encoding = 'cp949'
                
                new_content = content
                for pattern, repl in replacements:
                    new_content = re.sub(pattern, repl, new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding=encoding) as f:
                        f.write(new_content)
                    print(f"Fixed: {path}")
            except Exception as e:
                print(f"Error processing {path}: {e}")
