const formatDateWithOrdinal = (dateString) => {
  const d = new Date(dateString);
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = d.getDate();

  const getSuffix = (n) => {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return `${weekday} ${day}${getSuffix(day)}`;
};

export default async (event) => {
  const API_KEY = process.env.FOOTBALL_DATA_API_KEY; // Free tier available
  
  try {
    // Get Premier League table
    const table = await $fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: { 'X-Auth-Token': API_KEY }
    
    });

    
    // Get Liverpool's matches
    const matches = await $fetch('https://api.football-data.org/v4/teams/64/matches?limit=50', {
      headers: { 'X-Auth-Token': API_KEY }
    });

    

    
    const now = new Date();
    const lastMatch = matches.matches
      .filter(m => new Date(m.utcDate) < now && m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];
      
    const nextMatch = matches.matches
      .filter(m => new Date(m.utcDate) > now)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0];
    
    return {
      table: table.standings[0].table.map(team => ({
        position: team.position,
        team: team.team.name,
        shortName: team.team.tla, // 3-letter code from API
        played: team.playedGames,
        won: team.won,
        drawn: team.draw,
        lost: team.lost,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        goalDifference: team.goalDifference,
        points: team.points
      })),
      liverpool: {
        lastMatch: lastMatch ? {
          home: lastMatch.homeTeam.tla,
          away: lastMatch.awayTeam.tla,
          score: `${lastMatch.score.fullTime.home} - ${lastMatch.score.fullTime.away}`
        } : null,
        nextMatch: nextMatch ? {
          date: formatDateWithOrdinal(nextMatch.utcDate),
          time: new Date(nextMatch.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          home: nextMatch.homeTeam.tla,
          away: nextMatch.awayTeam.tla,
          competition: nextMatch.competition.name
        } : null
      },
      updated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Football API error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch football data'
    });
  }
}