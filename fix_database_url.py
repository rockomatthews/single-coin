#!/usr/bin/env python3

# Read the .env.local file
with open('.env.local', 'r') as f:
    lines = f.readlines()

# Find and fix the DATABASE_URL line
fixed_lines = []
i = 0
while i < len(lines):
    if lines[i].startswith('DATABASE_URL='):
        # Check if the line is incomplete (doesn't end with a complete URL)
        if i + 1 < len(lines) and lines[i + 1].startswith('/'):
            # Join the two lines
            fixed_line = lines[i].rstrip() + lines[i + 1].rstrip() + '\n'
            fixed_lines.append(fixed_line)
            i += 2  # Skip the next line since we've already processed it
        else:
            fixed_lines.append(lines[i])
            i += 1
    else:
        fixed_lines.append(lines[i])
        i += 1

# Write back to file
with open('.env.local', 'w') as f:
    f.writelines(fixed_lines)

print("✅ Fixed DATABASE_URL to be on a single line")

# Verify the fix
with open('.env.local', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            print(f"DATABASE_URL is now: {line.strip()}") 