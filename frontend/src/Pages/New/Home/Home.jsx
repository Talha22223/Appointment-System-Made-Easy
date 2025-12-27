import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [activeFriends, setActiveFriends] = useState([]);
  const [shareOptions, setShareOptions] = useState({ show: false, postId: null });
  
  useEffect(() => {
    // Mock data - in a real app, these would come from an API
    const mockPosts = [
      {
        id: 1,
        user: {
          id: 2,
          name: 'Jane Smith',
          profilePic: 'https://via.placeholder.com/50',
          lastActive: '10m'
        },
        content: 'Just finished reading an amazing book! Would highly recommend "The Silent Patient" to everyone.',
        timestamp: '2 hours ago',
        likes: 24,
        dislikes: 3,
        comments: 5
      },
      {
        id: 2,
        user: {
          id: 3,
          name: 'Michael Johnson',
          profilePic: 'https://via.placeholder.com/50',
          lastActive: '30m'
        },
        content: 'Beautiful day for hiking! Check out this amazing view from the mountain top!',
        image: 'https://via.placeholder.com/600x400',
        timestamp: '5 hours ago',
        likes: 42,
        dislikes: 1,
        comments: 8
      },
      {
        id: 3,
        user: {
          id: 4,
          name: 'Sarah Williams',
          profilePic: 'https://via.placeholder.com/50',
          lastActive: '1h'
        },
        content: 'Just got promoted at work! So excited for this new chapter in my career. Thanks everyone for your support!',
        timestamp: '1 day ago',
        likes: 89,
        dislikes: 0,
        comments: 15
      }
    ];
    
    const mockActiveFriends = [
      { id: 2, name: 'Jane Smith', profilePic: 'https://via.placeholder.com/50', lastActive: '10m' },
      { id: 3, name: 'Michael Johnson', profilePic: 'https://via.placeholder.com/50', lastActive: '30m' },
      { id: 4, name: 'Sarah Williams', profilePic: 'https://via.placeholder.com/50', lastActive: '1h' },
      { id: 5, name: 'David Brown', profilePic: 'https://via.placeholder.com/50', lastActive: '2h' },
      { id: 6, name: 'Emma Davis', profilePic: 'https://via.placeholder.com/50', lastActive: '3h' }
    ];
    
    setPosts(mockPosts);
    setActiveFriends(mockActiveFriends);
  }, []);
  
  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    
    // Add new post to the top of the feed
    const currentUser = JSON.parse(localStorage.getItem('user')) || { username: 'Current User' };
    
    const newPostObj = {
      id: Date.now(),
      user: {
        id: 1,
        name: currentUser.username,
        profilePic: 'https://via.placeholder.com/50',
        lastActive: 'Just now'
      },
      content: newPost,
      timestamp: 'Just now',
      likes: 0,
      dislikes: 0,
      comments: 0
    };
    
    setPosts([newPostObj, ...posts]);
    setNewPost('');
  };
  
  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };
  
  const handleDislike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, dislikes: post.dislikes + 1 } : post
    ));
  };
  
  const toggleShareOptions = (postId) => {
    setShareOptions({
      show: shareOptions.postId !== postId || !shareOptions.show,
      postId: postId
    });
  };

  return (
    <div className="home-container">
      <Navbar />
      
      <div className="home-content">
        <div className="left-sidebar">
          <div className="user-profile-card">
            <img src="https://via.placeholder.com/50" alt="Your Profile" className="sidebar-profile-pic" />
            <h3>Your Profile</h3>
          </div>
          <ul className="sidebar-menu">
            <li><i className="fas fa-newspaper"></i> News Feed</li>
            <li><i className="fas fa-user-friends"></i> Friends</li>
            <li><i className="fas fa-users"></i> Groups</li>
            <li><i className="fas fa-store"></i> Marketplace</li>
            <li><i className="fas fa-calendar-alt"></i> Events</li>
            <li><i className="fas fa-bookmark"></i> Saved</li>
          </ul>
        </div>
        
        <div className="main-content">
          <div className="create-post-card">
            <form onSubmit={handlePostSubmit}>
              <div className="post-input-container">
                <img src="https://via.placeholder.com/40" alt="Profile" className="post-profile-pic" />
                <input 
                  type="text"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="post-input"
                  placeholder="What's on your mind?"
                />
              </div>
              <div className="post-actions">
                <button type="button" className="post-action-btn">
                  <i className="fas fa-image"></i> Photo
                </button>
                <button type="button" className="post-action-btn">
                  <i className="fas fa-video"></i> Video
                </button>
                <button type="submit" className="post-submit-btn">Post</button>
              </div>
            </form>
          </div>
          
          <div className="news-feed">
            {posts.map(post => (
              <div className="post-card" key={post.id}>
                <div className="post-header">
                  <img src={post.user.profilePic} alt={post.user.name} className="post-profile-pic" />
                  <div className="post-meta">
                    <h4>{post.user.name}</h4>
                    <p className="post-time">{post.timestamp} · Last active {post.user.lastActive} ago</p>
                  </div>
                </div>
                
                <div className="post-content">
                  <p>{post.content}</p>
                  {post.image && <img src={post.image} alt="Post content" className="post-image" />}
                </div>
                
                <div className="post-stats">
                  <div className="likes-stats">
                    <span>
                      <i className="fas fa-thumbs-up"></i> {post.likes}
                    </span>
                    <span>
                      <i className="fas fa-thumbs-down"></i> {post.dislikes}
                    </span>
                  </div>
                  <span>{post.comments} comments</span>
                </div>
                
                <div className="post-actions-bar">
                  <button onClick={() => handleLike(post.id)} className="post-action">
                    <i className="far fa-thumbs-up"></i> Like
                  </button>
                  <button onClick={() => handleDislike(post.id)} className="post-action">
                    <i className="far fa-thumbs-down"></i> Dislike
                  </button>
                  <button className="post-action">
                    <i className="far fa-comment"></i> Comment
                  </button>
                  <div className="share-dropdown">
                    <button 
                      className="post-action" 
                      onClick={() => toggleShareOptions(post.id)}
                    >
                      <i className="far fa-share-square"></i> Share
                    </button>
                    
                    {shareOptions.show && shareOptions.postId === post.id && (
                      <div className="share-options">
                        <button className="share-option">Share with all friends</button>
                        <button className="share-option">Share with selected friends</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="right-sidebar">
          <div className="active-friends-container">
            <h3>Active Friends</h3>
            <ul className="active-friends-list">
              {activeFriends.map(friend => (
                <li key={friend.id} className="active-friend">
                  <div className="friend-pic-container">
                    <img src={friend.profilePic} alt={friend.name} className="friend-pic" />
                    <span className="active-indicator"></span>
                  </div>
                  <div className="friend-info">
                    <span className="friend-name">{friend.name}</span>
                    <span className="last-active">Active {friend.lastActive} ago</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
