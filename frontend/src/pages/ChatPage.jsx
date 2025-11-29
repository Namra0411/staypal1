import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChat, sendChatMessage } from "../api/chat";
import Header from "../Components/Header";
import { useAuth } from "../context/AuthContext";
import "../StyleSheets/ChatPage.css"; 

export default function ChatPage() {
  const { receiverEmail } = useParams();
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState("");
  
  // Ref for auto-scrolling to bottom
  const chatEndRef = useRef(null);

  // AUTH
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check if user is trying to chat with themselves
  const isSelfChat = user?.email === receiverEmail;

  // LOGOUT HANDLER
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // FETCH CHAT
  const loadChat = async () => {
    try {
      const res = await fetchChat(receiverEmail);
      setChat(res.data.data || null);
    } catch (err) {
      console.error("Error fetching chat:", err);
    }
  };

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!message.trim()) return;

    await sendChatMessage(receiverEmail, message);
    setMessage("");
    await loadChat();
  };
  
  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (!isSelfChat) {
      loadChat();
    }
  }, [receiverEmail, isSelfChat]);

  // If trying to chat with self, show creative error
  if (isSelfChat) {
    return (
      <>
        <Header 
          user={user}
          onLogout={handleLogout} 
          onNavigate={navigate}
        />

        <div className="room-page-wrapper">
          <div className="self-chat-error-container">
            <div className="self-chat-error-card">
              <div className="error-icon-wrapper">
                <span className="error-mirror-emoji"></span>
              </div>
              
              <h1 className="error-title">Oops! Talking to Yourself?</h1>
              
              <p className="error-message">
                We know you're amazing, but even you can't chat with yourself! 
                <br/>
                <span className="error-submessage">
                  (Try finding someone else to share your brilliance with )
                </span>
              </p>

              <div className="error-suggestion">
                <p>💡 <strong>Pro tip:</strong> Making friends works better when there's... you know... another person involved!</p>
              </div>

              <button 
                className="error-back-btn"
                onClick={() => navigate(-1)}
              >
                <span className="back-arrow">←</span>
                Take Me Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        user={user}
        onLogout={handleLogout} 
        onNavigate={navigate}
      />

      <div className="room-page-wrapper">
        <div className="room-interface-card">
          
          {/* Header of the Chat Card */}
          <div className="room-header">
            <h2 className="room-title">
              <span className="room-status-indicator"></span>
              {receiverEmail}
            </h2>
          </div>

          {/* Chat History Window */}
          <div className="room-history-window">
            {chat?.messages?.length ? (
              chat.messages.map((msg, idx) => {
                const isMe = msg.senderEmail !== receiverEmail;
                
                return (
                  <div 
                    key={idx} 
                    className={`msg-row ${isMe ? "sent" : "received"}`}
                  >
                    <div className="msg-bubble">
                      {msg.body}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="room-empty-msg">No messages yet. Say hello!</p>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Zone */}
          <div className="room-input-area">
            <input
              className="room-text-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message..."
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="room-send-btn" onClick={sendMessage}>
              Send
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
