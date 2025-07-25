// ----------------------  content.js  ----------------------

// Luistert naar berichten vanuit background/popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeContent") {
    console.log("BGO Copilot: Content script received a scrape request.");

    const host = location.hostname;
    let pageTextPromise;

    if (host.includes('natuurhuisje.be')) {
      pageTextPromise = scrapeNatuurhuisjeAsText();
    } else if (host.includes('vipio.com')) {
      pageTextPromise = scrapeVipioAsText();
    } else if (host.includes('booking.com')) {
      sendResponse({ pageContent: "Booking.com scraping is tijdelijk geparkeerd." });
      return;
    } else if (host.includes('campspace.com')) {
      pageTextPromise = scrapeCampspaceAsText();
    } else {
      pageTextPromise = Promise.reject(new Error("This website is niet ondersteund."));
    }

    pageTextPromise
      .then(text => {
        if (!text || text.trim().length < 50) throw new Error("Kon geen content van de pagina scrapen.");
        sendResponse({ pageContent: text });
      })
      .catch(err => {
        console.error("BGO Copilot: Error scraping content:", err);
        sendResponse({ error: `Fout: ${err.message}` });
      });

    return true; // kanaal open
  }
});

// ---------------- helper utils -----------------

const getText    = (sel, p = document) => p.querySelector(sel)?.innerText.trim() || '';
const getAllText = (sel, p = document) => [...p.querySelectorAll(sel)].map(el => el.innerText.trim());

// ------------- SCRAPERS (volledige versies) -------------

