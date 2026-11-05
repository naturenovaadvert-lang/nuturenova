const FooterSection = () => {
  return (
    <section className="footer-section">
      <div className="2xl:h-[110dvh] relative md:pt-[20vh] pt-[10vh]">
        <div className="overflow-hidden z-10">
          <h1 className="general-title text-center text-milk py-5">
            #CHUGRESPONSIBLY
          </h1>
        </div>
        <div className="flex-center gap-5 relative z-10 md:mt-20 mt-5">
          <div className="social-btn">
            <img src={`${import.meta.env.BASE_URL}images/yt.svg`} alt="" />
          </div>
          <div className="social-btn">
            <img src={`${import.meta.env.BASE_URL}images/insta.svg`} alt="" />
          </div>
          <div className="social-btn">
            <img src={`${import.meta.env.BASE_URL}images/tiktok.svg`} alt="" />
          </div>
        </div>

        <div className="copyright-box">
          <p>Copyright © 2026 NurtureNova - All Rights Reserved</p>
          <div className="flex items-center gap-7">
            <a href="https://x.com/vicopsx" target="_blank" rel="noreferrer">
              Developer
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FooterSection;
