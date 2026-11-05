import process from "node:process";
import {
  PRODUCT_PRICES,
  SHIPPING_FEE,
  STORE_CURRENCY,
} from "../../src/constants/product-pricing.js";

const sendJson = (response, status, body) =>
  response.status(status).json(body);

const cleanText = (value, maxLength = 180) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return sendJson(response, 503, {
      error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY in Vercel settings.",
    });
  }

  const customer = request.body?.customer ?? {};
  const email = cleanText(customer.email, 254).toLowerCase();
  const name = cleanText(customer.name);
  const phone = cleanText(customer.phone, 40);
  const address = cleanText(customer.address);
  const city = cleanText(customer.city, 100);
  const country = cleanText(customer.country, 100);
  const postal = cleanText(customer.postal, 30);

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return sendJson(response, 400, { error: "A valid customer email is required." });
  }
  if (!name || !phone || !address || !city || !country || !postal) {
    return sendJson(response, 400, { error: "Complete the customer and shipping details." });
  }

  const requestedItems = request.body?.items;
  if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 20) {
    return sendJson(response, 400, { error: "Your cart is empty or invalid." });
  }

  const quantities = new Map();
  for (const item of requestedItems) {
    const productId = cleanText(item?.productId, 80);
    const quantity = Number(item?.quantity);
    if (!PRODUCT_PRICES[productId] || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return sendJson(response, 400, { error: "Your cart contains an invalid product or quantity." });
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    if (quantities.get(productId) > 99) {
      return sendJson(response, 400, { error: "A product quantity cannot exceed 99." });
    }
  }

  const items = Array.from(quantities, ([productId, quantity]) => ({
    productId,
    quantity,
    unitPriceNaira: PRODUCT_PRICES[productId].price,
  }));
  const subtotalNaira = items.reduce(
    (sum, item) => sum + PRODUCT_PRICES[item.productId].price * item.quantity,
    0
  );
  const amountKobo = Math.round((subtotalNaira + SHIPPING_FEE) * 100);

  if (!Number.isSafeInteger(amountKobo) || amountKobo < 100) {
    return sendJson(response, 400, { error: "The order total is invalid." });
  }

  const publicSiteUrl = cleanText(process.env.PUBLIC_SITE_URL, 300);
  const productionHost = cleanText(process.env.VERCEL_PROJECT_PRODUCTION_URL, 250);
  const configuredOrigin = publicSiteUrl
    ? publicSiteUrl
    : productionHost
      ? `https://${productionHost}`
      : process.env.VERCEL === "1"
        ? ""
        : cleanText(request.headers.origin, 300);
  let origin;
  try {
    const parsedOrigin = new URL(configuredOrigin);
    const isLocalHttp =
      parsedOrigin.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(parsedOrigin.hostname);
    if (parsedOrigin.protocol !== "https:" && !isLocalHttp) {
      throw new Error("Checkout return URL must use HTTPS.");
    }
    origin = parsedOrigin.origin;
  } catch {
    return sendJson(response, 400, { error: "Unable to determine the checkout return URL." });
  }

  try {
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: STORE_CURRENCY,
        callback_url: `${origin.replace(/\/$/, "")}/?payment=paystack#checkout`,
        metadata: {
          expected_amount_kobo: amountKobo,
          shipping_amount_kobo: SHIPPING_FEE * 100,
          items,
          shipping: {
            name,
            phone,
            address,
            city,
            country,
            postal,
          },
        },
      }),
    });
    const paystackResult = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackResult.status) {
      return sendJson(response, 502, {
        error: paystackResult.message || "Paystack could not initialize this payment.",
      });
    }

    return sendJson(response, 200, {
      authorizationUrl: paystackResult.data.authorization_url,
      reference: paystackResult.data.reference,
    });
  } catch {
    return sendJson(response, 502, { error: "Could not reach Paystack. Please try again." });
  }
}