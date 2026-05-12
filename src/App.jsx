import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import RouteStateMiddleware from './middleware/RouteStateMiddleware';
import { buildPath } from './routes/appRoutes';
import {
  TopNav as AppTopNav,
  SidebarLeft as AppSidebarLeft,
  SidebarRight as AppSidebarRight,
  MobileNav as AppMobileNav,
} from './components/AppChrome';
import AppPostCard from './components/PostCard';
import {
  BookmarksView as AppBookmarksView,
  ExploreView as AppExploreView,
  FriendsView as AppFriendsView,
  MessagesView as AppMessagesView,
  ProfileView as AppProfileView,
  SearchResultsView as AppSearchResultsView,
} from './views/AppViews';
import { 
  Plus,
  Video,
  Search,
  MessageSquarePlus,
  Camera,
  UploadCloud,
  Square,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  UserPlus,
  BookOpen,
  MessageCircle,
  MoreHorizontal,
  Flag,
  Heart,
  Send,
  Smile,
  X,
  Bookmark,
  MessageSquare,
  PenTool,
  Home,
  Compass,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { socketUrl } from './lib/backend';
import { createPost, fetchPosts, notifyPostsChanged, subscribeToPostsChanged, updatePost, uploadPostMedia } from './lib/postsApi';
import {
  fetchConversations,
  fetchUsers,
  readCurrentUser,
  subscribeToConversationsChanged,
  subscribeToUsersChanged,
  updateUser,
} from './lib/mongoApi';
import AuthPage from './pages/AuthPage';

const STORY_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const POST_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;

const revokeObjectUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const inferMediaType = (mimeType = '', url = '') => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  if (url.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(url)) return 'video';
  return 'image';
};

const compressImageBlob = (fileOrBlob, maxWidth = 1600, quality = 0.82) =>
  new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new window.Image();

    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          resolve(blob || fileOrBlob);
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(fileOrBlob);
    };

    img.src = objectUrl;
  });

const prepareUploadBlob = async (fileOrBlob, type) => {
  if (type === 'image') {
    return compressImageBlob(fileOrBlob);
  }
  return fileOrBlob;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });

