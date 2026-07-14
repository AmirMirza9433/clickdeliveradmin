import {
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { chatService } from "../services/chatService";

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getPreview = (message) => {
  if (!message) return "No messages yet";
  if (message.deletedForEveryone) return "Message deleted";
  if (message.type === "text") return message.text || "Text message";
  return `${message.type} message`;
};

const fileNameFromUrl = (url) => {
  try {
    const clean = url.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "Attachment");
  } catch {
    return "Attachment";
  }
};

const isSupportParticipant = (participant) =>
  ["admin", "sub-admin"].includes(participant?.role);

const getEndUserParticipant = (conversation) =>
  conversation?.participants?.find((participant) => !isSupportParticipant(participant));

const formatParticipants = (conversation) => {
  if (conversation?.includesAdmin) {
    return getEndUserParticipant(conversation)?.user?.name || "User";
  }

  const names = (conversation.participants || [])
    .map((p) => p.user?.name)
    .filter(Boolean);
  return names.join(" · ") || "Unknown";
};

const formatVoiceTime = (seconds) => {
  const sec = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
};

const VoiceMessage = ({ url, durationMs = 0, isMine = false }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalSec, setTotalSec] = useState(
    durationMs > 0 ? Math.floor(durationMs / 1000) : 0,
  );
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentSec(0);
    setLoadError(false);
    setTotalSec(durationMs > 0 ? Math.floor(durationMs / 1000) : 0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [url, durationMs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onTimeUpdate = () => {
      setCurrentSec(audio.currentTime);
      if (audio.duration && Number.isFinite(audio.duration)) {
        setTotalSec(Math.floor(audio.duration));
        setProgress(Math.min(audio.currentTime / audio.duration, 1));
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setTotalSec(Math.floor(audio.duration));
      }
    };

    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentSec(0);
    };

    const onError = () => setLoadError(true);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [url]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || loadError) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      toast.error("Cannot play this voice message");
      setLoadError(true);
    }
  };

  const displaySec = playing ? currentSec : totalSec;

  return (
    <div className={`chat-voice ${isMine ? "mine" : "theirs"}`}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        className="chat-voice-hidden"
      />
      <button
        type="button"
        className="chat-voice-play"
        onClick={togglePlay}
        disabled={loadError}
        aria-label={playing ? "Pause voice" : "Play voice"}
      >
        {playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" />
        )}
      </button>
      <div className="chat-voice-body">
        <div className="chat-voice-track">
          <div
            className="chat-voice-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="chat-voice-time">{formatVoiceTime(displaySec)}</span>
        {loadError && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="chat-voice-fallback"
          >
            Open audio file
          </a>
        )}
      </div>
    </div>
  );
};

