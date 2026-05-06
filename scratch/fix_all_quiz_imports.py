import os
import re

# Configuration
BASE_DIR = r"c:\Users\ghkdd\gemini-projects\solve-climb"
FEATURE_QUIZ_DIR = os.path.join(BASE_DIR, "src", "features", "quiz")

# Mapping for global aliases
GLOBAL_REPLACEMENTS = [
    (r"@/constants/game", "@/features/quiz/constants/game"),
    (r"@/constants/tiers", "@/features/quiz/constants/tiers"),
    (r"@/constants/stages", "@/features/quiz/constants/stages"),
]

# Function to find where a file moved to within the quiz feature
def find_new_path_within_quiz(target_name):
    for root, dirs, files in os.walk(FEATURE_QUIZ_DIR):
        for f in files:
            name_without_ext = os.path.splitext(f)[0]
            if name_without_ext == target_name:
                # Calculate path relative to src
                rel_path = os.path.relpath(os.path.join(root, name_without_ext), os.path.join(BASE_DIR, "src"))
                return "@/" + rel_path.replace("\\", "/")
    return None

def fix_imports_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    original_content = content
    
    # 1. Apply global replacements (aliases)
    for pattern, replacement in GLOBAL_REPLACEMENTS:
        content = re.sub(pattern, replacement, content)

    # 2. Fix broken relative imports in tests
    # Specifically look for imports that fail in the XML report
    # pattern: import ... from '../Something'
    def relative_replacer(match):
        prefix = match.group(1)
        target = match.group(2)
        suffix = match.group(3)
        
        # If it's a relative import starting with ..
        if target.startswith(".."):
            target_name = target.split("/")[-1]
            # Try to find where this target moved to in features/quiz
            new_alias = find_new_path_within_quiz(target_name)
            if new_alias:
                # Check if it's actually broken. 
                # If the relative path exists, don't change it.
                current_dir = os.path.dirname(file_path)
                potential_path = os.path.normpath(os.path.join(current_dir, target))
                if not (os.path.exists(potential_path + ".tsx") or os.path.exists(potential_path + ".ts") or os.path.exists(potential_path + ".js")):
                    print(f"  Fixing broken relative import in {os.path.basename(file_path)}: {target} -> {new_alias}")
                    return f"{prefix}'{new_alias}'{suffix}"
        
        return match.group(0)

    content = re.sub(r"(import\s+.*?\s+from\s+)['\"](.*?)['\"](\s*;?)", relative_replacer, content)

    # 3. Check for @/components, @/hooks etc that should be @/features/quiz/...
    # But only if the target exists in the quiz feature
    def alias_fixer(match):
        prefix = match.group(1)
        target = match.group(2)
        suffix = match.group(3)
        
        if target.startswith("@/"):
            target_name = target.split("/")[-1]
            # Check if this target name exists in features/quiz but NOT in global src/components etc
            # (Actually, if it exists in features/quiz, we probably want to use that one)
            new_alias = find_new_path_within_quiz(target_name)
            if new_alias and new_alias != target:
                # Verify that the original target is missing or we explicitly want to move it
                # For this refactor, we usually want the one in features/quiz
                print(f"  Updating alias in {os.path.basename(file_path)}: {target} -> {new_alias}")
                return f"{prefix}'{new_alias}'{suffix}"
        
        return match.group(0)

    content = re.sub(r"(import\s+.*?\s+from\s+)['\"](.*?)['\"](\s*;?)", alias_fixer, content)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    print("Starting import fixing...")
    count = 0
    # Process all files in src/features/quiz
    for root, dirs, files in os.walk(FEATURE_QUIZ_DIR):
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
                file_path = os.path.join(root, f)
                if fix_imports_in_file(file_path):
                    count += 1
    
    # Also check src/pages/__tests__/MyPage.test.tsx and other relevant files
    extra_files = [
        os.path.join(BASE_DIR, "src", "pages", "__tests__", "MyPage.test.tsx"),
        os.path.join(BASE_DIR, "src", "hooks", "useHistoryData.ts"),
    ]
    for file_path in extra_files:
        if os.path.exists(file_path):
            if fix_imports_in_file(file_path):
                count += 1

    print(f"Finished. Updated {count} files.")

if __name__ == "__main__":
    main()
