# Product source files

Each product gets a folder under `data/products/<product-slug>/`.

Add trusted PDFs, TXT files, or Markdown files there, then run:

```bash
python scripts/reindex.py "Manufacturer Product Model"
```

The Streamlit interface can also save uploaded files to the active product workspace and rebuild its index. Paste public manufacturer support/documentation URLs to save a readable local copy for the product index.

