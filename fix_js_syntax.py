with open("d:/Downloads/NEW/members.js", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("text.split(/?\n/)", "text.split(/\\r?\\n/)")
text = text.replace("text.split(/?\r\n/)", "text.split(/\\r?\\n/)")

with open("d:/Downloads/NEW/members.js", "w", encoding="utf-8") as f:
    f.write(text)
