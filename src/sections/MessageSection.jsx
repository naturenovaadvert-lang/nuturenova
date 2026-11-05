import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/all";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// The three background images, in the order they appear.
const BG_IMAGES = [
  "https://res.cloudinary.com/msz67c6u/image/upload/v1793522245/message-bg.jpg",
  "https://res.cloudinary.com/msz67c6u/image/upload/v1793522245/8674f1023e3a5bd0dab48865b0d324b9.jpg",
  "https://res.cloudinary.com/msz67c6u/image/upload/v1793522574/athlete-2-1536x1003.webp",
];

const HOLD = 4; // seconds each image stays on screen
const SLIDE = 1.2; // seconds the slide-up transition takes

const MessageSection = () => {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);
  const dipRef = useRef(null);

  // Background: each image slides up over the previous one, then loops
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const slides = gsap.utils.toArray(".message-bg-slide");
        const imgs = slides.map((slide) => slide.querySelector("img"));
        const count = slides.length;

        const tl = gsap.timeline({ repeat: -1 });

        // Starting state (re-applied on every loop): first image showing
        tl.set(slides, {
          visibility: "visible",
          yPercent: (i) => (i === 0 ? 0 : 100),
          zIndex: (i) => i + 1,
        }).set(imgs, { yPercent: 0 });

        for (let i = 0; i < count; i++) {
          const outgoing = slides[i];
          const incoming = slides[(i + 1) % count];
          const incomingImg = imgs[(i + 1) % count];

          tl.set(incoming, { yPercent: 100, zIndex: count + 1 + i }, `+=${HOLD}`)
            // new image slides up over the old one
            .to(incoming, { yPercent: 0, duration: SLIDE, ease: "power3.inOut" })
            // small parallax: the image inside lags, the old one drifts up
            .fromTo(
              incomingImg,
              { yPercent: -25 },
              { yPercent: 0, duration: SLIDE, ease: "power3.inOut" },
              "<"
            )
            .to(outgoing, { yPercent: -20, duration: SLIDE, ease: "power3.inOut" }, "<");
        }

        // Let the last image rest before the loop restarts
        tl.to({}, { duration: HOLD });

        // Only run while the section is on screen
        ScrollTrigger.create({
          trigger: bgRef.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
        });
      });

      return () => mm.revert();
    },
    { scope: bgRef }
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          dipRef.current,
          { yPercent: -12 },
          {
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  useGSAP(() => {
    const firstMsgSplit = SplitText.create(".first-message", {
      type: "words",
    });
    const secMsgSplit = SplitText.create(".second-message", {
      type: "words",
    });
    const paragraphSplit = SplitText.create(".message-content p", {
      type: "words, lines",
      linesClass: "paragraph-line",
    });

    gsap.to(firstMsgSplit.words, {
      color: "#ffffff",
      ease: "power1.in",
      stagger: 1,
      scrollTrigger: {
        trigger: ".message-content",
        start: "top center",
        end: "30% center",
        scrub: true,
      },
    });
    gsap.to(secMsgSplit.words, {
      color: "#ffffff",
      ease: "power1.in",
      stagger: 1,
      scrollTrigger: {
        trigger: ".second-message",
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
    });

    const revealTl = gsap.timeline({
      delay: 1,
      scrollTrigger: {
        trigger: ".msg-text-scroll",
        start: "top 60%",
      },
    });
    revealTl.to(".msg-text-scroll", {
      duration: 1,
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      ease: "circ.inOut",
    });

    const paragraphTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".message-content p",
        start: "top center",
      },
    });
    paragraphTl.from(paragraphSplit.words, {
      yPercent: 300,
      rotate: 3,
      ease: "power1.inOut",
      duration: 1,
      stagger: 0.01,
    });
  });

  return (
    <section ref={sectionRef} className="message-content">
      <div ref={bgRef} className="message-bg" aria-hidden="true">
        {BG_IMAGES.map((src) => (
          <div key={src} className="message-bg-slide">
            <img src={src} alt="" draggable={false} />
          </div>
        ))}
      </div>
      <img
        ref={dipRef}
        src={`${import.meta.env.BASE_URL}images/footer-dip.png`}
        alt=""
        aria-hidden="true"
        className="message-dip"
      />
      <div className="message-overlay" aria-hidden="true" />
      <div className="container mx-auto flex-center py-28 relative z-10">
        <div className="w-full h-full">
          <div className="msg-wrapper">
            <h1 className="first-message">Stir up your fearless past and</h1>

            <div
              style={{
                clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)",
              }}
              className="msg-text-scroll"
            >
              <div className="bg-light-brown md:pb-5 pb-3 px-5">
                <h2 className="text-red-brown">Fuel Up</h2>
              </div>
            </div>

            <h1 className="second-message">
              your future with every gulp of Perfect Protein
            </h1>
          </div>

          <div className="flex-center md:mt-20 mt-10">
            <div className="max-w-md px-10 flex-center overflow-hidden">
              <p>
                Rev up your rebel spirit and feed the adventure of life with
                NUTURENOVA supplements, where you’re one chug away from epic nostalgia and
                fearless fun.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MessageSection;