// ===== Campspace =====
async function scrapeCampspaceAsText() {
<<<<<<< HEAD
    const contentParts = [];
    contentParts.push(`TITEL: ${getText('h1.space-header--h1')}`);
    contentParts.push(`${getText('.space-header--part-reviews')}\n${getText('.space-header--part-location')}`);
    contentParts.push('\n---\n');
    contentParts.push(`HIGHLIGHTS: ${getAllText('.popular-filters-label label').join(', ')}`);
    const descriptionNode = document.querySelector('[data-app--base--read-more-target="textContent"]');
    if (descriptionNode) {
        const fullDescription = descriptionNode.dataset.fullText || descriptionNode.innerText;
        contentParts.push('OMSCHRIJVING:');
        contentParts.push(fullDescription.replace(/Lees meer/g, '').trim());
    }
    const infoSections = document.querySelectorAll('.info-section');
    infoSections.forEach(section => {
        const title = getText('h4', section);
        if (title && title.includes('Perfect voor...')) {
            const text = getText('p', section);
            contentParts.push(`\nPERFECT VOOR...\n${text}`);
        }
    });
    contentParts.push('\n---\n');
    contentParts.push(`VERHUURDER: ${getText('.space-host-introduction a')}`);
    contentParts.push('\n---\n');
    const amenitiesPopup = document.querySelector('dialog[data-popup-name="amenities"] .popup--body');
    if (amenitiesPopup) {
        contentParts.push('ALGEMENE VOORZIENINGEN:');
        const amenityGroups = amenitiesPopup.querySelectorAll('.space-grid');
        amenityGroups.forEach(group => {
            const amenityTitle = getText('h4', group);
            if (amenityTitle) {
                contentParts.push(`\n${amenityTitle}:`);
                const amenityItems = Array.from(group.querySelectorAll('li')).map(li => `- ${li.innerText.trim().replace(/\n/g, ': ')}`);
                contentParts.push(amenityItems.join('\n'));
            }
        });
    }
    contentParts.push('\n---\n');
    contentParts.push('ACCOMMODATIE OPTIES:');
    const pitches = document.querySelectorAll('.space-pitches--section');
    if (pitches.length > 0) {
        pitches.forEach(pitch => {
            const pitchTitle = getText('.space-pitches--h3', pitch);
            const pitchPrice = getText('.space-pitches--type-price', pitch);
            
            if (pitchTitle && pitchPrice) {
                contentParts.push(`\n** ${pitchTitle.toUpperCase()} ** - ${pitchPrice}`);
            } else if (pitchTitle) {
                contentParts.push(`\n** ${pitchTitle.toUpperCase()} **`);
            }

            const popupName = pitch.querySelector('[data-popup-name]')?.dataset.popupName;
            const popup = document.querySelector(`dialog[data-popup-name="${popupName}"]`);
            if (popup) {
                const popupBody = popup.querySelector('.popup--body');
                if (popupBody) {
                    const pitchFullDescription = getText('.pitch-full-description', popupBody);
                    contentParts.push(pitchFullDescription);
                    const bookingInfoContainer = popupBody.querySelector('.pitch-booking-information');
                    if(bookingInfoContainer){
                        contentParts.push("\nBOEKINGSINFORMATIE:");
                        contentParts.push(bookingInfoContainer.innerText.trim());
                    }
                    const amenitiesContainer = popupBody.querySelector('.pitch-amenities');
                    if (amenitiesContainer) {
                        contentParts.push("\nVOORZIENINGEN:");
                        const amenityGroups = amenitiesContainer.querySelectorAll('.space-grid, h4');
                        let currentTitle = '';
                        amenityGroups.forEach(element => {
                            if (element.tagName === 'H4') {
                                currentTitle = element.innerText.trim();
                                contentParts.push(`\n${currentTitle}:`);
                            } else if (element.classList.contains('space-grid')) {
                                const amenityItems = Array.from(element.querySelectorAll('li')).map(li => `- ${li.innerText.trim().replace(/\n/g, ': ')}`);
                                contentParts.push(amenityItems.join('\n'));
                            } else if (element.tagName === 'P') {
                                contentParts.push(element.innerText.trim());
                            }
                        });
                    }
                }
            } else {
                const pitchDescription = getText('.pitch-description', pitch);
                contentParts.push(pitchDescription);
            }
        });
    } else {
        contentParts.push('Geen specifieke accommodatie-opties gevonden.');
    }
    contentParts.push('\n---\n');
    contentParts.push('BEOORDELINGEN:');
    const allReviews = [];
    const processReviewPage = (doc) => {
        doc.querySelectorAll('.space-review').forEach(review => {
            const author = getText('.review-headline--span', review);
            const date = getText('.review-subline', review);
            let reviewText = getText('.review-body', review);
            const hostResponse = getText('.review-feedback', review);
            if (hostResponse) {
                reviewText += `\n\n${hostResponse}`;
            }
            if (reviewText && author) {
                allReviews.push(`Review door ${author} (${date || 'Onbekend'}):\n${reviewText.replace(/\n\n/g, '\n')}`);
            }
        });
    };
    processReviewPage(document);
    const pagination = document.querySelector('.pager');
    if (pagination) {
        let totalPages = 1;
        let reviewUrlBase = null;
        const firstPageLink = pagination.querySelector('a.pager-a[href]');
        if (firstPageLink) {
            reviewUrlBase = firstPageLink.getAttribute('href').split('?')[0];
        }
        const lastPageLink = pagination.querySelector('a[title="Laatste pagina"]');
        if (lastPageLink) {
            try {
                const url = new URL(lastPageLink.href, window.location.origin);
                totalPages = parseInt(url.searchParams.get('page'), 10) || 1;
            } catch (e) { console.error("Kon 'Laatste pagina' link niet verwerken.", e); }
        }
        const MAX_REVIEWS = 50;
        const REVIEWS_PER_PAGE = 10;
        const maxPagesToFetch = Math.ceil(MAX_REVIEWS / REVIEWS_PER_PAGE);
        const endPage = Math.min(totalPages, maxPagesToFetch);
        if (reviewUrlBase && totalPages > 1) {
            for (let i = 2; i <= endPage; i++) {
                try {
                    const response = await fetch(`${window.location.origin}${reviewUrlBase}?page=${i}`);
                    const htmlText = await response.text();
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlText;
                    processReviewPage(tempDiv);
                } catch (error) {
                    console.error(`BGO Copilot: Fout bij het ophalen van Campspace reviews voor pagina ${i}:`, error);
                }
            }
        }
    }
    if (allReviews.length > 0) {
        contentParts.push(allReviews.join('\n\n---\n\n'));
    } else {
        contentParts.push('Geen beoordelingen gevonden.');
    }
    const finalContent = contentParts.join('\n\n').replace(/\n\n\n+/g, '\n\n').replace(/\n\s*\n/g, '\n\n');
    return Promise.resolve(finalContent);
}

