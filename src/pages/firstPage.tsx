import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaAward, FaStar, FaUsers, FaGlobe, FaHandshake, FaSmile } from 'react-icons/fa';
import Logo from '../components/Logo';
import './FirstPage.css';

const achievements = [
  { icon: FaAward, value: '5+', label: 'Years Experience' },
  { icon: FaStar, value: '1000+', label: 'Happy Customers' },
  { icon: FaUsers, value: '500+', label: 'Expert Technicians' },
  { icon: FaGlobe, value: '50+', label: 'Service Locations' }
];

const features = [
  {
    icon: FaHandshake,
    title: 'Trust & Reliability',
    description: 'We build lasting relationships through quality service and transparency'
  },
  {
    icon: FaSmile,
    title: 'Customer Satisfaction',
    description: 'Your happiness is our top priority - we go above and beyond'
  }
];

const FirstPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="container">
      <Logo />
      {/* Hero Section */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="hero-title"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Make Life Easier With Hire_Me
          </motion.h1>
          <p className="hero-subtitle" style={{ textAlign: 'center' }}>
         
At HireMe, we believe every problem has a fast, affordable fix.<br />
Find skilled experts you can trust — no hassle, no waiting.<br />

          </p>
          <div className="hero-cta">
            <motion.button 
              className="cta-button primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/user-type')}
            >
              Explore Services
            </motion.button>
          </div>
          
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {achievements.map((item, index) => (
            <motion.div
              key={index}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <item.icon className="stat-icon" />
              <h3 className="stat-value">{item.value}</h3>
              <p className="stat-label">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Us</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * index }}
            >
              <feature.icon className="feature-icon" />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bottom-cta">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Ready to Transform Your Space?</h2>
          <p>Join thousands of satisfied customers who trust HireMe</p>
          <motion.button
            className="cta-button primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/user-type')}
          >
            Start Your Journey
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
};

export default FirstPage;