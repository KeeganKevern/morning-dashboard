export default async (event) => {
  const API_KEY = process.env.FOOTBALL_DATA_API_KEY; // Free tier available
  
  try {
    // Get Premier League table
    const table = await $fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: { 'X-Auth-Token': API_KEY }
    
    });
    console.log("here")
    
    // Get Liverpool's matches
    const matches = await $fetch('https://api.football-data.org/v4/teams/64/matches?limit=10', {
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
          date: new Date(lastMatch.utcDate).toLocaleDateString('en-GB'),
          home: lastMatch.homeTeam.name,
          away: lastMatch.awayTeam.name,
          score: `${lastMatch.score.fullTime.home} - ${lastMatch.score.fullTime.away}`
        } : null,
        nextMatch: nextMatch ? {
          date: new Date(nextMatch.utcDate).toLocaleDateString('en-GB'),
          time: new Date(nextMatch.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          home: nextMatch.homeTeam.name,
          away: nextMatch.awayTeam.name,
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