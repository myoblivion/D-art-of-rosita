import { Mail, MapPin, Clock3, ArrowRight } from 'lucide-react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import './Contact.scss';

export default function Contact() {
  return (
    <main className="contact-page animate-fade-in">
      <section className="contact-hero">
        <div className="section-shell contact-hero__inner">
          <div className="contact-hero__copy">
            <p className="eyebrow">Contact</p>
            <h1>Get in touch</h1>
            <p className="contact-hero__lead">
              For commissions, event inquiries, or a simple hello.
            </p>

            <div className="contact-chips">
              <span className="contact-chip">Commissions</span>
              <span className="contact-chip">Events</span>
              <span className="contact-chip">General questions</span>
            </div>
          </div>

          <div className="contact-hero__card">
            <div className="contact-card">
              <div className="contact-card__row">
                <Mail size={18} />
                <div>
                  <span className="contact-card__label">Email</span>
                  <a href="mailto:hello@example.com">hello@example.com</a>
                </div>
              </div>

              <div className="contact-card__row">
                <MapPin size={18} />
                <div>
                  <span className="contact-card__label">Location</span>
                  <p>Available for local and online inquiries</p>
                </div>
              </div>

              <div className="contact-card__row">
                <Clock3 size={18} />
                <div>
                  <span className="contact-card__label">Reply time</span>
                  <p>Usually within 1 to 3 business days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-main">
        <div className="section-shell contact-grid">
          <div className="contact-links">
            <div className="section-head">
              <div>
                <p className="eyebrow">Social</p>
                <h2>Follow the work</h2>
              </div>
            </div>

            <a href="mailto:rosita.simms@gmail.com" className="social-item">
              <span className="social-item__icon">
                <Mail size={18} />
              </span>
              <span className="social-item__text">
                <strong>Email</strong>
              </span>
              <ArrowRight size={16} />
            </a>

            <a href="https://www.instagram.com/rtistrosita/" className="social-item">
              <span className="social-item__icon">
                <FaInstagram />
              </span>
              <span className="social-item__text">
                <strong>Instagram</strong>
              </span>
              <ArrowRight size={16} />
            </a>

            <a href="#" className="social-item">
              <span className="social-item__icon">
                <FaFacebook />
              </span>
              <span className="social-item__text">
                <strong>Facebook</strong>
              </span>
              <ArrowRight size={16} />
            </a>
          </div>

          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Message</p>
                <h2>Send a note</h2>
              </div>
            </div>

            <div className="input-grid">
              <div className="input-group">
                <label htmlFor="name">Name</label>
                <input id="name" type="text" required placeholder="Your name" />
              </div>

              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required placeholder="Your email" />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="subject">Subject</label>
              <input id="subject" type="text" placeholder="What is this about?" />
            </div>

            <div className="input-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                required
                placeholder="Write your message here"
              />
            </div>

            <button type="submit" className="submit-btn">
              Send message
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}