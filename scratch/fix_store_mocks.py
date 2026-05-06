import os
import re

def fix_mocks(root_dir):
    patterns = [
        (r"vi\.mock\(['\"].*?\/stores\/useUserStore['\"]", "vi.mock('@/stores/useUserStore'"),
        (r"vi\.mock\(['\"].*?\/stores\/useSettingsStore['\"]", "vi.mock('@/stores/useSettingsStore'"),
        (r"vi\.mock\(['\"].*?\/stores\/useToastStore['\"]", "vi.mock('@/stores/useToastStore'"),
        (r"vi\.mock\(['\"].*?\/stores\/useQuizStore['\"]", "vi.mock('@/features/quiz/stores/useQuizStore'"),
    ]
    
    test_files = []
    for root, dirs, files in os.walk(root_dir):
        if '__tests__' in root:
            for file in files:
                if file.endswith('.test.tsx') or file.endswith('.test.ts'):
                    test_files.append(os.path.join(root, file))
                    
    for file_path in test_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)
            
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed mocks in: {file_path}")

if __name__ == "__main__":
    fix_mocks(r'c:\Users\ghkdd\gemini-projects\solve-climb\src\features\quiz')
