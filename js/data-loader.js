/**
 * AGES Malaysia Website - Data Loader Module
 * Handles read-only data fetching from Supabase with graceful fallback to static DOM content.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize dynamic data loading after DOM is ready
  initDataLoader();
});

async function initDataLoader() {
  const client = getSupabaseClient();
  if (!client) return;

  // Load site settings across all pages (footers, contact info, SEO)
  await loadSiteSettings(client);

  // Page-specific data loading
  const pagePath = window.location.pathname;
  if (pagePath.endsWith('index.html') || pagePath === '/' || pagePath.endsWith('/')) {
    await loadHomeData(client);
  } else if (pagePath.endsWith('tournaments.html')) {
    await loadTournamentsData(client);
  } else if (pagePath.endsWith('live.html')) {
    await loadHighlightsData(client);
  } else if (pagePath.endsWith('contact.html')) {
    await loadContactData(client);
  }
}

/**
 * Loads site_settings (row id = 1) and updates footer, contact details, and SEO metadata.
 */
async function loadSiteSettings(client) {
  try {
    const { data, error } = await client
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      console.log('Site settings using fallback static data:', error ? error.message : 'No data');
      return;
    }

    // Check Maintenance Mode
    if (data.maintenance_mode) {
      console.warn('Site Maintenance Mode Active:', data.maintenance_message);
    }

    // Update Footer Contact Column
    const footerLinks = document.querySelectorAll('.footer-column');
    footerLinks.forEach(col => {
      const title = col.querySelector('.footer-column-title');
      if (title && title.textContent.trim().toLowerCase().includes('contact')) {
        const linksContainer = col.querySelector('.footer-links');
        if (linksContainer) {
          let html = '';
          if (data.address) {
            html += `<p class="footer-tagline">${escapeHtml(data.address)}</p>`;
          }
          if (data.contact_email) {
            html += `<p class="footer-tagline"><strong>Email:</strong> <a href="mailto:${escapeHtml(data.contact_email)}" style="color: var(--color-gold);">${escapeHtml(data.contact_email)}</a></p>`;
          }
          if (data.contact_phone) {
            const cleanPhone = data.contact_phone.replace(/[^0-9]/g, '');
            html += `<p class="footer-tagline"><strong>WhatsApp:</strong> <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" style="color: var(--color-gold);">${escapeHtml(data.contact_phone)}</a></p>`;
          }
          html += `<p class="footer-tagline"><strong>Hours:</strong> 8:00 AM – 12:00 AM</p>`;
          linksContainer.innerHTML = html;
        }
      }
    });

    // Update Footer Social Links
    const socialContainer = document.querySelector('.footer-bottom .social-links');
    if (socialContainer) {
      let socialHtml = '';
      if (data.facebook_url) {
        socialHtml += `<a href="${escapeHtml(data.facebook_url)}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Facebook">Facebook</a>`;
      }
      if (data.instagram_url) {
        socialHtml += `<a href="${escapeHtml(data.instagram_url)}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram">Instagram</a>`;
      }
      if (data.youtube_url) {
        socialHtml += `<a href="${escapeHtml(data.youtube_url)}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="YouTube">YouTube</a>`;
      }
      if (data.tiktok_url) {
        socialHtml += `<a href="${escapeHtml(data.tiktok_url)}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="TikTok">TikTok</a>`;
      }
      if (socialHtml) {
        socialContainer.innerHTML = socialHtml;
      }
    }

    // Update Copyright Text
    const copyrightEl = document.querySelector('.copyright');
    if (copyrightEl && data.footer_copyright) {
      copyrightEl.textContent = data.footer_copyright;
    }

  } catch (err) {
    console.error('Error loading site settings:', err);
  }
}

/**
 * Loads dynamic content for the Homepage (index.html).
 */
