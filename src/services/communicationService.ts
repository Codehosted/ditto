import { db, collection, addDoc, Timestamp } from '../firebase';

export enum MeetingProvider {
  ZOOM = 'zoom',
  TEAMS = 'teams',
}

export interface MeetingRequest {
  familyId: string;
  vendorId: string;
  provider: MeetingProvider;
  startTime: Date;
  topic: string;
}

export const scheduleMeeting = async (request: MeetingRequest) => {
  // In a real app, this would call the Zoom or Teams API via a backend proxy
  // For this prototype, we'll simulate the API call and store the meeting in Firestore
  
  const mockMeetingUrl = request.provider === MeetingProvider.ZOOM 
    ? `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`
    : `https://teams.microsoft.com/l/meetup-join/${Math.random().toString(36).substring(2)}`;

  try {
    const docRef = await addDoc(collection(db, 'meetings'), {
      familyId: request.familyId,
      vendorId: request.vendorId,
      provider: request.provider,
      meetingUrl: mockMeetingUrl,
      startTime: Timestamp.fromDate(request.startTime),
      topic: request.topic,
      status: 'scheduled',
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, url: mockMeetingUrl };
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    throw error;
  }
};

export const getOAuthUrl = (provider: MeetingProvider) => {
  // This would return the authorization URL for the provider
  const clientId = provider === MeetingProvider.ZOOM 
    ? process.env.VITE_ZOOM_CLIENT_ID 
    : process.env.VITE_TEAMS_CLIENT_ID;
  
  const redirectUri = `${window.location.origin}/auth/callback`;
  
  if (provider === MeetingProvider.ZOOM) {
    return `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
  } else {
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=Calendars.ReadWrite`;
  }
};
