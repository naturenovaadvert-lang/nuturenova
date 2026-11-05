import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/all";
import gsap from "gsap";
import { getProductImageUrl, heroProducts, products } from "../constants";
import {
  PRODUCT_PRICES,
  SHIPPING_FEE,
  STORE_CURRENCY,
} from "../constants/product-pricing";

gsap.registerPlugin(useGSAP, SplitText);

/* ---- Config: adjust to your store -------------------------------- */
const CART_KEY = "wisemax-cart"; // same key ProductPage writes to
const INFO_KEY = "wisemax-checkout-info"; // "save this information" storage
const WHATSAPP_RECEIPT_NUMBER = "2347037270598";
const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "United Kingdom",
  "United States",
  "Canada",
  "India",
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: STORE_CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);

const formatReceiptMoney = (amount) =>
  `NGN ${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount)}`;

const createReceiptPdf = (receipt, PdfConstructor) => {
  const document = new PdfConstructor();
  const pageWidth = document.internal.pageSize.getWidth();
  let y = 22;

  document.setFontSize(22);
  document.text("NurtureNova", 20, y);
  y += 10;
  document.setFontSize(14);
  document.text("PAYMENT RECEIPT", 20, y);
  y += 12;

  document.setFontSize(10);
  document.text(`Reference: ${receipt.reference}`, 20, y);
  y += 7;
  if (receipt.paidAt && !Number.isNaN(Date.parse(receipt.paidAt))) {
    document.text(`Paid: ${new Date(receipt.paidAt).toLocaleString("en-NG")}`, 20, y);
    y += 7;
  }
  if (receipt.customer.name) {
    document.text(`Customer: ${receipt.customer.name}`, 20, y);
    y += 7;
  }
  if (receipt.customer.email) {
    document.text(`Email: ${receipt.customer.email}`, 20, y);
    y += 7;
  }

  y += 5;
  document.setFontSize(11);
  document.text("Items", 20, y);
  document.text("Amount", pageWidth - 20, y, { align: "right" });
  y += 7;
  document.setFontSize(10);

  for (const item of receipt.items) {
    if (y > 270) {
      document.addPage();
      y = 20;
    }

    const product = [...products, ...heroProducts].find(
      (entry) => entry.id === item.productId
    );
    const name = product?.name ?? item.productId.replace(/-/g, " ");
    document.text(`${name} x ${item.quantity}`, 20, y);
    if (item.unitPriceNaira !== null) {
      document.text(
        formatReceiptMoney(item.unitPriceNaira * item.quantity),
        pageWidth - 20,
        y,
        { align: "right" }
      );
    }
    y += 7;
  }

  y += 5;
  document.setFontSize(13);
  document.text("Total paid", 20, y);
  document.text(formatReceiptMoney(receipt.amount / 100), pageWidth - 20, y, {
    align: "right",
  });

  return document;
};

const EMPTY_FORM = {
  email: "",
  phone: "",
  name: "",
  address: "",
  city: "",
  country: "",
  postal: "",
};

/* ---- Storage helpers (same defensive pattern as ProductPage) ------- */
const readJson = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const readCart = () => {
  const cart = readJson(CART_KEY, []);
  return Array.isArray(cart) ? cart : [];
};

const writeCart = (cart) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* storage unavailable: the in-memory cart still works */
  }
};

/* ---- Validation ---------------------------------------------------- */
const validate = (v) => {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = "Enter a valid email address.";
  if (v.phone.replace(/\D/g, "").length < 7) errors.phone = "Enter a valid phone number.";
  if (!v.name.trim()) errors.name = "Enter your full name.";
  if (!v.address.trim()) errors.address = "Enter your street address.";
  if (!v.city.trim()) errors.city = "Enter your city.";
  if (!v.country.trim()) errors.country = "Enter your country.";
  if (!v.postal.trim()) errors.postal = "Enter your postal code.";
  return errors;
};

/* ---- Small inline icons (no icon library needed) ------------------ */
const ICONS = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </>
  ),
  phone: (
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  box: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </>
  ),
};

const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

// Defined outside CheckoutPage so inputs keep focus while typing
const Field = ({ id, label, icon, error, ...inputProps }) => (
  <div className="checkout-field">
    <label htmlFor={id}>{label}</label>
    <div className="checkout-input-wrap">
      <Icon name={icon} />
      <input
        id={id}
        name={id}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
    </div>
    {error && (
      <p id={`${id}-error`} className="checkout-error">
        {error}
      </p>
    )}
  </div>
);

