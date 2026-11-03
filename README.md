# Silk Road Guesthouse — Website

A responsive, animated hospitality landing page created from the supplied property listing.

## Run locally
No build tools or package installation are required.

1. Unzip the project.
2. Open `index.html` in a browser, or run a local server from this folder:
   `python3 -m http.server 8000`
3. Visit `http://localhost:8000`.

## Files
- `index.html` — page structure and content
- `assets/style.css` — responsive styling, visual effects and animations
- `assets/script.js` — navigation, scroll reveals and enquiry form behaviour

## Before publishing
- Replace the stock photography with licensed, actual property photographs.
- Add the verified street address, phone number, official email and real booking URL.
- Connect the enquiry form to a real backend or booking provider. The current form only opens a prefilled email draft and does not create reservations.
- Verify current room rates, availability, taxes, breakfast inclusions and guest-review details.
- Add the final domain, analytics, privacy policy and SEO/social metadata.

## Content accuracy
Property details and nearby attraction distances are based on the PDF supplied in the conversation. INR room prices are indicative figures shown in that document and are not guaranteed live rates. The map graphic is illustrative, not a navigational map. The 10/10 score and quote are reproduced from the supplied listing, which showed two reviews.


## Updated: live map, gallery and reviews
- The location section embeds a live Google Maps search for the guesthouse name in Almaty and links to Google Maps directions. The PDF does not contain a verified street address; confirm the correct pin and replace the search query with a place ID or verified address before launch.
- The gallery expects 24 real property images at `assets/gallery/image-01.jpg` through `assets/gallery/image-24.jpg`. Add the photographs to that folder. The lightbox supports next/previous navigation and keyboard arrows.
- Guest reviews are loaded from `reviews.json`. Add genuine reviews to its `reviews` array using `name`, `country`, `rating` (out of 10), `comment`, and optional `date`. Update `averageRating` and `reviewCount` only from a reliable source. The supplied PDF shows 2 total reviews but only provides the text of one, so the site does not invent the missing review.
- Run the website through a local web server (not `file://`) so `fetch('reviews.json')` works.
