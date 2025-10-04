import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService, Purchasable } from '../services/events.service';
import '../styles/BigScreenMode.css';

const BigScreenMode: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [purchasables, setPurchasables] = useState<Purchasable[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadPurchasables();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadPurchasables();
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId]);

  const loadPurchasables = async () => {
    try {
      const data = await eventsService.getEventDetails(eventId!);
      setPurchasables(data.stations);
    } catch (err) {
      console.error('Failed to load purchasables', err);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const availableItems = purchasables.filter(p => p.isAvailable && p.stock > 0);
  
  if (availableItems.length === 0) {
    return (
      <div className="bigscreen-container">
        <div className="bigscreen-empty">
          <h1>No Items Available</h1>
          <p>Check back soon!</p>
        </div>
        {!isFullscreen && (
          <button className="bigscreen-back-button" onClick={() => navigate(`/events/${eventId}`)}>
            ← Back
          </button>
        )}
        <button className="fullscreen-toggle" onClick={toggleFullscreen}>
          {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
      </div>
    );
  }

  return (
    <div className="bigscreen-container">
      <div className="bigscreen-grid">
        {availableItems.map((item) => (
          <div key={item.id} className="bigscreen-grid-item">
            <div className="bigscreen-grid-image-container">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="bigscreen-grid-image"
                />
              ) : (
                <div className="bigscreen-grid-no-image">
                  <span className="bigscreen-grid-emoji">🛍️</span>
                </div>
              )}
            </div>

            <div className="bigscreen-grid-info">
              <h2 className="bigscreen-grid-name">{item.name}</h2>

              <div className="bigscreen-grid-stock">
                <span className="grid-stock-label">Stock:</span>
                <span className="grid-stock-value">{item.stock}</span>
              </div>

              <div className="bigscreen-grid-price">
                <span className="grid-price-value">{item.price}</span>
                <span className="grid-price-currency">🪙</span>
              </div>

              {item.description && (
                <p className="bigscreen-grid-description">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isFullscreen && (
        <button className="bigscreen-back-button" onClick={() => navigate(`/events/${eventId}`)}>
          ← Back
        </button>
      )}

      <button className="fullscreen-toggle" onClick={toggleFullscreen}>
        {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
      </button>
    </div>
  );
};

export default BigScreenMode;
