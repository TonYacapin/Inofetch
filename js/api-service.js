// API endpoints
const API_ENDPOINTS = [
    { name: 'Main Table', url: 'https://cabi-inference2.innodata.com/cabnpweb/api/get-main-by-term?term=' },
    { name: 'Non-Thesaurus', url: 'https://cabi-inference2.innodata.com/cabnpweb/api/search-non-thesaurus?term=' },
    { name: 'LookUp Table', url: 'https://cabi-inference2.innodata.com/cabnpweb/api/get-main-by-term?term=' },
    { name: 'CC Search', url: 'https://cabi-inference2.innodata.com/cabnpweb/api/search-cc?term=' }
];

class ApiService {
    constructor() {
        this.allCCData = [];
        this.results = [];
        this.ccData = [];
        this.onProgressUpdate = null; // Callback for progress updates
    }

    // Set progress update callback
    setProgressCallback(callback) {
        this.onProgressUpdate = callback;
    }

    async fetchApiData(keyword, api) {
        try {
            const response = await fetch(api.url + encodeURIComponent(keyword));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Calculate relevance score for CC code based on keyword
    calculateRelevanceScore(ccItem, keyword) {
        let score = 0;
        const keywordLower = keyword.toLowerCase();
        const descLower = ccItem.desc.toLowerCase();
        const snLower = ccItem.sn.toLowerCase();

        // Check if keyword appears in description
        if (descLower.includes(keywordLower)) {
            score += 3;
        }

        // Check if keyword appears in snippet
        if (snLower.includes(keywordLower)) {
            score += 2;
        }

        // Check for partial matches
        const keywordWords = keywordLower.split(/\s+/);
        keywordWords.forEach(word => {
            if (word.length > 3) {
                if (descLower.includes(word)) score += 1;
                if (snLower.includes(word)) score += 1;
            }
        });

        return score;
    }

    // Filter CC data for a specific keyword
    filterCCDataForKeyword(ccData, keyword) {
        return ccData.map(item => {
            const relevanceScore = this.calculateRelevanceScore(item, keyword);
            return {
                ...item,
                relevanceScore: relevanceScore
            };
        }).filter(item => item.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    async fetchAllCCData() {
        if (this.allCCData.length === 0) {
            const ccResponse = await this.fetchApiData('', API_ENDPOINTS[3]);
            if (ccResponse.success) {
                this.allCCData = ccResponse.data;
            } else {
                throw new Error('Failed to fetch CC data: ' + ccResponse.error);
            }
        }
        return this.allCCData;
    }

    async fetchCCDataForKeywords(keywordsArray) {
        await this.fetchAllCCData();
        
        this.ccData = [];
        let completedRequests = 0;
        const totalRequests = keywordsArray.length;
        
        for (let i = 0; i < keywordsArray.length; i++) {
            const keyword = keywordsArray[i];
            const relevantCCData = this.filterCCDataForKeyword(this.allCCData, keyword);
            
            this.ccData.push({
                keyword: keyword,
                data: {
                    success: true,
                    data: relevantCCData
                }
            });

            completedRequests++;
            
            // Update progress
            if (this.onProgressUpdate) {
                this.onProgressUpdate(completedRequests, totalRequests, 0);
            }
            
            // Allow UI to update by yielding to the event loop
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        return this.ccData;
    }

    async fetchAllDataForKeywords(keywordsArray) {
        this.results = [];
        this.ccData = [];
        
        await this.fetchAllCCData();
        
        const totalRequests = keywordsArray.length * API_ENDPOINTS.length;
        let completedRequests = 0;
        let failedRequests = 0;

        for (let i = 0; i < keywordsArray.length; i++) {
            const keyword = keywordsArray[i];
            const keywordResults = {
                keyword: keyword,
                apis: []
            };

            for (let j = 0; j < API_ENDPOINTS.length; j++) {
                const api = API_ENDPOINTS[j];
                let result;
                
                if (api.name === 'CC Search') {
                    // For CC search, use filtered approach
                    const relevantCCData = this.filterCCDataForKeyword(this.allCCData, keyword);
                    result = {
                        success: true,
                        data: relevantCCData
                    };
                    
                    // Store in ccData for summary generation
                    this.ccData.push({
                        keyword: keyword,
                        data: result
                    });
                } else {
                    result = await this.fetchApiData(keyword, api);
                    if (!result.success) {
                        failedRequests++;
                    }
                }
                
                keywordResults.apis.push({
                    name: api.name,
                    ...result
                });

                completedRequests++;
                
                // Update progress
                if (this.onProgressUpdate) {
                    this.onProgressUpdate(completedRequests, totalRequests, failedRequests);
                }
                
                // Allow UI to update by yielding to the event loop
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            this.results.push(keywordResults);
        }

        return {
            results: this.results,
            ccData: this.ccData
        };
    }

    getResults() {
        return this.results;
    }

    getCCData() {
        return this.ccData;
    }

    clearData() {
        this.results = [];
        this.ccData = [];
        this.allCCData = [];
    }

    generateSummary(keywordsArray) {
        const allCCItems = [];
        
        // Use ccData array which should be populated by either fetchCCData() or fetchAllData()
        this.ccData.forEach(item => {
            if (item.data && item.data.success && item.data.data) {
                item.data.data.forEach(ccItem => {
                    // Check if this CC code is already in our list
                    const existingIndex = allCCItems.findIndex(existing => existing.code === ccItem.code);
                    if (existingIndex === -1) {
                        // Add new CC code
                        allCCItems.push({
                            code: ccItem.code,
                            desc: ccItem.desc,
                            keywords: [{
                                keyword: item.keyword,
                                score: ccItem.relevanceScore
                            }],
                            maxScore: ccItem.relevanceScore
                        });
                    } else {
                        // Update existing CC code
                        allCCItems[existingIndex].keywords.push({
                            keyword: item.keyword,
                            score: ccItem.relevanceScore
                        });
                        // Update max score if needed
                        if (ccItem.relevanceScore > allCCItems[existingIndex].maxScore) {
                            allCCItems[existingIndex].maxScore = ccItem.relevanceScore;
                        }
                    }
                });
            }
        });
        
        // Sort CC codes by max relevance score
        allCCItems.sort((a, b) => b.maxScore - a.maxScore);
        
        return {
            keywords: keywordsArray,
            totalKeywords: keywordsArray.length,
            ccCodes: allCCItems,
            totalCCCodes: allCCItems.length
        };
    }
}