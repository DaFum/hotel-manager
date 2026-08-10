import re

with open("src/i18n/resources/en.ts", "r") as f:
    en_content = f.read()
en_content = re.sub(r'    save: "Save",\n    load: "Load",\n    save: "Save",\n    load: "Load",', '    save: "Save",\n    load: "Load",', en_content)
with open("src/i18n/resources/en.ts", "w") as f:
    f.write(en_content)

with open("src/i18n/resources/de.ts", "r") as f:
    de_content = f.read()
de_content = re.sub(r'    save: "Speichern",\n    load: "Laden",\n    save: "Speichern",\n    load: "Laden",', '    save: "Speichern",\n    load: "Laden",', de_content)
with open("src/i18n/resources/de.ts", "w") as f:
    f.write(de_content)
