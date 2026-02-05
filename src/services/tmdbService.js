import fetch from 'node-fetch';

class TMDBService {
  constructor() {
    this.baseUrl = 'https://db.videasy.net/3';
  }

  async fetchMovieMetadata(tmdbId) {
    try {
      const url = `${this.baseUrl}/movie/${tmdbId}?append_to_response=credits,external_ids,videos,recommendations,translations,similar&language=en&include_video_language=en,null`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`TMDB API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching TMDB data:', error);
      throw error;
    }
  }

  extractMetadata(apiResponse) {
    return {
      tmdb_id: apiResponse.id,
      adult: apiResponse.adult,
      backdrop_path: apiResponse.backdrop_path,
      budget: apiResponse.budget,
      genres: apiResponse.genres,
      homepage: apiResponse.homepage,
      imdb_id: apiResponse.imdb_id,
      origin_country: apiResponse.origin_country,
      original_language: apiResponse.original_language,
      original_title: apiResponse.original_title,
      overview: apiResponse.overview,
      popularity: apiResponse.popularity,
      poster_path: apiResponse.poster_path,
      release_date: apiResponse.release_date,
      revenue: apiResponse.revenue,
      runtime: apiResponse.runtime,
      tagline: apiResponse.tagline,
      vote_average: apiResponse.vote_average,
      vote_count: apiResponse.vote_count
    };
  }
}

export default new TMDBService();
