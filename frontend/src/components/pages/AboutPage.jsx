import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/AboutPage.css";
import Sidebar from "../layout/Sidebar.jsx";

import aradQuestLogo from "../../assets/images/backgrounds/aradquest-logo.png";
function AboutPage() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const steps = [
    {
      number: "01",
      icon: "🧭",
      title: "Choose Your Adventure",
      description:
        "Select a nature or historical adventure and discover the places waiting for you around Arad.",
    },
    {
      number: "02",
      icon: "📍",
      title: "Explore the Location",
      description:
        "Follow your route and visit real places. Every destination hides a new story.",
    },
    {
      number: "03",
      icon: "🧩",
      title: "Solve the Clues",
      description:
        "Answer riddles, complete challenges and scan QR codes to unlock the next part of your quest.",
    },
    {
      number: "04",
      icon: "🏆",
      title: "Earn Your Rewards",
      description:
        "Collect points, unlock badges and celebrate every discovery you make.",
    },
  ];

  const adventureTypes = [
    {
      icon: "🌿",
      title: "Nature Explorer",
      description:
        "Discover forests, scenic trails, lakes and the natural beauty of Arad County.",
      label: "Nature & Outdoors",
      className: "about-nature",
    },
    {
      icon: "🏛️",
      title: "Historical Discoverer",
      description:
        "Explore monuments, architecture, fortresses and the stories of Arad's past.",
      label: "Culture & History",
      className: "about-history",
    },
    {
      icon: "🚲",
      title: "Local Explorer",
      description:
        "Experience the region through walking, cycling and road-trip adventures.",
      label: "Discover Arad",
      className: "about-local",
    },
  ];

  const features = [
    {
      icon: "🗺️",
      title: "Interactive Routes",
      description:
        "Discover routes designed around real destinations in Arad County.",
    },
    {
      icon: "🔐",
      title: "QR Code Challenges",
      description:
        "Unlock clues and activities by scanning QR codes at selected locations.",
    },
    {
      icon: "🎧",
      title: "AI-Powered Stories",
      description:
        "Discover engaging audio stories and learn more about the places you visit.",
    },
    {
      icon: "🎖️",
      title: "Badges & Achievements",
      description:
        "Celebrate your progress by collecting points and unlocking achievements.",
    },
    {
      icon: "🎁",
      title: "Local Rewards",
      description:
        "Discover reward opportunities and potential benefits from local partners.",
    },
  ];

  const guideItems = [
    {
      icon: "👤",
      title: "Create Your Explorer Profile",
      description:
        "Register, choose your avatar and personalize your explorer identity.",
    },
    {
      icon: "🧭",
      title: "Pick a Route",
      description:
        "Choose an adventure based on your interests, location and preferred way to explore.",
    },
    {
      icon: "📖",
      title: "Read the Instructions",
      description:
        "Check the route details, challenges and any information provided before starting.",
    },
    {
      icon: "📸",
      title: "Complete the Quest",
      description:
        "Visit the locations, solve clues and follow the challenge instructions.",
    },
    {
      icon: "⭐",
      title: "Track Your Progress",
      description:
        "Check your profile to see your points, completed adventures and earned badges.",
    },
  ];

  const faqs = [
    {
      question: "What is Arad Quest?",
      answer:
        "Arad Quest is a tourism discovery platform that transforms exploring Arad County into an interactive treasure-hunt experience. Users discover places, solve clues and learn local stories.",
    },
    {
      question: "Who can use Arad Quest?",
      answer:
        "Arad Quest is designed for curious explorers, tourists, families, students and anyone who wants to discover Arad in a fun and engaging way.",
    },
    {
      question: "Do I need to visit real locations?",
      answer:
        "Yes. Adventures are designed around real places. Depending on the quest, you may need to visit a location, answer a question or scan a QR code to progress.",
    },
    {
      question: "How do I earn points and badges?",
      answer:
        "Points and badges are connected to completing adventures and challenges. Your profile helps you track your progress and achievements.",
    },
    {
      question: "Is Arad Quest free?",
      answer:
        "Arad Quest is being developed as a tourism discovery experience. Availability and any reward conditions will be presented within the application.",
    },
  ];

  return (
    <div className="about-page">
      {/* SHARED SIDEBAR + HAMBURGER MENU */}
      <Sidebar
        activePage="About"
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* MAIN CONTENT */}
      <main className="about-main">
        {/* HERO */}
        <section className="about-hero">
          <div className="about-hero-content">
            <span className="about-hero-label">
              ✦ YOUR JOURNEY STARTS HERE ✦
            </span>

            <h1>
              More than a journey.
              <br />
              <span>A quest.</span>
            </h1>

            <p>
              Discover Arad through hidden stories, exciting challenges and
              unforgettable adventures.
            </p>

            <button
              className="about-hero-button"
              onClick={() => navigate("/adventures")}
            >
              Start Your Adventure <span>→</span>
            </button>
          </div>

          <div className="about-hero-decoration">
            <div className="about-compass">🧭</div>
            <div className="about-hero-star star-one">✦</div>
            <div className="about-hero-star star-two">✧</div>
            <div className="about-hero-star star-three">✦</div>
          </div>

          <div className="about-hero-bottom">
            <span>Explore</span>
            <span>•</span>
            <span>Discover</span>
            <span>•</span>
            <span>Earn</span>
          </div>
        </section>

        {/* ABOUT DESCRIPTION */}
        <section className="about-intro-section">
          <div className="about-intro-icon">🏰</div>

          <div className="about-intro-content">
            <span className="about-section-eyebrow">OUR MISSION</span>
            <h2>Discover the hidden treasures of Arad</h2>

            <p>
              Arad Quest is an interactive tourism platform that turns exploring
              Arad County into a real-life treasure hunt. From beautiful natural
              landscapes to historic landmarks, every destination becomes an
              opportunity to discover something new.
            </p>

            <p>
              Through routes, riddles, QR code challenges, digital rewards and
              AI-powered stories, we connect people with the places, culture and
              history that make Arad unique.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="about-section">
          <div className="about-section-heading">
            <span className="about-section-eyebrow">THE ADVENTURE</span>
            <h2>How Arad Quest Works</h2>
            <p>Your journey from curious explorer to quest champion.</p>
          </div>

          <div className="about-steps-grid">
            {steps.map((step, index) => (
              <article className="about-step-card" key={step.number}>
                <div className="about-step-top">
                  <span className="about-step-number">{step.number}</span>
                  <span className="about-step-icon">{step.icon}</span>
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>

                {index < steps.length - 1 && (
                  <span className="about-step-arrow">→</span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ADVENTURE TYPES */}
        <section className="about-section">
          <div className="about-section-heading">
            <span className="about-section-eyebrow">FIND YOUR PATH</span>
            <h2>Choose Your Adventure</h2>
            <p>Different paths. Endless stories.</p>
          </div>

          <div className="about-adventure-grid">
            {adventureTypes.map((adventure) => (
              <article
                className={`about-adventure-card ${adventure.className}`}
                key={adventure.title}
              >
                <div className="about-adventure-icon">{adventure.icon}</div>

                <span className="about-adventure-label">{adventure.label}</span>

                <h3>{adventure.title}</h3>
                <p>{adventure.description}</p>

                <button
                  onClick={() => navigate("/adventures")}
                  className="about-card-link"
                >
                  Explore Adventures →
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="about-section">
          <div className="about-section-heading">
            <span className="about-section-eyebrow">EXPLORE SMARTER</span>
            <h2>What Makes Arad Quest Special?</h2>
            <p>Technology meets tourism, storytelling and discovery.</p>
          </div>

          <div className="about-features-grid">
            {features.map((feature) => (
              <article className="about-feature-card" key={feature.title}>
                <div className="about-feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* EXPLORER GUIDE */}
        <section className="about-guide-section">
          <div className="about-guide-heading">
            <span className="about-section-eyebrow">NEW EXPLORER?</span>
            <h2>Your Explorer's Guide</h2>
            <p>Everything you need to begin your journey.</p>
          </div>

          <div className="about-guide-list">
            {guideItems.map((item, index) => (
              <article className="about-guide-item" key={item.title}>
                <div className="about-guide-number">{index + 1}</div>

                <div className="about-guide-icon">{item.icon}</div>

                <div className="about-guide-text">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="about-guide-note">
            <span>💡</span>
            <p>
              <strong>Explorer Tip:</strong> Wear comfortable shoes, keep your
              phone charged and follow the instructions provided for each
              adventure. Respect nature, landmarks and local communities.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="about-section about-faq-section">
          <div className="about-section-heading">
            <span className="about-section-eyebrow">NEED HELP?</span>
            <h2>Frequently Asked Questions</h2>
            <p>Quick answers for curious explorers.</p>
          </div>

          <div className="about-faq-list">
            {faqs.map((faq, index) => (
              <article
                className={`about-faq-item ${openFAQ === index ? "open" : ""}`}
                key={faq.question}
              >
                <button
                  className="about-faq-question"
                  onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
                >
                  <span>{faq.question}</span>
                  <span className="about-faq-toggle">
                    {openFAQ === index ? "−" : "+"}
                  </span>
                </button>

                {openFAQ === index && (
                  <div className="about-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <div className="about-cta-compass">🧭</div>

          <div>
            <span className="about-section-eyebrow">
              YOUR NEXT STORY AWAITS
            </span>
            <h2>Ready to become an explorer?</h2>
            <p>Arad is full of stories. Go out and discover yours.</p>
          </div>

          <button
            className="about-hero-button"
            onClick={() => navigate("/adventures")}
          >
            Explore Arad <span>→</span>
          </button>
        </section>

        {/* FOOTER */}
        <footer className="about-footer">
          <img src={aradQuestLogo} alt="Arad Quest" />
          <p>Made for explorers. Inspired by Arad.</p>
          <span>© Arad Quest</span>
        </footer>
      </main>
    </div>
  );
}

export default AboutPage;
