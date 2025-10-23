import React from 'react';

function AboutSonfy() {
  return (
    <div className="about-sonfy">
      <div className="hero-section">
        <h1>About Sonfy - The Ultimate Music Streaming Experience</h1>
        <p className="hero-description">
          Sonfy is revolutionizing how you discover, stream, and enjoy music online. 
          Our platform offers unlimited access to millions of songs, completely free.
        </p>
      </div>

      <div className="content-sections">
        <section className="what-is-sonfy">
          <h2>What is Sonfy?</h2>
          <p>
            Sonfy is a cutting-edge music streaming platform that brings you the best of online music 
            without any cost. Built with modern web technologies, Sonfy delivers high-quality audio 
            streaming, intuitive playlist management, and seamless music discovery.
          </p>
          <ul>
            <li>🎵 Stream millions of songs on Sonfy for free</li>
            <li>🎨 Create and customize unlimited playlists</li>
            <li>🔍 Discover new music with Sonfy's smart recommendations</li>
            <li>📱 Enjoy Sonfy on any device - mobile, tablet, or desktop</li>
            <li>🚀 Experience lightning-fast loading and smooth playback</li>
          </ul>
        </section>

        <section className="why-choose-sonfy">
          <h2>Why Choose Sonfy Music?</h2>
          <div className="features-grid">
            <div className="feature">
              <h3>100% Free</h3>
              <p>Sonfy provides unlimited music streaming without any subscription fees or hidden costs.</p>
            </div>
            <div className="feature">
              <h3>No Ads</h3>
              <p>Enjoy uninterrupted music on Sonfy without annoying advertisements.</p>
            </div>
            <div className="feature">
              <h3>High Quality</h3>
              <p>Sonfy delivers crystal-clear audio quality for the best listening experience.</p>
            </div>
            <div className="feature">
              <h3>Easy to Use</h3>
              <p>Sonfy's intuitive interface makes music discovery and playlist creation effortless.</p>
            </div>
          </div>
        </section>

        <section className="sonfy-features">
          <h2>Sonfy Features</h2>
          <p>
            Discover what makes Sonfy the preferred choice for music lovers worldwide:
          </p>
          <div className="features-list">
            <div className="feature-item">
              <strong>Smart Search:</strong> Find any song, artist, or album instantly on Sonfy
            </div>
            <div className="feature-item">
              <strong>Playlist Management:</strong> Create, edit, and share playlists with Sonfy
            </div>
            <div className="feature-item">
              <strong>Music Discovery:</strong> Explore trending songs and new releases on Sonfy
            </div>
            <div className="feature-item">
              <strong>Cross-Platform:</strong> Access Sonfy from any web browser
            </div>
            <div className="feature-item">
              <strong>Offline Ready:</strong> Sonfy works even when you're offline
            </div>
          </div>
        </section>

        <section className="get-started">
          <h2>Start Your Sonfy Journey Today</h2>
          <p>
            Join millions of users who have made Sonfy their go-to music streaming platform. 
            Experience the future of free music streaming with Sonfy - where great music meets 
            innovative technology.
          </p>
          <button className="cta-button" onClick={() => window.location.href = '/'}>
            Start Streaming on Sonfy Now
          </button>
        </section>
      </div>
    </div>
  );
}

export default AboutSonfy;