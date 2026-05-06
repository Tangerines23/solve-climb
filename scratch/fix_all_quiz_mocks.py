import os
import re

def fix_all_quiz_mocks(root_dir):
    # Mapping of common broken patterns to absolute aliases
    mappings = {
        # 1. Broken Alises (Pointing to wrong place)
        r"@\/features\/quiz\/hooks\/useNavigationContext": "@/hooks/useNavigationContext",
        r"@\/features\/quiz\/utils\/adService": "@/utils/adService",
        r"@\/features\/quiz\/utils\/supabaseClient": "@/utils/supabaseClient",
        r"@\/features\/quiz\/config\/app": "@/config/app",
        r"@\/features\/quiz\/components\/FooterNav": "@/components/FooterNav",
        r"@\/features\/quiz\/components\/Header": "@/components/Header",
        r"@\/components\/TopicHeader": "@/features/quiz/components/TopicHeader",
        
        # 2. Relative paths (Global targets)
        r"['\"](\.\.\/)+stores\/useUserStore['\"]": "'@/stores/useUserStore'",
        r"['\"](\.\.\/)+stores\/useFavoriteStore['\"]": "'@/stores/useFavoriteStore'",
        r"['\"](\.\.\/)+stores\/useDebugStore['\"]": "'@/stores/useDebugStore'",
        r"['\"](\.\.\/)+stores\/useSettingsStore['\"]": "'@/stores/useSettingsStore'",
        r"['\"](\.\.\/)+stores\/useToastStore['\"]": "'@/stores/useToastStore'",
        r"['\"](\.\.\/)+hooks\/useNavigationContext['\"]": "'@/hooks/useNavigationContext'",
        r"['\"](\.\.\/)+utils\/adService['\"]": "'@/utils/adService'",
        r"['\"](\.\.\/)+utils\/supabaseClient['\"]": "'@/utils/supabaseClient'",
        r"['\"](\.\.\/)+config\/app['\"]": "'@/config/app'",
        r"['\"](\.\.\/)+components\/FooterNav['\"]": "'@/components/FooterNav'",
        r"['\"](\.\.\/)+components\/Header['\"]": "'@/components/Header'",
        r"['\"](\.\.\/)+lib\/eventBus['\"]": "'@/lib/eventBus'",
        r"['\"](\.\.\/)+constants\/ui['\"]": "'@/constants/ui'",
        
        # 3. Relative paths (Feature-local targets)
        r"['\"](\.\.\/)+stores\/useLevelProgressStore['\"]": "'@/features/quiz/stores/useLevelProgressStore'",
        r"['\"](\.\.\/)+components\/ClimbGraphic['\"]": "'@/features/quiz/components/ClimbGraphic'",
        r"['\"](\.\.\/)+components\/TopicHeader['\"]": "'@/features/quiz/components/TopicHeader'",
        r"['\"](\.\.\/)+constants\/tiers['\"]": "'@/features/quiz/constants/tiers'",
        r"['\"](\.\.\/)+tiers['\"]": "'@/features/quiz/constants/tiers'",
        
        # Special case for imports/mocks
        r"from '\.\.\/tiers'": "from '@/features/quiz/constants/tiers'",
        r"vi\.mock\('\.\.\/tiers'": "vi.mock('@/features/quiz/constants/tiers'",
        r"vi\.mock\('\.\.\/utils\/supabaseClient'": "vi.mock('@/utils/supabaseClient'",
    }
    
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
        for pattern, replacement in mappings.items():
            content = re.sub(pattern, replacement, content)
            
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {file_path}")

if __name__ == "__main__":
    fix_all_quiz_mocks(r'c:\Users\ghkdd\gemini-projects\solve-climb\src\features\quiz')
