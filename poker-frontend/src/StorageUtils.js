export const hasPlayerJoined = (gameId) => {
    return !!localStorage.getItem(`joined_game_${gameId}`);
}

export const markPlayerJoined = (gameId) => {
    localStorage.setItem(`joined_game_${gameId}`, "true");
}

export const markPlayerLeft = (gameId) => {
    localStorage.removeItem(`joined_game_${gameId}`);
}
