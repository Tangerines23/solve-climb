import json
import sys

def get_error_for_file(json_path, target_file):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for test_result in data.get('testResults', []):
        if target_file in test_result.get('name', ''):
            sys.stdout.buffer.write(f"--- ERRORS FOR {test_result['name']} ---\n".encode('utf-8'))
            for assertion in test_result.get('assertionResults', []):
                if assertion.get('status') == 'failed':
                    sys.stdout.buffer.write(f"Test: {assertion['title']}\n".encode('utf-8'))
                    msg = assertion.get('failureMessages', ['No message'])[0]
                    sys.stdout.buffer.write(f"Message: {msg}\n".encode('utf-8'))
                    sys.stdout.buffer.write(("-" * 20 + "\n").encode('utf-8'))

if __name__ == "__main__":
    if len(sys.argv) > 2:
        get_error_for_file(sys.argv[1], sys.argv[2])
