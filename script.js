// API URL 설정
// const API_URL = 'http://localhost:5000/api/summoner';  // 로컬 테스트
const API_URL = 'http://172.27.79.80:5000/api/summoner';


async function searchSummoner() {
    const summonerInput = document.getElementById('summonerInput');
    
    if (!summonerInput) {
        console.error('summonerInput 요소를 찾을 수 없습니다.');
        return;
    }
    
    const summonerName = summonerInput.value.trim();
    
    if (!summonerName) {
        showError('소환사명을 입력해주세요.');
        return;
    }

    // UI 요소 확인 및 초기화
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');
    
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    if (resultsDiv) resultsDiv.style.display = 'none';

    try {
        console.log('검색 시작:', summonerName);
        
        const url = `${API_URL}?name=${encodeURIComponent(summonerName)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
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
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

function displayResults(data) {
    // AI Scores
    const aiScoresDiv = document.getElementById('aiScores');
    if (aiScoresDiv) {
        if (data.ai_scores && data.ai_scores.length > 0) {
            aiScoresDiv.innerHTML = data.ai_scores.map((score, index) => 
                `<div class="score-item" title="게임 ${index + 1}">${score}</div>`
            ).join('');
        } else {
            aiScoresDiv.innerHTML = '<p>AI Score 데이터가 없습니다.</p>';
        }
    } else {
        console.error('aiScores 요소를 찾을 수 없습니다.');
    }

    // Season Tiers
    const seasonTiersDiv = document.getElementById('seasonTiers');
    if (seasonTiersDiv) {
        if (data.season_tiers && data.season_tiers.length > 0) {
            seasonTiersDiv.innerHTML = data.season_tiers.map((tier, index) => 
                `<div class="tier-item">
                    <span class="season-number">시즌 ${index + 1}</span>
                    <span class="tier-value">${tier}</span>
                </div>`
            ).join('');
        } else {
            seasonTiersDiv.innerHTML = '<p>시즌 티어 데이터가 없습니다.</p>';
        }
    } else {
        console.error('seasonTiers 요소를 찾을 수 없습니다.');
    }

    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        console.error('error 요소를 찾을 수 없습니다.');
        alert(message);
    }
}

// DOMContentLoaded 이벤트로 안전하게 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM 로드 완료');
    
    // Enter 키로 검색
    const summonerInput = document.getElementById('summonerInput');
    if (summonerInput) {
        summonerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchSummoner();
            }
        });
    }
    
    // 검색 버튼
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchSummoner);
    }
    
    // 서버 상태 확인
    checkServerStatus();
});

async function checkServerStatus() {
    try {
        const healthUrl = API_URL.replace('/api/summoner', '/health');
        const response = await fetch(healthUrl);
        const data = await response.json();
        console.log('✅ 서버 연결 성공:', data);
    } catch (error) {
        console.error('❌ 서버 연결 실패:', error);
        showError('⚠️ 백엔드 서버에 연결할 수 없습니다. 서버가 실행중인지 확인하세요.');
    }
}