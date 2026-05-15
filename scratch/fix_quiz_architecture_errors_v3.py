import os
import re

QUIZ_ROOT = r'c:\Users\ghkdd\gemini-projects\solve-climb\src\features\quiz'

CONSTANTS_TO_MOVE = [
    'MAX_POSSIBLE_ANSWER',
    'CATEGORY_IDS',
    'MATH_SUB_IDS',
    'SUB_CATEGORY_IDS',
    'ANIMATION_CONFIG',
    'GAME_CONFIG',
    'CATEGORY_CONFIG',
    'LANDMARK_MAPPING',
    'SURVIVAL_CONFIG',
    'THEME_MULTIPLIERS',
    'BOSS_LEVEL',
    'BOSS_BONUS',
    'UI_MESSAGES'
]

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='utf-16') as f:
            content = f.read()

    original_content = content

    # 1. Fix constants imported from types/quiz -> constants/game
    for const_name in CONSTANTS_TO_MOVE:
        # Pattern: import { ..., CONST, ... } from '@/features/quiz/types/quiz'
        # This is a bit complex with regex if multiple imports exist.
        # Let's try a simpler approach: if a file has an import from types/quiz AND contains the constant
        
        type_import_match = re.search(r"import \{(.*?)\} from '@[/\\]features[/\\]quiz[/\\]types[/\\]quiz'", content)
        if type_import_match:
            imports = [i.strip() for i in type_import_match.group(1).split(',')]
            if const_name in imports:
                # Remove from types import
                new_type_imports = [i for i in imports if i != const_name]
                if new_type_imports:
                    content = content.replace(type_import_match.group(0), f"import {{ {', '.join(new_type_imports)} }} from '@/features/quiz/types/quiz'")
                else:
                    # Remove the whole line if empty
                    content = content.replace(type_import_match.group(0) + '\n', '')
                    content = content.replace(type_import_match.group(0), '')
                
                # Add to constants import
                const_import_match = re.search(r"import \{(.*?)\} from '@[/\\]features[/\\]quiz[/\\]constants[/\\]game'", content)
                if const_import_match:
                    const_imports = [i.strip() for i in const_import_match.group(1).split(',')]
                    if const_name not in const_imports:
                        const_imports.append(const_name)
                        content = content.replace(const_import_match.group(0), f"import {{ {', '.join(const_imports)} }} from '@/features/quiz/constants/game'")
                else:
                    # Add new import line
                    content = f"import {{ {const_name} }} from '@/features/quiz/constants/game';\n" + content

    # 2. Fix the specific case in useQuizValidator.ts if regex above was too fragile
    if 'useQuizValidator.ts' in filepath:
        content = content.replace(
            "import { MAX_POSSIBLE_ANSWER } from '@/features/quiz/types/quiz';",
            "import { MAX_POSSIBLE_ANSWER } from '@/features/quiz/constants/game';"
        )
        content = content.replace(
            "import { CATEGORY_IDS, MATH_SUB_IDS, SUB_CATEGORY_IDS } from '@/features/quiz/types/quiz';",
            "import { CATEGORY_IDS, MATH_SUB_IDS, SUB_CATEGORY_IDS } from '@/features/quiz/constants/game';"
        )

    # 3. Alias and Mock fixes (v2 logic)
    ALIAS_MAP = {
        r"@/contexts/QuizContext": r"@/features/quiz/contexts/QuizContext",
        r"@/stores/useGameStore": r"@/features/quiz/stores/useGameStore",
        r"@/stores/useQuizStore": r"@/features/quiz/stores/useQuizStore",
        r"@/stores/useBaseCampStore": r"@/features/quiz/stores/useBaseCampStore",
        r"@/stores/useLevelProgressStore": r"@/features/quiz/stores/useLevelProgressStore",
        r"@/types/quiz": r"@/features/quiz/types/quiz",
        r"@/hooks/useQuiz": r"@/features/quiz/contexts/QuizContext",
    }
    for old, new in ALIAS_MAP.items():
        content = content.replace(f"'{old}'", f"'{new}'")
        content = content.replace(f'"{old}"', f'"{new}"')

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
