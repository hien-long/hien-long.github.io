import json
lines = open('d:/Downloads/NEW/admin.html', encoding='utf-8').read().split('\n')
with open('d:/Downloads/NEW/quotes.txt', 'w', encoding='utf-8') as f:
    for i, l in enumerate(lines):
        if 'quote' in l.lower() or 'member' in l.lower():
            f.write(f"{i}: {l}\n")
