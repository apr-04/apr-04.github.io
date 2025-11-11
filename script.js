/**
 * DeepLoL AI Score Checker
 * GitHub Pages용 프론트엔드 전용 버전
 */

const BASE_URL = 'https://b2c-api-cdn.deeplol.gg';

/**
 * 메인 검색 함수
 */
async function searchSummoner() {
    const summonerName = document.getElementById('summonerName').value.trim();
    
    if (!summonerName) {
        showError('소환사명을 입력해주세요.');
        return;
    }

    // UI 초기화
    showLoading(true);
    hideError();
    hideResults();
    disableSearch(true);

    try {
        // 이름과 태그 분리
        let name, tag;
        if (summonerName.includes('#')) {
            [name, tag] = summonerName.split('#');
        } else {
            name = summonerName;
            tag = 'KR1';
        }

        name = name.trim();
        tag = tag.trim();

        console.log(`🔍 검색 시작: ${name}#${tag}`);

        // 1. 소환사 정보 가져오기
        const summonerInfo = await getSummonerInfo(name, tag);
        if (!summonerInfo) {
            throw new Error('소환사를 찾을 수 없습니다.');
        }

        const puuId = summonerInfo.puu_id;
        if (!puuId) {
            throw new Error('PUU ID를 찾을 수 없습니다.');
        }

        console.log(`✓ PUU ID: ${puuId}`);

        // 2. 매치 리스트 가져오기
        const matchIdList = await getMatchIdList(puuId);
        if (!matchIdList || matchIdList.length === 0) {
            throw new Error('매치 정보를 찾을 수 없습니다.');
        }

        console.log(`✓ 매치 수: ${matchIdList.length}`);

        // 3. AI Score 수집 (최근 10게임)
        const aiScores = await collectAIScores(matchIdList.slice(0, 10), puuId);

        console.log(`✓ AI Score 수집 완료: ${aiScores.length}개`);

        // 4. 결과 표시
        displayResults(summonerInfo, aiScores);

    } catch (error) {
        console.error('❌ 에러:', error);
        showError(error.message);
    } finally {
        showLoading(false);
        disableSearch(false);
    }
}

/**
 * 소환사 정보 가져오기
 */
async function getSummonerInfo(name, tag) {
    const encodedName = encodeURIComponent(name);
    const encodedTag = encodeURIComponent(tag);
    
    const url = `${BASE_URL}/summoner/summoner?riot_id_name=${encodedName}&riot_id_tag_line=${encodedTag}&platform_id=KR`;
    
    console.log('  [API] 소환사 정보 요청');

    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`소환사 조회 실패 (${response.status})`);
    }

    const data = await response.json();
    return data.summoner_basic_info_dict;
}

/**
 * 매치 ID 리스트 가져오기
 */
async function getMatchIdList(puuId) {
    const url = `${BASE_URL}/match/matches?puu_id=${puuId}&platform_id=KR&offset=0&count=20&queue_type=ALL&champion_id=0&only_list=1&last_updated_at=0`;
    
    console.log('  [API] 매치 리스트 요청');

    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`매치 리스트 조회 실패 (${response.status})`);
    }

    const data = await response.json();
    return data.match_id_list;
}

/**
 * AI Score 수집
 */
async function collectAIScores(matchIdList, puuId) {
    const aiScores = [];
    const total = Math.min(matchIdList.length, 10);

    console.log(`  [처리] 최근 10게임 AI Score 수집 시작`);

    for (let i = 0; i < total; i++) {
        const matchId = matchIdList[i].match_id;
        
        console.log(`    [${i + 1}/${total}] ${matchId}`);

        try {
            const matchDetail = await getMatchDetail(matchId);
            
            if (!matchDetail) {
                console.warn(`      ✗ 상세 정보 없음`);
                continue;
            }

            const participantsList = matchDetail.participants_list || [];

            for (const participant of participantsList) {
                if (participant.puu_id === puuId) {
                    const laneStats = participant.lane_stat_dict || {};
                    
                    aiScores.push({
                        matchId: matchId,
                        aiScore: laneStats.ai_score || 'N/A',
                        champion: getChampionName(participant.champion_id, matchDetail),
                        championId: participant.champion_id,
                        win: participant.win || false,
                        kills: participant.kills || 0,
                        deaths: participant.deaths || 0,
                        assists: participant.assists || 0,
                        position: participant.position || 'N/A',
                        tier: `${participant.tier || ''} ${participant.division || ''}`.trim()
                    });

                    console.log(`      ✓ AI Score: ${laneStats.ai_score}`);
                    break;
                }
            }

            // API 호출 간격 (과도한 요청 방지)
            await sleep(200);

        } catch (error) {
            console.error(`      ✗ 오류:`, error.message);
        }
    }

    return aiScores;
}

