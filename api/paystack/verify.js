import process from "node:process";
import {
  PRODUCT_PRICES,
  SHIPPING_FEE,
  STORE_CURRENCY,
} from "../../src/constants/product-pricing.js";

const sendJson = (response, status, body) =>
  response.status(status).json(body);

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return sendJson(response, 503, {
      error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY in Vercel settings.",
    });
  }

  const reference = typeof request.query?.reference === "string"
    ? request.query.reference.trim()
    : "";
  if (!/^[\w.-]{8,100}$/.test(reference)) {
    return sendJson(response, 400, { error: "A valid Paystack reference is required." });
  }

  try {
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const paystackResult = await paystackResponse.json();
    if (!paystackResponse.ok || !paystackResult.status) {
      return sendJson(response, 502, {
        error: paystackResult.message || "Paystack could not verify this payment.",
      });
    }

    const transaction = paystackResult.data;
    if (transaction.status !== "success") {
      return sendJson(response, 402, {
        status: transaction.status || "failed",
        error: "Paystack has not marked this payment as successful.",
      });
    }

    const items = transaction.metadata?.items;
    if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
      return sendJson(response, 400, { error: "The transaction is missing valid order details." });
    }

    let itemsAmountKobo = 0;
    let hasPriceSnapshot = true;
    let hasAnyPriceSnapshot = false;
    const verifiedItems = [];
    for (const item of items) {
      const quantity = Number(item.quantity);
      const pricing = PRODUCT_PRICES[item.productId];
      if (!pricing || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return sendJson(response, 400, { error: "The transaction order details are invalid." });
      }

      if (item.unitPriceNaira === undefined) {
        hasPriceSnapshot = false;
        verifiedItems.push({ productId: item.productId, quantity, unitPriceNaira: null });
      } else {
        hasAnyPriceSnapshot = true;
        const unitPriceNaira = Number(item.unitPriceNaira);
        if (!Number.isSafeInteger(unitPriceNaira) || unitPriceNaira < 1) {
          return sendJson(response, 400, { error: "The transaction price details are invalid." });
        }
        itemsAmountKobo += unitPriceNaira * quantity * 100;
        verifiedItems.push({ productId: item.productId, quantity, unitPriceNaira });
      }
    }

    if (hasAnyPriceSnapshot && !hasPriceSnapshot) {
      return sendJson(response, 400, { error: "The transaction price details are incomplete." });
    }

    if (!hasPriceSnapshot) {
      verifiedItems.forEach((item) => {
        item.unitPriceNaira = null;
      });
    }

    const expectedAmountKobo = Number(transaction.metadata.expected_amount_kobo);
    const shippingAmountKobo = Number(
      transaction.metadata.shipping_amount_kobo ?? SHIPPING_FEE * 100
    );
    if (
      transaction.currency !== STORE_CURRENCY ||
      !Number.isSafeInteger(expectedAmountKobo) ||
      expectedAmountKobo < 100 ||
      transaction.amount !== expectedAmountKobo ||
      !Number.isSafeInteger(shippingAmountKobo) ||
      shippingAmountKobo < 0 ||
      (hasPriceSnapshot && itemsAmountKobo + shippingAmountKobo !== expectedAmountKobo)
    ) {
      return sendJson(response, 409, {
        error: "The verified payment amount does not match the order total.",
      });
    }

    return sendJson(response, 200, {
      status: "success",
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      paidAt: transaction.paid_at,
      customer: {
        name: transaction.metadata.shipping?.name ?? "",
        email: transaction.customer?.email ?? "",
      },
      items: verifiedItems,
    });
  } catch {
    return sendJson(response, 502, { error: "Could not reach Paystack. Please try again." });
  }
}