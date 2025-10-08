class UIHandler {
    constructor(keywordExtractor, apiService) {
        this.keywordExtractor = keywordExtractor;
        this.apiService = apiService;
        this.totalRequests = 0;
        this.initializeEventListeners();
        
        // Set up progress callback
        this.apiService.setProgressCallback(this.updateProgress.bind(this));
    }

    initializeEventListeners() {
        // Button event listeners
        document.getElementById('extractBtn').addEventListener('click', () => this.extractKeywords());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadKeywords());
        document.getElementById('addKeywordBtn').addEventListener('click', () => this.addCustomKeyword());
        document.getElementById('fetchBtn').addEventListener('click', () => this.fetchAllData());
        document.getElementById('fetchCCBtn').addEventListener('click', () => this.fetchCCData());
        
        // Input event listeners
        document.getElementById('newKeywordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomKeyword();
            }
        });

        document.getElementById('abstractInput').addEventListener('paste', () => {
            setTimeout(() => this.extractKeywords(), 100);
        });

        document.getElementById('highlightToggle').addEventListener('click', () => this.toggleHighlights());

        // Filter event listeners
        document.getElementById('relevanceFilter').addEventListener('change', () => this.displayCCResults());
        document.getElementById('sortFilter').addEventListener('change', () => this.displayCCResults());
    }

    extractKeywords() {
        const abstract = document.getElementById('abstractInput').value.trim();
        if (!abstract) {
            alert('Please paste a research abstract first');
            return;
        }

        try {
            const keywords = this.keywordExtractor.extractKeywords(abstract);
            this.displayKeywords();
            document.getElementById('keywordsSection').style.display = 'block';
            document.getElementById('highlightToggle').style.display = 'block';
        } catch (error) {
            alert(error.message);
        }
    }

    displayKeywords() {
        const keywordsGrid = document.getElementById('keywordsGrid');
        keywordsGrid.innerHTML = '';

        const keywordsArray = this.keywordExtractor.getKeywords();
        
        keywordsArray.forEach(keyword => {
            const keywordItem = document.createElement('div');
            keywordItem.className = 'keyword-item';
            keywordItem.innerHTML = `
                <span class="keyword-text">${keyword}</span>
                <button class="keyword-remove" data-keyword="${keyword}">×</button>
            `;
            keywordsGrid.appendChild(keywordItem);
        });

        // Add event listeners to remove buttons
        keywordsGrid.querySelectorAll('.keyword-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const keyword = e.target.getAttribute('data-keyword');
                this.removeKeyword(keyword);
            });
        });

        document.getElementById('keywordCount').textContent = `${this.keywordExtractor.getKeywordCount()} keywords`;
        document.getElementById('totalKeywords').textContent = this.keywordExtractor.getKeywordCount();
        
        // Update highlights if they're currently shown
        if (this.keywordExtractor.highlightsEnabled) {
            this.applyHighlights();
        }
    }

    removeKeyword(keyword) {
        this.keywordExtractor.removeKeyword(keyword);
        this.displayKeywords();
    }

    addCustomKeyword() {
        const input = document.getElementById('newKeywordInput');
        const newKeyword = input.value.trim();
        
        if (this.keywordExtractor.addCustomKeyword(newKeyword)) {
            this.displayKeywords();
            input.value = '';
        } else if (this.keywordExtractor.keywords.has(newKeyword)) {
            alert('Keyword already exists!');
        }
    }

    toggleHighlights() {
        const abstractInput = document.getElementById('abstractInput');
        const abstractDisplay = document.getElementById('abstractDisplay');
        const toggleBtn = document.getElementById('highlightToggle');
        
        if (this.keywordExtractor.toggleHighlights()) {
            // Apply highlights - show display div
            if (this.keywordExtractor.getKeywordCount() === 0) {
                alert('Please extract keywords first');
                this.keywordExtractor.highlightsEnabled = false;
                return;
            }
            this.applyHighlights();
            abstractInput.style.display = 'none';
            abstractDisplay.style.display = 'block';
            toggleBtn.textContent = 'Remove Highlights';
        } else {
            // Remove highlights - show textarea
            abstractInput.style.display = 'block';
            abstractDisplay.style.display = 'none';
            toggleBtn.textContent = 'Show Highlights';
        }
    }

    applyHighlights() {
        const abstractDisplay = document.getElementById('abstractDisplay');
        const highlightedText = this.keywordExtractor.applyHighlights();
        abstractDisplay.innerHTML = highlightedText;
    }

    clearAll() {
        document.getElementById('abstractInput').value = '';
        document.getElementById('abstractDisplay').innerHTML = '';
        document.getElementById('abstractInput').style.display = 'block';
        document.getElementById('abstractDisplay').style.display = 'none';
        
        this.keywordExtractor.clearKeywords();
        this.apiService.clearData();
        
        document.getElementById('keywordsSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('summarySection').style.display = 'none';
        document.getElementById('stats').style.display = 'none';
        document.getElementById('filterControls').style.display = 'none';
        document.getElementById('newKeywordInput').value = '';
        document.getElementById('highlightToggle').style.display = 'none';
        document.getElementById('highlightToggle').textContent = 'Show Highlights';
        
        this.results = [];
        this.ccData = [];
    }

    downloadKeywords() {
        try {
            this.keywordExtractor.downloadKeywordsCSV();
        } catch (error) {
            alert(error.message);
        }
    }

    async fetchCCData() {
        if (this.keywordExtractor.getKeywordCount() === 0) {
            alert('Please extract keywords first');
            return;
        }

        this.showLoading('Fetching and filtering CC data... Please wait');
        document.getElementById('stats').style.display = 'flex';
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('filterControls').style.display = 'block';

        const keywordsArray = this.keywordExtractor.getKeywords();
        this.totalRequests = keywordsArray.length;
        
        // Initialize progress
        this.updateProgress(0, this.totalRequests, 0);
        
        try {
            await this.apiService.fetchCCDataForKeywords(keywordsArray);
            this.displayCCResults();
            this.generateSummary();
        } catch (error) {
            this.hideLoading();
            alert('Failed to fetch CC data: ' + error.message);
            return;
        }

        this.hideLoading();
    }

    async fetchAllData() {
        if (this.keywordExtractor.getKeywordCount() === 0) {
            alert('Please extract keywords first');
            return;
        }

        this.showLoading('Fetching all API data... Please wait');
        document.getElementById('stats').style.display = 'flex';
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('fetchBtn').disabled = true;

        const keywordsArray = this.keywordExtractor.getKeywords();
        this.totalRequests = keywordsArray.length * 4; // 4 API endpoints per keyword
        
        // Initialize progress
        this.updateProgress(0, this.totalRequests, 0);
        
        try {
            await this.apiService.fetchAllDataForKeywords(keywordsArray);
            this.displayResults();
            this.generateSummary();
        } catch (error) {
            alert('Error fetching data: ' + error.message);
        }

        this.hideLoading();
        document.getElementById('fetchBtn').disabled = false;
    }

    displayCCResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        const minRelevance = parseInt(document.getElementById('relevanceFilter').value);
        const sortBy = document.getElementById('sortFilter').value;
        const ccData = this.apiService.getCCData();

        ccData.forEach(item => {
            let filteredData = item.data.data;
            
            // Apply relevance filter
            if (minRelevance > 0) {
                filteredData = filteredData.filter(ccItem => ccItem.relevanceScore >= minRelevance);
            }

            // Apply sorting
            if (sortBy === 'code') {
                filteredData = [...filteredData].sort((a, b) => a.code.localeCompare(b.code));
            } else {
                filteredData = [...filteredData].sort((a, b) => b.relevanceScore - a.relevanceScore);
            }

            if (filteredData.length === 0) return;

            const card = document.createElement('div');
            card.className = 'result-card';
            
            let cardContent = `
                <div class="result-header">
                    <div class="keyword">${item.keyword}</div>
                    <div class="api-type">CC Search</div>
                </div>
                <div class="success">
                    Found ${filteredData.length} relevant CC code(s) for "${item.keyword}"
                </div>
                <div class="cc-codes">
            `;
            
            filteredData.forEach(ccItem => {
                const snippetPreview = ccItem.sn.length > 150 ? 
                    ccItem.sn.substring(0, 150) + '...' : ccItem.sn;
                
                cardContent += `
                    <div class="cc-code-item">
                        <div class="cc-code">
                            ${ccItem.code}: ${ccItem.desc}
                            <span class="relevance-score">Score: ${ccItem.relevanceScore}</span>
                        </div>
                        <div class="cc-desc">Scope Note: ${snippetPreview}</div>
                    </div>
                `;
            });
            
            cardContent += `</div>`;
            card.innerHTML = cardContent;
            resultsGrid.appendChild(card);
        });
    }

    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        const results = this.apiService.getResults();

        results.forEach(keywordResult => {
            const card = document.createElement('div');
            card.className = 'result-card';
            
            let cardContent = `
                <div class="result-header">
                    <div class="keyword">${keywordResult.keyword}</div>
                </div>
            `;

            keywordResult.apis.forEach(apiResult => {
                const isCC = apiResult.name === 'CC Search';
                cardContent += `
                    <div class="api-result">
                        <div class="api-type">${apiResult.name}</div>
                        <div class="result-content">
                `;

                if (apiResult.success) {
                    if (isCC && apiResult.data && apiResult.data.length > 0) {
                        cardContent += `
                            <div class="success">
                                Found ${apiResult.data.length} relevant CC code(s)
                            </div>
                            <div class="cc-codes">
                        `;
                        
                        apiResult.data.forEach(ccItem => {
                            const snippetPreview = ccItem.sn.length > 100 ? 
                                ccItem.sn.substring(0, 100) + '...' : ccItem.sn;
                            
                            cardContent += `
                                <div class="cc-code-item">
                                    <div class="cc-code">
                                        ${ccItem.code}: ${ccItem.desc}
                                        <span class="relevance-score">Score: ${ccItem.relevanceScore}</span>
                                    </div>
                                    <div class="cc-desc">${snippetPreview}</div>
                                </div>
                            `;
                        });
                        
                        cardContent += `</div>`;
                    } else if (isCC) {
                        cardContent += `<div class="error">No relevant CC codes found for this keyword</div>`;
                    } else {
                        cardContent += `<pre>${JSON.stringify(apiResult.data, null, 2)}</pre>`;
                    }
                } else {
                    cardContent += `<div class="error">Error: ${apiResult.error}</div>`;
                }

                cardContent += `
                        </div>
                    </div>
                    <hr style="margin: 10px 0; border: none; border-top: 1px solid #f0f0f0;">
                `;
            });

            card.innerHTML = cardContent;
            resultsGrid.appendChild(card);
        });
    }

    generateSummary() {
        document.getElementById('summarySection').style.display = 'block';
        const summaryContent = document.getElementById('summaryContent');
        
        const keywordsArray = this.keywordExtractor.getKeywords();
        const summary = this.apiService.generateSummary(keywordsArray);
        
        let summaryHTML = `
            <h3>Extracted Keywords</h3>
            <p>Total keywords extracted: <strong>${summary.totalKeywords}</strong></p>
            <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                ${summary.keywords.join(', ')}
            </div>
            
            <h3 style="margin-top: 25px;">Relevant CC Codes</h3>
            <p>Total relevant CC codes found: <strong>${summary.totalCCCodes}</strong></p>
        `;
        
        if (summary.ccCodes.length > 0) {
            summaryHTML += `
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>CC Code</th>
                            <th>Description</th>
                            <th>Max Relevance</th>
                            <th>Matching Keywords</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            summary.ccCodes.forEach(item => {
                // Sort keywords by score
                item.keywords.sort((a, b) => b.score - a.score);
                
                // Create keyword list with scores
                const keywordList = item.keywords.map(k => 
                    `${k.keyword} <span class="relevance-score">${k.score}</span>`
                ).join(', ');
                
                summaryHTML += `
                    <tr>
                        <td><strong>${item.code}</strong></td>
                        <td>${item.desc}</td>
                        <td><span class="relevance-score">${item.maxScore}</span></td>
                        <td>${keywordList}</td>
                    </tr>
                `;
            });
            
            summaryHTML += `
                    </tbody>
                </table>
            `;
        } else {
            summaryHTML += `<p class="no-results">No relevant CC codes found for the extracted keywords.</p>`;
        }
        
        summaryContent.innerHTML = summaryHTML;
    }

    showLoading(message) {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('loadingText').textContent = message;
        document.getElementById('progressBar').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('progressBar').style.display = 'none';
    }

    updateProgress(completed, total, failed = 0) {
        document.getElementById('completedRequests').textContent = completed;
        document.getElementById('failedRequests').textContent = failed;
        document.getElementById('totalKeywords').textContent = total;
        
        const progress = total > 0 ? (completed / total) * 100 : 0;
        document.getElementById('progress').style.width = progress + '%';
        
        // Update loading text with progress
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = `Processing... ${completed}/${total} requests completed (${failed} failed)`;
        }
    }
}