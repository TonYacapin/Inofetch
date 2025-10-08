// Common scientific terms to extract
const SCIENTIFIC_TERMS = [
    // Processes
    'anaerobic digestion', 'co-digestion', 'biogas production', 'methanogenesis',
    'hydrolysis', 'acidogenesis', 'acetogenesis', 'sulfide level',
    'microbial communities', 'taxonomic profiling', 'next-generation sequencing',
    '16S rRNA', 'gene amplicons', 'batch-mode digestion', 'continuous co-digestion',
    
    // Compounds
    'long-chain fatty acids', 'LCFA', 'oleate', 'stearate', 'acetate', 'sulfide',
    'waste lipids', 'primary sewage sludge', 'activated sewage sludge', 'PASS',
    
    // Microorganisms
    'Cloacimonetes', 'Cloacimonadaceae', 'Cloacimonadales', 'Syntrophomonas',
    'Smithella', 'Methanobacterium', 'W5', 'W27',
    
    // General scientific terms
    'theoretical biogas potential', 'microbial community dynamics',
    'municipal sludge digesters', 'wastewater treatment plants',
    'LCFA degradation', 'LCFA accumulation', 'hydrogenotrophic',
    'acetoclastic', 'biogas formation'
];

class KeywordExtractor {
    constructor() {
        this.keywords = new Set();
        this.originalAbstract = '';
        this.highlightsEnabled = false;
    }

    extractKeywords(abstract) {
        if (!abstract) {
            throw new Error('Abstract is empty');
        }

        // Store original abstract
        this.originalAbstract = abstract;

        // Clear existing keywords
        this.keywords.clear();

        // Convert abstract to lowercase for case-insensitive matching
        const abstractLower = abstract.toLowerCase();

        // Extract scientific terms
        SCIENTIFIC_TERMS.forEach(term => {
            const termLower = term.toLowerCase();
            if (abstractLower.includes(termLower)) {
                this.keywords.add(term);
            }
        });

        // Extract acronyms (2-5 capital letters)
        const acronymRegex = /\b[A-Z]{2,5}\b/g;
        const acronyms = abstract.match(acronymRegex);
        if (acronyms) {
            acronyms.forEach(acronym => {
                if (acronym.length >= 2) {
                    this.keywords.add(acronym);
                }
            });
        }

        // Extract compound patterns (like C18:1, C18:0)
        const compoundRegex = /C\d+:\d+/g;
        const compounds = abstract.match(compoundRegex);
        if (compounds) {
            compounds.forEach(compound => this.keywords.add(compound));
        }

        // Extract genus/species names (capitalized words, potentially italicized)
        const genusRegex = /(\b[A-Z][a-z]+)\s+([a-z]+)/g;
        let match;
        while ((match = genusRegex.exec(abstract)) !== null) {
            this.keywords.add(match[1]); // Genus
            this.keywords.add(`${match[1]} ${match[2]}`); // Full genus species
        }

        return Array.from(this.keywords).sort();
    }

    addCustomKeyword(keyword) {
        if (keyword && !this.keywords.has(keyword)) {
            this.keywords.add(keyword);
            return true;
        }
        return false;
    }

    removeKeyword(keyword) {
        return this.keywords.delete(keyword);
    }

    clearKeywords() {
        this.keywords.clear();
        this.originalAbstract = '';
        this.highlightsEnabled = false;
    }

    getKeywords() {
        return Array.from(this.keywords).sort();
    }

    getKeywordCount() {
        return this.keywords.size;
    }

    // Highlighting functionality
    toggleHighlights() {
        this.highlightsEnabled = !this.highlightsEnabled;
        return this.highlightsEnabled;
    }

    applyHighlights() {
        if (this.keywords.size === 0) {
            return this.originalAbstract;
        }
        
        // Sort keywords by length (longer first) to prevent partial highlighting
        const sortedKeywords = Array.from(this.keywords).sort((a, b) => b.length - a.length);
        
        // Create a regex pattern to match keywords (case insensitive)
        const pattern = new RegExp(sortedKeywords.map(keyword => 
            keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ).join('|'), 'gi');
        
        // Replace matches with highlighted spans
        return this.originalAbstract.replace(pattern, match => {
            return `<span class="highlighted" title="Extracted keyword: ${match}">${match}</span>`;
        });
    }

    downloadKeywordsCSV() {
        if (this.keywords.size === 0) {
            throw new Error('No keywords to download');
        }

        const csvContent = Array.from(this.keywords).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'extracted_keywords.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}