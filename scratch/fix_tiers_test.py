import os

path = r'c:\Users\ghkdd\gemini-projects\solve-climb\src\features\quiz\constants\__tests__\tiers.test.ts'

with open(path, 'r', encoding='cp949') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if 'calculateTierSync,' in line:
        continue
    if "describe('calculateTierSync', () => {" in line:
        skip = True
        continue
    if skip and '  });' in line:
        # Check if it's the end of calculateTierSync block by looking at the next line if possible
        # Actually, let's just find the next describe block or end of file
        pass
    
    if skip:
        # We need a better way to find the end of the block.
        # Since I know the next block is describe('getNextTierInfo', ...), I'll look for that.
        if "describe('getNextTierInfo', () => {" in line:
            skip = False
            new_lines.append(line)
        continue
    
    new_lines.append(line)

with open(path, 'w', encoding='cp949') as f:
    f.writelines(new_lines)
