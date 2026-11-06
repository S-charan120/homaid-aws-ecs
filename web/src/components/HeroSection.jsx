export default function HeroSection() {
  return (
    <section className="hero" id="top">
      <div>
        <p className="eyebrow">A LITTLE HELP GOES A LONG WAY</p>
        <h1>
          Home care,
          <br />
          <em>made simpler.</em>
        </h1>
        <p className="lead">
          Book everyday home services with a clear request, a preferred time,
          and a little less hassle.
        </p>
        <a className="primary-link" href="#booking">
          Book a service <span>↗</span>
        </a>
        <div className="proof">
          <span>● Clear booking requests</span>
          <span>● Simple status tracking</span>
        </div>
      </div>

      <div className="hero-card" aria-label="Illustration of a home">
        <div className="sun">✳</div>
        <div className="home-shape" aria-hidden="true">⌂</div>
        <p>
          Make room for
          <br />
          <b>the good things.</b>
        </p>
      </div>
    </section>
  );
}
