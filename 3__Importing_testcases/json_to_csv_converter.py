#!/usr/bin/env python3
"""
Simple JSON to CSV Converter for Zephyr Scale Test Cases
"""

import json
import csv
import argparse
from pathlib import Path


def load_test_cases(input_path: str):
    with open(input_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Accept either an array of test cases, or an object with key 'test_cases'
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and 'test_cases' in data:
        return data['test_cases']
    raise ValueError("Unsupported JSON structure. Provide an array of test case objects or an object with key 'test_cases'.")


def convert_json_to_csv(input_path: str, output_path: str):
    """Convert test cases from JSON to CSV format."""

    test_cases = load_test_cases(input_path)

    # Prepare CSV rows
    csv_rows = []

    for test_case in test_cases:
        steps = test_case.get('Steps', [])
        expected = test_case.get('Expected', [])

        # Create rows for each step
        for i, (step, result) in enumerate(zip(steps, expected)):
            if i == 0:  # First row - include all test case info
                row = {
                    'Name': test_case.get('Name', ''),
                    'Status': test_case.get('Status', ''),
                    'Step': step,
                    'Expected Result': result,
                    'Priority': test_case.get('Priority', ''),
                    'Labels': ','.join(test_case.get('Labels', [])),
                    'Objective': test_case.get('Objective', ''),
                    'Precondition': test_case.get('Precondition', '')
                }
            else:  # Subsequent rows - only step and expected result
                row = {
                    'Name': '',
                    'Status': '',
                    'Step': step,
                    'Expected Result': result,
                    'Priority': '',
                    'Labels': '',
                    'Objective': '',
                    'Precondition': ''
                }
            csv_rows.append(row)

    # Ensure output directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # Write CSV file
    headers = ['Name', 'Status', 'Step', 'Expected Result', 'Priority', 'Labels', 'Objective', 'Precondition']

    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"✅ Converted {len(test_cases)} test cases to {output_path}")
    print(f"📊 Total rows: {len(csv_rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert JSON test cases to CSV")
    parser.add_argument('--input', default='2__Testcase_generation/Test_Cases.json', help='Path to input JSON file')
    parser.add_argument('--output', default='3__Importing_testcases/test_cases_simple.csv', help='Path to output CSV file')
    args = parser.parse_args()

    convert_json_to_csv(args.input, args.output)