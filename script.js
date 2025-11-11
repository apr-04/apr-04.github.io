// API URL 설정
// const API_URL = 'http://localhost:5000/api/summoner';  // 로컬 테스트
const API_URL = 'http://172.27.79.80:5000/api/summoner';

// API 연결 테스트
async function testConnection() {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
            console.log('✅ 백엔드 연결 성공');
            return true;
        }
    } catch (error) {
        console.error('❌ 백엔드 연결 실패:', error);
        return false;
    }
}

// 페이지 로드 시 연결 테스트
window.addEventListener('load', async () => {
    const connected = await testConnection();
    if (!connected) {
        showError('백엔드 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.');
    }
});

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchSummoner();
    }
}

async function searchSummoner() {
    const summonerName = document.getElementById('summonerInput').value.trim();
    
    if (!summonerName) {
        showError('소환사명을 입력해주세요.');
        return;
    }

    // UI 초기화
    hideError();
    hideResults();
    showLoading();

    try {
        console.log('검색 시작:', summonerName);
        
        const response = await fetch(`${API_URL}/api/summoner/${encodeURIComponent(summonerName)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('응답 상태:', response.status);
        console.log('응답 헤더:', response.headers.get('content-type'));

        // Content-Type 확인
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('JSON이 아닌 응답:', text.substring(0, 200));
            throw new Error('서버가 올바른 응답을 반환하지 않았습니다. 백엔드를 확인해주세요.');
        }

        const data = await response.json();
        console.log('응답 데이터:', data);

        hideLoading();

        if (!response.ok || !data.success) {
            throw new Error(data.error || '데이터를 가져오는데 실패했습니다.');
        }

        displayResults(data);

    } catch (error) {
        console.error('검색 오류:', error);
        hideLoading();
        showError(`오류: ${error.message}`);
    }
}

function displayResults(data) {
    // 소환사명 표시
    document.getElementById('summonerName').textContent = `${data.summoner}님의 통계`;

    // AI Scores 표시
    const aiScoresContainer = document.getElementById('aiScores');
    aiScoresContainer.innerHTML = '';
    
    if (data.ai_scores && data.ai_scores.length > 0) {
        data.ai_scores.forEach((score, index) => {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'score-item';
            scoreDiv.textContent = score;
            scoreDiv.title = `게임 ${index + 1}`;
            aiScoresContainer.appendChild(scoreDiv);
        });
    } else {
        aiScoresContainer.innerHTML = '<p style="color: #999;">AI Score 데이터가 없습니다.</p>';
    }

    // 티어 & 레이트 표시
    const tierRateContainer = document.getElementById('tierRate');
    tierRateContainer.innerHTML = '';
    
    if (data.tier_rate && data.tier_rate.length > 0) {
        data.tier_rate.forEach((tier, index) => {
            const tierDiv = document.createElement('div');
            tierDiv.className = 'tier-item';
            tierDiv.textContent = tier;
            tierRateContainer.appendChild(tierDiv);
        });
    } else {
        tierRateContainer.innerHTML = '<p style="color: #999;">티어 정보가 없습니다.</p>';
    }

    // DeepLOL 링크
    document.getElementById('deeplolLink').href = data.url;

    // 결과 표시
    showResults();
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.classList.add('hidden');
    setTimeout(() => {
        errorDiv.classList.remove('hidden');
    }, 10);
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function showResults() {
    document.getElementById('results').classList.remove('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}