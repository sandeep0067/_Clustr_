import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, MessageCircle, MessageSquare, Search, Camera, X, Trash2, MoreHorizontal } from 'lucide-react';
import PostCard from '../components/PostCard';
import { deleteConversation, notifyConversationsChanged, saveConversation, toggleFollow, updateUser } from '../lib/mongoApi';

export function ProfileView({ user, usersInfo, posts, selectedProfileId, setCurrentView, setSelectedProfileId, setSelectedChatUserId }) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const photoInputRef = useRef(null);

  const profileUserId = selectedProfileId || user?.uid;
  const currentUserData = usersInfo[profileUserId] || {};
  const signedInUserData = usersInfo[user?.uid] || {};
  const userPosts = posts.filter((p) => p.authorId === profileUserId);
  const isOwnProfile = !!user?.uid && profileUserId === user.uid;
  const isFollowing = !!user?.uid && !isOwnProfile && (signedInUserData.following || []).includes(profileUserId);

  const saveProfile = async () => {
    if (!isOwnProfile) return;
    await updateUser(user.uid, { bio, role });
    setEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 2097152) {
      alert('Image is too large. Max size is 2MB.');
      return;
    }

    try {
      setUploadingPhoto(true);

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = async () => {
        const maxWidth = 400;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.75);

        await updateUser(user.uid, { photoURL: compressedImageUrl });

        setUploadingPhoto(false);
        alert('Profile picture updated successfully!');
      };

      img.onerror = () => {
        setUploadingPhoto(false);
        alert('Failed to load image. Please try another image.');
      };

      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target?.result || '';
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingPhoto(false);
      console.error('Photo upload error:', error);
      alert('Could not upload photo. Please try again.');
    }

    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleFollowToggle = async () => {
    if (!user || isOwnProfile) return;

    try {
      await toggleFollow(user.uid, profileUserId);
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
  const profileSummary =
    currentUserData.bio ||
    currentUserData.role ||
    currentUserData.email ||
    'No profile details added yet.';

  return (
    <div className="space-y-7 pb-12">
      <section className="overflow-hidden rounded-[2rem] border border-[#dbe2ff] bg-[#f9fbff] shadow-[0_18px_44px_rgba(90,101,195,0.12)] dark:border-[#2d2b4f] dark:bg-[#16152a]">
        <div className="h-40 bg-[linear-gradient(135deg,#22c7f5_0%,#6395ff_42%,#8b5cf6_76%,#d946ef_100%)] sm:h-52" />

        <div className="relative px-5 pb-8 sm:px-8">
          <div className="flex flex-col items-start">
            <div className="relative -mt-16 sm:-mt-14 mb-4">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
              <img 
                src={currentUserData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserData.displayName || 'User')}&background=random`} 
                alt={currentUserData.displayName || 'Profile'} 
                onClick={() => setShowPhotoModal(true)}
                className="h-32 w-32 rounded-[1.5rem] border-4 border-[#f9fbff] dark:border-[#16152a] object-cover bg-white shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
              />
              {isOwnProfile && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-2 -right-2 rounded-full bg-blue-600 p-2.5 text-white hover:bg-blue-700 shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                  title="Upload Photo"
                >
                  <Camera size={18} />
                </button>
              )}
            </div>

            <div className="w-full text-left">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {currentUserData.displayName || 'User'}
                  </h2>
                  <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentUserData.email || currentUserData.username || 'No email provided'}
                  </p>
                </div>
                
                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleFollowToggle}
                      className={`rounded-full px-5 py-2 text-[13px] font-bold transition-all ${
                        isFollowing
                          ? 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={handleMessageClick}
                      className="rounded-full border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      <MessageCircle size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 max-w-2xl">
                {currentUserData.bio || currentUserData.role || 'No bio yet.'}
              </div>

              <div className="flex gap-6 mt-6 text-[14px] text-slate-500 dark:text-slate-400">
                <p><span className="font-bold text-slate-900 dark:text-white mr-1">{postsCount}</span> Posts</p>
                <p><span className="font-bold text-slate-900 dark:text-white mr-1">{followersCount}</span> Followers</p>
                <p><span className="font-bold text-slate-900 dark:text-white mr-1">{followingCount}</span> Following</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
            {editing && isOwnProfile ? (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition-all"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition-all"
                    placeholder="Your role (e.g. Frontend Developer)"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={saveProfile}
                    className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-full border border-slate-200 px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : isOwnProfile ? (
              <button
                onClick={() => setEditing(true)}
                className="rounded-full border border-slate-200 px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Edit Profile
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {userPosts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Posts</h3>
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} usersInfo={usersInfo} setCurrentView={setCurrentView} setSelectedProfileId={setSelectedProfileId} />
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full flex justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute -top-12 right-0 md:-right-12 md:top-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <img 
                src={currentUserData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserData.displayName || 'User')}&background=random`} 
                alt={currentUserData.displayName || 'Profile Full'} 
                className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl" 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SearchResultsView({ searchQuery, posts, usersInfo, user, setCurrentView, setSelectedProfileId }) {
  const lowerQuery = searchQuery.trim().toLowerCase();
  const users = Object.values(usersInfo).filter((profile) => {
    if (!lowerQuery) return false;
    return (
      profile.displayName?.toLowerCase().includes(lowerQuery) ||
      profile.username?.toLowerCase().includes(lowerQuery) ||
      profile.role?.toLowerCase().includes(lowerQuery) ||
      profile.skills?.some((skill) => skill.toLowerCase().includes(lowerQuery))
    );
  });

  const matchingPosts = posts.filter((post) => {
    if (!lowerQuery) return false;
    return (
      post.title?.toLowerCase().includes(lowerQuery) ||
      post.content?.toLowerCase().includes(lowerQuery) ||
      post.skills?.some((skill) => skill.toLowerCase().includes(lowerQuery)) ||
      usersInfo[post.authorId]?.displayName?.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <div className="pb-12 space-y-6">
      <div className="px-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Search Results</h2>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Results for "{searchQuery}"
        </p>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">People</h3>
          <span className="text-[12px] text-slate-400">{users.length}</span>
        </div>
        {users.length === 0 ? (
          <p className="text-[13px] text-slate-500">No matching people found.</p>
        ) : (
          <div className="space-y-3">
            {users.map((profile) => (
              <button
                key={profile.uid}
                onClick={() => {
                  setSelectedProfileId(profile.uid);
                  setCurrentView('profile');
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <img src={profile.photoURL} alt={profile.displayName} className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{profile.displayName}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    {profile.role || 'Member'}{profile.uid === user?.uid ? ' • You' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Posts</h3>
          <span className="text-[12px] text-slate-400">{matchingPosts.length}</span>
        </div>
        {matchingPosts.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-[13px] text-slate-500">
            No matching posts found.
          </div>
        ) : (
          <div className="space-y-4">
            {matchingPosts.map((post) => (
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

export function FriendsView({ user, usersInfo, setCurrentView, setSelectedProfileId, setSelectedChatUserId }) {
  const currentUserData = usersInfo[user?.uid] || {};
  const followers = (currentUserData.followers || []).map((id) => usersInfo[id]).filter(Boolean);
  const following = (currentUserData.following || []).map((id) => usersInfo[id]).filter(Boolean);
  const suggestions = Object.values(usersInfo)
    .filter((profile) => profile.uid !== user?.uid && !currentUserData.following?.includes(profile.uid))
    .slice(0, 6);

  const renderFriendCard = (profile, showChat = true) => (
    <div key={profile.uid} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <button
        onClick={() => {
          setSelectedProfileId(profile.uid);
          setCurrentView('profile');
        }}
        className="flex items-center gap-3 text-left"
      >
        <img src={profile.photoURL} alt={profile.displayName} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
        <div>
          <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{profile.displayName}</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">{profile.role || 'Member'}</p>
        </div>
      </button>
      {showChat && (
        <button
          onClick={() => {
            setSelectedChatUserId(profile.uid);
            setCurrentView('messages');
          }}
          className="rounded-full border border-blue-500 px-4 py-1.5 text-[12px] font-semibold text-blue-600 transition-colors hover:bg-blue-50"
        >
          Chat
        </button>
      )}
    </div>
  );

  return (
    <div className="pb-12 space-y-6">
      <div className="px-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Friends</h2>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Manage the people you follow and message.</p>
      </div>

      <section>
        <h3 className="mb-3 px-2 text-[15px] font-bold text-slate-900 dark:text-slate-100">Following</h3>
        {following.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-[13px] text-slate-500">You are not following anyone yet.</div>
        ) : (
          <div className="space-y-3">{following.map((profile) => renderFriendCard(profile))}</div>
        )}
      </section>

      <section>
        <h3 className="mb-3 px-2 text-[15px] font-bold text-slate-900 dark:text-slate-100">Followers</h3>
        {followers.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-[13px] text-slate-500">No followers yet.</div>
        ) : (
          <div className="space-y-3">{followers.map((profile) => renderFriendCard(profile))}</div>
        )}
      </section>

      <section>
        <h3 className="mb-3 px-2 text-[15px] font-bold text-slate-900 dark:text-slate-100">Suggested People</h3>
        {suggestions.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-[13px] text-slate-500">No suggestions right now.</div>
        ) : (
          <div className="space-y-3">{suggestions.map((profile) => renderFriendCard(profile, false))}</div>
        )}
      </section>
    </div>
  );
}

export function ExploreView({ setSearchQuery, setCurrentView }) {
  const handleTopicClick = (topic) => {
    setSearchQuery(topic);
    setCurrentView('home');
  };

  return (
    <div className="pb-12">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 px-2">
         Explore Network
      </h2>
      <div className="grid gap-4">
        {['React', 'UI/UX Design', 'Backend Systems', 'Cloud DevOps'].map(topic => (
          <div 
            key={topic} 
            onClick={() => handleTopicClick(topic)}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm font-bold text-slate-800 dark:text-slate-200 text-center cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {topic}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookmarksView({ user, usersInfo, posts }) {
  const currentUserData = usersInfo[user?.uid] || {};
  const savedPostIds = currentUserData.savedPosts || [];
  const savedPosts = posts.filter(p => savedPostIds.includes(p.id));

  return (
    <div className="pb-12">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 px-2 flex items-center gap-2">
        <Bookmark size={24} className="text-blue-500"/> Saved Content
      </h2>
      {savedPosts.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          No saved posts yet.
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts.map(post => <PostCard key={post.id} post={post} user={user} usersInfo={usersInfo} />)}
        </div>
      )}
    </div>
  );
}

export function MessagesView({ user, usersInfo, messageThreads, selectedChatUserId, setSelectedChatUserId, setCurrentView, setSelectedProfileId, socket, socketConnected, socketError }) {
  const [inputText, setInputText] = useState('');
  const [showOptionsId, setShowOptionsId] = useState(null);
  
  const activeThread = selectedChatUserId 
    ? messageThreads.find(t => t.participants?.includes(selectedChatUserId)) 
    : null;
    
  const activeChatUser = selectedChatUserId ? usersInfo[selectedChatUserId] : null;

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedChatUserId || !user?.uid) return;
    
    if (socket && socketConnected) {
      socket.emit('message:send', {
        from: user.uid,
        to: selectedChatUserId,
        text: inputText.trim()
      });
      setInputText('');
    }
  };

  const handleDeleteChat = async (threadId) => {
    if (window.confirm("Are you sure you want to delete this entire conversation? This cannot be undone.")) {
      try {
        await deleteConversation(threadId);
        notifyConversationsChanged();
        if (activeThread?.id === threadId) {
          setSelectedChatUserId(null);
        }
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        alert("Failed to delete conversation. Please try again.");
      }
    }
  };

  if (selectedChatUserId && activeChatUser) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedChatUserId(null)}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
            >
              <X size={20} />
            </button>
            <button 
              onClick={() => { setSelectedProfileId(activeChatUser.uid); setCurrentView('profile'); }}
              className="flex items-center gap-3 text-left"
            >
              <img src={activeChatUser.photoURL} alt={activeChatUser.displayName} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-[14px] font-bold text-slate-900 dark:text-white">{activeChatUser.displayName}</p>
                <p className="text-[12px] text-slate-500">{socketConnected ? 'Online' : 'Offline'}</p>
              </div>
            </button>
          </div>
          {activeThread && (
            <button 
              onClick={() => handleDeleteChat(activeThread.id)}
              className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Delete Conversation"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fffdfa] dark:bg-[#1a1512]">
          {!activeThread?.messages?.length ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p className="text-[14px]">Send a message to start the conversation.</p>
            </div>
          ) : (
            activeThread.messages.map((msg, idx) => {
              const isOwnMessage = (msg.authorId || msg.senderId) === user?.uid;
              const msgTime = msg.createdAt || msg.timestamp;
              return (
                <div key={idx} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwnMessage 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                  }`}>
                    <p className="text-[14px] leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${isOwnMessage ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msgTime ? new Date(msgTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {socketError && (
            <div className="mb-2 text-[12px] text-red-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Disconnected from chat server
            </div>
          )}
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2.5 text-[14px] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || !socketConnected}
              className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MessageSquare size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inbox View
  return (
    <div className="pb-12">
      <div className="px-2 mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle size={24} className="text-blue-500"/> Messages
        </h2>
        {socketError && <p className="text-[12px] text-red-500 mt-1">Disconnected. Reconnecting...</p>}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {messageThreads.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <MessageSquare size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">No messages yet</p>
            <p className="text-[13px] text-slate-500 mt-1 mb-6">Connect with friends to start chatting.</p>
            <button 
              onClick={() => setCurrentView('friends')}
              className="px-6 py-2 bg-blue-600 text-white rounded-full text-[13px] font-semibold hover:bg-blue-700 transition-colors"
            >
              Find Friends
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {messageThreads.map(thread => {
              const otherUserId = thread.participants?.find(id => id !== user?.uid);
              const otherUser = usersInfo[otherUserId];
              if (!otherUser) return null;

              return (
                <div key={thread.id} className="relative group flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setSelectedChatUserId(otherUserId)}>
                  <img src={otherUser.photoURL} alt={otherUser.displayName} className="w-12 h-12 rounded-full object-cover mr-4 border border-slate-200 dark:border-slate-700" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[15px] font-bold text-slate-900 dark:text-white truncate pr-2">{otherUser.displayName}</h3>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {thread.messages?.length > 0 && new Date(thread.messages[thread.messages.length - 1].timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 truncate pr-8">
                      {thread.lastMessage || 'Start a conversation'}
                    </p>
                  </div>
                  
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setShowOptionsId(showOptionsId === thread.id ? null : thread.id)}
                      className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    
                    {showOptionsId === thread.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-10 overflow-hidden">
                        <button 
                          onClick={() => handleDeleteChat(thread.id)}
                          className="w-full text-left px-4 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Delete Conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
