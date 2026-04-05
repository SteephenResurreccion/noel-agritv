/** Client's Facebook Messenger deep link */
export const MESSENGER_URL = "https://m.me/noeltolentino2728";

/** Facebook page URL */
export const FACEBOOK_URL = "https://www.facebook.com/noeltolentino2728/";

/** Client phone number */
export const PHONE_NUMBER = "0927-274-3281";
export const PHONE_TEL = "tel:+639272743281";

/** YouTube channel — UPDATE when client provides URL */
export const YOUTUBE_URL = "https://www.youtube.com/@noelagritv";

/** Email */
export const EMAIL = "noelagritv@gmail.com";

/** Messenger link with prefilled product inquiry */
export function messengerProductLink(
  productName: string,
  packSize: string
): string {
  const text = `Hi, I'm interested in ${productName} (${packSize})`;
  return `${MESSENGER_URL}?text=${encodeURIComponent(text)}`;
}

/** Messenger link with prefilled wholesale inquiry */
export const MESSENGER_WHOLESALE_URL = `${MESSENGER_URL}?text=${encodeURIComponent("Hi, I'm interested in wholesale pricing")}`;
