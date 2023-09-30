// CommunityCards.js
import React from 'react';
import Card from './Card';

function convertCompactToCardObject(compactCard) {
    const rankMapping = {
        'T': '10',
        'J': 'jack',
        'Q': 'queen',
        'K': 'king',
        'A': 'ace'
    };

    let rank = rankMapping[compactCard.slice(0, -1)] || compactCard.slice(0, -1);
    const suitMap = {
        'c': 'clubs',
        'd': 'diamonds',
        'h': 'hearts',
        's': 'spades'
    };
    const suit = suitMap[compactCard.slice(-1)];
    
    return { rank, suit };
}



function CommunityCards({ cards }) {
    const communityCardsStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
    };

    return (
        <div className="community-cards" style={communityCardsStyle}>
            {cards.map((compactCard, index) => {
                const card = convertCompactToCardObject(compactCard);
                return <Card key={index} suit={card.suit} rank={card.rank} />;
            })}
        </div>
    );
}

export default CommunityCards;