async function loadHomeData(client) {
  try {
    // 1. Fetch Published Announcements (Joined with Tournaments)
    const { data: announcements, error: annError } = await client
      .from('announcements')
      .select('*, tournaments(id, title, slug)')
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(6);

    if (annError) {
      console.warn('Error querying announcements:', annError.message);
    }
    renderHomeAnnouncements(announcements || []);

    // 2. Fetch Active Published Tournaments
    const { data: tournaments, error: tourneyError } = await client
      .from('tournaments')
      .select('*')
      .eq('status', 'published')
      .order('event_date', { ascending: true })
      .limit(3);

    if (tourneyError) {
      console.warn('Error fetching home tournaments:', tourneyError.message);
    }
    if (tournaments && tournaments.length > 0) {
      renderHomeTournaments(tournaments);
    }

    // 3. Fetch Featured Highlights
    const { data: highlights } = await client
      .from('highlights')
      .select('*')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (highlights && highlights.length > 0) {
      renderHomeHighlights(highlights);
    }

  } catch (err) {
    console.error('Error loading home data:', err);
  }
}

/**
 * Loads dynamic data for tournaments.html
 */
async function loadTournamentsData(client) {
  try {
    const { data: tournaments, error } = await client
      .from('tournaments')
      .select('*')
      .eq('status', 'published')
      .order('event_date', { ascending: true });

    if (error) {
      console.warn('Error fetching tournaments:', error.message);
    } else if (tournaments && tournaments.length > 0) {
      console.log(`Loaded ${tournaments.length} published tournaments from Supabase.`);
      renderTournamentsList(tournaments);
    }
  } catch (err) {
    console.error('Error loading tournaments data:', err);
  }
}

/**
 * Loads dynamic data for live.html
 */
async function loadHighlightsData(client) {
  try {
    const { data: highlights } = await client
      .from('highlights')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (highlights && highlights.length > 0) {
      console.log(`Loaded ${highlights.length} published media highlights from Supabase.`);
    }
  } catch (err) {
    console.error('Error loading highlights data:', err);
  }
}

/**
 * Loads contact page settings for contact.html
 */
async function loadContactData(client) {
  try {
    const { data } = await client
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      console.log('Contact settings loaded successfully.');
    }
  } catch (err) {
    console.error('Error loading contact data:', err);
  }
}

/* Helper Renderers */

