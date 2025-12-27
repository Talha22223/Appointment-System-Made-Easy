import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './Profile.css';

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  
  useEffect(() => {
    // Mock data - in a real app, this would come from an API
    const mockProfile = {
      id: 1,
      name: 'John Doe',
      username: 'johndoe',
      profilePic: 'https://via.placeholder.com/150',
      coverPhoto: 'https://via.placeholder.com/1000x300',
      bio: 'Software developer | Nature enthusiast | Amateur photographer',
      location: 'New York, USA',
      education: 'Computer Science, MIT',
      work: 'Senior Developer at Tech Company',
      joinedDate: 'January 2018'
    };
    
    const mockFriends = [
      { id: 2, name: 'Jane Smith', profilePic: 'https://via.placeholder.com/50', rating: 3 },
      { id: 3, name: 'Michael Johnson', profilePic: 'https://via.placeholder.com/50', rating: 2 },
      { id: 4, name: 'Sarah Williams', profilePic: 'https://via.placeholder.com/50', rating: 3 },
      { id: 5, name: 'David Brown', profilePic: 'https://via.placeholder.com/50', rating: 1 },
      { id: 6, name: 'Emma Davis', profilePic: 'https://via.placeholder.com/50', rating: 2 },
    ];
    
    const mockRequests = [
      { id: 7, name: 'Robert Wilson', profilePic: 'https://via.placeholder.com/50' },
      { id: 8, name: 'Lisa Anderson', profilePic: 'https://via.placeholder.com/50' }
    ];
    
    setUserProfile(mockProfile);
    setFriends(mockFriends);
    setFriendRequests(mockRequests);
  }, []);
  
  const acceptFriendRequest = (id) => {
    const requestToAccept = friendRequests.find(req => req.id === id);
    if (requestToAccept) {
      // Add to friends list with default rating
      setFriends([...friends, { ...requestToAccept, rating: 1 }]);
      // Remove from requests
      setFriendRequests(friendRequests.filter(req => req.id !== id));
    }
  };
  
  const rejectFriendRequest = (id) => {
    setFriendRequests(friendRequests.filter(req => req.id !== id));
  };
  
  const updateFriendRating = (id, rating) => {
    setFriends(friends.map(friend => 
      friend.id === id ? { ...friend, rating } : friend
    ));
  };
  
  const getRatingIcons = (rating) => {
    const icons = [];
    
    for (let i = 1; i <= 3; i++) {
      let iconClass = 'far';
      if (i <= rating) {
        iconClass = 'fas';
      }
      
      icons.push(
        <i 
          key={i} 
          className={`${iconClass} fa-star rating-star ${i === 1 ? 'stupid' : i === 2 ? 'cool' : 'trustworthy'}`}
          onClick={() => updateFriendRating(id, i)}
        ></i>
      );
    }
    
    return icons;
  };
  
  if (!userProfile) {
    return <div className="loading">Loading profile...</div>;
  }
  
  return (
    <div className="profile-container">
      <Navbar />
      
      <div className="profile-content">
        <div className="profile-header">
          <div className="cover-photo" style={{ backgroundImage: `url(${userProfile.coverPhoto})` }}>
            <div className="profile-pic-container">
              <img src={userProfile.profilePic} alt={userProfile.name} className="profile-pic" />
            </div>
          </div>
          
          <div className="profile-info-container">
            <div className="profile-name-section">
              <h1>{userProfile.name}</h1>
              <button className="edit-profile-btn">
                <i className="fas fa-pencil-alt"></i> Edit Profile
              </button>
            </div>
            
            <p className="bio">{userProfile.bio}</p>
            
            <div className="profile-details">
              <div className="detail">
                <i className="fas fa-map-marker-alt"></i>
                <span>{userProfile.location}</span>
              </div>
              <div className="detail">
                <i className="fas fa-graduation-cap"></i>
                <span>{userProfile.education}</span>
              </div>
              <div className="detail">
                <i className="fas fa-briefcase"></i>
                <span>{userProfile.work}</span>
              </div>
              <div className="detail">
                <i className="fas fa-calendar-alt"></i>
                <span>Joined {userProfile.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-body">
          <div className="profile-sidebar">
            <div className="profile-section">
              <h3>About</h3>
              <p>Welcome to my profile! Connect with me to share updates and stay in touch.</p>
            </div>
            
            <div className="profile-section">
              <h3>Photos</h3>
              <div className="photo-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="photo-item">
                    <img src={`https://via.placeholder.com/100?text=Photo${i+1}`} alt={`Photo ${i+1}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="profile-main">
            <div className="friends-section">
              <div className="section-header">
                <h2>Friends ({friends.length})</h2>
                <button className="view-all-btn">View All</button>
              </div>
              
              <div className="friends-grid">
                {friends.map((friend) => (
                  <div key={friend.id} className="friend-card">
                    <img src={friend.profilePic} alt={friend.name} className="friend-pic" />
                    <h4>{friend.name}</h4>
                    <div className="friend-rating">
                      {[1, 2, 3].map((star) => (
                        <i 
                          key={star} 
                          className={`${star <= friend.rating ? 'fas' : 'far'} fa-star ${star === 1 ? 'stupid' : star === 2 ? 'cool' : 'trustworthy'}`}
                          onClick={() => updateFriendRating(friend.id, star)}
                          title={star === 1 ? 'Stupid' : star === 2 ? 'Cool' : 'Trustworthy'}
                        ></i>
                      ))}
                    </div>
                    <button className="message-friend-btn">
                      <i className="fas fa-comment-alt"></i> Message
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {friendRequests.length > 0 && (
              <div className="friend-requests-section">
                <h2>Friend Requests ({friendRequests.length})</h2>
                
                <div className="requests-list">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="request-card">
                      <img src={request.profilePic} alt={request.name} className="request-pic" />
                      <div className="request-info">
                        <h4>{request.name}</h4>
                        <div className="request-actions">
                          <button 
                            className="accept-btn"
                            onClick={() => acceptFriendRequest(request.id)}
                          >
                            Accept
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => rejectFriendRequest(request.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
