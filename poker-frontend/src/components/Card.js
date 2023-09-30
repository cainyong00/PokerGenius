import React from 'react';

function filenameFromCard(rank, suit) {
    if (rank === 'T') rank = '10';

    let filename = rank.toLowerCase();
    
    if (['jack', 'queen', 'king'].includes(filename)) {
        return `${filename}_of_${suit.toLowerCase()}2.png`;
    }

    return `${filename}_of_${suit.toLowerCase()}.png`;
}




function Card({ suit, rank }) {
    const cardStyle = {
        width: '75px',  // Previously 50px
        height: '120px', // Previously 80px
        margin: '7.5px',  // Adjust the margin for spacing
        display: 'inline-block',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
    };
    

    const imagePath = `/cards/${filenameFromCard(rank, suit)}`;
    cardStyle.backgroundImage = `url(${imagePath})`;

    return <div className="card" style={cardStyle}></div>;
}

export default Card;
