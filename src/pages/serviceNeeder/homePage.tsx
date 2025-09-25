import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTools,
  FaCheckCircle,
  FaClock,
  FaPhoneAlt,
  FaBolt,
  FaWrench,
  FaHammer,
  FaCar,
  FaBroom,
  FaPaintRoller,
  FaTree,
  FaHome,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUserTie,
  FaShieldAlt,
  FaMoneyBillWave,
  FaHeadset,
  FaThumbsUp,
  FaChevronDown,
  FaPaintBrush,
} from "react-icons/fa";
import "./homePage.css";

const ServiceNeederHomePage: React.FC = () => {
  const services = [
    {
      id: 1,
      title: "Electrician Services",
      description: "Professional electrical installation and repair services",
      icon: FaBolt,
    },
    {
      id: 2,
      title: "Plumbing Services",
      description: "Expert plumbing solutions for your home",
      icon: FaWrench,
    },
    {
      id: 3,
      title: "Carpentry Services",
      description: "Custom woodwork and furniture repairs",
      icon: FaHammer,
    },
    {
      id: 4,
      title: "Vehicle Breakdown",
      description: "24/7 roadside assistance services",
      icon: FaCar,
    },
    {
      id: 5,
      title: "Appliance Repair",
      description: "Fixing all types of home appliances",
      icon: FaTools,
    },
    {
      id: 6,
      title: "House Cleaning",
      description: "Professional cleaning services",
      icon: FaBroom,
    },
    {
      id: 7,
      title: "Painting Services",
      description: "Interior and exterior painting solutions",
      icon: FaPaintRoller ,
      
    },
    {
      id: 8,
      title: "Gardening & Landscaping",
      description: "Transform your outdoor spaces",
      icon: FaTree,
    },
    {
      id: 9,
      title: "Roof Repair",
      description: "Waterproofing and roof maintenance",
      icon: FaHome,
    },
    
  ];

  const steps = [
    {
      title: "Book Service",
      description: "Choose the service you need and book online",
      icon: <FaTools />,
    },
    {
      title: "Get Matched",
      description: "We'll connect you with an expert technician",
      icon: <FaCheckCircle />,
    },
    {
      title: "Quick Service",
      description: "Get your repair done efficiently",
      icon: <FaClock />,
    },
  ];

  const benefits = [
    {
      icon: <FaUserTie />,
      title: "Expert Technicians",
      description: "Qualified and experienced professionals at your service",
    },
    {
      icon: <FaShieldAlt />,
      title: "Guaranteed Safety",
      description: "All services backed by our satisfaction guarantee",
    },
    {
      icon: <FaClock />,
      title: "24/7 Availability",
      description: "Round-the-clock service for emergencies",
    },
    {
      icon: <FaMoneyBillWave />,
      title: "Competitive Pricing",
      description: "Transparent pricing with no hidden charges",
    },
    {
      icon: <FaHeadset />,
      title: "Dedicated Support",
      description: "Customer service team always ready to help",
    },
    {
      icon: <FaThumbsUp />,
      title: "Quality Assured",
      description: "Top-notch service quality guaranteed",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Make Life Easier with Hire_Me</h1>
          <p>At HireMe, we believe every problem has a fast, affordable fix.<br />
          Find skilled experts you can trust — no hassle, no waiting.</p>
          <button
            className="cta-button"
            onClick={() => navigate("/service-needer/login")}
          >
            Book a Service
          </button>
        </div>
        <div
          className="scroll-indicator"
          onClick={() =>
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
          }
        >
          <span>Scroll Down</span>
          <FaChevronDown className="scroll-icon" />
        </div>
      </section>
      {/* Services Section */}
      <section className="services">
        <h2>Our Services</h2>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="SN-service-card">
              <span className="service-icon">
                <service.icon />
              </span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </section>
      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Why Choose Us */}
      <section className="why-us">
        <h2>Why Choose HireMe</h2>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact">
        <h2>Get In Touch</h2>
        <div className="contact-container">
          <div className="contact-info">
            <div className="contact-item">
              <FaPhoneAlt />
              <span>+94 76 89 76 222</span>
            </div>
            <div className="contact-item">
              <FaEnvelope />
              <span>HireMe2001@gmail.com</span>
            </div>
            <div className="contact-item">
              <FaMapMarkerAlt />
              <span>172/2 , Mannar Road , Puttalam .</span>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <input type="text" id="name" placeholder="Your Name" required />
            </div>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                placeholder="Your Email"
                required
              />
            </div>
            <div className="input-wrapper">
              <input type="tel" id="phone" placeholder="Your Phone" required />
            </div>
            {/* <div className="input-wrapper">
              <select id="service" required>
                <option value="">Select Service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.title}>
                    {service.title}
                  </option>
                ))}
              </select>
            </div> */}
            <div className="input-wrapper">
              <textarea
                id="message"
                placeholder="Your Message"
                rows={4}
                required
              ></textarea>
            </div>
            <button type="submit" className="submit-button">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default ServiceNeederHomePage;