/**
 * 매치 상세 정보 가져오기
 */
async function getMatchDetail(matchId) {
    const url = `${BASE_URL}/match/match-cached?match_id=${matchId}&platform_id=KR`;

    const response = await fetch(url);
    
    if (!response.ok) {
        return null;
    }

    return await response.json();
}

/**
 * 챔피언 이름 가져오기
 */
function getChampionName(championId, matchDetail) {
    const participants = matchDetail.participants_list || [];
    
    for (const participant of participants) {
        if (participant.champion_id === championId && participant.champion_name) {
            return participant.champion_name;
        }
    }

    return `Champion_${championId}`;
}

/**
 * 결과 표시
 */
function displayResults(summonerInfo, aiScores) {
    // 소환사 이름
    document.getElementById('summonerNameDisplay').textContent = 
        `${summonerInfo.riot_id_name}#${summonerInfo.riot_id_tag_line}`;
    
    // 레벨
    document.getElementById('summonerLevel').textContent = 
        `Lv. ${summonerInfo.level}`;

    // 티어 정보
    displayTierInfo(summonerInfo);

    // 평균 AI Score
    displayAverageScore(aiScores);

    // 게임 리스트
    displayGamesList(aiScores);

    showResults();
}

/**
 * 티어 정보 표시
 */
function displayTierInfo(summonerInfo) {
    const tierContainer = document.getElementById('tierContainer');
    tierContainer.innerHTML = '';
    
    const previousSeasons = summonerInfo.previous_season_tier_list || [];
    const sortedSeasons = previousSeasons.sort((a, b) => b.season - a.season);
    
    sortedSeasons.slice(0, 3).forEach(season => {
        const tierBadge = document.createElement('div');
        tierBadge.className = 'tier-badge';
        
        const division = season.division ? ` ${season.division}` : '';
        const lp = season.lp >= 0 ? ` ${season.lp}LP` : '';
        
        tierBadge.textContent = `시즌 ${season.season}: ${season.tier}${division}${lp}`;
        tierContainer.appendChild(tierBadge);
    });
}

/**
 * 평균 AI Score 표시
 */
function displayAverageScore(aiScores) {
    const validScores = aiScores
        .map(s => s.aiScore)
        .filter(score => typeof score === 'number');
    
    const average = validScores.length > 0 
        ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)
        : 0;
    
    document.getElementById('averageScore').textContent = average;
}

/**
 * 게임 리스트 표시
 */
function displayGamesList(aiScores) {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = '';

    aiScores.forEach((game, index) => {
        const gameCard = document.createElement('div');
        gameCard.className = `game-card ${game.win ? 'win' : 'lose'}`;

        const kda = game.deaths > 0 
            ? ((game.kills + game.assists) / game.deaths).toFixed(2)
            : 'Perfect';

        gameCard.innerHTML = `
            <div class="game-header">
                <div class="game-info">
                    <div class="game-result ${game.win ? 'win' : 'lose'}">
                        ${game.win ? '승리' : '패배'}
                    </div>
                    <div class="champion-name">${game.champion}</div>
                    <div class="position-badge">${game.position}</div>
                </div>
                <div class="ai-score-badge">${game.aiScore}</div>
            </div>
            <div class="game-stats">
                <div class="stat-item">
                    <div class="stat-label">KDA</div>
                    <div class="stat-value kda">${game.kills}/${game.deaths}/${game.assists}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">KDA 비율</div>
                    <div class="stat-value">${kda}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">티어</div>
                    <div class="stat-value">${game.tier || 'N/A'}</div>
                </div>
            </div>
        `;

        gamesList.appendChild(gameCard);
    });
}

// ========================================
// UI 헬퍼 함수들
// ========================================

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('active');
}

function hideError() {
    document.getElementById('error').classList.remove('active');
}

function showResults() {
    document.getElementById('results').classList.add('active');
}

function hideResults() {
    document.getElementById('results').classList.remove('active');
}

function disableSearch(disabled) {
    document.getElementById('searchBtn').disabled = disabled;
    document.getElementById('summonerName').disabled = disabled;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 초기화
// ========================================

console.log('goroshi 준비 완료');