const CheckoutPage = ({ onContinue }) => {
  const rootRef = useRef(null);
  const [cart, setCart] = useState(readCart);
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...readJson(INFO_KEY, {}) }));
  const [saveInfo, setSaveInfo] = useState(() => localStorage.getItem(INFO_KEY) !== null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [verifiedReceipt, setVerifiedReceipt] = useState(null);
  const [receiptError, setReceiptError] = useState("");

  const handleReceiptDownload = async () => {
    setReceiptError("");
    try {
      const { jsPDF } = await import("jspdf");
      createReceiptPdf(verifiedReceipt, jsPDF).save(
        `NurtureNova-receipt-${verifiedReceipt.reference}.pdf`
      );
    } catch (error) {
      const details = error instanceof Error ? ` ${error.message}` : "";
      setReceiptError(
        `Could not generate the receipt PDF. Please try again.${details}`
      );
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return undefined;

    let active = true;
    setIsSubmitting(true);
    setStatus("Verifying your Paystack payment…");

    const cleanCallbackUrl = () => {
      params.delete("reference");
      params.delete("trxref");
      params.delete("payment");
      const query = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
      );
    };

    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Payment verification failed.");
        return result;
      })
      .then((result) => {
        if (!active) return;
        if (result.status !== "success") throw new Error("Paystack did not confirm this payment.");
        localStorage.removeItem(CART_KEY);
        setCart([]);
        setPaymentReference(reference);
        setVerifiedReceipt(result);
        setStatus("Payment confirmed. Your order is complete.");
        cleanCallbackUrl();
      })
      .catch((error) => {
        if (!active) return;
        setStatus(error.message || "We couldn't verify the payment. Contact support with your reference.");
        cleanCallbackUrl();
      })
      .finally(() => {
        if (active) setIsSubmitting(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Cart items joined with product data (name, image, price)
  const lines = useMemo(
    () =>
      cart.map((item) => {
        const product = [...products, ...heroProducts].find(
          (entry) => entry.id === item.productId
        );
        const pricing = PRODUCT_PRICES[item.productId];
        const price = pricing?.price ?? 0;
        return {
          productId: item.productId,
          name: product?.name ?? item.name,
          image: product?.image ?? item.image,
          quantity: item.quantity,
          price,
          originalPrice: pricing?.originalPrice ?? price,
          unavailable: !product || !pricing,
          total: price * item.quantity,
        };
      }),
    [cart]
  );

  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const shipping = lines.length ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;
  const hasUnavailableItems = lines.some((line) => line.unavailable);

  const updateCart = (next) => {
    setCart(next);
    writeCart(next);
  };

  const changeQuantity = (productId, delta) =>
    updateCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(99, Math.max(1, item.quantity + delta)) }
          : item
      )
    );

  const removeItem = (productId) =>
    updateCart(cart.filter((item) => item.productId !== productId));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    if (status) setStatus("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length || !lines.length || hasUnavailableItems) return;

    try {
      if (saveInfo) localStorage.setItem(INFO_KEY, JSON.stringify(form));
      else localStorage.removeItem(INFO_KEY);
    } catch {
      /* ignore storage errors */
    }

    const order = {
      customer: form,
      items: lines.map(({ productId, name, quantity, price }) => ({
        productId,
        name,
        quantity,
        price,
      })),
      subtotal,
      shipping,
      total,
      currency: STORE_CURRENCY,
    };

    if (onContinue) {
      setIsSubmitting(true);
      setStatus("");
      try {
        await onContinue(order);
      } catch (error) {
        setStatus(error.message || "Unable to start Paystack checkout. Please try again.");
        setIsSubmitting(false);
      }
    } else {
      setStatus("Payment is not configured for this deployment.");
    }
  };

  // Same entrance language as ProductPage: split title + sliding label
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const revealed = "polygon(100% 0, 0 0, 0 100%, 100% 100%)";

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const titleSplit = SplitText.create(".checkout-title", { type: "chars" });

        gsap
          .timeline()
          .from(titleSplit.chars, { yPercent: 100, stagger: 0.02, ease: "power2.out" })
          .to(
            ".checkout-text-scroll",
            { clipPath: revealed, duration: 1, ease: "power1.inOut" },
            "<0.2"
          )
          .from(
            ".checkout-card, .checkout-summary",
            { y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power2.out" },
            "<0.1"
          );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".checkout-text-scroll", { clipPath: revealed });
      });

      return () => mm.revert();
    },
    { scope: rootRef }
  );

  return (
    <section id="checkout" ref={rootRef} className="checkout-section">
      <div className="checkout-inner">
        {/* Title block, same structure as the product page */}
        <div className="general-title relative flex flex-col items-start justify-center">
          <div className="overflow-hidden">
            <h1 className="checkout-title text-dark-brown">Checkout</h1>
          </div>
          <div
            style={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }}
            className="checkout-text-scroll"
          >
            <div className="bg-yellow-brown px-3 pb-5 pt-3 md:px-5 md:pt-0">
              <h2 className="text-milk-yellow">Almost There</h2>
            </div>
          </div>
        </div>

        <div className="checkout-grid">
          {/* ---- Form ---- */}
          <form className="checkout-card" onSubmit={handleSubmit} noValidate>
            <h2 className="checkout-group-title">Contact information</h2>
            <Field
              id="email"
              label="E-mail"
              icon="mail"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Field
              id="phone"
              label="Phone"
              icon="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Your phone number"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
            />

            <h2 className="checkout-group-title">Shipping address</h2>
            <Field
              id="name"
              label="Full name"
              icon="user"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Field
              id="address"
              label="Address"
              icon="home"
              type="text"
              autoComplete="street-address"
              placeholder="Street address"
              value={form.address}
              onChange={handleChange}
              error={errors.address}
            />
            <Field
              id="city"
              label="City"
              icon="building"
              type="text"
              autoComplete="address-level2"
              placeholder="Your city"
              value={form.city}
              onChange={handleChange}
              error={errors.city}
            />
            <div className="checkout-row">
              <Field
                id="country"
                label="Country"
                icon="globe"
                type="text"
                list="checkout-countries"
                autoComplete="country-name"
                placeholder="Your country"
                value={form.country}
                onChange={handleChange}
                error={errors.country}
              />
              <Field
                id="postal"
                label="Postal code"
                icon="box"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="Postal code"
                value={form.postal}
                onChange={handleChange}
                error={errors.postal}
              />
            </div>
            <datalist id="checkout-countries">
              {COUNTRIES.map((country) => (
                <option key={country} value={country} />
              ))}
            </datalist>

            <label className="checkout-check" htmlFor="save-info">
              <input
                id="save-info"
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
              />
              Save this information for next time
            </label>

            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-end">
              <button
                type="submit"
                className="checkout-submit"
                disabled={!lines.length || hasUnavailableItems || isSubmitting}
              >
                {isSubmitting ? "Processing…" : "Pay with Paystack"}
              </button>
            </div>

            {status && (
              <p className={`checkout-status${paymentReference ? " is-success" : ""}`} role="status">
                {status}
                {paymentReference && <span> Reference: {paymentReference}</span>}
              </p>
            )}
            {verifiedReceipt && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="checkout-submit"
                  onClick={handleReceiptDownload}
                >
                  Download PDF receipt
                </button>
                <a
                  className="checkout-submit"
                  href={`https://wa.me/${WHATSAPP_RECEIPT_NUMBER}?text=${encodeURIComponent(
                    `Hello NurtureNova, I have paid successfully. My receipt is attached. Reference: ${verifiedReceipt.reference}. Please confirm my order.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open WhatsApp chat
                </a>
                <p className="checkout-status w-full" role="note">
                  Download the PDF, then attach it in WhatsApp and tap Send.
                </p>
                {receiptError && (
                  <p className="checkout-status w-full" role="alert">
                    {receiptError}
                  </p>
                )}
              </div>
            )}
          </form>

          {/* ---- Order summary ---- */}
          <aside className="checkout-summary order-first lg:order-none" aria-label="Order summary">
            <h2>Your order</h2>

            {lines.length === 0 ? (
              <div className="checkout-empty">
                <p>Your cart is empty.</p>
                <a href="#hero" className="checkout-submit">
                  Shop flavors
                </a>
              </div>
            ) : (
              <>
                <ul>
                  {lines.map((line) => (
                    <li key={line.productId} className="checkout-line">
                      <div className="checkout-line-image">
                        <img
                          src={getProductImageUrl(line.image)}
                          alt={`${line.name} whey protein`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="checkout-line-name">{line.name}</p>
                        <p className="checkout-line-price">
                          {line.originalPrice > line.price && (
                            <del>{formatMoney(line.originalPrice)}</del>
                          )}
                          <span>{formatMoney(line.price)}</span>
                        </p>
                        <div className="checkout-qty">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${line.name}`}
                            disabled={line.quantity <= 1}
                            onClick={() => changeQuantity(line.productId, -1)}
                          >
                            −
                          </button>
                          <output aria-live="polite">{line.quantity}</output>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${line.name}`}
                            disabled={line.quantity >= 99}
                            onClick={() => changeQuantity(line.productId, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="checkout-remove"
                        onClick={() => removeItem(line.productId)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="checkout-sum-row">
                  <span>Subtotal ({itemCount})</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="checkout-sum-row">
                  <span>Shipping</span>
                  <span>{shipping ? formatMoney(shipping) : "Free"}</span>
                </div>
                <div className="checkout-grand">
                  <span>Total</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default CheckoutPage;