function ClustrLoader() {
  const canvasRef = useRef(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    'connecting your stars',
    'mapping your cluster',
    'finding your people',
    'opening your network',
    'building your circle',
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = window.devicePixelRatio || 1;
    const width = 240;
    const height = 240;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = 125;
    const cy = 120;
    const radius = 88;
    const openDeg = 42;
    const span = 360 - 2 * openDeg;
    const nodeCount = 10;
    const toRad = (deg) => deg * Math.PI / 180;

    const nodes = Array.from({ length: nodeCount }, (_, index) => {
      const fraction = index / (nodeCount - 1);
      const deg = -openDeg - fraction * span;
      const x = cx + radius * Math.cos(toRad(deg));
      const y = cy + radius * Math.sin(toRad(deg));
      const nodeRadius = (index === 0 || index === nodeCount - 1)
        ? 11
        : (index === Math.round((nodeCount - 1) / 2))
          ? 11
          : (index === 2 || index === 7)
            ? 7.5
            : 6;

      return { x, y, r: nodeRadius, t: fraction };
    });

    const connections = [
      [0, 2], [1, 3], [0, 3],
      [3, 5], [4, 6],
      [6, 8], [7, 9], [6, 9],
      [2, 5], [4, 7],
    ];

    const lerpColor = (t) => {
      const stops = [
        [0x1e, 0xcf, 0xff],
        [0x70, 0x33, 0xee],
        [0xd0, 0x40, 0xe8],
      ];
      const scaled = t * 2;
      const stopIndex = Math.min(Math.floor(scaled), 1);
      const factor = scaled - stopIndex;
      const start = stops[stopIndex];
      const end = stops[stopIndex + 1];

      return [
        Math.round(start[0] + (end[0] - start[0]) * factor),
        Math.round(start[1] + (end[1] - start[1]) * factor),
        Math.round(start[2] + (end[2] - start[2]) * factor),
      ];
    };

    const rgba = (t, alpha) => {
      const [r, g, b] = lerpColor(t);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    const arcDuration = 1200;
    const nodeStart = 200;
    const nodeGap = 220;
    const connectionDelay = 80;
    const connectionDuration = 320;
    const ringDuration = 500;

    const nodeTime = (index) => nodeStart + index * nodeGap;
    const connectionTime = (a, b) => Math.max(nodeTime(a), nodeTime(b)) + connectionDelay;
    const totalDuration = nodeTime(nodeCount - 1) + 1500;

    const easeOut = (t) => 1 - (1 - t) ** 3;
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
    const spring = (t) => {
      if (t >= 1) return 1;
      return 1 - Math.exp(-8 * t) * Math.cos(12 * t);
    };

    const drawArc = (progress) => {
      const totalRad = toRad(span);
      const drawn = totalRad * progress;
      const steps = 160;
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;

      for (let index = 0; index < steps; index += 1) {
        const t0 = index / steps;
        const t1 = (index + 1) / steps;
        if (t0 * totalRad > drawn) break;

        const a0 = toRad(-openDeg) - t0 * totalRad;
        const a1 = toRad(-openDeg) - Math.min(t1 * totalRad, drawn);
        const [r, g, b] = lerpColor(t0);
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, a0, a1, true);
        ctx.stroke();
      }
    };

    const drawConnection = (a, b, progress) => {
      const start = nodes[a];
      const end = nodes[b];
      const x2 = start.x + (end.x - start.x) * progress;
      const y2 = start.y + (end.y - start.y) * progress;
      const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      gradient.addColorStop(0, rgba(start.t, 0.55));
      gradient.addColorStop(1, rgba(end.t, 0.55));
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const drawNode = (node, progress, ringProgress) => {
      const { x, y, r, t } = node;
      const [nr, ng, nb] = lerpColor(t);

      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
      halo.addColorStop(0, `rgba(${nr},${ng},${nb},0.13)`);
      halo.addColorStop(1, `rgba(${nr},${ng},${nb},0)`);
      ctx.beginPath();
      ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      if (ringProgress < 1) {
        const rippleRadius = r + r * 1.7 * ringProgress;
        ctx.beginPath();
        ctx.arc(x, y, rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${nr},${ng},${nb},${0.6 * (1 - ringProgress)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const scaledRadius = r * Math.min(spring(progress * 1.1), 1.1);
      ctx.beginPath();
      ctx.arc(x, y, scaledRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${nr},${ng},${nb})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, scaledRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    };

    let frameId;
    let startTime = null;

    const render = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % totalDuration;
      ctx.clearRect(0, 0, width, height);

      drawArc(easeInOut(Math.min(elapsed / arcDuration, 1)));

      connections.forEach(([a, b]) => {
        const startAt = connectionTime(a, b);
        if (elapsed < startAt) return;
        drawConnection(a, b, easeOut(Math.min((elapsed - startAt) / connectionDuration, 1)));
      });

      nodes.forEach((node, index) => {
        const startAt = nodeTime(index);
        if (elapsed < startAt) return;
        drawNode(
          node,
          Math.min((elapsed - startAt) / 500, 1),
          Math.min((elapsed - startAt) / ringDuration, 1),
        );
      });

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,207,255,0.08),_transparent_35%),linear-gradient(180deg,_#09111b_0%,_#0c0c0c_100%)] font-sans text-white">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="clustr-loader-wrap">
          <canvas
            ref={canvasRef}
            className="clustr-loader-stage"
            style={{ width: 240, height: 240 }}
          />
          <div className="clustr-loader-label">
            <span className="clustr-loader-brand">clustr</span>
            <div className="clustr-loader-sub">
              <span
                className="transition-opacity duration-300"
                key={messageIndex}
              >
                {messages[messageIndex]}
              </span>
              <span className="clustr-loader-cursor" />
            </div>
            <div className="clustr-loader-pips">
              <div className="clustr-loader-pip clustr-loader-p1" />
              <div className="clustr-loader-pip clustr-loader-p2" />
              <div className="clustr-loader-pip clustr-loader-p3" />
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes clustrFloatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            @keyframes clustrBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            @keyframes clustrPip { 0%, 100% { transform: scale(1); opacity: .45; } 50% { transform: scale(1.5); opacity: 1; } }
            .clustr-loader-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.8rem 1rem 2.2rem; min-height: 340px; gap: 1.8rem; }
            .clustr-loader-stage { display: block; animation: clustrFloatY 5s ease-in-out infinite; }
            .clustr-loader-label { display: flex; flex-direction: column; align-items: center; gap: 7px; }
            .clustr-loader-brand { font-size: 22px; font-weight: 500; letter-spacing: .1em; color: rgba(255,255,255,0.96); text-transform: lowercase; }
            .clustr-loader-sub { min-height: 18px; display: flex; align-items: center; gap: 3px; font-size: 12px; color: rgba(255,255,255,0.56); text-transform: lowercase; }
            .clustr-loader-cursor { display: inline-block; width: 1px; height: 11px; background: rgba(255,255,255,0.56); animation: clustrBlink 1s step-end infinite; }
            .clustr-loader-pips { display: flex; gap: 6px; margin-top: 2px; }
            .clustr-loader-pip { width: 5px; height: 5px; border-radius: 9999px; }
            .clustr-loader-p1 { background: #1ecfff; animation: clustrPip 1.8s ease-in-out infinite; }
            .clustr-loader-p2 { background: #8040f0; animation: clustrPip 1.8s ease-in-out infinite; animation-delay: .3s; }
            .clustr-loader-p3 { background: #d040e8; animation: clustrPip 1.8s ease-in-out infinite; animation-delay: .6s; }
          `,
        }}
      />
    </div>
  );
}

export default function SkillNet() {
  const navigate = useNavigate();
  const location = useLocation();
  const skillSwapUrl = import.meta.env.VITE_SKILLSWAP_URL?.replace(/\/$/, '') || 'http://localhost:5173';
  const transferParams = new URLSearchParams(location.search);
  const transferredProfileName = transferParams.get('profileName')?.trim() || '';
  const routeProfileId = location.pathname.startsWith('/profile/')
    ? location.pathname.split('/').filter(Boolean)[1] || null
    : null;
  const isAuthRoute = location.pathname === '/auth';
  const [user, setUser] = useState(null);
  
  const [authLoaded, setAuthLoaded] = useState(false);
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(true);
  const [postAuthLoading, setPostAuthLoading] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false); 
  const [currentView, setCurrentView] = useState('home'); 
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [messageThreads, setMessageThreads] = useState([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const socketRef = useRef(null);
  const socketContextRef = useRef({ user: null, usersInfo: {} });
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState('all'); 
  const [feedSort, setFeedSort] = useState('following');
  
  const [posts, setPosts] = useState([]);
  const [usersInfo, setUsersInfo] = useState({}); 

  const createInitialAvatar = (name = '') => {
    const trimmedName = name.trim();
    const initials = trimmedName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="32" fill="#dbeafe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#1d4ed8">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const buildUsernameFromName = (name, uid) => {
    const base = (name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 12);

    return `@${base || `john${uid.substring(0, 4)}`}`;
  };

  const sanitizeLegacyProfile = (profile = {}) => {
    const legacyRole = profile.role === 'Product Designer' ? '' : (profile.role || '');
    const legacyBio = profile.bio === 'Exploring ideas and building beautiful digital experiences.'
      ? ''
      : (profile.bio || '');
    const legacySkills = Array.isArray(profile.skills) &&
      profile.skills.join('|') === 'React|Design|Product'
      ? []
      : (profile.skills || []);

    return {
      ...profile,
      role: legacyRole,
      bio: legacyBio,
      skills: legacySkills,
    };
  };

  useEffect(() => {
    socketContextRef.current = { user, usersInfo };
  }, [user, usersInfo]);

  useEffect(() => {
    if (!postAuthLoading) return;

    setMinLoadTimePassed(false);
    const timer = setTimeout(() => {
      setMinLoadTimePassed(true);
      setPostAuthLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [postAuthLoading]);
  
  useEffect(() => {
    const currentUser = readCurrentUser();
    setUser(currentUser);
    setAuthLoaded(true);

    const refreshCurrentUser = () => {
      setUser(readCurrentUser());
    };

    const unsubscribe = subscribeToUsersChanged(refreshCurrentUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const currentUser = readCurrentUser();
    if (!currentUser) return;

    const resolvedDisplayName =
      transferredProfileName ||
      currentUser.displayName ||
      `john${currentUser.uid.substring(0, 4)}`;
    const baseProfile = sanitizeLegacyProfile(currentUser);
    const currentUserPayload = {
      displayName: resolvedDisplayName,
      email: currentUser.email || baseProfile.email || '',
      username: buildUsernameFromName(resolvedDisplayName, currentUser.uid),
      photoURL: baseProfile.photoURL || currentUser.photoURL || createInitialAvatar(resolvedDisplayName),
      skills: baseProfile.skills || [],
      savedPosts: baseProfile.savedPosts || [],
      followers: baseProfile.followers || [],
      following: baseProfile.following || [],
      role: baseProfile.role || '',
      bio: baseProfile.bio || '',
      joinedAt: baseProfile.joinedAt || Date.now(),
    };

    updateUser(currentUser.uid, currentUserPayload)
      .catch((error) => console.error('User profile sync error:', error));
  }, [transferredProfileName]);

  useEffect(() => {
    if (!authLoaded) return;

    if (!user && !isAuthRoute) {
      navigate('/auth', { replace: true });
      return;
    }

    if (user && isAuthRoute) {
      navigate(buildPath('profile', { profileId: user.uid }), { replace: true });
    }
  }, [authLoaded, user, isAuthRoute, navigate]);

  useEffect(() => {
    if (!user) return;

    const loadUsers = async () => {
      try {
        const users = await fetchUsers();
      const usersMap = {};
        users.forEach((profile) => {
          usersMap[profile.uid] = profile;
      });
      setUsersInfo(usersMap);
      } catch (err) {
        console.error("Users fetch error:", err);
      }
    };

    const loadPosts = async () => {
      try {
        const postsData = await fetchPosts();
        if (postsData.length === 0 && user) {
          await seedInitialPosts(user.uid);
          return;
        }
        setPosts(postsData);
      } catch (err) {
        console.error('Posts fetch error:', err);
      }
    };

    loadUsers();
    loadPosts();
    const unsubscribeUsers = subscribeToUsersChanged(loadUsers);
    const unsubscribePostEvents = subscribeToPostsChanged(loadPosts);

    return () => {
      unsubscribeUsers();
      unsubscribePostEvents();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setMessageThreads([]);
      return;
    }

    const loadConversations = async () => {
      try {
        const threads = await fetchConversations(user.uid);
        setMessageThreads(threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      } catch (err) {
        console.error('Conversations fetch error:', err);
      }
    };

    loadConversations();
    return subscribeToConversationsChanged(loadConversations);
  }, [user]);

  useEffect(() => {
    if (currentView === 'auth') return;

    const nextPath = buildPath(currentView, {
      profileId: selectedProfileId,
      searchQuery,
      chatUserId: selectedChatUserId,
    });

    const currentUrl = `${location.pathname}${location.search}`;
    if (nextPath !== currentUrl) {
      navigate(nextPath, { replace: true });
    }
  }, [currentView, selectedProfileId, searchQuery, selectedChatUserId, navigate, location.pathname, location.search]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setSocketConnected(false);
      setSocketError('');
      setMessageThreads([]);
      return;
    }

    if (!socketRef.current) {
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;
      setSocket(socket);

      const emitRegister = () => {
        const activeUser = socketContextRef.current.user;
        if (!activeUser) return;
        const userData = socketContextRef.current.usersInfo[activeUser.uid] || {};
        socket.emit('register', {
          userId: activeUser.uid,
          following: userData.following || [],
          followers: userData.followers || [],
        });
      };

      socket.on('connect', () => {
        console.log('[Socket] Connected');
        setSocketConnected(true);
        setSocketError('');
        emitRegister();
      });

      socket.on('conversations:init', (data) => {
        console.log('[Socket] Conversations initialized:', data);
        if (Array.isArray(data?.threads)) {
          setMessageThreads(data.threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        }
      });

      socket.on('conversation:update', (updatedThread) => {
        console.log('[Socket] Conversation updated:', updatedThread);
        setMessageThreads((currentThreads) => {
          const nextThreads = currentThreads.filter((thread) => thread.id !== updatedThread.id);
          return [updatedThread, ...nextThreads].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        });
      });

      socket.on('message:confirmation', (data) => {
        console.log('[Socket] Message confirmation:', data);
      });

      socket.on('error:validation', (error) => {
        console.error('[Socket] Validation error:', error);
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        setSocketConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error);
        setSocketConnected(false);
        setSocketError(error?.message || 'Unable to connect to chat server');
      });
    }

    return () => {
    };
  }, [user]);

  useEffect(() => {
    if (!user || !socketRef.current?.connected) return;
    const userData = usersInfo[user.uid] || {};
    socketRef.current.emit('register', {
      userId: user.uid,
      following: userData.following || [],
      followers: userData.followers || [],
    });
  }, [user, usersInfo]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('[Socket] Disconnecting on unmount');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setSocketConnected(false);
      setSocketError('');
    };
  }, []);

  const seedInitialPosts = async (uid) => {
    notifyPostsChanged();
  };

  if (postAuthLoading || !minLoadTimePassed) {
    return <ClustrLoader />;
  }

  if (currentView === 'auth') {
    return (
      <AuthPage
        onBack={() => {
          if (typeof window !== 'undefined') {
            window.location.href = skillSwapUrl;
          }
        }}
        onContinue={(signedInUser, context = {}) => {
          setSelectedProfileId(signedInUser?.uid || null);
          setCurrentView('profile');

          if (context.mode === 'login' || context.mode === 'signup') {
            setPostAuthLoading(true);
            window.setTimeout(() => {
              navigate(buildPath('profile', { profileId: signedInUser?.uid || null }), { replace: true });
            }, 2500);
            return;
          }

          navigate(buildPath('profile', { profileId: signedInUser?.uid || null }), { replace: true });
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans animate-in fade-in duration-1000 ${darkMode ? 'dark bg-[#0f1020] text-slate-200' : 'bg-[#f5f7ff] text-[#1d2342]'}`}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(circle_at_top,_rgba(34,199,245,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_28%),linear-gradient(180deg,_#0f1020_0%,_#14172d_100%)]' : 'bg-[radial-gradient(circle_at_top,_rgba(34,199,245,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(96,165,250,0.12),_transparent_26%),linear-gradient(180deg,_#f8faff_0%,_#eef2ff_100%)]'}`}></div>
      </div>
      <RouteStateMiddleware
        setCurrentView={setCurrentView}
        setSelectedProfileId={setSelectedProfileId}
        setSelectedChatUserId={setSelectedChatUserId}
        setSearchQuery={setSearchQuery}
      />
      
      <AppTopNav 
        darkMode={darkMode} setDarkMode={setDarkMode} user={user} usersInfo={usersInfo} 
        setCurrentView={setCurrentView} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        setSelectedProfileId={setSelectedProfileId}
        posts={posts}
      />

      <div className="max-w-[1440px] mx-auto flex justify-center gap-6 px-4 pt-[80px] relative">
        
        <AppSidebarLeft 
          currentView={currentView} setCurrentView={setCurrentView} user={user} usersInfo={usersInfo} posts={posts}
          setSelectedProfileId={setSelectedProfileId}
        />

        <main className="flex-1 max-w-[680px] w-full min-h-screen pb-28 md:pb-8">
          <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <StoriesCarousel user={user} usersInfo={usersInfo} />
              <CreatePost user={user} usersInfo={usersInfo} />
              <FeedFilters
                feedFilter={feedFilter}
                setFeedFilter={setFeedFilter}
                feedSort={feedSort}
                setFeedSort={setFeedSort}
              />
              <Feed
                posts={posts}
                user={user}
                usersInfo={usersInfo}
                feedFilter={feedFilter}
                feedSort={feedSort}
                searchQuery={searchQuery}
                setCurrentView={setCurrentView}
                setSelectedProfileId={setSelectedProfileId}
              />
            </motion.div>
          )}
          
          {currentView === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AppProfileView
              user={user}
              usersInfo={usersInfo}
              posts={posts}
              selectedProfileId={selectedProfileId}
              setCurrentView={setCurrentView}
              setSelectedProfileId={setSelectedProfileId}
              setSelectedChatUserId={setSelectedChatUserId}
            />
            </motion.div>
          )}

          {currentView === 'explore' && (
            <motion.div key="explore" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AppExploreView setSearchQuery={setSearchQuery} setCurrentView={setCurrentView} />
            </motion.div>
          )}

          {currentView === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AppSearchResultsView
              searchQuery={searchQuery}
              posts={posts}
              usersInfo={usersInfo}
              user={user}
              setCurrentView={setCurrentView}
              setSelectedProfileId={setSelectedProfileId}
            />
            </motion.div>
          )}

          {currentView === 'friends' && (
            <motion.div key="friends" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AppFriendsView
              user={user}
              usersInfo={usersInfo}
              setCurrentView={setCurrentView}
              setSelectedProfileId={setSelectedProfileId}
              setSelectedChatUserId={setSelectedChatUserId}
            />
            </motion.div>
          )}

          {currentView === 'bookmarks' && (
            <motion.div key="bookmarks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AppBookmarksView user={user} usersInfo={usersInfo} posts={posts} />
            </motion.div>
          )}

          {currentView === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AppMessagesView
              user={user}
              usersInfo={usersInfo}
              messageThreads={messageThreads}
              selectedChatUserId={selectedChatUserId}
              setSelectedChatUserId={setSelectedChatUserId}
              setCurrentView={setCurrentView}
              setSelectedProfileId={setSelectedProfileId}
              socket={socket}
              socketConnected={socketConnected}
              socketError={socketError}
            />
            </motion.div>
          )}
          </AnimatePresence>
        </main>


        <AppSidebarRight
          usersInfo={usersInfo}
          currentUser={user}
          setCurrentView={setCurrentView}
          setSelectedProfileId={setSelectedProfileId}
          messageThreads={messageThreads}
          setSelectedChatUserId={setSelectedChatUserId}
        />


        <AppMobileNav currentView={currentView} setCurrentView={setCurrentView} user={user} setSelectedProfileId={setSelectedProfileId} />
      </div>
    </div>
  );
}

function StoriesCarousel({ user, usersInfo }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStoryUrl, setNewStoryUrl] = useState('');
  const [newStoryFile, setNewStoryFile] = useState(null);
  const [newStoryType, setNewStoryType] = useState('');
  const [viewingStory, setViewingStory] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [localStory, setLocalStory] = useState(null);
  const localStoryUrlRef = useRef('');
  
  const [activeTab, setActiveTab] = useState('upload');
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const currentUserData = usersInfo[user?.uid] || {};
  const isStoryValid = (timestamp) => timestamp && (Date.now() - timestamp < 24 * 60 * 60 * 1000);
  const activeLocalStory = localStory && isStoryValid(localStory.storyTimestamp) ? localStory : null;
  const displayCurrentUserData = activeLocalStory
    ? {
        ...currentUserData,
        currentStory: activeLocalStory.currentStory,
        currentStoryType: activeLocalStory.currentStoryType,
        storyTimestamp: activeLocalStory.storyTimestamp,
      }
    : currentUserData;
  const updateStoryPreview = (nextUrl, nextFile = null, nextType = '') => {
    setNewStoryUrl((currentUrl) => {
      revokeObjectUrl(currentUrl);
      return nextUrl;
    });
    setNewStoryFile(nextFile);
    setNewStoryType(nextType);
  };
  
  const startCamera = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStream(stream);
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Could not access camera. Please check your browser permissions or use the Upload option.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (showAddModal && activeTab === 'camera' && !newStoryUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showAddModal, activeTab, newStoryUrl]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        updateStoryPreview(URL.createObjectURL(blob), blob, 'image');
        stopCamera();
      }, 'image/jpeg', 0.7);
    }
  };

  const startRecording = () => {
    if (!cameraStream) return;
    chunksRef.current = [];
    try {
      const mediaRecorder = new MediaRecorder(cameraStream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        if (blob.size > STORY_UPLOAD_LIMIT_BYTES) {
          alert("Video is too large for this demo database (Max 20MB). Try a shorter clip.");
          updateStoryPreview('', null, '');
          return;
        }
        updateStoryPreview(URL.createObjectURL(blob), blob, 'video');
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 4000);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Video recording is not supported in this browser context.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > STORY_UPLOAD_LIMIT_BYTES) {
       alert("File is too large for this demo database (Max 20MB). Please choose a smaller file.");
       return;
    }

    updateStoryPreview(URL.createObjectURL(file), file, inferMediaType(file.type));
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    updateStoryPreview('', null, '');
    setActiveTab('upload');
    setIsRecording(false);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopCamera();
  };

  const handleAddStory = async () => {
    if (!user || !newStoryFile) return;
    setIsAdding(true);
    try {
      const preparedStoryBlob = await prepareUploadBlob(newStoryFile, newStoryType);
      const storyFile = preparedStoryBlob instanceof File
        ? preparedStoryBlob
        : new File(
            [preparedStoryBlob],
            `story.${newStoryType === 'video' ? 'webm' : 'jpg'}`,
            { type: preparedStoryBlob.type || newStoryFile.type || (newStoryType === 'video' ? 'video/webm' : 'image/jpeg') },
                );
      let uploadedStory;
      let shouldSaveStory = true;

      try {
        uploadedStory = await uploadPostMedia(storyFile);
      } catch (uploadError) {
        if (newStoryType === 'image') {
          uploadedStory = {
            url: await blobToDataUrl(preparedStoryBlob),
            mediaType: 'image',
          };
        } else {
          const localVideoUrl = URL.createObjectURL(storyFile);
          revokeObjectUrl(localStoryUrlRef.current);
          localStoryUrlRef.current = localVideoUrl;
          uploadedStory = {
            url: localVideoUrl,
            mediaType: 'video',
          };
          shouldSaveStory = false;
          console.warn('Story video upload failed; showing local preview only.', uploadError);
        }
      }

      const storyPayload = {
        currentStory: uploadedStory.url,
        currentStoryType: uploadedStory.mediaType || newStoryType || inferMediaType(newStoryFile.type, uploadedStory.url),
        storyTimestamp: Date.now(),
      };
      setLocalStory(storyPayload);
      if (shouldSaveStory) {
        await updateUser(user.uid, storyPayload);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error adding story:", err);
      alert(err?.message || 'Could not add story. Please make sure the server is running and try again.');
    }
    setIsAdding(false);
  };

  const handleDeleteStory = async () => {
    if (!user) return;
    try {
      await updateUser(user.uid, {
        currentStory: null,
        currentStoryType: null,
        storyTimestamp: null
      });
      revokeObjectUrl(localStoryUrlRef.current);
      localStoryUrlRef.current = '';
      setLocalStory(null);
      setViewingStory(null);
    } catch (err) {
      console.error("Error deleting story:", err);
    }
  };

  useEffect(() => () => revokeObjectUrl(localStoryUrlRef.current), []);

  const dynamicStories = Object.values(usersInfo)
    .filter(u => u.uid !== user?.uid && u.currentStory && isStoryValid(u.storyTimestamp))
    .slice(0, 10)
    .map((u, i) => ({
      id: u.uid,
      name: u.displayName.substring(0, 10) + (u.displayName.length > 10 ? '...' : ''),
      avatar: u.photoURL,
      storyUrl: u.currentStory,
      mediaType: u.currentStoryType || inferMediaType('', u.currentStory || ''),
      color: ['border-blue-400', 'border-emerald-400', 'border-purple-400', 'border-orange-400'][i % 4]
    }));

  const hasMyStory = displayCurrentUserData.currentStory && isStoryValid(displayCurrentUserData.storyTimestamp);

  const stories = [
    { 
      id: 'add', 
      name: 'Your Story', 
      avatar: displayCurrentUserData.photoURL, 
      isAdd: !hasMyStory,
      storyUrl: displayCurrentUserData.currentStory,
      mediaType: displayCurrentUserData.currentStoryType || inferMediaType('', displayCurrentUserData.currentStory || ''),
      color: hasMyStory ? 'border-blue-500' : 'border-slate-200 dark:border-slate-700'
    },
    ...dynamicStories
  ];

  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 pt-2 snap-x">
        {stories.map((story) => (
          <div 
            key={story.id} 
            onClick={() => {
              if (story.id === 'add' && !hasMyStory) setShowAddModal(true);
              else if (story.storyUrl) setViewingStory(story);
            }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer snap-start group"
          >
            <div className={`relative w-[60px] h-[70px] rounded-[20px] flex items-center justify-center bg-white dark:bg-slate-800 transition-transform ${story.id !== 'add' || hasMyStory ? `border-2 ${story.color}` : 'border border-slate-200 dark:border-slate-700'}`}>
               {story.storyUrl ? (
                 story.mediaType === 'video' ? (
                   <video src={story.storyUrl} muted playsInline className="w-[52px] h-[62px] rounded-[16px] object-cover bg-slate-100 dark:bg-slate-700" />
                 ) : (
                   <img src={story.storyUrl} className="w-[52px] h-[62px] rounded-[16px] object-cover bg-slate-100 dark:bg-slate-700" alt={story.name}/>
                 )
               ) : (
                 <img src={story.avatar} className="w-[52px] h-[62px] rounded-[16px] object-cover bg-slate-100 dark:bg-slate-700" alt={story.name}/>
               )}
               {story.isAdd && (
                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                   <Plus size={12} className="text-white font-bold"/>
                 </div>
               )}
            </div>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{story.name}</span>
          </div>
        ))}
      </div>


      <AnimatePresence>
      {showAddModal && (
        <motion.div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Create Story</h2>
            

            <div className="flex gap-2 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab('upload'); updateStoryPreview('', null, ''); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'upload' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <UploadCloud size={16} /> Upload Media
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab('camera'); updateStoryPreview('', null, ''); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'camera' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <Camera size={16} /> Camera
              </motion.button>
            </div>


            <div className="min-h-[160px] flex flex-col justify-center mb-6">
              {activeTab === 'upload' && (
                <div className="flex flex-col items-center gap-4">
                  {newStoryUrl ? (
                    <div className="relative w-full max-h-[220px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {newStoryType === 'video' ? (
                         <video src={newStoryUrl} autoPlay loop playsInline className="max-h-[220px] object-contain" />
                      ) : (
                         <img src={newStoryUrl} alt="Preview" className="max-h-[220px] object-contain" />
                      )}
                      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.95 }} onClick={() => updateStoryPreview('', null, '')} className="absolute top-2 right-2 bg-slate-900/60 p-1.5 rounded-full text-white hover:bg-slate-900/80 transition-colors z-10">
                        <X size={14} />
                      </motion.button>
                    </div>
                  ) : (
                    <label className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-500/10 transition-colors bg-slate-50 dark:bg-slate-800/50">
                      <UploadCloud size={32} className="text-blue-500" />
                      <span className="text-[14px] font-medium text-slate-600 dark:text-slate-400">Click to upload an image or video</span>
                      <span className="text-[11px] text-slate-400">JPG, PNG or MP4 (Max 20MB)</span>
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              )}

              {activeTab === 'camera' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  {newStoryUrl ? (
                    <div className="relative w-full max-h-[250px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {newStoryType === 'video' ? (
                         <video src={newStoryUrl} autoPlay loop playsInline className="max-h-[250px] object-contain" />
                      ) : (
                         <img src={newStoryUrl} alt="Captured" className="max-h-[250px] object-contain" />
                      )}
                      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.95 }} onClick={() => updateStoryPreview('', null, '')} className="absolute top-2 right-2 bg-slate-900/60 p-1.5 rounded-full text-white hover:bg-slate-900/80 transition-colors z-10">
                        <X size={14} />
                      </motion.button>
                    </div>
                  ) : (
                    <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-800">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                      
                      {isRecording && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                          <span className="text-[9px] text-white font-bold tracking-widest uppercase">REC</span>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={capturePhoto} 
                          disabled={isRecording} 
                          className={`bg-white/20 p-3 rounded-full backdrop-blur-md transition-colors border-2 border-white shadow-sm ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/40'}`} 
                          title="Take Photo"
                        >
                          <Camera size={20} className="text-white" />
                        </motion.button>
                        {!isRecording ? (
                           <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startRecording} className="bg-red-500/80 p-3 rounded-full backdrop-blur-md hover:bg-red-600 transition-colors border-2 border-white shadow-sm" title="Record Video (4s max)">
                             <Video size={20} className="text-white" />
                           </motion.button>
                        ) : (
                           <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={stopRecording} className="bg-white p-3 rounded-full backdrop-blur-md animate-pulse border-2 border-red-500 shadow-sm" title="Stop Recording">
                             <Square size={20} className="text-red-500 fill-current" />
                           </motion.button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCloseModal}
                className="px-5 py-2 rounded-full font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[13px]"
              >
                Cancel
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddStory}
                disabled={isAdding || !newStoryFile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-colors disabled:opacity-50 text-[13px]"
              >
                {isAdding ? 'Posting...' : 'Share Story'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>


      {viewingStory && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
            <div className="flex items-center gap-3">
              <img src={viewingStory.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-white/30 object-cover" />
              <span className="text-white font-semibold text-[14px]">{viewingStory.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {viewingStory.id === 'add' && (
                <button 
                  onClick={handleDeleteStory}
                  className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 transition-colors mr-2"
                  title="Delete your story"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button 
                onClick={() => setViewingStory(null)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-8 pt-24 sm:px-6">
            <div className="flex h-[calc(100vh-8rem)] max-h-[780px] w-full max-w-[min(92vw,440px)] items-center justify-center overflow-hidden rounded-2xl bg-black shadow-2xl">
              {viewingStory.mediaType === 'video' ? (
                <video src={viewingStory.storyUrl} autoPlay playsInline controls className="h-full w-full object-contain" />
              ) : (
                <img src={viewingStory.storyUrl} alt="Story" className="h-full w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CreatePost({ user, usersInfo }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [postType, setPostType] = useState('interested'); 
  const [isPublishing, setIsPublishing] = useState(false);
  
  const currentUserData = usersInfo[user?.uid] || {};
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const hasDraft =
    !!title.trim() ||
    !!content.trim() ||
    !!tags.trim() ||
    !!mediaUrl.trim() ||
    !!attachment;

  const updateMediaPreview = (nextUrl, nextFile = null, nextType = '') => {
    setMediaUrl((currentUrl) => {
      revokeObjectUrl(currentUrl);
      return nextUrl;
    });
    setMediaFile(nextFile);
    setMediaType(nextType);
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadLimitMB = (POST_UPLOAD_LIMIT_BYTES / (1024 * 1024)).toFixed(0);
    if (file.size > POST_UPLOAD_LIMIT_BYTES) {
      alert(`File is too large for this demo database (Max ${uploadLimitMB}MB). Please choose a smaller image or a shorter video.`);
      return;
    }

    updateMediaPreview(URL.createObjectURL(file), file, inferMediaType(file.type));
  };

  const handleAttachmentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadLimitMB = (POST_UPLOAD_LIMIT_BYTES / (1024 * 1024)).toFixed(0);
    if (file.size > POST_UPLOAD_LIMIT_BYTES) {
      alert(`Attachment is too large for this demo database (Max ${uploadLimitMB}MB). Please choose a smaller file.`);
      return;
    }

    setAttachmentFile(file);
    setAttachment({
      name: file.name,
      type: file.type || 'application/octet-stream',
      url: '',
    });
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaUrl.trim() && !title.trim() && !attachment) return;
    setIsPublishing(true);
    
    let skillsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    if (skillsArray.length === 0) skillsArray = ['Feed'];

    try {
      const mediaUploadPromise = mediaFile
        ? (async () => {
            const preparedMediaBlob = await prepareUploadBlob(mediaFile, mediaType);
            const uploadFile = preparedMediaBlob instanceof File
              ? preparedMediaBlob
              : new File(
                  [preparedMediaBlob],
                  mediaFile.name || `media.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
                  { type: preparedMediaBlob.type || mediaFile.type },
                );
            try {
              const uploaded = await uploadPostMedia(uploadFile);
              return {
                url: uploaded.url,
                mediaType: uploaded.mediaType || mediaType,
              };
            } catch (uploadError) {
              if (mediaType === 'image') {
                const dataUrl = await blobToDataUrl(preparedMediaBlob);
                return {
                  url: dataUrl,
                  mediaType: 'image',
                };
              }

              console.warn('Post video upload failed; showing local video preview only.', uploadError);
              return {
                url: URL.createObjectURL(uploadFile),
                mediaType: 'video',
              };
            }
          })()
        : Promise.resolve(null);

      const attachmentUploadPromise = attachmentFile
        ? uploadPostMedia(attachmentFile).then((uploaded) => ({
            name: attachmentFile.name,
            type: attachmentFile.type || 'application/octet-stream',
            url: uploaded.url,
          }))
        : Promise.resolve(null);

      const [uploadedMediaUrl, uploadedAttachment] = await Promise.all([
        mediaUploadPromise,
        attachmentUploadPromise,
      ]);

      await createPost({
        authorId: user.uid,
        title: title.trim(),
        content: content.trim(),
        mediaUrl: uploadedMediaUrl?.url || '',
        mediaType: uploadedMediaUrl?.url ? (uploadedMediaUrl.mediaType || mediaType || inferMediaType(mediaFile?.type || '', uploadedMediaUrl.url)) : '',
        attachment: uploadedAttachment,
        postType: postType || 'standard',
        skills: skillsArray,
        likes: [],
        reactions: [],
        reposts: [],
        reports: [],
        comments: [],
        createdAt: Date.now()
      });
      notifyPostsChanged();
      setTitle('');
      setContent('');
      setTags('');
      updateMediaPreview('', null, '');
      setAttachment(null);
      setAttachmentFile(null);
      setPostType('interested');
    } catch (error) {
      console.error("Error creating post", error);
      alert(error?.message || 'Could not create post. Please make sure the server is running and try again.');
    }
    setIsPublishing(false);
  };

  return (
    <div className="mb-6 rounded-[1.6rem] border border-[#e8e1d8] bg-[#fffdfa] p-5 shadow-[0_12px_30px_rgba(43,54,78,0.08)] dark:border-[#2e2620] dark:bg-[#1d1713]">
      <div className="flex gap-4">
        <img 
          src={currentUserData.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} 
          alt="Avatar" 
          className="h-10 w-10 flex-shrink-0 rounded-full border border-[#e8e1d8] bg-[#f6f2ec] object-cover dark:border-[#3a3028] dark:bg-[#241d18]"
        />
        <div className="flex-1 flex flex-col gap-2">

          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a title (optional)..."
            className="w-full rounded-xl border border-[#ece5dc] bg-[#f6f2ec] px-4 py-2.5 text-[14px] font-medium text-[#1f1b16] outline-none transition-colors placeholder:text-[#aca093] focus:border-[#cfdbff] focus:bg-[#fffdfa] dark:border-[#2c241e] dark:bg-[#241d18] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#a77858] dark:focus:bg-[#241d18]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Ask a question, share what you know, or find someone to learn from..."
            className="min-h-[64px] w-full resize-none rounded-xl border border-[#ece5dc] bg-[#f6f2ec] px-4 py-3 text-[14px] font-medium text-[#1f1b16] outline-none transition-colors placeholder:text-[#aca093] focus:border-[#cfdbff] focus:bg-[#fffdfa] dark:border-[#2c241e] dark:bg-[#241d18] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#a77858] dark:focus:bg-[#241d18]"
          />
          <input 
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add skill tags, comma-separated (e.g. React, Figma, Spanish)"
            className="w-full rounded-xl border border-[#ece5dc] bg-[#f6f2ec] px-4 py-2.5 text-[13px] font-medium text-[#1f1b16] outline-none transition-colors placeholder:text-[#aca093] focus:border-[#cfdbff] focus:bg-[#fffdfa] dark:border-[#2c241e] dark:bg-[#241d18] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#a77858] dark:focus:bg-[#241d18]"
          />
        </div>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleMediaUpload} 
      />
      <input
        type="file"
        accept="video/*"
        className="hidden"
        ref={videoInputRef}
        onChange={handleMediaUpload}
      />
      <input
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
        className="hidden"
        ref={attachmentInputRef}
        onChange={handleAttachmentUpload}
      />

      {mediaUrl ? (
        <div className="relative mt-4 ml-[56px] flex max-h-[320px] max-w-md items-center justify-center overflow-hidden rounded-[16px] border border-slate-200 bg-black/5 shadow-sm dark:border-slate-700 dark:bg-black/30">
          {mediaType === 'video' ? (
             <video src={mediaUrl} controls autoPlay loop playsInline className="max-h-[320px] w-full object-contain"></video>
          ) : (
             <img src={mediaUrl} alt="Upload preview" className="max-h-[320px] w-full object-contain" />
          )}
          <button onClick={() => updateMediaPreview('', null, '')} className="absolute top-2 right-2 bg-slate-900/60 p-1.5 rounded-full text-white hover:bg-slate-900/80 transition-colors z-10 backdrop-blur-sm">
            <X size={14} />
          </button>
        </div>
      ) : null}

      {attachment && (
        <div className="mt-4 ml-[56px] max-w-sm">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e8e1d8] bg-[#f8f4ee] px-4 py-3 shadow-sm dark:border-[#3a3028] dark:bg-[#241d18]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-full bg-[#e8efff] p-2 text-[#2563ff] dark:bg-[#27443c]/40 dark:text-[#86cbbb]">
                <Paperclip size={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{attachment.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Attachment ready to post</p>
              </div>
            </div>
            <button onClick={() => { setAttachment(null); setAttachmentFile(null); }} className="rounded-full bg-slate-900/60 p-1.5 text-white transition-colors hover:bg-slate-900/80">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center ml-[56px] mt-4 gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-[#665c52] transition-colors hover:bg-[#f1ede7] dark:text-stone-300 dark:hover:bg-[#241d18]">
            <ImageIcon size={16} className="text-[#2563ff]" /> <span className="text-[13px] hidden sm:inline">Photo</span>
          </button>
          <button onClick={() => videoInputRef.current?.click()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-[#665c52] transition-colors hover:bg-[#f1ede7] dark:text-stone-300 dark:hover:bg-[#241d18]">
            <Video size={16} className="text-[#2563ff]" /> <span className="text-[13px] hidden sm:inline">Video</span>
          </button>
          <button onClick={() => attachmentInputRef.current?.click()} className="mr-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-[#665c52] transition-colors hover:bg-[#f1ede7] dark:text-stone-300 dark:hover:bg-[#241d18]">
            <Paperclip size={16} className="text-[#2563ff]" /> <span className="text-[13px] hidden sm:inline">Attachment</span>
          </button>


          <button 
            onClick={() => setPostType('interested')}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all whitespace-nowrap ${postType === 'interested' ? 'border-[#2563ff] bg-[#e8efff] text-[#2563ff] dark:bg-[#244139]/40 dark:text-[#86cbbb]' : 'border-[#e8e1d8] bg-transparent text-[#665c52] hover:bg-[#f1ede7] dark:border-[#3a3028] dark:text-stone-300 dark:hover:bg-[#241d18]'}`}
          >
            <UserPlus size={14} className={postType === 'interested' ? 'text-[#2563ff]' : 'text-[#aea295]'} /> Interested
          </button>
          <button 
            onClick={() => setPostType('sharing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-semibold transition-all whitespace-nowrap ${postType === 'sharing' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-600 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <BookOpen size={14} className={postType === 'sharing' ? 'text-emerald-600' : 'text-slate-400'} /> Sharing
          </button>
          <button 
            onClick={() => setPostType('discussion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-semibold transition-all whitespace-nowrap ${postType === 'discussion' ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-600 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <MessageCircle size={14} className={postType === 'discussion' ? 'text-orange-600' : 'text-slate-400'} /> Discussion
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {hasDraft && (
            <button 
              onClick={() => { setContent(''); updateMediaPreview('', null, ''); setTitle(''); setTags(''); setAttachment(null); setAttachmentFile(null); }}
              className="text-[13px] font-medium text-[#928679] transition-colors hover:text-[#5f554b] dark:text-stone-400 dark:hover:text-stone-200"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handlePost}
            disabled={isPublishing || (!content.trim() && !mediaUrl.trim() && !title.trim() && !attachment)}
            className={`rounded-full px-5 py-2 text-[13px] font-semibold text-white transition-all ${
              (content.trim() || mediaUrl.trim() || title.trim() || attachment) 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95' 
                : 'bg-[#9ec0ff] cursor-not-allowed opacity-80'
            } disabled:opacity-50`}
          >
            {isPublishing ? '...' : 'Share Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedFilters({ feedFilter, setFeedFilter, feedSort, setFeedSort }) {
  const baseButtonClass =
    'flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors whitespace-nowrap';
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortOptions = [
    { id: 'following', label: 'Following' },
    { id: 'recent', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
  ];
  const activeSortLabel = sortOptions.find((option) => option.id === feedSort)?.label || 'Following';

  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide text-[13px] font-semibold text-[#665c52] dark:text-stone-400">
        <button 
          onClick={() => setFeedFilter('all')} 
          className={`rounded-full px-4 py-1.5 transition-colors whitespace-nowrap ${feedFilter === 'all' ? 'border border-[#cfdbff] bg-[#e8efff] text-[#2563ff] dark:border-[#35594f] dark:bg-[#244139]/40 dark:text-[#86cbbb]' : 'hover:bg-[#f1ede7] dark:hover:bg-[#241d18]'}`}
        >
          All
        </button>
        <button
          onClick={() => setFeedFilter('interested')}
          className={`${baseButtonClass} ${feedFilter === 'interested' ? 'border border-[#cfdbff] bg-[#e8efff] text-[#2563ff] dark:border-[#35594f] dark:bg-[#244139]/40 dark:text-[#86cbbb]' : 'hover:bg-[#f1ede7] dark:hover:bg-[#241d18]'}`}
        >
          <UserPlus size={14} className={feedFilter === 'interested' ? 'text-[#2563ff]' : 'text-slate-400'} />
          Interested
        </button>
        <button
          onClick={() => setFeedFilter('discussion')}
          className={`${baseButtonClass} ${feedFilter === 'discussion' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300' : 'hover:bg-[#f1ede7] dark:hover:bg-[#241d18]'}`}
        >
          <MessageSquarePlus size={14} className={feedFilter === 'discussion' ? 'text-orange-600 dark:text-orange-300' : 'text-slate-400'} />
          Discussions
        </button>
        <button
          onClick={() => setFeedFilter('sharing')}
          className={`${baseButtonClass} ${feedFilter === 'sharing' ? 'bg-[#eefaf2] text-[#10b981] dark:bg-[#4a2f20]/50 dark:text-[#e1ab8d]' : 'hover:bg-[#f1ede7] dark:hover:bg-[#241d18]'}`}
        >
          <BookOpen size={14} className={feedFilter === 'sharing' ? 'text-[#10b981]' : 'text-slate-400'} />
          Sharing
        </button>
      </div>
      <div className="relative ml-4 hidden sm:block">
        <button
          onClick={() => setIsSortMenuOpen((open) => !open)}
          className="flex items-center gap-1 whitespace-nowrap text-[12px] text-[#928679] transition-colors hover:text-[#5f554b] dark:text-stone-400 dark:hover:text-stone-200"
        >
          <span>Sort by:</span>
          <span className="flex items-center font-bold text-[#1f1b16] dark:text-stone-100">
            {activeSortLabel}
            <ChevronDown size={14} className={`ml-1 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {isSortMenuOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 min-w-[140px] rounded-2xl border border-[#e8e1d8] bg-white p-1.5 shadow-[0_14px_40px_rgba(43,54,78,0.12)] dark:border-[#2e2620] dark:bg-[#1d1713]">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setFeedSort(option.id);
                  setIsSortMenuOpen(false);
                }}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors ${feedSort === option.id ? 'bg-[#eefaf2] text-[#10b981] dark:bg-[#4a2f20]/50 dark:text-[#e1ab8d]' : 'text-[#665c52] hover:bg-[#f1ede7] dark:text-stone-300 dark:hover:bg-[#241d18]'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Feed({ posts, user, usersInfo, feedFilter, feedSort, searchQuery, setCurrentView, setSelectedProfileId }) {
  const currentUserData = usersInfo[user?.uid] || {};
  const following = currentUserData.following || [];


  let filteredPosts = [...posts];

  if (feedFilter === 'interested') {
    filteredPosts = filteredPosts.filter(p => p.postType === 'interested');
  } else if (feedFilter === 'sharing') {
    filteredPosts = filteredPosts.filter(p => p.postType === 'sharing');
  } else if (feedFilter === 'discussion') {
    filteredPosts = filteredPosts.filter(p => p.postType === 'discussion');
  }

  if (searchQuery && searchQuery.trim()) {
    const lowerQ = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(p => {
      const contentMatch = p.content?.toLowerCase().includes(lowerQ);
      const titleMatch = p.title?.toLowerCase().includes(lowerQ);
      const skillMatch = p.skills?.some(skill => skill.toLowerCase().includes(lowerQ));
      const authorMatch = usersInfo[p.authorId]?.displayName?.toLowerCase().includes(lowerQ);
      return contentMatch || titleMatch || skillMatch || authorMatch;
    });
  }

  filteredPosts.sort((a, b) => {
    const timeA = Number(a.createdAt) || 0;
    const timeB = Number(b.createdAt) || 0;

    if (feedSort === 'oldest') {
      return timeA - timeB;
    }

    if (feedSort === 'following') {
      const aPriority = following.includes(a.authorId) || a.authorId === user?.uid ? 1 : 0;
      const bPriority = following.includes(b.authorId) || b.authorId === user?.uid ? 1 : 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
    }

    return timeB - timeA;
  });

  if (filteredPosts.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[#e8e1d8] bg-[#fffdfa] p-12 text-center shadow-[0_12px_30px_rgba(43,54,78,0.08)] dark:border-[#2e2620] dark:bg-[#1d1713]">
        <p className="text-[14px] font-medium text-[#928679] dark:text-stone-400">No posts found. Try a different filter or search term!</p>
      </div>
    );
  }

  return (
      <motion.div className="pb-12 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}>
      <AnimatePresence>
      {filteredPosts.map(post => (
        <AppPostCard
          key={post.id}
          post={post}
          user={user}
          usersInfo={usersInfo}
          setCurrentView={setCurrentView}
          setSelectedProfileId={setSelectedProfileId}
        />
      ))}
      </AnimatePresence>
    </motion.div>
  );
}

function PostCard({ post, user, usersInfo, setCurrentView, setSelectedProfileId }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const commentImageInputRef = useRef(null);

  const author = usersInfo[post.authorId] || { 
    displayName: 'Unknown User', 
    photoURL: `https://i.pravatar.cc/150?u=${post.authorId}`,
    role: 'Member'
  };
  
  const currentUserData = usersInfo[user?.uid] || {};
  const isSaved = currentUserData.savedPosts?.includes(post.id);
  const media = post.mediaUrl || post.imageUrl;
  const isVideo = media && ((post.mediaType || '').startsWith('video') || media.match(/\.(mp4|webm|ogg)$/i) || media.startsWith('data:video'));
  const reactionOptions = [
    { id: 'like', emoji: '👍', label: 'Like', color: 'bg-blue-500' },
    { id: 'celebrate', emoji: '👏', label: 'Celebrate', color: 'bg-green-500' },
    { id: 'support', emoji: '🤝', label: 'Support', color: 'bg-purple-500' },
    { id: 'love', emoji: '❤️', label: 'Love', color: 'bg-rose-500' },
    { id: 'insightful', emoji: '💡', label: 'Insightful', color: 'bg-amber-500' },
    { id: 'funny', emoji: '😄', label: 'Funny', color: 'bg-cyan-500' },
  ];
  const commentEmojiOptions = ['😀', '😂', '😍', '👏', '🔥', '👍', '🎉', '💡'];
  const reactions = post.reactions || (post.likes || []).map((userId) => ({ userId, type: 'like' }));
  const currentReaction = reactions.find((reaction) => reaction.userId === user?.uid)?.type || null;
  const isLiked = currentReaction === 'like';
  const reactionCount = reactions.length;
  const reports = post.reports || [];
  const isReported = user?.uid ? reports.includes(user.uid) : false;
  const commentCount = (post.comments || []).length;
  const topReactionTypes = [...new Set(reactions.map((reaction) => reaction.type))].slice(0, 3);
  

  const visibleReactionOptions = isLiked 
    ? reactionOptions.filter((reaction) => reaction.id !== 'like')
    : reactionOptions;

  const timeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  const handleLike = async () => {
    await handleReactionSelect(currentReaction === 'like' ? null : 'like');
  };

  const handleReactionSelect = async (type) => {
    if (!user) return;
    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'posts', post.id);
    try {
      const existing = reactions.find((reaction) => reaction.userId === user.uid);
      let nextReactions;

      if (!type && existing) {
        nextReactions = reactions.filter((reaction) => reaction.userId !== user.uid);
      } else if (existing) {
        nextReactions = reactions.map((reaction) =>
          reaction.userId === user.uid ? { ...reaction, type } : reaction
        );
      } else {
        nextReactions = [...reactions, { userId: user.uid, type }];
      }

      await updateDoc(postRef, {
        reactions: nextReactions,
        likes: nextReactions.map((reaction) => reaction.userId),
      });
      setShowReactionPicker(false);
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (!user || user.uid !== post.authorId) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', post.id));
    } catch (err) {}
  };

  const handleAddComment = async () => {
    if (!user || (!commentText.trim() && !commentImage)) return;
    setIsCommenting(true);
    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'posts', post.id);
    try {
      const newComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        authorId: user.uid,
        text: commentText.trim(),
        imageUrl: commentImage,
        createdAt: Date.now()
      };
      await updateDoc(postRef, { comments: arrayUnion(newComment) });
      setCommentText('');
      setCommentImage('');
      setShowCommentEmojiPicker(false);
    } catch (err) {}
    setIsCommenting(false);
  };

  const handleCommentImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }

    if (file.size > 1048576) {
      alert('Comment image is too large for this demo database (Max 1MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCommentImage(event.target?.result || '');
      setShowComments(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    const targetComment = (post.comments || []).find((comment) => comment.id === commentId);
    if (!targetComment || targetComment.authorId !== user.uid) return;

    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'posts', post.id);
    try {
      await updateDoc(postRef, {
        comments: (post.comments || []).filter((comment) => comment.id !== commentId),
      });
    } catch (err) {}
  };

  const handleSave = async () => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    try {
      if (isSaved) {
        await updateDoc(userRef, { savedPosts: arrayRemove(post.id) });
      } else {
        await updateDoc(userRef, { savedPosts: arrayUnion(post.id) });
      }
    } catch (err) {}
  };

  const handleReport = async () => {
    if (!user) return;
    if (isReported) return;
    try {
      await updatePost(post.id, {
        reports: [...reports, user.uid],
      });
      notifyPostsChanged();
      alert('Report submitted. Thanks for helping keep the feed safe.');
    } catch (err) {
      console.error('Report update failed:', err);
    }
  };

  const handleSend = async () => {
    const url = `${window.location.origin}/#post-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'Check out this post',
          text: post.content?.slice(0, 120) || 'Take a look at this post',
          url,
        });
        return;
      } catch {
      }
    }

    try {
      await navigator.clipboard?.writeText(url);
    } catch {
    }
  };

  const getTypeStyle = (type) => {
    switch(type) {
      case 'sharing': return { color: 'text-emerald-600', icon: BookOpen, label: 'Sharing', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
      case 'discussion': return { color: 'text-orange-500', icon: MessageCircle, label: 'Discussion', bg: 'bg-orange-50 dark:bg-orange-500/10' };
      case 'interested': return { color: 'text-blue-600', icon: UserPlus, label: 'Interested', bg: 'bg-blue-50 dark:bg-blue-500/10' };
      default: return null;
    }
  };
  const typeStyle = getTypeStyle(post.postType);
  const openAuthorProfile = (authorId) => {
    if (!authorId) return;
    setSelectedProfileId?.(authorId);
    setCurrentView?.('profile');
  };

  return (
    <div className="rounded-[1.7rem] border border-[#e8e1d8] bg-[#fffdfa] p-6 shadow-[0_12px_30px_rgba(43,54,78,0.08)] dark:border-[#2e2620] dark:bg-[#1d1713]">

      <div className="flex items-start gap-3 mb-2">
        <button onClick={() => openAuthorProfile(post.authorId)} className="shrink-0 cursor-pointer">
          <img src={author.photoURL} alt={author.displayName} className="h-10 w-10 rounded-full border border-[#ece4da] bg-[#f8f4ee] object-cover dark:border-[#2c241e] dark:bg-[#241d18]" />
        </button>
        
        <div className="flex-1 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
               <button onClick={() => openAuthorProfile(post.authorId)} className="cursor-pointer text-[15px] font-bold text-[#1f1b16] hover:underline dark:text-stone-100">
                 {author.displayName}
               </button>
            </div>
            <div className="text-[12px] font-medium text-[#928679] dark:text-stone-400">{timeAgo(post.createdAt)}</div>
          </div>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full p-1.5 text-[#aea295] transition-colors hover:bg-[#f1ede7] hover:text-[#655b50] dark:hover:bg-[#241d18]">
              <MoreHorizontal size={18} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-[#e8e1d8] bg-[#fffdfa] py-1 shadow-[0_18px_36px_rgba(43,54,78,0.08)] dark:border-[#332a24] dark:bg-[#211b17]">
                {user?.uid === post.authorId && (
                  <button onClick={() => { handleDelete(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <Trash2 size={14} /> Delete Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


      {typeStyle && (
        <div className={`flex items-center gap-1.5 mb-3 ${typeStyle.color} text-[13px] font-semibold mt-1`}>
          <typeStyle.icon size={14} /> {typeStyle.label}
        </div>
      )}


      <div className="mb-4">
        {post.title && <h3 className="mb-1 text-[16px] font-bold text-[#1f1b16] dark:text-stone-100">{post.title}</h3>}
        <p className="whitespace-pre-wrap text-[14px] text-[#534a42] dark:text-stone-200">{post.content}</p>
        
        {post.skills && post.skills.length > 0 && post.skills[0] !== 'Feed' && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.skills.map(skill => (
              <span key={skill} className="cursor-pointer text-[13px] text-[#2563ff] hover:underline dark:text-[#86cbbb]">
                #{skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {post.attachment?.url && (
        <div className="mb-4">
          <a
            href={post.attachment.url}
            download={post.attachment.name || 'attachment'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
          >
            <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Paperclip size={14} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                {post.attachment.name || 'Attachment'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Open or download attachment</p>
            </div>
          </a>
        </div>
      )}


      {media && (
        <div className="mb-4 flex max-h-[460px] items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          {isVideo ? (
            <video src={media} controls playsInline className="max-h-[460px] w-full object-contain" />
          ) : (
            <img src={media} alt="Post media" className="max-h-[460px] w-full object-contain" />
          )}
        </div>
      )}

      {(reactionCount > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between pb-3 text-[12px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {reactionCount > 0 && (
              <>
                <div className="flex -space-x-1">
                  {topReactionTypes.map((type) => {
                    const reaction = reactionOptions.find((option) => option.id === type);
                    return (
                      <span key={type} className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[12px] shadow-sm dark:border-slate-900 ${reaction?.color || 'bg-slate-400'}`}>
                        {reaction?.emoji || '👍'}
                      </span>
                    );
                  })}
                </div>
                <span>{reactionCount}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {commentCount > 0 && <span>{commentCount} comment{commentCount > 1 ? 's' : ''}</span>}
          </div>
        </div>
      )}


      <div className="relative grid grid-cols-4 items-center gap-2 border-t border-slate-100 pt-3 text-slate-500 dark:border-slate-800">
        {showReactionPicker && (
          <div className="absolute -top-16 left-0 z-20 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {visibleReactionOptions.map((reaction) => (
              <button
                key={reaction.id}
                onClick={() => handleReactionSelect(reaction.id)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[20px] transition-transform hover:-translate-y-1"
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        )}

        <button onClick={handleLike} onContextMenu={(e) => { e.preventDefault(); setShowReactionPicker((value) => !value); }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${isLiked ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <Heart size={18} className={isLiked ? 'fill-current' : ''} />
          {!isLiked && <span>{currentReaction ? reactionOptions.find((reaction) => reaction.id === currentReaction)?.label || 'Like' : 'Like'}</span>}
          {reactionCount > 0 && <span className="ml-1 text-xs">({reactionCount})</span>}
        </button>

        <button onClick={() => setShowComments((value) => !value)} className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>

        <button onClick={handleReport} disabled={isReported} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${isReported ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <Flag size={18} className={isReported ? 'fill-current' : ''} />
          <span>{isReported ? 'Reported' : 'Report'}</span>
        </button>

        <button onClick={handleSend} className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
          <Send size={18} />
          <span>Send</span>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={commentImageInputRef}
          onChange={handleCommentImageUpload}
        />
        <img src={usersInfo[user?.uid]?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
        <div className="relative flex-1">
          {showCommentEmojiPicker && (
            <div className="absolute -top-14 right-0 z-20 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {commentEmojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setCommentText((value) => `${value}${emoji}`);
                    setShowCommentEmojiPicker(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] transition-transform hover:-translate-y-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <input 
            type="text" 
            value={commentText}
            onFocus={() => setShowComments(true)}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Add a comment..."
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-4 pr-24 text-[13px] outline-none transition-colors focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-3 text-slate-400">
            <button onClick={() => setShowCommentEmojiPicker((value) => !value)} className="transition-colors hover:text-slate-600 dark:hover:text-slate-200">
              <Smile size={18} />
            </button>
            <button onClick={() => commentImageInputRef.current?.click()} className="transition-colors hover:text-slate-600 dark:hover:text-slate-200">
              <ImageIcon size={18} />
            </button>
          </div>
        </div>
        <button 
          onClick={handleAddComment} 
          disabled={(!commentText.trim() && !commentImage) || isCommenting} 
          className={`rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-all ${
            (commentText.trim() || commentImage) 
              ? 'bg-blue-600 hover:bg-blue-700 shadow-sm active:scale-95' 
              : 'bg-[#9ec0ff] cursor-not-allowed opacity-80'
          } disabled:opacity-50`}
        >
          Post
        </button>
      </div>

      {commentImage && (
        <div className="mt-3 ml-11 max-w-[220px]">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <img src={commentImage} alt="Comment attachment" className="w-full object-cover" />
            <button
              onClick={() => setCommentImage('')}
              className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1.5 text-white transition-colors hover:bg-slate-900/90"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <button className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-[12px] font-bold transition-colors">
           <BookOpen size={14}/> I Can Teach This
        </button>
        <button onClick={handleSave} className={`ml-auto hover:text-slate-700 dark:hover:text-slate-300 transition-colors ${isSaved ? 'text-blue-500' : 'text-slate-500'}`}>
          <Bookmark size={20} className={isSaved ? 'fill-current text-blue-500' : ''} />
        </button>
      </div>


      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {[...(post.comments||[])].sort((a, b) => b.createdAt - a.createdAt).map((c) => {
              const cAuthor = usersInfo[c.authorId] || { displayName: 'User', photoURL: `https://i.pravatar.cc/150?u=${c.authorId}` };
              return (
                <div key={c.id} className="flex gap-2">
                  <img src={cAuthor.photoURL} className="w-8 h-8 rounded-full mt-0.5 object-cover border border-slate-200 dark:border-slate-700" />
                  <div className="flex-1">
                    <div className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-[16px] rounded-tl-sm inline-block">
                      <span className="font-bold text-[13px] text-slate-900 dark:text-slate-100 mr-2">{cAuthor.displayName}</span>
                      <span className="text-[13px] text-slate-700 dark:text-slate-300">{c.text}</span>
                      {c.imageUrl && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                          <img src={c.imageUrl} alt="Comment attachment" className="max-w-[220px] object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 ml-2 mt-1">
                      <span>{timeAgo(c.createdAt)}</span>
                      {c.authorId === user?.uid && (
                        <button onClick={() => handleDeleteComment(c.id)} className="text-rose-500 transition-colors hover:text-rose-600">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileView({ user, usersInfo, posts, selectedProfileId, setCurrentView, setSelectedProfileId, setSelectedChatUserId }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');
  
  const profileUserId = selectedProfileId || user?.uid;
  const currentUserData = usersInfo[profileUserId] || {};
  const signedInUserData = usersInfo[user?.uid] || {};
  const userPosts = posts.filter(p => p.authorId === profileUserId);
  const isOwnProfile = !!user?.uid && profileUserId === user.uid;
  const isFollowing = !!user?.uid && !isOwnProfile && (signedInUserData.following || []).includes(profileUserId);

  useEffect(() => {
    setDisplayName(currentUserData.displayName || '');
    if (currentUserData.bio) setBio(currentUserData.bio);
    else setBio('');
    if (currentUserData.role) setRole(currentUserData.role);
    else setRole('');
  }, [currentUserData]);

  const saveProfile = async () => {
    if (!isOwnProfile) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    await updateDoc(userRef, { bio, role });
    setEditing(false);
  };

  const handleFollowToggle = async () => {
    if (!user || isOwnProfile) return;

    const currentUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    const targetUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', profileUserId);

    try {
      if (isFollowing) {
        await updateDoc(currentUserRef, { following: arrayRemove(profileUserId) });
        await updateDoc(targetUserRef, { followers: arrayRemove(user.uid) });
      } else {
        await updateDoc(currentUserRef, { following: arrayUnion(profileUserId) });
        await updateDoc(targetUserRef, { followers: arrayUnion(user.uid) });
      }
    } catch (error) {
      console.error('Follow error', error);
    }
  };

  const handleMessageClick = () => {
    if (!profileUserId || isOwnProfile) return;
    setSelectedChatUserId?.(profileUserId);
    setCurrentView('messages');
  };

  const followersCount = currentUserData.followers?.length || 0;
  const followingCount = currentUserData.following?.length || 0;
  const postsCount = userPosts.length;

  return (
    <div className="pb-12 space-y-7">
      <section className="overflow-hidden rounded-[2rem] border border-[#e8e1d8] bg-[#fffdfa] shadow-[0_18px_44px_rgba(43,54,78,0.08)] dark:border-[#2e2620] dark:bg-[#1d1713]">
        <div className="h-40 bg-[linear-gradient(135deg,#85b2ff_0%,#6fa4ff_48%,#b9d2ff_100%)] sm:h-52" />

        <div className="relative px-5 pb-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="relative -mt-16 sm:-mt-14">
              <img
                src={currentUserData.photoURL}
                alt={currentUserData.displayName || 'Profile'}
                className="h-28 w-28 rounded-[1.6rem] border-4 border-[#fffdfa] bg-[#edf3ff] object-cover shadow-lg dark:border-[#1d1713] sm:h-36 sm:w-36"
              />
            </div>

            <div className="flex flex-wrap gap-3 sm:pt-6">
              {isOwnProfile ? (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full border border-[#e8e1d8] px-6 py-3 text-[13px] font-semibold text-[#5d5349] transition-colors hover:bg-[#f1ede7] dark:border-[#3a3028] dark:text-stone-200 dark:hover:bg-[#241d18]"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleMessageClick}
                    className="flex items-center gap-2 rounded-full border border-[#2563ff] px-6 py-3 text-[13px] font-semibold text-[#2563ff] transition-colors hover:bg-[#e8efff] dark:border-[#4d8d7d] dark:text-[#86cbbb] dark:hover:bg-[#244139]/40"
                  >
                    <MessageCircle size={16} />
                    Message
                  </button>
                  <button
                    onClick={handleFollowToggle}
                    className={`rounded-full border px-6 py-3 text-[13px] font-semibold transition-colors ${
                      isFollowing
                        ? 'border-[#e8e1d8] text-[#1f1b16] hover:bg-[#f1ede7] dark:border-[#3a3028] dark:text-white dark:hover:bg-[#241d18]'
                        : 'border-[#2563ff] bg-[#2563ff] text-white hover:bg-[#1d4ed8]'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </>
              )}
            </div>
          </div>

          {editing && isOwnProfile ? (
            <div className="mt-6 grid gap-3">
              <input type="text" value={displayName} readOnly className="w-full rounded-2xl border border-[#e8e1d8] bg-[#f0ece7] px-4 py-3 text-sm text-[#7b7066] outline-none dark:border-[#312923] dark:bg-[#241d18] dark:text-stone-400" placeholder="Display name..." />
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-2xl border border-[#e8e1d8] bg-[#f6f2ec] px-4 py-3 text-sm text-[#1f1b16] outline-none focus:border-[#cfdbff] dark:border-[#312923] dark:bg-[#241d18] dark:text-stone-100" placeholder="Role..." />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[96px] w-full rounded-2xl border border-[#e8e1d8] bg-[#f6f2ec] px-4 py-3 text-sm text-[#1f1b16] outline-none focus:border-[#cfdbff] dark:border-[#312923] dark:bg-[#241d18] dark:text-stone-100" placeholder="Bio..." />
              <div className="flex flex-wrap gap-3">
                <button onClick={saveProfile} className="rounded-full bg-[#2563ff] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]">Save</button>
                <button onClick={() => setEditing(false)} className="rounded-full bg-[#f1ede7] px-5 py-2.5 text-sm font-semibold text-[#5f554b] transition-colors hover:bg-[#ece6de] dark:bg-[#241d18] dark:text-stone-200 dark:hover:bg-[#2a231d]">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#1f1b16] dark:text-[#f7efe4]">
                {currentUserData.displayName || 'Member'}
              </h1>
              <p className="mt-2 text-[18px] text-[#928679] dark:text-stone-400">
                {currentUserData.username || '@username'}
              </p>
              <p className="mt-4 max-w-2xl text-[14px] leading-6 text-[#5a5148] dark:text-stone-300">
                {currentUserData.bio || currentUserData.role || 'Exploring ideas and connecting with other builders.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-8 text-[15px] text-[#928679] dark:text-stone-400">
                <p><span className="mr-1 text-2xl font-bold text-[#1f1b16] dark:text-white">{followersCount}</span>Followers</p>
                <p><span className="mr-1 text-2xl font-bold text-[#1f1b16] dark:text-white">{followingCount}</span>Following</p>
                <p><span className="mr-1 text-2xl font-bold text-[#1f1b16] dark:text-white">{postsCount}</span>Posts</p>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={() => {
                    setSelectedProfileId(user?.uid || null);
                    setCurrentView('profile');
                  }}
                  className="mt-6 text-[13px] font-semibold text-[#928679] transition-colors hover:text-[#534a42] dark:text-stone-400 dark:hover:text-stone-200"
                >
                  Back to Your Profile
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-[-0.03em] text-[#1f1b16] dark:text-white">Posts</h2>
        {userPosts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-[#e8e1d8] bg-[#fffdfa] p-12 text-center text-[15px] text-[#ab9f92] shadow-[0_12px_30px_rgba(43,54,78,0.08)] dark:border-[#2e2620] dark:bg-[#1d1713] dark:text-stone-500">
            Posts will appear here
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                usersInfo={usersInfo}
                setCurrentView={setCurrentView}
                setSelectedProfileId={setSelectedProfileId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SidebarRight({ usersInfo, currentUser, setCurrentView, setSelectedProfileId, messageThreads, setSelectedChatUserId }) {
  const currentUserData = usersInfo[currentUser?.uid] || {};
  
  const topContributors = Object.values(usersInfo)
    .filter(u => u.uid !== currentUser?.uid)
    .slice(0, 4)
    .map(u => ({
      id: u.uid,
      name: u.displayName,
      role: u.role || u.skills?.[0] || 'Member',
      avatar: u.photoURL,
      isFollowing: currentUserData.following?.includes(u.uid)
    }));

  const handleFollowToggle = async (targetUserId) => {
    if (!currentUser) return;
    const isFollowing = currentUserData.following?.includes(targetUserId);
    
    const currentUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
    const targetUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', targetUserId);

    try {
      if (isFollowing) {
        await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
        await updateDoc(targetUserRef, { followers: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
        await updateDoc(targetUserRef, { followers: arrayUnion(currentUser.uid) });
      }
    } catch (err) {
      console.error("Follow error", err);
    }
  };

  const recentChats = (messageThreads || [])
    .map((thread) => {
      const otherUserId = thread.participants?.find((id) => id !== currentUser?.uid);
      const otherUser = usersInfo[otherUserId];
      if (!otherUser) return null;
      return {
        id: thread.id,
        otherUserId,
        name: otherUser.displayName,
        avatar: otherUser.photoURL,
        lastMessage: thread.lastMessage || 'Start a conversation',
      };
    })
    .filter(Boolean)
    .slice(0, 4);

  return (
    <aside className="hidden lg:block w-[300px] h-[calc(100vh-80px)] sticky top-[80px] overflow-y-auto scrollbar-hide pb-8">
      

      <div className="mb-4 rounded-[1.5rem] border border-[#e8e1d8] bg-[#fffdfa] p-5 shadow-[0_12px_30px_rgba(43,54,78,0.08)] dark:border-[#2e2620] dark:bg-[#1d1713]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="flex items-center gap-2 text-[14px] font-bold text-[#1f1b16] dark:text-stone-100">
            <BookOpen size={16} className="text-[#2563ff]"/> Top Contributors
          </h3>
          <button className="text-[12px] font-semibold text-[#2563ff] hover:underline dark:text-[#86cbbb]">See All</button>
        </div>
        
        <div className="space-y-4">
          {topContributors.length > 0 ? topContributors.map(user => (
            <div key={user.id} className="flex items-center gap-3">
              <img src={user.avatar} className="w-10 h-10 rounded-full border border-[#ece4da] dark:border-slate-800 object-cover" alt={user.name} />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => {
                    setSelectedProfileId?.(user.id);
                    setCurrentView?.('profile');
                  }}
                  className="truncate text-[13px] font-bold text-[#1f1b16] hover:underline dark:text-stone-100"
                >
                  {user.name}
                </button>
                <p className="truncate text-[11px] text-[#928679] dark:text-stone-400">{user.role}</p>
              </div>
              <button 
                onClick={() => handleFollowToggle(user.id)}
                className={`px-4 py-1.5 rounded-full border text-[12px] font-semibold transition-colors ${
                  user.isFollowing 
                    ? 'border-[#e8e1d8] bg-[#fffdfa] text-[#655b50] hover:bg-[#f1ede7] dark:border-[#3a3028] dark:bg-[#241d18] dark:text-stone-300' 
                    : 'border-[#2563ff] bg-transparent text-[#2563ff] hover:bg-[#e8efff]'
                }`}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )) : (
            <p className="text-[13px] text-slate-500 text-center py-2">No other users found.</p>
          )}
        </div>
      </div>


      <div className="mb-4 rounded-[1.5rem] border border-[#e8e1d8] bg-[#fffdfa] p-5 shadow-[0_12px_30px_rgba(43,54,78,0.08)] dark:border-[#2e2620] dark:bg-[#1d1713]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="flex items-center gap-2 text-[14px] font-bold text-[#1f1b16] dark:text-stone-100">
            <MessageSquare size={16} className="text-[#2563ff]"/> Messages
          </h3>
          <button className="text-slate-400 hover:text-slate-600 transition-colors"><PenTool size={14}/></button>
        </div>

        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full rounded-xl border border-[#ece5dc] bg-[#f6f2ec] py-1.5 pl-8 pr-3 text-[13px] text-[#1f1b16] outline-none transition-colors focus:border-[#cfdbff] dark:bg-[#241d18] dark:text-stone-100"
          />
        </div>

        {recentChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
             <p className="text-[13px] font-medium text-slate-500 mb-1">No messages yet</p>
             <button
               onClick={() => setCurrentView('friends')}
               className="text-[13px] font-semibold text-[#2563ff] hover:underline dark:text-[#86cbbb]"
             >
               Start a conversation
             </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setSelectedChatUserId?.(chat.otherUserId);
                  setCurrentView?.('messages');
                }}
                className="flex w-full items-center gap-3 text-left"
              >
                <img src={chat.avatar} className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-800 object-cover" alt={chat.name} />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-[13px] font-bold text-slate-900 dark:text-slate-100">{chat.name}</h4>
                  <p className="truncate text-[11px] text-slate-500">{chat.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setCurrentView('messages')}
          className="mt-2 w-full border-t border-[#f1ece5] pt-3 text-center text-[13px] font-bold text-[#2563ff] hover:underline dark:border-[#2c241e] dark:text-[#86cbbb]"
        >
          View All Messages
        </button>
      </div>

    </aside>
  );
}

function MobileNav({ currentView, setCurrentView, user, setSelectedProfileId }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#e8e1d8] bg-[#fffdfa]/94 p-3 pb-safe shadow-[0_-6px_18px_rgba(43,54,78,0.08)] backdrop-blur-xl dark:border-[#2e2620] dark:bg-[#1a1512]/94 md:hidden">
      <button onClick={() => setCurrentView('home')} className={`rounded-xl p-2 transition-all ${currentView === 'home' ? 'bg-[#e8efff] text-[#2563ff] dark:bg-[#244139]/40 dark:text-[#86cbbb]' : 'text-[#928679] hover:text-[#2563ff]'}`}>
        <Home size={22} className={currentView === 'home' ? 'fill-current' : ''} />
      </button>
      <button onClick={() => setCurrentView('explore')} className={`rounded-xl p-2 transition-all ${currentView === 'explore' ? 'bg-[#e8efff] text-[#2563ff] dark:bg-[#244139]/40 dark:text-[#86cbbb]' : 'text-[#928679] hover:text-[#2563ff]'}`}>
        <Compass size={22} className={currentView === 'explore' ? 'fill-current' : ''}/>
      </button>
      <button onClick={() => { setSelectedProfileId(user?.uid || null); setCurrentView('profile'); }} className={`rounded-xl p-2 transition-all ${currentView === 'profile' ? 'bg-[#e8efff] text-[#2563ff] dark:bg-[#244139]/40 dark:text-[#86cbbb]' : 'text-[#928679] hover:text-[#2563ff]'}`}>
        <UserIcon size={22} className={currentView === 'profile' ? 'fill-current' : ''}/>
      </button>
    </nav>
  );
}