const CATEGORIES = [
    { id: 'world', label: 'World', subreddit: 'worldnews' },
    { id: 'uk', label: 'UK', subreddit: 'uknews' },
    { id: 'football', label: 'Football', subreddit: 'soccer' },
    { id: 'celebrity', label: 'Celebrity', subreddit: 'entertainment' },
    { id: 'truecrime', label: 'Murder Investigations', subreddit: 'TrueCrimeDiscussion' },
    { id: 'casefile', label: 'Casefile Podcast', subreddit: 'Casefile' }
  ];
  
  const fetchRedditTop = async (subreddit, limit) => {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit * 2}&t=day`;
    const res = await $fetch(url, {
      headers: {
        'User-Agent': 'morning-dashboard/1.0 (https://localhost)'
      }
    });
    return (res?.data?.children || [])
      .map(({ data }) => ({
        id: data.id,
        title: data.title,
        url: data.url && data.url.startsWith('http')
          ? data.url
          : `https://www.reddit.com${data.permalink}`,
        source: `r/${data.subreddit}`,
        score: data.score,
        comments: data.num_comments,
        createdAt: new Date(data.created_utc * 1000).toISOString()
      }))
      .slice(0, limit);
  };
  
  const fetchRedditHot = async (subreddit, limit) => {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    const res = await $fetch(url, {
      headers: {
        'User-Agent': 'morning-dashboard/1.0 (https://localhost)'
      }
    });
    return (res?.data?.children || [])
      .map(({ data }) => ({
        id: data.id,
        title: data.title,
        url: data.url && data.url.startsWith('http')
          ? data.url
          : `https://www.reddit.com${data.permalink}`,
        source: `r/${data.subreddit}`,
        score: data.score,
        comments: data.num_comments,
        createdAt: new Date(data.created_utc * 1000).toISOString()
      }))
      .slice(0, limit);
  };
  
  const fetchCategory = async (category) => {
    try {
      // Special handling for football: 3 general + 2 Premier League
      if (category.id === 'football') {
        const [general, premier] = await Promise.all([
          fetchRedditTop('soccer', 3),
          fetchRedditTop('premierleague', 2)
        ]);
        return {
          id: category.id,
          label: category.label,
          items: [...general, ...premier]
        };
      }
      
      // Special handling for Casefile: use hot posts (more likely to have new episodes)
      if (category.id === 'casefile') {
        const items = await fetchRedditHot(category.subreddit, 3);
        return {
          id: category.id,
          label: category.label,
          items
        };
      }
      
      // Special handling for true crime: combine multiple sources
      if (category.id === 'truecrime') {
        const [trueCrimeDiscussion, unresolvedMysteries] = await Promise.all([
          fetchRedditTop('TrueCrimeDiscussion', 2),
          fetchRedditTop('UnresolvedMysteries', 2)
        ]);
        return {
          id: category.id,
          label: category.label,
          items: [...trueCrimeDiscussion, ...unresolvedMysteries]
        };
      }
      
      const items = await fetchRedditTop(category.subreddit, 3);
      return {
        id: category.id,
        label: category.label,
        items
      };
    } catch (error) {
      console.error(`News API error for ${category.subreddit}:`, error);
      return {
        id: category.id,
        label: category.label,
        items: []
      };
    }
  };
  
  export default async (event) => {
    const sections = await Promise.all(CATEGORIES.map(fetchCategory));
    const hasAnyItems = sections.some(section => section.items.length > 0);
    
    if (!hasAnyItems) {
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch news'
      });
    }
    
    return {
      sections,
      updated: new Date().toISOString()
    };
  };