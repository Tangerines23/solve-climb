import os
import re

QUIZ_ROOT = r'c:\Users\ghkdd\gemini-projects\solve-climb\src\features\quiz'

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    original_content = content

    # 1. Fix useGameStore imports
    # Case: import { ... useGameStore ... } from '@/features/quiz/types/quiz'
    content = re.sub(
        r"import \{(.*?useGameStore.*?)\} from '@/features/quiz/types/quiz'",
        r"import {\1} from '@/features/quiz/stores/useGameStore'",
        content
    )
    
    # Case: import { ... useGameStore ... } from '../../types/quiz'
    # This is trickier because relative depth varies. 
    # Let's just convert these to absolute aliases for safety.
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

    # 2. Fix useQuizStore imports
    content = re.sub(
        r"import \{(.*?useQuizStore.*?)\} from '@/features/quiz/types/quiz'",
        r"import {\1} from '@/features/quiz/stores/useQuizStore'",
        content
    )

    # 3. Fix getTodayChallenge imports
    content = re.sub(
        r"import \{(.*?getTodayChallenge.*?)\} from '@/features/quiz/types/challenge'",
        r"import {\1} from '@/features/quiz/utils/challenge'",
        content
    )

    # 4. Fix vi.mock paths in tests
    if filepath.endswith('.test.ts') or filepath.endswith('.test.tsx'):
        # Patterns like vi.mock('../../stores/useGameStore'
        # Let's generalize to replace any relative mock that points to a known internal folder
        
        folders = ['stores', 'utils', 'hooks', 'constants', 'types', 'contexts', 'components']
        for folder in folders:
            # Match 2 or 3 levels of ../
            content = re.sub(
                f"vi.mock\\(['\"]\\.\\./\\.\\./{folder}/(.*?)\\(['\"]",
                f"vi.mock('@/features/quiz/{folder}/\\1'",
                content
            )
            content = re.sub(
                f"vi.mock\\(['\"]\\.\\./\\.\\./\\.\\./{folder}/(.*?)\\(['\"]",
                f"vi.mock('@/features/quiz/{folder}/\\1'",
                content
            )
            # Also handle single level if any (e.g. from components/__tests__ to components)
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
