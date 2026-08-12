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

    // 2. Fetch Active Tournaments
    const { data: tournaments } = await client
      .from('tournaments')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(3);

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
    const { data: tournaments } = await client
      .from('tournaments')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (tournaments && tournaments.length > 0) {
      // Dynamic tournament data exists - can populate or augment existing cards
      console.log(`Loaded ${tournaments.length} published tournaments from Supabase.`);
    }

    const { data: results } = await client
      .from('results')
      .select('*')
      .eq('status', 'published')
      .order('match_date', { ascending: false });

    if (results && results.length > 0) {
      console.log(`Loaded ${results.length} published match results from Supabase.`);
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
      // Update contact page elements if needed
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

    // Truncate long content
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
  // Enhances or maintains tournament previews
}

function renderHomeHighlights(items) {
  // Enhances or maintains highlights previews
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