async function scrapeVipioAsText() {
    const contentParts = [];
    const getPrice = () => {
        try {
            const scriptTag = document.querySelector('script[type="application/ld+json"]');
            if (scriptTag) {
                const jsonData = JSON.parse(scriptTag.textContent);
                if (jsonData && jsonData.offers && jsonData.offers.price) {
                    return `€ ${jsonData.offers.price}`;
                }
            }
            return getText('.card-booking-box .from-price');
        } catch (error) {
            console.error("BGO Copilot: Fout bij het scrapen van de prijs voor Vipio.", error);
            return 'Prijs niet gevonden';
        }
    };
    const processReviewNode = (reviewNode) => {
        const author = getText('.name .publishing-name', reviewNode) || 'Anoniem';
        const date = getText('time', reviewNode);
        const commentNode = reviewNode.querySelector('q[data-target="listing-description.translatedText"]') || reviewNode.querySelector('p.public-review');
        const comment = commentNode ? commentNode.innerText.trim() : 'Geen commentaar.';
        return `Review door ${author} (${date}):\n${comment}`;
    };
    contentParts.push(`TITEL: ${getText('h1 .offer-title')}`);
    contentParts.push(`VANAF PRIJS: ${getPrice()}`);
    contentParts.push(getAllText('section.overview ul.list.horizontal li').join('\n'));
    const summaryList = getAllText('section.summary ul.list li');
    if (summaryList.length > 0) contentParts.push(`KENMERKEN: ${summaryList.join(' | ')}`);
    const reviewScore = getText('.review-summary-average');
    const reviewCount = getText('.review-summary-detail-number');
    if (reviewScore && reviewCount) contentParts.push(`SCORE: ${reviewScore} (${reviewCount})`);
    contentParts.push('\n---\n');
    const descriptionNode = document.querySelector('section.description .content');
    if (descriptionNode) {
        contentParts.push('OMSCHRIJVING:');
        contentParts.push(descriptionNode.innerText.trim());
    }
    contentParts.push('\n---\n');
    const facilitiesNode = document.querySelector('section.facilities');
    if(facilitiesNode) {
        contentParts.push('VOORZIENINGEN:');
        contentParts.push(getAllText('.facility', facilitiesNode).join(', '));
    }
    contentParts.push('\n---\n');
    const practicalInfoNode = document.querySelector('section.practicalInfo');
    if(practicalInfoNode) {
        contentParts.push('PRAKTISCHE INFORMATIE:');
        contentParts.push(practicalInfoNode.innerText.trim());
    }
    contentParts.push('\n---\n');
    const costsSections = document.querySelectorAll('section.additionalCosts');
    costsSections.forEach(section => {
        const title = getText('h2.section-title', section);
        const items = getAllText('.row.no-gutters', section).map(rowText => `- ${rowText.replace(/\n/g, ' ')}`);
        contentParts.push(title.toUpperCase() + ':');
        contentParts.push(items.join('\n'));
    });
    contentParts.push('\n---\n');
    contentParts.push('BEOORDELINGEN:');
    const allReviews = new Set();
    try {
        const reviewsUrl = window.location.href.split('?')[0] + '/reviews';
        const response = await fetch(reviewsUrl, { headers: { 'Accept': 'text/html' } });
        if (!response.ok) throw new Error(`Review page request failed with status ${response.status}`);
        const htmlText = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;
        const reviewNodes = tempDiv.querySelectorAll('article.review');
        if (reviewNodes.length === 0) throw new Error("No review articles found in the fetched HTML.");
        reviewNodes.forEach(reviewNode => allReviews.add(processReviewNode(reviewNode)));
        contentParts.push(...Array.from(allReviews));
    } catch (error) {
        console.error("BGO Copilot: API fetch for reviews failed, scraping only visible reviews as a fallback.", error);
        const visibleReviews = document.querySelectorAll('section.reviews article.review');
        if (visibleReviews.length > 0) {
            visibleReviews.forEach(reviewNode => allReviews.add(processReviewNode(reviewNode)));
            contentParts.push(...Array.from(allReviews));
        } else {
            contentParts.push('Kon de reviews niet laden.');
        }
    }
    return contentParts.join('\n\n').replace(/\n\n\n+/g, '\n\n');
}

