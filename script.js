// API URL 설정
// const API_URL = 'http://localhost:5000/api/summoner';  // 로컬 테스트
const API_URL = 'http://172.27.79.80:5000/api/summoner';
// const API_URL = 'https://your-app.railway.app/api/summoner';  // 배포시

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
        console.log('API 호출 시작:', summonerName);
        
        const url = `${API_URL}?name=${encodeURIComponent(summonerName)}`;
        console.log('요청 URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'  // CORS 모드 명시
        });

        console.log('응답 상태:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '데이터를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        console.log('받은 데이터:', data);
        
        if (data.success === false) {
            throw new Error(data.error || '데이터 조회 실패');
        }
        
        displayResults(data);
        
    } catch (error) {
        console.error('에러 발생:', error);
        showError(`에러: ${error.message}`);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function displayResults(data) {
    // AI Scores
    const aiScoresDiv = document.getElementById('aiScores');
    if (data.ai_scores && data.ai_scores.length > 0) {
        aiScoresDiv.innerHTML = data.ai_scores.map((score, index) => 
            `<div class="score-item" title="게임 ${index + 1}">${score}</div>`
        ).join('');
    } else {
        aiScoresDiv.innerHTML = '<p>AI Score 데이터가 없습니다.</p>';
    }

    // Season Tiers
    const seasonTiersDiv = document.getElementById('seasonTiers');
    if (data.season_tiers && data.season_tiers.length > 0) {
        seasonTiersDiv.innerHTML = data.season_tiers.map((tier, index) => 
            `<div class="tier-item"><strong>시즌 ${index + 1}:</strong> ${tier}</div>`
        ).join('');
    } else {
        seasonTiersDiv.innerHTML = '<p>시즌 티어 데이터가 없습니다.</p>';
    }

    // Top Rates
    const topRatesDiv = document.getElementById('topRates');
    if (data.top_rates && data.top_rates.length > 0) {
        topRatesDiv.innerHTML = data.top_rates.map((rate, index) => 
            `<div class="rate-item"><strong>시즌 ${index + 1}:</strong> ${rate}</div>`
        ).join('');
    } else {
        topRatesDiv.innerHTML = '<p>탑 레이트 데이터가 없습니다.</p>';
    }

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

// 페이지 로드시 API 서버 상태 확인
window.addEventListener('load', async () => {
    try {
        const healthUrl = API_URL.replace('/api/summoner', '/health');
        const response = await fetch(healthUrl);
        const data = await response.json();
        console.log('서버 상태:', data);
    } catch (error) {
        console.error('서버 연결 실패:', error);
        showError('⚠️ 백엔드 서버에 연결할 수 없습니다. 서버가 실행중인지 확인하세요.');
    }
});