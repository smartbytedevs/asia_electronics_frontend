/**
 * Single source of truth for the shop's public contact details.
 *
 * Every surface (footer, product actions, structured data, floating contact
 * widget) reads from here so a phone/email/address change only has to happen
 * once.
 */
export const SITE_CONTACT = Object.freeze({
  phoneDisplay: "+880 1972-436209",
  // E.164 without spaces — used in `tel:` links.
  phoneTel: "+8801972436209",
  // Digits only, including the country code — used in wa.me links.
  whatsappNumber: "8801972436209",
  email: "asiaelectronicsinfo@gmail.com",
  address: Object.freeze({
    line1: "95/12, Jahanara Mention",
    line2: "Amtol, Riazuddin Bazar",
    city: "Chittagong",
    country: "Bangladesh",
  }),
});

export const SITE_ADDRESS_LINES = Object.freeze([
  SITE_CONTACT.address.line1,
  SITE_CONTACT.address.line2,
  SITE_CONTACT.address.city,
]);

/** WhatsApp deep link with an optional pre-filled message. */
export function whatsappHref(message) {
  const base = `https://wa.me/${SITE_CONTACT.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Gmail web compose link, pre-addressed to the shop inbox. */
export function gmailComposeHref(subject) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: SITE_CONTACT.email,
  });
  if (subject) {
    params.set("su", subject);
  }
  return `https://mail.google.com/mail/?${params.toString()}`;
}