async function scrapeNatuurhuisjeAsText() {
    const contentParts = [];
    contentParts.push(`TITEL: ${getText('h1.nh-detail__header__title')}`);

    const params = new URLSearchParams(window.location.search);
    const arrivalStr = params.get('arrivalDate');
    const departureStr = params.get('departureDate');

    if (arrivalStr && departureStr) {
        const priceElement = document.querySelector('span[data-testid="total-price"]');
        if (priceElement) {
            let totalText = priceElement.innerText.trim();
            try {
                const arrivalDate = new Date(arrivalStr);
                const departureDate = new Date(departureStr);
                const diffTime = Math.abs(departureDate - arrivalDate);
                const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const totalPriceRaw = priceElement.dataset.totalPrice || totalText.replace(/€\s*/, '').replace(',', '.');
                const totalPrice = parseFloat(totalPriceRaw);

                if (!isNaN(totalPrice) && numberOfNights > 0) {
                    const pricePerNight = totalPrice / numberOfNights;
                    const formattedPrice = `€ ${pricePerNight.toFixed(2).replace('.', ',')}`;
                    contentParts.push(`VANAF PRIJS: ${formattedPrice} per nacht`);
                } else {
                    contentParts.push(`PRIJS: ${totalText}`);
                }
            } catch (e) {
                console.error("BGO Copilot: Fout bij berekenen prijs per nacht voor Natuurhuisje", e);
                contentParts.push(`PRIJS: ${totalText}`);
            }
        }
    }

    contentParts.push(getText('h2.nh-detail__header__subtitle'));
    contentParts.push(`TYPE: ${getText('.nh-detail__header__details')}`);
    const features = getAllText('.nh-detail__header__features .nh-list__item');
    contentParts.push(`KENMERKEN: ${features.join(' | ')}`);
    contentParts.push('\n---\n');
    const descriptionNode = document.querySelector('#nature_description_show_more [data-role="content"]');
    if (descriptionNode) {
        contentParts.push('OMSCHRIJVING:');
        contentParts.push(descriptionNode.innerText.trim());
    }
    contentParts.push('\n---\n');
    const facilitiesSection = document.querySelector('[data-role="facilities-section"]');
    if (facilitiesSection) {
        contentParts.push('FACILITEITEN:');
        facilitiesSection.querySelectorAll('.nh-detail__content__facilities__bedroom').forEach(room => {
            const roomName = getText('.nh-detail__content__facilities__bedroom__title', room);
            const beds = getAllText('li', room).join(', ');
            contentParts.push(`${roomName}: ${beds}`);
        });
        facilitiesSection.querySelectorAll('.nh-detail__content__facilities__category').forEach(cat => {
            const categoryName = getText('strong', cat);
            const items = getAllText('.nh-detail__content__facilities__category__list-item', cat);
            contentParts.push(`${categoryName}: ${items.join(', ')}`);
        });
    }
    contentParts.push('\n---\n');
    const optionalCostsTable = document.querySelector('.nh-detail__content__optional-costs table');
    if (optionalCostsTable) {
        contentParts.push('OPTIONELE KOSTEN:');
        Array.from(optionalCostsTable.querySelectorAll('tr')).forEach(row => {
            const description = getText('th', row).replace(/\n/g, ' ');
            const price = getText('td', row);
            contentParts.push(`- ${description}: ${price}`);
        });
    }
    contentParts.push('\n---\n');
    contentParts.push('BEOORDELINGEN:');
    const houseId = document.querySelector('meta[id="house-id"]')?.content;
    if (houseId) {
        try {
            const reviewApiUrl = `/api/houses/${houseId}/reviews?skip=0`;
            const response = await fetch(reviewApiUrl);
            const reviewsData = await response.json();
            if (reviewsData && reviewsData.data && reviewsData.data.reviews && reviewsData.data.reviews.length > 0) {
                const reviewsText = reviewsData.data.reviews.map(review =>
                    `Review door ${review.initials} (aankomst ${review.arrivalDate}):\nNatuur: ${review.natureCommentTranslated || review.natureComment}\nHuisje: ${review.houseCommentTranslated || review.houseComment}`
                ).join('\n\n');
                contentParts.push(reviewsText);
            } else {
                contentParts.push('Geen beoordelingen gevonden.');
            }
        } catch (error) {
            console.error("BGO Copilot: Fout bij het ophalen van reviews via API:", error);
            contentParts.push('Kon beoordelingen niet laden.');
        }
    } else {
        contentParts.push('Kon huis-ID niet vinden voor reviews.');
    }
    contentParts.push('\n---\n');
    const goodToKnowSection = document.querySelector('[data-role="good-to-know"]');
    if (goodToKnowSection) {
        contentParts.push('GOED OM TE WETEN:');
        contentParts.push(goodToKnowSection.innerText.trim());
    }
    return contentParts.join('\n').replace(/\n\n+/g, '\n\n');
}


