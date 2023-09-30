import React from 'react';

function calculateVPIP(handsVoluntarilyPutMoney, handsPlayed) {
    if (handsPlayed === 0) return 0;
    return (handsVoluntarilyPutMoney / handsPlayed) * 100;
}

function calculatePotOdds(currentPotSize, costOfCall) {
    if (costOfCall === 0) return 0;
    return currentPotSize / costOfCall;
}

function calculateAGG(bets, raises, calls) {
    if (calls === 0) return 0;
    return (bets + raises) / calls;
}

function PlayerStats({ player, potAmount }) {
    const vpip = calculateVPIP(player.handsVoluntarilyPutMoney, player.handsPlayed);
    const potOdds = calculatePotOdds(potAmount, player.currentBet);
    const agg = calculateAGG(player.bets, player.raises, player.calls);

    return (
        <div className="player-stats">
            <span>VPIP: {vpip.toFixed(2)}%</span>
            <span>Pot Odds: {potOdds.toFixed(2)}</span>
            <span>AGG: {agg.toFixed(2)}</span>
        </div>
    );
}

export default PlayerStats;
