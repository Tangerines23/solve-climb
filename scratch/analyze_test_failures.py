import json
import os
import sys

if len(sys.argv) < 2:
    print("Usage: python analyze_test_failures.py <report_path>")
    sys.exit(1)

report_path = sys.argv[1]

if not os.path.exists(report_path):
    print(f"Error: {report_path} not found.")
    sys.exit(1)

with open(report_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

test_results = data.get('testResults', [])
failed_files = []

for suite in test_results:
    if suite['status'] == 'failed':
        file_path = suite['name']
        errors = []
        for test in suite['assertionResults']:
            if test['status'] == 'failed':
                errors.append({
                    'title': test['title'],
                    'messages': test['failureMessages']
                })
        failed_files.append({
            'file': file_path,
            'errors': errors
        })

print(f"Total failed files: {len(failed_files)}")
for item in failed_files:
    print(f"\nFAILED FILE: {item['file']}")
    for err in item['errors'][:2]: # Show first 2 errors per file
        print(f"  - Test: {err['title']}")
        # Print first line of first message
        if err['messages']:
            print(f"    Error: {err['messages'][0].splitlines()[0]}")