// --- General functions for buttons and images ---
=======
  const contentParts = [];
  contentParts.push(`TITEL: ${getText('h1.space-header--h1')}`);
  contentParts.push(`${getText('.space-header--part-reviews')}\n${getText('.space-header--part-location')}`);
  contentParts.push('\n---\n');
  contentParts.push(`HIGHLIGHTS: ${getAllText('.popular-filters-label label').join(', ')}`);

  const descriptionNode = document.querySelector('[data-app--base--read-more-target="textContent"]');
  if (descriptionNode) {
    const fullDescription = descriptionNode.dataset.fullText || descriptionNode.innerText;
    contentParts.push('OMSCHRIJVING:');
    contentParts.push(fullDescription.replace(/Lees meer/g, '').trim());
  }

  const infoSections = document.querySelectorAll('.info-section');
  infoSections.forEach(section => {
    const title = getText('h4', section);
    if (title && title.includes('Perfect voor...')) {
      const text = getText('p', section);
      contentParts.push(`\nPERFECT VOOR...\n${text}`);
    }
  });

  contentParts.push('\n---\n');
  contentParts.push(`VERHUURDER: ${getText('.space-host-introduction a')}`);
  contentParts.push('\n---\n');

  // Voorzieningen (popup)
  const amenitiesPopup = document.querySelector('dialog[data-popup-name="amenities"] .popup--body');
  if (amenitiesPopup) {
    contentParts.push('ALGEMENE VOORZIENINGEN:');
    const amenityGroups = amenitiesPopup.querySelectorAll('.space-grid');
    amenityGroups.forEach(group => {
      const amenityTitle = getText('h4', group);
      if (amenityTitle) {
        contentParts.push(`\n${amenityTitle}:`);
        const items = [...group.querySelectorAll('li')]
          .map(li => `- ${li.innerText.trim().replace(/\n/g, ': ')}`);
        contentParts.push(items.join('\n'));
      }
    });
  }

  contentParts.push('\n---\n');
  contentParts.push('ACCOMMODATIE OPTIES:');

  const pitches = document.querySelectorAll('.space-pitches--section');
  if (pitches.length > 0) {
    for (const pitch of pitches) {
      const pitchTitle = getText('.space-pitches--h3', pitch);
      const pitchPrice = getText('.space-pitches--type-price', pitch);
      contentParts.push(`\n** ${pitchTitle.toUpperCase()} **`);
      contentParts.push(pitchPrice);

      const popupName = pitch.querySelector('[data-popup-name]')?.dataset.popupName;
      const popup = document.querySelector(`dialog[data-popup-name="${popupName}"]`);
      if (popup) {
        const body = popup.querySelector('.popup--body');
        if (body) {
          const fullDesc = getText('.pitch-full-description', body);
          if (fullDesc) contentParts.push(fullDesc);

          const bookInfo = body.querySelector('.pitch-booking-information');
          if (bookInfo) {
            contentParts.push('\nBOEKINGSINFORMATIE:');
            contentParts.push(bookInfo.innerText.trim());
          }

          const amenitiesContainer = body.querySelector('.pitch-amenities');
          if (amenitiesContainer) {
            contentParts.push('\nVOORZIENINGEN:');
            let currentTitle = '';
            amenitiesContainer.childNodes.forEach(el => {
              if (el.tagName === 'H4') {
                currentTitle = el.innerText.trim();
                contentParts.push(`\n${currentTitle}:`);
              } else if (el.classList?.contains('space-grid')) {
                const items = [...el.querySelectorAll('li')].map(li => `- ${li.innerText.trim().replace(/\n/g, ': ')}`);
                contentParts.push(items.join('\n'));
              } else if (el.tagName === 'P') {
                contentParts.push(el.innerText.trim());
              }
            });
          }
        }
      } else {
        const shortDesc = getText('.pitch-description', pitch);
        if (shortDesc) contentParts.push(shortDesc);
      }
    }
  } else {
    contentParts.push('Geen specifieke accommodatie-opties gevonden.');
  }

  // Reviews
  contentParts.push('\n---\n');
  contentParts.push('BEOORDELINGEN:');
  const allReviews = [];
  const processReviewPage = doc => {
    doc.querySelectorAll('.space-review').forEach(review => {
      const author = getText('.review-headline--span', review);
      const date   = getText('.review-subline', review);
      let text     = getText('.review-body', review);
      const hostR  = getText('.review-feedback', review);
      if (hostR) text += `\n\n${hostR}`;
      if (text && author) allReviews.push(`Review door ${author} (${date || 'Onbekend'}):\n${text}`);
    });
  };

  processReviewPage(document);

  // Paginate (max 50 reviews)
  const pagination = document.querySelector('.pager');
  if (pagination) {
    let totalPages = 1;
    const last = pagination.querySelector('a[title="Laatste pagina"]');
    if (last) {
      try {
        const url = new URL(last.href, location.origin);
        totalPages = parseInt(url.searchParams.get('page'), 10) || 1;
      } catch {}
    }
    const MAX_REVIEWS = 50, PER = 10;
    const endPage = Math.min(totalPages, Math.ceil(MAX_REVIEWS / PER));
    const base = pagination.querySelector('a.pager-a[href]')?.href.split('?')[0];

    for (let p = 2; p <= endPage && base; p++) {
      try {
        const res = await fetch(`${location.origin}${base}?page=${p}`);
        const html = await res.text();
        const div = document.createElement('div');
        div.innerHTML = html;
        processReviewPage(div);
      } catch (e) { console.error('Campspace review fetch error', e); }
    }
  }

  contentParts.push(allReviews.length ? allReviews.join('\n\n---\n\n') : 'Geen beoordelingen gevonden.');

  return contentParts.join('\n\n').replace(/\n{3,}/g, '\n\n');
}

