// 백엔드 API URL (나중에 배포한 서버 주소로 변경)
//const API_URL = 'https://your-backend-url.com/api/summoner';
const API_URL= 'http://localhost:5000/api/summoner'
// 로컬 테스트: 'http://localhost:5000/api/summoner'

async function searchSummoner() {
    const summonerName = document.getElementById('summonerInput').value.trim();
    
    if (!summonerName) {
        showError('소환사명을 입력해주세요.');
        return;
    }

    // UI 초기화
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('results').style.display = 'none';

    try {
        const response = await fetch(`${API_URL}?name=${encodeURIComponent(summonerName)}`);
        
        if (!response.ok) {
            throw new Error('데이터를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        showError(error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function displayResults(data) {
    // AI Scores
    const aiScoresDiv = document.getElementById('aiScores');
    aiScoresDiv.innerHTML = data.ai_scores.map((score, index) => 
        `<div class="score-item" title="게임 ${index + 1}">${score}</div>`
    ).join('');

    // Season Tiers
    const seasonTiersDiv = document.getElementById('seasonTiers');
    seasonTiersDiv.innerHTML = data.season_tiers.map((tier, index) => 
        `<div class="tier-item"><strong>시즌 ${index + 1}:</strong> ${tier}</div>`
    ).join('');

    // Top Rates
    const topRatesDiv = document.getElementById('topRates');
    topRatesDiv.innerHTML = data.top_rates.map((rate, index) => 
        `<div class="rate-item"><strong>시즌 ${index + 1}:</strong> ${rate}</div>`
    ).join('');

    document.getElementById('results').style.display = 'block';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Enter 키로 검색
document.getElementById('summonerInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchSummoner();
    }
});
