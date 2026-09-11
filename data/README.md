# Data Directory

Place your source documents here following this folder convention:

```
data/
└── <department>/
    └── <subject>/
        └── <year>_<doc_type>_<topic>.<ext>
```

## Departments
- `BTech`
- `MCA`
- `MBA`
- `BBA`
- `HotelMgmt`

## doc_type values
- `past_paper`
- `notes`
- `textbook`
- `syllabus`

## Extensions supported
- `.pdf`
- `.docx`
- `.doc`

## Example

```
data/BTech/DBMS/2023_past_paper_SQL.pdf
data/MCA/Software_Engineering/2022_notes_SDLC.pdf
data/MBA/Financial_Management/2021_textbook_Capital_Budgeting.docx
```

## Running Ingestion

```bash
# Single file with explicit tags
node scripts/ingestContent.js --file ./data/BTech/DBMS/2023_past_paper_SQL.pdf \
  --dept BTech --subject DBMS --topic SQL --year 2023 --doc_type past_paper

# Extracts text, creates 768-dimension embeddings, and stores chunks in
# MongoDB Atlas collection knowledgechunks.
npm run ingest -- --file ./data/BTech/DBMS/notes.txt --dept BTech --subject DBMS --topic Normalization

## Atlas Vector Search Mapping

Use the mapping in `server/src/config/vector-index.json` for the `knowledgechunks` collection and create the index with the name `vector_index`.

# Bulk (all files under /data — uses filename convention for auto-tagging)
node scripts/ingestContent.js --bulk
```
