# Research Abstract Keyword Extractor

A lightweight, browser-based tool that extracts keywords from research abstracts and retrieves relevant metadata from CABI’s public APIs.

This project is designed for researchers, analysts, and data engineers who need to identify key scientific terms and map them to standardized classification codes efficiently.

---

## Overview

The Research Abstract Keyword Extractor analyzes research abstracts to identify important terms—such as processes, microorganisms, and compounds—and then queries multiple APIs to return structured data, including CABI CC codes and related thesaurus information.

The tool runs entirely on the client side, requiring no backend setup or authentication.

---

## Features

- **Automatic Keyword Extraction**  
  Detects scientific terms, acronyms, genus/species names, and chemical compounds.

- **API Integration**  
  Retrieves structured data from several endpoints:  
  - Main Table  
  - Non-Thesaurus  
  - LookUp Table  
  - CC Search

- **Dynamic Interface**  
  - Add or remove keywords manually  
  - Track progress and request statistics in real time  
  - Export extracted keywords as CSV

- **Filtering and Sorting**  
  - Filter by minimum relevance score  
  - Sort results by CC code or relevance

- **Client-Side Execution**  
  - Runs locally in the browser  
  - No database or authentication required

---

## Tech Stack

| Technology | Purpose |
|-------------|----------|
| HTML5 / CSS3 | UI layout and styling |
| Vanilla JavaScript (ES6) | Keyword logic and API handling |
| Fetch API | Connects to CABI endpoints |
| CABI Inference APIs | Data source for CC codes and related metadata |

---

## Project Structure

```
research-keyword-extractor/
├── index.html        # Main app (HTML, CSS, and JS in one file)
├── README.md         # Project documentation
└── assets/           # (Optional) static files, icons, or screenshots
```

---

## Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/research-keyword-extractor.git
   ```

2. **Open the application**  
   Launch `index.html` directly in your web browser. No installation or server setup is required.

3. **Paste a research abstract**  
   The tool automatically extracts keywords. You can also add or remove keywords manually.

4. **Fetch data**  
   Use the provided buttons to:
   - Fetch all API data  
   - Fetch only CC data

5. **Export results**  
   Download extracted keywords as a CSV file for documentation or analysis.

---

## Example

**Sample Input:**  
> Anaerobic digestion of municipal sludge using Syntrophomonas and Methanobacterium shows improved biogas production.

**Extracted Keywords:**  
anaerobic digestion, municipal sludge, Syntrophomonas, Methanobacterium, biogas production

**Output:**  
The tool retrieves matching CC codes and related metadata from CABI’s APIs, sorted by relevance.

---

## How It Works

1. **Keyword Extraction**
   - Uses pattern matching and a curated list of scientific terms.
   - Detects chemical compounds, acronyms, and biological names.

2. **Relevance Scoring**
   ```
   +3 → Keyword found in description  
   +2 → Keyword found in snippet  
   +1 → Partial matches for long terms
   ```

3. **Filtering and Sorting**
   - Filters out low-relevance matches
   - Sorts data alphabetically or by relevance score

---

## API Endpoints

| API | Endpoint | Description |
|------|-----------|-------------|
| Main Table | `https://cabi-inference2.innodata.com/cabnpweb/api/get-main-by-term?term=` | Fetches main table data |
| Non-Thesaurus | `https://cabi-inference2.innodata.com/cabnpweb/api/search-non-thesaurus?term=` | Fetches non-thesaurus results |
| LookUp Table | `https://cabi-inference2.innodata.com/cabnpweb/api/get-main-by-term?term=` | Alternate lookup |
| CC Search | `https://cabi-inference2.innodata.com/cabnpweb/api/search-cc?term=` | Fetches classification codes |

---

## Deployment

To deploy using **GitHub Pages**:

1. Push the repository to GitHub.  
2. Go to **Settings → Pages → Build and Deployment**.  
3. Under “Source,” select:  
   - **Deploy from a branch**  
   - **Branch:** `main`  
   - **Folder:** `/ (root)`  
4. Click **Save**.

Your app will be available at:  
```
https://<your-username>.github.io/research-keyword-extractor/
```

---

## License

This project is open source under the **MIT License**.  
You may modify, enhance, and redistribute it with proper attribution.

---

## Author

**Angel Hamelton O. Yacapin**  
Software Engineer | MERN Stack Developer  

[GitHub](https://github.com/TonYacapin)  
[Email](mailto:yacapinton@gmail.com)
