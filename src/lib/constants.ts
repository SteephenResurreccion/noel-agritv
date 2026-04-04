/** Client's Facebook Messenger deep link */
export const MESSENGER_URL = "https://m.me/noeltolentino2728";

/** Facebook page URL */
export const FACEBOOK_URL = "https://www.facebook.com/noeltolentino2728/";

/** Client phone number — UPDATE when client provides */
export const PHONE_NUMBER = "0917-000-0000";
export const PHONE_TEL = "tel:+63917000000";

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