const Chats = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const [sidebarTab, setSidebarTab] = useState("users");
  const [chatUsers, setChatUsers] = useState([]);
  const [allConversations, setAllConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [canSendInSelected, setCanSendInSelected] = useState(true);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedConversation = useMemo(
    () => allConversations.find((c) => c._id === selectedId),
    [allConversations, selectedId],
  );

  const otherParticipant = useMemo(() => {
    if (!selectedConversation) return null;
    if (selectedConversation.includesAdmin) {
      return getEndUserParticipant(selectedConversation)?.user || null;
    }
    return null;
  }, [selectedConversation]);

  const filteredUsers = useMemo(() => {
    const usersInConversations = new Set(
      allConversations
        .filter((c) => c.includesAdmin)
        .flatMap((c) => {
          const endUser = getEndUserParticipant(c)?.user;
          return endUser?._id ? [endUser._id] : [];
        }),
    );

    let availableUsers = chatUsers.filter(
      (u) => !usersInConversations.has(u._id),
    );

    const q = userSearch.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q),
    );
  }, [chatUsers, userSearch, allConversations]);

  const loadSidebarData = useCallback(async () => {
    try {
      const [users, conversations] = await Promise.all([
        chatService.getChatUsers(),
        chatService.getAllConversations(),
      ]);
      setChatUsers(users || []);
      setAllConversations(conversations || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load chats");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setLoadingMessages(true);
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = io(chatService.getSocketBaseUrl(), {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", user._id);
    });

    socket.on("chat:message", (message) => {
      const conversationId =
        message.conversation?.toString?.() || message.conversation;
      setMessages((prev) => {
        if (conversationId !== selectedId) return prev;
        return prev.some((m) => m._id === message._id)
          ? prev
          : [...prev, message];
      });
      loadSidebarData();
    });

    socket.on("chat:messageUpdated", (message) => {
      const conversationId =
        message.conversation?.toString?.() || message.conversation;
      if (conversationId !== selectedId) return;
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m)),
      );
    });

    socket.on("chat:conversationUpdated", () => {
      loadSidebarData();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, selectedId, loadSidebarData]);

  useEffect(() => {
    if (selectedId && user?._id) {
      loadMessages(selectedId);
      socketRef.current?.emit("chat:openConversation", {
        conversationId: selectedId,
        userId: user._id,
      });
    } else {
      setMessages([]);
    }
  }, [selectedId, user?._id, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const mergeMessage = (message) => {
    setMessages((prev) =>
      prev.some((m) => m._id === message._id) ? prev : [...prev, message],
    );
  };

  const handleSelectConversation = (conversation, allowSend) => {
    setSelectedId(conversation._id);
    const canReply =
      typeof conversation.canReply === "boolean"
        ? conversation.canReply
        : allowSend && can("chats", "continue_chat");
    setCanSendInSelected(canReply);
    setText("");
    setShowAttachMenu(false);
    setImagePreview(null);
  };

  const handleStartChatWithUser = async (chatUser) => {
    try {
      let conversationId = chatUser.conversationId;
      if (!conversationId) {
        const conversation = await chatService.startConversation(chatUser._id);
        conversationId = conversation._id;
      }
      const refreshed = await chatService.getAllConversations();
      setAllConversations(refreshed || []);
      const users = await chatService.getChatUsers();
      setChatUsers(users || []);
      const conversation = (refreshed || []).find(
        (c) => c._id === conversationId,
      ) || {
        _id: conversationId,
        includesAdmin: true,
        participants: [
          { user: { _id: user._id, name: user.name, role: "admin" } },
          { user: chatUser },
        ],
      };
      handleSelectConversation(
        { ...conversation, _id: conversationId, includesAdmin: true },
        true,
      );
      setShowUserModal(false);
      setUserSearch("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to start chat");
    }
  };

  const handleSendText = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !selectedId || sending || !canSendInSelected) return;
    setSending(true);
    try {
      const message = await chatService.sendMessage(selectedId, {
        type: "text",
        text: text.trim(),
      });
      mergeMessage(message);
      setText("");
      loadSidebarData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendMedia = async (type, mediaUrl, extra = {}) => {
    if (!selectedId || !mediaUrl || !canSendInSelected) return;
    setSending(true);
    try {
      const message = await chatService.sendMessage(selectedId, {
        type,
        mediaUrl,
        ...extra,
      });
      mergeMessage(message);
      loadSidebarData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to send attachment",
      );
    } finally {
      setSending(false);
      setShowAttachMenu(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSending(true);
    try {
      const { imageUrl } = await chatService.uploadImage(file);
      await handleSendMedia("image", imageUrl);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Image upload failed");
      setSending(false);
    }
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSending(true);
    try {
      const { videoUrl } = await chatService.uploadVideo(file);
      await handleSendMedia("video", videoUrl);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Video upload failed");
      setSending(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSending(true);
    try {
      const { fileUrl } = await chatService.uploadFile(file);
      await handleSendMedia("file", fileUrl);
    } catch (error) {
      toast.error(error?.response?.data?.message || "File upload failed");
      setSending(false);
    }
  };

  const startVoiceRecording = async () => {
    if (isRecording || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone is not available");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(recordTimerRef.current);
        setRecordSeconds(0);
      };
      recorder.start();
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const cancelVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        recorder.stream?.getTracks().forEach((track) => track.stop());
      };
      recorder.stop();
    }
    recordChunksRef.current = [];
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const sendVoiceRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    const durationMs = recordSeconds * 1000;
    if (recordSeconds < 1) {
      cancelVoiceRecording();
      toast.error("Recording is too short");
      return;
    }
    await new Promise((resolve) => {
      recorder.onstop = async () => {
        recorder.stream?.getTracks().forEach((track) => track.stop());
        clearInterval(recordTimerRef.current);
        setIsRecording(false);
        setRecordSeconds(0);
        resolve();
      };
      recorder.stop();
    });
    const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
    recordChunksRef.current = [];
    if (!blob.size) return;
    setSending(true);
    try {
      const file = new File([blob], `voice_${Date.now()}.webm`, {
        type: "audio/webm",
      });
      const { fileUrl } = await chatService.uploadFile(file);
      await handleSendMedia("voice", fileUrl, { duration: durationMs });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send voice");
      setSending(false);
    }
  };

  const renderMessageContent = (message, isMine = false) => {
    if (message.deletedForEveryone) {
      return (
        <p className="chat-message-text muted">This message was deleted</p>
      );
    }
    if (message.type === "image" && message.mediaUrl) {
      return (
        <button
          type="button"
          className="chat-image-btn"
          onClick={() => setImagePreview(message.mediaUrl)}
        >
          <img src={message.mediaUrl} alt="Shared" className="chat-image" />
        </button>
      );
    }
    if (message.type === "video" && message.mediaUrl) {
      return (
        <video
          src={message.mediaUrl}
          controls
          className="chat-video"
          preload="metadata"
        />
      );
    }
    if (message.type === "voice" && message.mediaUrl) {
      return (
        <VoiceMessage
          url={message.mediaUrl}
          durationMs={message.duration}
          isMine={isMine}
        />
      );
    }
    if (message.type === "file" && message.mediaUrl) {
      return (
        <a
          href={message.mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="chat-file-link"
        >
          <FileText size={18} />
          {fileNameFromUrl(message.mediaUrl)}
        </a>
      );
    }
    return <p className="chat-message-text">{message.text}</p>;
  };

  const renderUserRow = (chatUser, showStartHint = false) => (
    <button
      key={chatUser._id}
      type="button"
      className={`chat-conversation-item ${
        selectedId === chatUser.conversationId ? "active" : ""
      }`}
      onClick={() => {
        if (chatUser.conversationId) {
          const conv = allConversations.find(
            (c) => c._id === chatUser.conversationId,
          );
          if (conv) handleSelectConversation(conv, true);
          else handleStartChatWithUser(chatUser);
        } else {
          handleStartChatWithUser(chatUser);
        }
      }}
    >
      <div className="chat-conversation-avatar">
        {(chatUser.name || "?").slice(0, 1).toUpperCase()}
      </div>
      <div className="chat-conversation-meta">
        <div className="chat-conversation-top">
          <span className="chat-conversation-name">{chatUser.name}</span>
          {!chatUser.conversationId && showStartHint && (
            <span className="chat-new-pill">New</span>
          )}
        </div>
        <span className="chat-conversation-role">{chatUser.role}</span>
        <span className="chat-conversation-preview">{chatUser.email}</span>
      </div>
    </button>
  );

  return (
    <div className="content-area chat-page">
      <div className="chat-layout glass-panel">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-title-row">
              <div>
                <h2>Chats</h2>
                <p>Manage all user conversations</p>
              </div>
              <button
                type="button"
                className="chat-plus-btn"
                onClick={() => setShowUserModal(true)}
                title="Chat with user"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="chat-sidebar-tabs">
              <button
                type="button"
                className={sidebarTab === "users" ? "active" : ""}
                onClick={() => setSidebarTab("users")}
              >
                <Users size={14} /> All Users
              </button>
              <button
                type="button"
                className={sidebarTab === "all" ? "active" : ""}
                onClick={() => setSidebarTab("all")}
              >
                <Eye size={14} /> All Chats
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="chat-empty">
              <Loader2 className="spin" size={24} />
            </div>
          ) : sidebarTab === "users" ? (
            <div className="chat-conversation-list">
              {allConversations.filter((c) => c.includesAdmin).length === 0 ? (
                <div className="chat-empty">
                  No conversations yet. Press + to start a chat.
                </div>
              ) : (
                allConversations
                  .filter((c) => c.includesAdmin)
                  .map((conversation) => {
                    const isActive = conversation._id === selectedId;
                    return (
                      <button
                        key={conversation._id}
                        type="button"
                        className={`chat-conversation-item ${isActive ? "active" : ""}`}
                        onClick={() =>
                          handleSelectConversation(
                            conversation,
                            conversation.canReply ?? true,
                          )
                        }
                      >
                        <div className="chat-conversation-avatar">
                          {formatParticipants(conversation)
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                        <div className="chat-conversation-meta">
                          <div className="chat-conversation-top">
                            <span className="chat-conversation-name">
                              {formatParticipants(conversation)}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <span className="chat-unread-badge">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <span className="chat-conversation-preview">
                            {getPreview(conversation.lastMessage)}
                          </span>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          ) : (
            <div className="chat-conversation-list">
              {allConversations.length === 0 ? (
                <div className="chat-empty">No conversations yet</div>
              ) : (
                allConversations.map((conversation) => {
                  const isActive = conversation._id === selectedId;
                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      className={`chat-conversation-item ${isActive ? "active" : ""}`}
                      onClick={() =>
                        handleSelectConversation(
                          conversation,
                          conversation.canReply ?? !!conversation.includesAdmin,
                        )
                      }
                    >
                      <div className="chat-conversation-avatar">
                        {formatParticipants(conversation)
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div className="chat-conversation-meta">
                        <div className="chat-conversation-top">
                          <span className="chat-conversation-name">
                            {formatParticipants(conversation)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="chat-unread-badge">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="chat-conversation-preview">
                          {getPreview(conversation.lastMessage)}
                        </span>
                        {!conversation.includesAdmin && (
                          <span className="chat-view-only-pill">View only</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </aside>

        <section className="chat-main">
          {!selectedId ? (
            <div className="chat-empty chat-empty-main">
              Select a user or conversation, or tap + to start a new chat
            </div>
          ) : (
            <>
              <header className="chat-main-header">
                <div>
                  <h3>
                    {selectedConversation?.includesAdmin
                      ? otherParticipant?.name || "Support Chat"
                      : formatParticipants(selectedConversation)}
                  </h3>
                  {!canSendInSelected && (
                    <span className="chat-view-only-banner">
                      View only — user-to-user chat
                    </span>
                  )}
                </div>
              </header>

              <div className="chat-messages">
                {loadingMessages ? (
                  <div className="chat-empty">
                    <Loader2 className="spin" size={24} />
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender?._id === user?._id;
                    return (
                      <div
                        key={message._id}
                        className={`chat-message-row ${isMine ? "mine" : "theirs"}`}
                      >
                        <div
                          className={`chat-bubble ${isMine ? "mine" : "theirs"}`}
                        >
                          {!isMine && (
                            <span className="chat-sender-name">
                              {message.sender?.name || "User"}
                            </span>
                          )}
                          {renderMessageContent(message, isMine)}
                          <span className="chat-message-time">
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {canSendInSelected ? (
                isRecording ? (
                  <div className="chat-recording-bar">
                    <button
                      type="button"
                      className="chat-recording-cancel"
                      onClick={cancelVoiceRecording}
                    >
                      <Trash2 size={18} /> Cancel
                    </button>
                    <div className="chat-recording-timer">
                      <span className="chat-recording-dot" />
                      {formatDuration(recordSeconds)}
                    </div>
                    <button
                      type="button"
                      className="chat-recording-send"
                      onClick={sendVoiceRecording}
                      disabled={sending}
                    >
                      <Send size={18} /> Send
                    </button>
                  </div>
                ) : (
                  <form className="chat-composer" onSubmit={handleSendText}>
                    <div className="chat-composer-tools">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setShowAttachMenu((v) => !v)}
                      >
                        <Paperclip size={18} />
                      </button>
                      {showAttachMenu && (
                        <div className="chat-attach-menu">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            <ImageIcon size={16} /> Image
                          </button>
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                          >
                            <Video size={16} /> Video
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FileText size={16} /> File
                          </button>
                        </div>
                      )}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageUpload}
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        hidden
                        onChange={handleVideoUpload}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={startVoiceRecording}
                      >
                        <Mic size={18} />
                      </button>
                    </div>
                    <input
                      className="chat-input"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type a message..."
                    />
                    <button
                      type="submit"
                      className="chat-send-btn"
                      disabled={!text.trim() || sending}
                    >
                      {sending ? (
                        <Loader2 className="spin" size={18} />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </form>
                )
              ) : (
                <div className="chat-readonly-bar">
                  You can view this conversation. Use + to message a user
                  directly.
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {showUserModal && (
        <div
          className="chat-user-modal-overlay"
          onClick={() => setShowUserModal(false)}
        >
          <div className="chat-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-user-modal-header">
              <h3>Start chat with user</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowUserModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="chat-user-search">
              <Search size={16} />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, role..."
              />
            </div>
            <div className="chat-user-modal-list">
              {filteredUsers.map((chatUser) => (
                <button
                  key={chatUser._id}
                  type="button"
                  className="chat-user-modal-item"
                  onClick={() => handleStartChatWithUser(chatUser)}
                >
                  <div className="chat-conversation-avatar">
                    {(chatUser.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="chat-conversation-name">
                      {chatUser.name}
                    </div>
                    <div className="chat-conversation-preview">
                      {chatUser.role} · {chatUser.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {imagePreview && (
        <div className="chat-image-modal" onClick={() => setImagePreview(null)}>
          <button
            type="button"
            className="chat-image-modal-close"
            onClick={() => setImagePreview(null)}
          >
            <X size={24} />
          </button>
          <img src={imagePreview} alt="Preview" />
        </div>
      )}
    </div>
  );
};

export default Chats;