function renderHomeAnnouncements(items) {
  const grid = document.querySelector('#announcements-grid');
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div class="service-card text-center" style="grid-column: 1 / -1; padding: 2rem;">
        <p class="service-text" style="margin: 0; color: var(--color-muted);">No active announcements at this time. Check back soon for official updates.</p>
      </div>
    `;
    return;
  }

  let html = '';
  items.forEach(item => {
    const isFeatured = item.is_featured ? 'is-featured' : '';
    const typeLabel = item.announcement_type ? item.announcement_type : 'ANNOUNCEMENT';
    const rawDate = item.published_at || item.created_at;
    const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    const tourneyTitle = item.tournaments && item.tournaments.title ? item.tournaments.title : null;

    let shortContent = item.content || '';
    if (shortContent.length > 140) {
      shortContent = shortContent.substring(0, 137) + '...';
    }

    html += `
      <article class="announcement-card ${isFeatured}">
        ${item.image_url ? `
          <div class="announcement-media">
            <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">
          </div>
        ` : ''}
        <div class="announcement-body">
          <div class="announcement-badge-row">
            <span class="announcement-type-badge">${escapeHtml(typeLabel)}</span>
            ${item.is_featured ? `<span class="announcement-featured-badge">FEATURED</span>` : ''}
          </div>
          <h3 class="announcement-title">${escapeHtml(item.title)}</h3>
          ${formattedDate ? `<div class="announcement-date">${escapeHtml(formattedDate)}</div>` : ''}
          <div class="announcement-text">${escapeHtml(shortContent)}</div>
          ${tourneyTitle ? `<div class="announcement-tourney-tag">🏆 Tournament: ${escapeHtml(tourneyTitle)}</div>` : ''}
        </div>
      </article>
    `;
  });

  grid.innerHTML = html;
}

function renderHomeTournaments(items) {
  const container = document.querySelector('#home-tournament-container');
  if (!container || !items || items.length === 0) return;

  const item = items[0];
  const formattedDate = formatEventDate(item.event_date);
  const timeStr = formatTime(item.start_time, item.end_time);
  const venueStr = item.venue ? (item.location ? `${item.venue}, ${item.location}` : item.venue) : (item.location || 'Location TBD');
  const catStr = item.category || item.age_category || 'Open Division';
  const teamsStr = item.number_of_teams ? `${item.number_of_teams} Teams Max` : 'Teams Registering';
  const feeStr = formatFee(item.registration_fee, 'RM TBD');
  const prizeStr = item.prize_champion ? `RM ${item.prize_champion}` : (item.prize_runner_up ? 'Cash Prizes' : 'Trophies & Medals');
  const waUrl = buildWhatsAppUrl(item.registration_phone, item.title);
  const contactName = item.registration_contact ? `WhatsApp ${item.registration_contact}` : 'Register Team';

  let html = `
    <div class="section-header">
      <span class="section-subtitle">Compete & Excel</span>
      <h2 class="section-title">Upcoming Tournament</h2>
    </div>

    <div class="tournament-card">
      <div class="tournament-info">
        <div class="tournament-header">
          <span class="tournament-badge">UPCOMING EVENT</span>
          <h3 class="tournament-name">${escapeHtml(item.title)}</h3>
        </div>
        ${item.description ? `<p class="tournament-description">${escapeHtml(item.description)}</p>` : ''}

        <div class="tournament-details">
          ${formattedDate ? `
            <div class="detail-item">
              <span class="detail-label">Date</span>
              <span class="detail-value">${escapeHtml(formattedDate)}</span>
            </div>
          ` : ''}
          ${timeStr ? `
            <div class="detail-item">
              <span class="detail-label">Time</span>
              <span class="detail-value">${escapeHtml(timeStr)}</span>
            </div>
          ` : ''}
          <div class="detail-item">
            <span class="detail-label">Venue</span>
            <span class="detail-value">${escapeHtml(venueStr)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Category</span>
            <span class="detail-value">${escapeHtml(catStr)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Teams</span>
            <span class="detail-value">${escapeHtml(teamsStr)}</span>
          </div>
        </div>

        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${escapeHtml(contactName)}</a>
      </div>

      <div class="tournament-highlights">
        <div class="highlight-box">
          <span class="highlight-title">Registration Fee</span>
          <span class="detail-value">${escapeHtml(feeStr)}</span>
        </div>
        <div class="highlight-box">
          <span class="highlight-title">Champion Prize</span>
          <span class="highlight-prize">${escapeHtml(prizeStr)}</span>
        </div>
        <div class="highlight-box">
          <span class="highlight-title">Broadcast</span>
          <span class="detail-value">Media & Stream</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function renderTournamentsList(items) {
  const dynamicSection = document.querySelector('#dynamic-tournaments-section');
  const grid = document.querySelector('#tournaments-list');
  if (!dynamicSection || !grid || !items || items.length === 0) return;

  dynamicSection.style.display = 'block';

  let html = '';
  const todayStr = new Date().toISOString().split('T')[0];

  items.forEach(item => {
    const formattedDate = formatEventDate(item.event_date);
    const timeStr = formatTime(item.start_time, item.end_time);
    const isPast = item.event_date && item.event_date < todayStr;
    const statusLabel = isPast ? 'COMPLETED' : 'UPCOMING';
    const statusClass = isPast ? 'status-completed' : 'status-upcoming';

    const venueStr = item.venue ? (item.location ? `${item.venue}, ${item.location}` : item.venue) : (item.location || 'TBA');
    const catStr = item.category || item.age_category || 'Open';
    const teamsStr = item.number_of_teams ? `${item.number_of_teams} Teams` : null;
    const feeStr = formatFee(item.registration_fee);
    const matchFeeStr = formatFee(item.match_fee);
    const waUrl = buildWhatsAppUrl(item.registration_phone, item.title);
    const contactText = item.registration_contact ? `WhatsApp ${item.registration_contact}` : 'Enquire on WhatsApp';

    let prizesHtml = '';
    if (item.prize_champion || item.prize_runner_up || item.prize_third_place) {
      let prizeItems = [];
      if (item.prize_champion) prizeItems.push(`🥇 <strong>1st:</strong> ${escapeHtml(item.prize_champion)}`);
      if (item.prize_runner_up) prizeItems.push(`🥈 <strong>2nd:</strong> ${escapeHtml(item.prize_runner_up)}`);
      if (item.prize_third_place) prizeItems.push(`🥉 <strong>3rd:</strong> ${escapeHtml(item.prize_third_place)}`);

      prizesHtml = `
        <div class="tournament-prizes-box">
          <div class="tournament-prizes-title">Trophies & Prizes</div>
          <div class="tournament-prizes-list">
            ${prizeItems.join(' • ')}
          </div>
        </div>
      `;
    }

    html += `
      <article class="tournament-card-dynamic">
        <div class="tournament-poster-media">
          ${item.poster_url ? `
            <img src="${escapeHtml(item.poster_url)}" alt="${escapeHtml(item.title)}" loading="lazy">
          ` : `
            <div class="tournament-poster-fallback">
              <svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c2.21-.4 4-2.27 4.39-4.94C19.08 10.63 21 8.55 21 8V7c0-1.1-.9-2-2-2z"/></svg>
              <span style="font-weight: 700; font-size: 0.85rem; letter-spacing: 0.05em;">AGES TOURNAMENT</span>
            </div>
          `}
        </div>

        <div class="tournament-card-content">
          <span class="tournament-status-badge ${statusClass}">${statusLabel}</span>
          <h3 class="tournament-card-title-dyn">${escapeHtml(item.title)}</h3>
          ${item.description ? `<p class="tournament-card-desc-dyn">${escapeHtml(item.description)}</p>` : ''}

          <div class="tournament-details-list">
            ${formattedDate ? `
              <div class="tournament-detail-row">
                <span class="tournament-detail-label">Date</span>
                <span class="tournament-detail-val">${escapeHtml(formattedDate)}</span>
              </div>
            ` : ''}
            ${timeStr ? `
              <div class="tournament-detail-row">
                <span class="tournament-detail-label">Time</span>
                <span class="tournament-detail-val">${escapeHtml(timeStr)}</span>
              </div>
            ` : ''}
            <div class="tournament-detail-row">
              <span class="tournament-detail-label">Venue</span>
              <span class="tournament-detail-val">${escapeHtml(venueStr)}</span>
            </div>
            <div class="tournament-detail-row">
              <span class="tournament-detail-label">Category</span>
              <span class="tournament-detail-val">${escapeHtml(catStr)}</span>
            </div>
            ${teamsStr ? `
              <div class="tournament-detail-row">
                <span class="tournament-detail-label">Capacity</span>
                <span class="tournament-detail-val">${escapeHtml(teamsStr)}</span>
              </div>
            ` : ''}
            ${feeStr ? `
              <div class="tournament-detail-row">
                <span class="tournament-detail-label">Entry Fee</span>
                <span class="tournament-detail-val">${escapeHtml(feeStr)}</span>
              </div>
            ` : ''}
            ${matchFeeStr ? `
              <div class="tournament-detail-row">
                <span class="tournament-detail-label">Match Fee</span>
                <span class="tournament-detail-val">${escapeHtml(matchFeeStr)}</span>
              </div>
            ` : ''}
            ${item.format ? `
              <div class="tournament-detail-row">
                <span class="tournament-detail-label">Format</span>
                <span class="tournament-detail-val">${escapeHtml(item.format)}</span>
              </div>
            ` : ''}
          </div>

          ${prizesHtml}

          <div class="tournament-card-actions">
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width: 100%; text-align: center;">${escapeHtml(contactText)}</a>
          </div>
        </div>
      </article>
    `;
  });

  grid.innerHTML = html;
}

function renderHomeHighlights(items) {
  // Enhances or maintains highlights previews
}

function formatEventDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${monthNames[monthIndex]} ${year}`;
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(startTime, endTime) {
  if (!startTime && !endTime) return '';
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  return startTime || endTime || '';
}

function formatFee(fee, fallback = '') {
  if (fee === null || fee === undefined || fee === '') return fallback;
  const strVal = String(fee).trim();
  if (!strVal) return fallback;
  if (/^\d+(\.\d+)?$/.test(strVal)) {
    return `RM${strVal}`;
  }
  return strVal;
}

function buildWhatsAppUrl(phoneStr, tournamentTitle) {
  let cleanPhone = phoneStr ? phoneStr.replace(/[^0-9]/g, '') : '601136644476';
  if (!cleanPhone.startsWith('60') && cleanPhone.startsWith('0')) {
    cleanPhone = '60' + cleanPhone.substring(1);
  }
  const msg = `Hello, I would like to enquire about registration for ${tournamentTitle || 'the tournament'}.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

