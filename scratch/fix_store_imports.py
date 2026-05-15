import os
import re

def fix_imports():
    root_dir = r'c:\Users\ghkdd\gemini-projects\solve-climb\src\features\quiz'
    
    replacements = {
        r'@/features/quiz/stores/useUserStore': r'@/stores/useUserStore',
        r'@/features/quiz/stores/useSettingsStore': r'@/stores/useSettingsStore',
        r'@/features/quiz/stores/useToastStore': r'@/stores/useToastStore',
        r'@/features/quiz/stores/useFavoriteStore': r'@/stores/useFavoriteStore',
        r'@/features/quiz/stores/useDebugStore': r'@/stores/useDebugStore',
    }
    
    for subdir, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.join(subdir, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                changed = False
                for old, new in replacements.items():
                    if old in new_content:
                        new_content = new_content.replace(old, new)
                        changed = True
                
                if changed:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Fixed imports in: {file_path}')

if __name__ == '__main__':
    fix_imports()
