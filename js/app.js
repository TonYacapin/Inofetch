// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize services
    const keywordExtractor = new KeywordExtractor();
    const apiService = new ApiService();
    
    // Initialize UI handler
    const uiHandler = new UIHandler(keywordExtractor, apiService);
    
    // Make services globally available for debugging if needed
    window.keywordExtractor = keywordExtractor;
    window.apiService = apiService;
    window.uiHandler = uiHandler;
    
    console.log('Research Abstract Keyword Extractor initialized');
});