// ===== Vipio =====
async function scrapeVipioAsText() {
  const parts = [];
  const getPrice = () => {
    try {
      const ld = document.querySelector('script[type="application/ld+json"]');
      if (ld) {
        const data = JSON.parse(ld.textContent);
        return data?.offers?.price ? `€ ${data.offers.price}` : '';
      }
    } catch {}
    return getText('.card-booking-box .from-price');
  };
  const reviewNodeToText = n => {
    const author = getText('.name .publishing-name', n) || 'Anoniem';
    const date   = getText('time', n);
    const commentNode = n.querySelector('q[data-target="listing-description.translatedText"]') || n.querySelector('p.public-review');
    const comment = commentNode ? commentNode.innerText.trim() : 'Geen commentaar.';
    return `Review door ${author} (${date}):\n${comment}`;
  };

  parts.push(`TITEL: ${getText('h1 .offer-title')}`);
  parts.push(`VANAF PRIJS: ${getPrice()}`);
  parts.push(getAllText('section.overview ul.list.horizontal li').join('\n'));

  const summary = getAllText('section.summary ul.list li');
  if (summary.length) parts.push(`KENMERKEN: ${summary.join(' | ')}`);

  const score = getText('.review-summary-average');
  const count = getText('.review-summary-detail-number');
  if (score && count) parts.push(`SCORE: ${score} (${count})`);

  parts.push('\n---\n');

  const desc = document.querySelector('section.description .content');
  if (desc) {
    parts.push('OMSCHRIJVING:');
    parts.push(desc.innerText.trim());
  }

  parts.push('\n---\n');
  const fac = document.querySelector('section.facilities');
  if (fac) {
    parts.push('VOORZIENINGEN:');
    parts.push(getAllText('.facility', fac).join(', '));
  }

  parts.push('\n---\n');
  const practic = document.querySelector('section.practicalInfo');
  if (practic) {
    parts.push('PRAKTISCHE INFORMATIE:');
    parts.push(practic.innerText.trim());
  }

  parts.push('\n---\n');
  document.querySelectorAll('section.additionalCosts').forEach(sec => {
    const title = getText('h2.section-title', sec);
    const items = getAllText('.row.no-gutters', sec).map(t => `- ${t.replace(/\n/g,' ')}`);
    parts.push(`${title.toUpperCase()}:`);
    parts.push(items.join('\n'));
  });

  parts.push('\n---\n');
  parts.push('BEOORDELINGEN:');
  const reviews = new Set();

  try {
    const url = location.href.split('?')[0] + '/reviews';
    const res = await fetch(url, { headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    const div  = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('article.review').forEach(r => reviews.add(reviewNodeToText(r)));
  } catch (e) {
    console.warn('Vipio review fetch fail, fall back to visible', e);
    document.querySelectorAll('section.reviews article.review').forEach(r => reviews.add(reviewNodeToText(r)));
  }
  parts.push(reviews.size ? [...reviews].join('\n\n') : 'Kon de reviews niet laden.');

  return parts.join('\n\n').replace(/\n{3,}/g, '\n\n');
}

// ===== Natuurhuisje =====
async function scrapeNatuurhuisjeAsText() {
  const parts = [];
  parts.push(`TITEL: ${getText('h1.nh-detail__header__title')}`);
  parts.push(getText('h2.nh-detail__header__subtitle'));
  parts.push(`TYPE: ${getText('.nh-detail__header__details')}`);
  const features = getAllText('.nh-detail__header__features .nh-list__item');
  if (features.length) parts.push(`KENMERKEN: ${features.join(' | ')}`);
  parts.push('\n---\n');

  const desc = document.querySelector('#nature_description_show_more [data-role="content"]');
  if (desc) {
    parts.push('OMSCHRIJVING:');
    parts.push(desc.innerText.trim());
  }

  parts.push('\n---\n');
  const facSec = document.querySelector('[data-role="facilities-section"]');
  if (facSec) {
    parts.push('FACILITEITEN:');

    facSec.querySelectorAll('.nh-detail__content__facilities__bedroom').forEach(room => {
      const name = getText('.nh-detail__content__facilities__bedroom__title', room);
      const beds = getAllText('li', room).join(', ');
      parts.push(`${name}: ${beds}`);
    });

    facSec.querySelectorAll('.nh-detail__content__facilities__category').forEach(cat => {
      const catName = getText('strong', cat);
      const items   = getAllText('.nh-detail__content__facilities__category__list-item', cat);
      parts.push(`${catName}: ${items.join(', ')}`);
    });
  }

  // Optionele kosten
  parts.push('\n---\n');
  const optTable = document.querySelector('.nh-detail__content__optional-costs table');
  if (optTable) {
    parts.push('OPTIONELE KOSTEN:');
    optTable.querySelectorAll('tr').forEach(row => {
      const desc = getText('th', row).replace(/\n/g, ' ');
      const price = getText('td', row);
      parts.push(`- ${desc}: ${price}`);
    });
  }

  // Reviews via API
  parts.push('\n---\n');
  parts.push('BEOORDELINGEN:');
  const houseId = document.querySelector('meta[id="house-id"]')?.content;
  if (houseId) {
    try {
      const rsp = await fetch(`/api/houses/${houseId}/reviews?skip=0`);
      const data = await rsp.json();
      const arr  = data?.data?.reviews || [];
      if (arr.length) {
        const txt = arr.map(r =>
          `Review door ${r.initials} (aankomst ${r.arrivalDate}):\nNatuur: ${r.natureCommentTranslated || r.natureComment}\nHuisje: ${r.houseCommentTranslated || r.houseComment}`
        ).join('\n\n');
        parts.push(txt);
      } else parts.push('Geen beoordelingen gevonden.');
    } catch (e) {
      console.error('Natuurhuisje review fetch error', e);
      parts.push('Kon beoordelingen niet laden.');
    }
  } else parts.push('Kon huis-ID niet vinden voor reviews.');

  // Goed om te weten
  parts.push('\n---\n');
  const good = document.querySelector('[data-role="good-to-know"]');
  if (good) {
    parts.push('GOED OM TE WETEN:');
    parts.push(good.innerText.trim());
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n');
}

// ---------------- IMAGE URL HELPERS ----------------
>>>>>>> 8f5344d (Images saved as JPEG)

function getHighQualityUrl(img) {
  const url = img.src;
  const host = location.hostname;

  if (host.includes('natuurhuisje.be') && url.includes('cdn-cgi/imagedelivery')) {
    return url.split('/').slice(0, -1).join('/') + '/width=1200,format=jpeg';
  }
  if (host.includes('vipio.com')) {
    return img.closest('picture')?.querySelector('img')?.src || url;
  }
  if (host.includes('campspace.com') && url.includes('/media/')) {
    return url
      .replace('/medium/', '/detail/')
      .replace('/teaser/', '/detail/')
      .replace('.webp', '.jpg');
  }
  if (host.includes('booking.com') && url.includes('cf.bstatic.com')) {
    return url.replace(/max\d+x\d+/g, 'max1280x900');
  }
  return url;
}

function getMediumQualityThumbnail(url) {
<<<<<<< HEAD
    const hostname = window.location.hostname;
    if (hostname.includes('natuurhuisje.be') && url.includes('cdn-cgi/imagedelivery')) {
        return url.split('/').slice(0, -1).join('/') + '/width=200,height=200,fit=cover';
    }
    if (hostname.includes('booking.com') && url.includes('cf.bstatic.com')) {
        return url.replace(/max\d+x\d+/g, 'max300');
    }
    if (hostname.includes('campspace.com') && url.includes('campspace.com/media')) {
        return url.replace('/teaser/', '/medium/').replace('/detail/', '/medium/');
    }
    return url;
=======
  const host = location.hostname;

  if (host.includes('natuurhuisje.be') && url.includes('cdn-cgi/imagedelivery')) {
    return url.split('/').slice(0, -1).join('/') + '/width=200,height=200,fit=cover,format=jpeg';
  }
  if (host.includes('booking.com') && url.includes('cf.bstatic.com')) {
    return url.replace(/max\d+x\d+/g, 'max300');
  }
  if (host.includes('campspace.com') && url.includes('/media/')) {
    return url
      .replace('/teaser/', '/medium/')
      .replace('/detail/', '/medium/')
      .replace('.webp', '.jpg');
  }
  return url; // Vipio thumbs mogen webp blijven
>>>>>>> 8f5344d (Images saved as JPEG)
}

// --------------- BUTTON LOGIC ----------------

function addButtonToImage(img, selected) {
  if (img.dataset.bgoCopilotProcessed || img.width < 100 || img.height < 100) return;
  img.dataset.bgoCopilotProcessed = 'true';

  const parent = img.parentNode;
  if (!parent) return;
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

  const btn = document.createElement('button');
  btn.className = 'bgo-copilot-button';
  updateButtonState(btn, selected.some(it => it.highQualityUrl === getHighQualityUrl(img)));
  parent.appendChild(btn);

  btn.addEventListener('click', e => {
    e.stopPropagation(); e.preventDefault();
    chrome.runtime.sendMessage({
      action: "toggleSelection",
      image: {
        thumbnailUrl: getMediumQualityThumbnail(img.src),
        highQualityUrl: getHighQualityUrl(img),
        pageUrl: location.href
      }
    });
  });
}

function updateButtonState(btn, sel) {
  btn.innerText = sel ? 'Geselecteerd' : 'Select';
  btn.classList.toggle('selected', sel);
}

function updateAllButtons() {
  chrome.storage.local.get("selectedImages", data => {
    const sel = data.selectedImages || [];
    document.querySelectorAll('.bgo-copilot-button').forEach(btn => {
      const img = btn.parentNode.querySelector('img');
      if (img) updateButtonState(btn, sel.some(i => i.highQualityUrl === getHighQualityUrl(img)));
    });
  });
}

function processAllImages() {
  chrome.storage.local.get("selectedImages", data => {
    const sel = data.selectedImages || [];
    document.querySelectorAll('img').forEach(img => addButtonToImage(img, sel));
  });
}

chrome.storage.onChanged.addListener((chg, ns) => {
  if (ns === 'local' && chg.selectedImages) updateAllButtons();
});

new MutationObserver(() => processAllImages())
  .observe(document.body, { childList: true, subtree: true });

processAllImages();

// ------------------- EINDE content.js -------------------
