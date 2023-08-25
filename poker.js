document.addEventListener("DOMContentLoaded", function() {

    function createGame() {
        fetch('http://localhost:5000/game/create', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            document.getElementById('gameId').value = data._id;
        })
        .catch(error => {
            console.error('Error creating game:', error);
        });
    }

    function joinGame() {
        const gameId = document.getElementById('gameId').value;
        const playerName = prompt('Enter your name:');

        fetch(`http://localhost:5000/game/${gameId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: playerName })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            fetchGameState(); // Fetch the game state after joining
        })
        .catch(error => {
            console.error('Error joining game:', error);
        });
    }

    function startGame() {
        const gameId = document.getElementById('gameId').value;

        fetch(`http://localhost:5000/game/${gameId}/start`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            fetchGameState(); // Fetch the game state after starting
        })
        .catch(error => {
            console.error('Error starting game:', error);
        });
    }

    function playerAction(action, playerId) {
        const gameId = document.getElementById('gameId').value;
        let amount = 0;
        if (action === 'bet' || action === 'raise') {
            amount = document.getElementById(`betAmount_${playerId}`).value;
        }

        fetch(`http://localhost:5000/game/${gameId}/player/${playerId}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, amount }) 
        })
        .then(response => response.json())
        .then(data => {
            fetchGameState(); // Fetch updated game state after every action
        })
        .catch(error => {
            console.error('Error processing player action:', error);
        });
    }

    function fetchGameState() {
        const gameId = document.getElementById('gameId').value;
        fetch(`http://localhost:5000/game/${gameId}`)
        .then(response => response.json())
        .then(data => {
            updateGameDisplay(data);
        })
        .catch(error => {
            console.error('Error fetching game state:', error);
        });
    }

    function updateGameDisplay(data) {
        // Update general game info
        document.getElementById('gameState').innerText = data.state;
        document.getElementById('communityCards').innerText = data.communityCards.join(", ");
        document.getElementById('potSize').innerText = data.potSize;

        // Update players' list
        let playersHTML = '';
        data.players.forEach(player => {
            if (!player || !player.name || !player.chips) {
                console.error('Received invalid player data:', player);
                return; // Skip to the next iteration
            }
    
            let handDisplay = player.hand && player.hand.length ? player.hand.join(', ') : 'No hand yet';
    
            playersHTML += `
            <div class="player" data-id="${player._id}">
                <span>${player.name} (Chips: ${player.chips}, Hand: ${handDisplay})</span>
                <button onclick="playerAction('fold', '${player._id}')">Fold</button>
                <button onclick="playerAction('check', '${player._id}')">Check</button>
                <button onclick="playerAction('call', '${player._id}')">Call</button>
                <input type="number" id="betAmount_${player._id}" placeholder="Amount">
                <button onclick="playerAction('bet', '${player._id}')">Bet</button>
                <button onclick="playerAction('raise', '${player._id}')">Raise</button>
            </div>`;
        });
        document.getElementById('playersList').innerHTML = playersHTML;
    }

    // This is to ensure the above functions are available globally for the HTML buttons to use
    window.createGame = createGame;
    window.joinGame = joinGame;
    window.startGame = startGame;
    window.playerAction = playerAction;
    window.fetchGameState = fetchGameState;

});
