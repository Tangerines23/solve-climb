import os
import re

QUIZ_ROOT = r'c:\Users\ghkdd\gemini-projects\solve-climb\src\features\quiz'

# Mappings for global aliases to feature-specific aliases
ALIAS_MAP = {
    r"@/contexts/QuizContext": r"@/features/quiz/contexts/QuizContext",
    r"@/stores/useGameStore": r"@/features/quiz/stores/useGameStore",
    r"@/stores/useQuizStore": r"@/features/quiz/stores/useQuizStore",
    r"@/stores/useBaseCampStore": r"@/features/quiz/stores/useBaseCampStore",
    r"@/stores/useLevelProgressStore": r"@/features/quiz/stores/useLevelProgressStore",
    r"@/types/quiz": r"@/features/quiz/types/quiz",
    r"@/hooks/useQuiz": r"@/features/quiz/contexts/QuizContext", # useQuiz is in Context
}

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='utf-16') as f:
            content = f.read()

    original_content = content

    # 1. Apply alias mappings to both imports and vi.mock
    for old, new in ALIAS_MAP.items():
        # Handle both single and double quotes
        content = content.replace(f"'{old}'", f"'{new}'")
        content = content.replace(f'"{old}"', f'"{new}"')

    # 2. Fix specific useGameStore from types/quiz error
    content = re.sub(
        r"import \{(.*?useGameStore.*?)\} from '@/features/quiz/types/quiz'",
        r"import {\1} from '@/features/quiz/stores/useGameStore'",
        content
    )
    
    # 3. Fix relative imports to types/quiz that should be stores/useGameStore
    # These often happen in hooks/core or hooks/bridge
    content = re.sub(
        r"import \{(.*?useGameStore.*?)\} from '\.\./\.\./types/quiz'",
        r"import {\1} from '@/features/quiz/stores/useGameStore'",
        content
    )
    content = re.sub(
        r"import \{(.*?useGameStore.*?)\} from '\.\./\.\./\.\./types/quiz'",
        r"import {\1} from '@/features/quiz/stores/useGameStore'",
        content
    )

    # 4. Fix useQuizStore imports
    content = re.sub(
        r"import \{(.*?useQuizStore.*?)\} from '@/features/quiz/types/quiz'",
        r"import {\1} from '@/features/quiz/stores/useQuizStore'",
        content
    )

    # 5. Fix getTodayChallenge imports
    content = re.sub(
        r"import \{(.*?getTodayChallenge.*?)\} from '@/features/quiz/types/challenge'",
        r"import {\1} from '@/features/quiz/utils/challenge'",
        content
    )

    # 6. Fix vi.mock paths in tests (relative to absolute)
    if filepath.endswith('.test.ts') or filepath.endswith('.test.tsx'):
        folders = ['stores', 'utils', 'hooks', 'constants', 'types', 'contexts', 'components']
        for folder in folders:
            # Match 1, 2, or 3 levels of ../
            content = re.sub(
                f"vi.mock\\(['\"]\\.\\./\\.\\./\\.\\./{folder}/(.*?)\\(['\"]",
                f"vi.mock('@/features/quiz/{folder}/\\1'",
                content
            )
            content = re.sub(
                f"vi.mock\\(['\"]\\.\\./\\.\\./{folder}/(.*?)\\(['\"]",
                f"vi.mock('@/features/quiz/{folder}/\\1'",
                content
            )
            content = re.sub(
                f"vi.mock\\(['\"]\\.\\./{folder}/(.*?)\\(['\"]",
                f"vi.mock('@/features/quiz/{folder}/\\1'",
                content
            )

    if content != original_content:
        print(f"Fixed {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

def main():
    for root, dirs, files in os.walk(QUIZ_ROOT):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                fix_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
