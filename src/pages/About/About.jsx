import rositaPortrait from '../../assets/rosita-portrait.jpg';
import './About.scss';

export default function About() {
  return (
    <main className="about-page animate-fade-in">
      <section className="about-hero">
        <div className="section-shell about-hero__inner">
          <div className="about-hero__copy">
            <p className="eyebrow">About the artist</p>
            <h1>Rosita Simmons</h1>
            <p className="about-hero__lead">
              A figurative artist focused on portraits, expressive color, and painterly texture.
            </p>
            <p className="about-hero__text">
              Her work centers on the human figure and the emotional weight of faces, gesture,
              and presence.
            </p>
          </div>

          <div className="about-hero__portrait">
            <img src={rositaPortrait} alt="Rosita Simmons portrait" />
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="section-shell about-grid">
          <div className="about-card">
            <p className="eyebrow">Artist statement</p>
            <h2>Painting the space between likeness and feeling.</h2>
            <p>
              Rosita’s practice moves between observation and expression. The work is grounded in
              portraiture, but color and surface carry as much meaning as resemblance.
            </p>
          </div>

          <div className="about-card">
            <p className="eyebrow">Focus</p>
            <ul className="simple-list">
              <li>Portraits</li>
              <li>Figurative painting</li>
              <li>Expressive color</li>
              <li>Mixed media</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-section about-section--alt">
        <div className="section-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Selected exhibition record</p>
              <h2>Recent public presentation</h2>
            </div>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-item__year">2026</span>
              <div>
                <h3>Featured exhibition presence</h3>
                <p>Portrait and figurative works shown in a gallery-style setting.</p>
              </div>
            </div>

            <div className="timeline-item">
              <span className="timeline-item__year">2024</span>
              <div>
                <h3>Portrait series</h3>
                <p>Work centered on the human subject with expressive color and texture.</p>
              </div>
            </div>

            <div className="timeline-item">
              <span className="timeline-item__year">2023</span>
              <div>
                <h3>Earlier studies</h3>
                <p>Developing pieces exploring identity, gesture, and image-making.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}