import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { parseLocation } from '../routes/appRoutes';

export default function RouteStateMiddleware({
  setCurrentView,
  setSelectedProfileId,
  setSelectedChatUserId,
  setSearchQuery,
}) {
  const location = useLocation();

  useEffect(() => {
    const routeState = parseLocation(location);
    setCurrentView(routeState.view);
    setSelectedProfileId(routeState.profileId);
    setSelectedChatUserId(routeState.chatUserId);
    setSearchQuery(routeState.searchQuery);
  }, [location, setCurrentView, setSelectedProfileId, setSelectedChatUserId, setSearchQuery]);

  return null;
}
