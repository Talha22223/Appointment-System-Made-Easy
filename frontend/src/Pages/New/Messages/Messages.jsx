import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import './Messages.css';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messageEndRef = useRef(null);
  
  useEffect(() => {
    // Mock data - in a real app, these would come from an API
    const mockConversations = [
      {
        id: 1,
        user: {
          id: 2,
          name: 'Jane Smith',
          profilePic: 'https://via.placeholder.com/50',
          isOnline: true
        },
        messages: [
          { id: 1, text: 'Hey there! How are you?', sender: 'them', time: '2 days ago' },
          { id: 2, text: 'I\'m good, thanks! How about you?', sender: 'me', time: '2 days ago' },
          { id: 3, text: 'Doing well! Are you coming to the event this weekend?', sender: 'them', time: '2 days ago' },
          { id: 4, text: 'Yes, I\'m planning to attend. Should be fun!', sender: 'me', time: '2 days ago' },
          { id: 5, text: 'Great! See you there then 😊', sender: 'them', time: '2 days ago' }
        ],
        unread: 0,
        lastMessage: 'Great! See you there then 😊'
      },
      {
        id: 2,
        user: {
          id: 3,
          name: 'Michael Johnson',
          profilePic: 'https://via.placeholder.com/50',
          isOnline: false
        },
        messages: [
          { id: 1, text: 'Hi Michael, do you have the report ready?', sender: 'me', time: '1 week ago' },
          { id: 2, text: 'Not yet, but I\'ll finish it by tomorrow.', sender: 'them', time: '1 week ago' },
          { id: 3, text: 'Okay, thanks! Let me know when it\'s done.', sender: 'me', time: '1 week ago' }
        ],
        unread: 0,
        lastMessage: 'Okay, thanks! Let me know when it\'s done.'
      },
      {
        id: 3,
        user: {
          id: 4,
          name: 'Sarah Williams',
          profilePic: 'https://via.placeholder.com/50',
          isOnline: true
        },
        messages: [
          { id: 1, text: 'Hey Sarah! Congrats on the promotion!', sender: 'me', time: '3 days ago' },
          { id: 2, text: 'Thanks so much! I\'m really excited about it.', sender: 'them', time: '3 days ago' },
          { id: 3, text: 'We should celebrate soon!', sender: 'me', time: '3 days ago' },
          { id: 4, text: 'Definitely! How about Friday night?', sender: 'them', time: '2 days ago' }
        ],
        unread: 1,
        lastMessage: 'Definitely! How about Friday night?'
      }
    ];
    
    setConversations(mockConversations);
    // Set the first conversation as active by default
    if (mockConversations.length > 0) {
      setActiveConversation(mockConversations[0]);
    }
  }, []);
  
  useEffect(() => {
    // Scroll to bottom of messages when conversation changes
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Add new message to conversation
    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'me',
      time: 'Just now'
    };
    
    const updatedConversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, newMessage],
      lastMessage: message
    };
    
    setActiveConversation(updatedConversation);
    
    // Update conversations list
    setConversations(conversations.map(conv => 
      conv.id === updatedConversation.id ? updatedConversation : conv
    ));
    
    // Clear message input
    setMessage('');
  };
  
  const handleConversationClick = (conversation) => {
    // Mark as read
    const updatedConversation = {
      ...conversation,
      unread: 0
    };
    
    setActiveConversation(updatedConversation);
    
    // Update conversations list
    setConversations(conversations.map(conv => 
      conv.id === conversation.id ? updatedConversation : conv
    ));
  };
  
  const filteredConversations = conversations.filter(conv => 
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="messages-container">
      <Navbar />
      
      <div className="messages-content">
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h2>Messages</h2>
            <button className="new-message-btn">
              <i className="fas fa-edit"></i>
            </button>
          </div>
          
          <div className="search-messages">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search messages" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="conversations-list">
            {filteredConversations.map((conversation) => (
              <div 
                key={conversation.id} 
                className={`conversation-item ${activeConversation && activeConversation.id === conversation.id ? 'active' : ''}`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="conversation-pic-container">
                  <img src={conversation.user.profilePic} alt={conversation.user.name} className="conversation-pic" />
                  {conversation.user.isOnline && <span className="online-indicator"></span>}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4>{conversation.user.name}</h4>
                    <span className="last-message-time">
                      {conversation.messages.length > 0 ? conversation.messages[conversation.messages.length - 1].time : ''}
                    </span>
                  </div>
                  <div className="conversation-last-message">
                    <p>{conversation.lastMessage}</p>
                    {conversation.unread > 0 && (
                      <span className="unread-count">{conversation.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="message-thread">
          {activeConversation ? (
            <>
              <div className="message-thread-header">
                <div className="thread-user-info">
                  <img src={activeConversation.user.profilePic} alt={activeConversation.user.name} className="thread-user-pic" />
                  <div>
                    <h3>{activeConversation.user.name}</h3>
                    <p className="user-status">{activeConversation.user.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="thread-actions">
                  <button className="thread-action-btn">
                    <i className="fas fa-phone"></i>
                  </button>
                  <button className="thread-action-btn">
                    <i className="fas fa-video"></i>
                  </button>
                  <button className="thread-action-btn">
                    <i className="fas fa-info-circle"></i>
                  </button>
                </div>
              </div>
              
              <div className="message-thread-body">
                {activeConversation.messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                    <div className="message-content">
                      <p>{msg.text}</p>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
              
              <div className="message-thread-footer">
                <form onSubmit={handleSendMessage} className="message-form">
                  <button type="button" className="message-action-btn">
                    <i className="fas fa-plus-circle"></i>
                  </button>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button type="button" className="message-action-btn">
                    <i className="far fa-image"></i>
                  </button>
                  <button type="button" className="message-action-btn">
                    <i className="far fa-laugh"></i>
                  </button>
                  <button type="submit" className="send-message-btn">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <div className="no-conversation-content">
                <i className="far fa-comment-alt"></i>
                <h3>No conversation selected</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
