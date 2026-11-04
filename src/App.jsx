import NavBar from "./components/NavBar";
import HeroSection from "./sections/HeroSection";
import { ScrollTrigger } from "gsap/all";
import gsap from "gsap";
import MessageSection from "./sections/MessageSection";
import FlavorSection from "./sections/FlavorSection";
import ProductPage from "./components/ProductPage";
import CheckoutPage from "./sections/CheckoutPage";
import FooterSection from "./sections/FooterSection";
import { useEffect, useState } from "react";
import { heroProducts, products } from "./constants";

gsap.registerPlugin(ScrollTrigger);

const getCurrentRoute = () => {
  if (window.location.hash) return window.location.hash;

  const search = new URLSearchParams(window.location.search);
  return search.has("reference") || search.has("trxref") || search.get("payment") === "paystack"
    ? "#checkout"
    : "";
};

const App = () => {
  const [routeHash, setRouteHash] = useState(getCurrentRoute);

  const startPaystackCheckout = async (order) => {
    const response = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.authorizationUrl) {
      throw new Error(result.error || "Unable to start Paystack checkout.");
    }

    window.location.assign(result.authorizationUrl);
  };

  useEffect(() => {
    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  useEffect(() => {
    const syncRoute = () => setRouteHash(getCurrentRoute());
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const isProductPage = routeHash.startsWith("#nutrition");
  const isCheckoutPage = routeHash === "#checkout";
  const productId = routeHash.split("/")[1];
  const selectedProduct =
    [...products, ...heroProducts].find((product) => product.id === productId) ??
    products[0];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routeHash]);

  return (
    <main>
      <NavBar isHero={!isCheckoutPage && !isProductPage} />
      {isCheckoutPage ? (
        <>
          <button
            type="button"
            onClick={() => {
              window.location.hash = "";
            }}
            className="fixed right-5 top-5 z-[60] rounded-full bg-dark-brown px-5 py-3 font-paragraph text-white"
          >
            Back to shopping
          </button>
          <CheckoutPage onContinue={startPaystackCheckout} />
        </>
      ) : isProductPage ? (
        <>
          <button
            type="button"
            onClick={() => {
              window.location.hash = "";
            }}
            className="fixed right-5 top-5 z-[60] rounded-full bg-dark-brown px-5 py-3 font-paragraph text-white"
          >
            Back to home
          </button>
          <ProductPage product={selectedProduct} />
        </>
      ) : (
        <>
          <HeroSection />
          <FlavorSection />
          <MessageSection />
          <FooterSection />
        </>
      )}
    </main>
  );
};

export default App;
