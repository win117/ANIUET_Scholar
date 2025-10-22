import { projectId } from './info';

// Get community ranking function
export const getCommunityRanking = async (accessToken: string) => {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/ranking`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch community ranking');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching community ranking:', error);
    throw error;
  }
};