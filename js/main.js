// Lightbox navigation state
let _lightboxImages = [];
let _lightboxIndex  = -1;

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    updateFooterByPath('verkehrsverein/index.html');
    
    // Save initial content for history navigation (Home state)
    const contentDiv = document.getElementById('content');
    const initialContent = contentDiv.innerHTML;
    const initialTitle = document.querySelector('header h1') ? document.querySelector('header h1').textContent : '';

    // Set initial history state
    history.replaceState({ path: null, title: initialTitle }, '', window.location.href);

    // Mobile menu toggle
    const btn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    const MENU_TOP_THRESHOLD = 8;
    let menuIsHidden = false;

    const hideMainMenuButtons = () => {
        if (!nav || menuIsHidden) return;

        nav.classList.remove('menu-visible-bounce');
        nav.classList.add('menu-hidden');
        closeAllOpenSubmenus();
        menuIsHidden = true;
    };

    const showMainMenuButtonsWithBounce = () => {
        if (!nav || !menuIsHidden) return;

        nav.classList.remove('menu-hidden');
        nav.classList.remove('menu-visible-bounce');
        void nav.offsetWidth;
        nav.classList.add('menu-visible-bounce');
        menuIsHidden = false;
    };

    const updateMenuVisibilityOnScroll = () => {
        if (window.scrollY <= MENU_TOP_THRESHOLD) {
            showMainMenuButtonsWithBounce();
            return;
        }

        hideMainMenuButtons();
    };

    if (btn) {
        btn.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }

    window.addEventListener('scroll', updateMenuVisibilityOnScroll, { passive: true });
    updateMenuVisibilityOnScroll();

    // Scroll-to-top button
    const scrollBtn = document.getElementById('scroll-to-top-btn');
    if (scrollBtn) {
        const SCROLL_THRESHOLD = 300;
        window.addEventListener('scroll', () => {
            if (window.scrollY > SCROLL_THRESHOLD) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        }, { passive: true });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Handle Browser Back/Forward Buttons
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.path) {
            loadContent(event.state.path, event.state.css);
            updateFooterByPath(event.state.path);
            if (event.state.title) {
                const headerH1 = document.querySelector('header h1');
                if (headerH1) headerH1.textContent = event.state.title.toUpperCase();
            }
        } else {
            // Restore initial content (Home)
            contentDiv.innerHTML = initialContent;
            if (initialTitle) {
                const headerH1 = document.querySelector('header h1');
                if (headerH1) headerH1.textContent = initialTitle;
            }
            // Reset theme CSS if any was added
            switchCSS(''); 
            updateFooterByPath('verkehrsverein/index.html');
        }
    });

    // Content navigation override
    document.addEventListener('click', (e) => {
        const galleryImage = e.target.closest('.gaense-gallery-grid img');
        if (galleryImage) {
            const grid = galleryImage.closest('.gaense-gallery-grid');
            const allImgs = grid ? Array.from(grid.querySelectorAll('img')) : [galleryImage];
            const idx = allImgs.indexOf(galleryImage);
            openGaenseLightbox(
                galleryImage.getAttribute('src'),
                galleryImage.getAttribute('alt') || 'Großansicht Bild',
                allImgs,
                idx
            );
            return;
        }

        const prevNavBtn = e.target.closest('#gaense-lightbox-prev');
        if (prevNavBtn) { navigateLightbox(-1); return; }

        const nextNavBtn = e.target.closest('#gaense-lightbox-next');
        if (nextNavBtn) { navigateLightbox(1); return; }

        const closeLightboxTrigger = e.target.closest('[data-lightbox-close="true"]');
        if (closeLightboxTrigger) {
            closeGaenseLightbox();
            return;
        }

        if (!e.target.closest('#main-nav .main-menu')) {
            closeAllOpenSubmenus();
        }

        const topMenuToggleLink = e.target.closest('#main-nav .main-menu > li.has-submenu > a');
        if (topMenuToggleLink) {
            e.preventDefault();

            const topMenuItem = topMenuToggleLink.parentElement;
            // Explicit click by the user — always clear the post-selection lock
            topMenuItem.classList.remove('submenu-selected');
            const shouldOpen = !topMenuItem.classList.contains('submenu-open');

            closeAllOpenSubmenus(topMenuItem);
            setSubmenuOpenState(topMenuItem, shouldOpen);
            topMenuToggleLink.blur();
            return;
        }

        const link = e.target.closest('a');
        if (link && link.getAttribute('href') && (link.dataset.path || link.getAttribute('href').startsWith('#'))) { 
            // Handle CMS links
            if (link.dataset.path) {
                e.preventDefault();

                const path = link.dataset.path;
                const css = link.dataset.css || inferCssFromPath(path);
                const title = link.dataset.sectionTitle;

                // Push to History
                history.pushState({ path: path, css: css, title: title }, '', '#' + path);

                loadContent(path, css);
                updateFooterByPath(path);
                
                // Update Header Title
                if (title) {
                    const headerH1 = document.querySelector('header h1');
                    if (headerH1) headerH1.textContent = title.toUpperCase();
                }
                // Remove focus to close submenu (fixes :focus-within keeping it open)
                link.blur();

                // Force-close submenu immediately, even while mouse is still over it
                closeSubmenuImmediately(link);

                // Close mobile menu if open
                if (nav) nav.classList.remove('open');
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeGaenseLightbox();
            closeAllOpenSubmenus();
        }
        if (e.key === 'ArrowLeft')  { navigateLightbox(-1); }
        if (e.key === 'ArrowRight') { navigateLightbox(1); }
    });


    // Handle initial load if we had hash routing, 
    // but for now we just start at Welcome.
});

function setSubmenuOpenState(menuItem, isOpen) {
    if (!menuItem) return;

    menuItem.classList.toggle('submenu-open', isOpen);

    const triggerLink = menuItem.querySelector(':scope > a');
    if (triggerLink) {
        triggerLink.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
}

function closeAllOpenSubmenus(exceptItem = null) {
    document.querySelectorAll('#main-nav .main-menu > li.submenu-open').forEach((menuItem) => {
        if (exceptItem && menuItem === exceptItem) return;
        setSubmenuOpenState(menuItem, false);
    });
}

function closeSubmenuImmediately(clickedLink) {
    const topMenuItem = clickedLink.closest('.main-menu > li');
    if (!topMenuItem) return;

    setSubmenuOpenState(topMenuItem, false);
    // Mark this item as "selection made" — hover will no longer reopen it.
    // Only an explicit click on the main menu button removes this class.
    topMenuItem.classList.add('submenu-selected');
}

async function loadMenu() {
    try {
        const response = await fetch('Menu.json');
        const data = await response.json();
        const navContainer = document.getElementById('main-nav');
        
        const ul = document.createElement('ul');
        ul.className = 'main-menu'; // Add class for CSS
        
        data.Menu.NavItems.forEach(item => {
            const li = document.createElement('li');
            if (item.className) li.className = item.className; // Add class from JSON (e.g. reileifzen-btn)

            const hasSubmenu = Array.isArray(item.NavItems) && item.NavItems.length > 0;
            if (hasSubmenu) li.classList.add('has-submenu');

            const a = document.createElement('a');
            // Store main section title for header update
            a.dataset.sectionTitle = item.SectionTitle || item.Name;

            // Icon handling
            if (item.Icon) {
                 a.innerHTML = `<i class="${item.Icon}"></i> ${item.Name}`;
            } else {
                 a.textContent = item.Name;
            }
            
            a.href = "#"; // Prevent default nav
            if (hasSubmenu) {
                a.setAttribute('aria-haspopup', 'true');
                a.setAttribute('aria-expanded', 'false');
            } else {
                a.dataset.path = item.Path;
                if (item.cssFile) a.dataset.css = item.cssFile;
            }
            
            li.appendChild(a);

            // Submenu
            if (item.NavItems && item.NavItems.length > 0) {
                const subUl = document.createElement('ul');
                subUl.className = 'submenu'; // Add class for CSS
                
                item.NavItems.forEach(subItem => {
                    const subLi = document.createElement('li');
                    const subA = document.createElement('a');

                    if (subItem.Icon) {
                        subA.innerHTML = `<i class="${subItem.Icon}"></i> ${subItem.Name}`;
                    } else {
                        subA.textContent = subItem.Name;
                    }

                    subA.href = "#";
                    subA.dataset.path = subItem.Path;
                    subA.dataset.sectionTitle = item.SectionTitle || item.Name; // Use parent name
                    
                    // Inherit CSS from parent if not set
                    const cssToUse = subItem.cssFile || item.cssFile;
                    if (cssToUse) subA.dataset.css = cssToUse;

                    subLi.appendChild(subA);
                    subUl.appendChild(subLi);
                });
                li.appendChild(subUl);
            }
            
            ul.appendChild(li);
        });

        navContainer.appendChild(ul);

    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

async function loadContent(path, cssFile) {
    const contentDiv = document.getElementById('content');
    
    // Show loading?
    contentDiv.innerHTML = '<div style="text-align:center; padding:50px;">Laden...</div>';

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Content not found');
        const html = await response.text();
        contentDiv.innerHTML = html;
        resolveEmbeddedResourceUrls(contentDiv, path);
        await executeEmbeddedScripts(contentDiv, path);

        // Handle Page-Specific CSS by switching the theme link
        const effectiveCss = cssFile || inferCssFromPath(path);
        if (effectiveCss) {
            switchCSS(effectiveCss);
        }

        document.dispatchEvent(new CustomEvent('content:loaded', {
            detail: { path: path, css: effectiveCss }
        }));

    } catch (error) {
        contentDiv.innerHTML = `<div style="text-align:center; padding:50px; color:red;">Fehler beim Laden: ${error.message}</div>`;
    }
}

function resolveEmbeddedResourceUrls(container, pagePath) {
    if (!container || !pagePath) return;

    const selectors = [
        '[src]',
        'a[href]',
        'link[href]'
    ];

    container.querySelectorAll(selectors.join(',')).forEach((element) => {
        if (element.hasAttribute('src')) {
            const currentSrc = element.getAttribute('src');
            const resolvedSrc = resolveUrlFromPagePath(currentSrc, pagePath);
            if (resolvedSrc) element.setAttribute('src', resolvedSrc);
        }

        if (element.hasAttribute('href')) {
            const currentHref = element.getAttribute('href');
            const resolvedHref = resolveUrlFromPagePath(currentHref, pagePath);
            if (resolvedHref) element.setAttribute('href', resolvedHref);
        }
    });
}

async function executeEmbeddedScripts(container, pagePath) {
    if (!container) return;

    const scripts = Array.from(container.querySelectorAll('script'));
    for (const oldScript of scripts) {
        const newScript = document.createElement('script');

        Array.from(oldScript.attributes).forEach((attribute) => {
            if (attribute.name === 'src') {
                const resolvedSrc = resolveUrlFromPagePath(attribute.value, pagePath);
                if (resolvedSrc) {
                    newScript.setAttribute('src', resolvedSrc);
                }
                return;
            }

            newScript.setAttribute(attribute.name, attribute.value);
        });

        if (!oldScript.src) {
            newScript.textContent = oldScript.textContent;
        }

        await new Promise((resolve) => {
            if (newScript.src) {
                newScript.onload = () => resolve();
                newScript.onerror = () => resolve();
            } else {
                resolve();
            }

            oldScript.replaceWith(newScript);
        });
    }
}

function resolveUrlFromPagePath(urlValue, pagePath) {
    if (!urlValue || !pagePath) return '';

    const trimmedUrl = String(urlValue).trim();
    if (!trimmedUrl || trimmedUrl.startsWith('#')) return '';
    if (trimmedUrl.startsWith('/')) return '';

    const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedUrl);
    if (hasScheme || trimmedUrl.startsWith('//')) return '';

    const rootAnchoredSegments = new Set([
        'verkehrsverein',
        'feuerwehr',
        'gaensetraenke',
        'images',
        'css',
        'js',
        'favicon.ico',
        'menu.json'
    ]);

    const firstSegment = trimmedUrl.split('/')[0].toLowerCase();
    const isDotRelative = trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../');

    if (!isDotRelative && rootAnchoredSegments.has(firstSegment)) {
        try {
            return new URL(trimmedUrl, window.location.href).toString();
        } catch {
            return '';
        }
    }

    try {
        return new URL(trimmedUrl, new URL(pagePath, window.location.href)).toString();
    } catch {
        return '';
    }
}

function inferCssFromPath(path) {
    if (!path || typeof path !== 'string') return '';

    const normalizedPath = path.toLowerCase();

    if (normalizedPath.startsWith('gaensetraenke/')) {
        return 'css/gaensetraenke.css';
    }

    if (normalizedPath.startsWith('feuerwehr/')) {
        return 'css/feuerwehr.css';
    }

    if (normalizedPath.startsWith('verkehrsverein/')) {
        return 'css/verkehrsverein.css';
    }

    return '';
}

const FOOTER_DATA = {
    verkehrsverein: {
        orgName: 'Heimat und Verkehrsverein Reileifzen 1969 e.V.',
        phone: 'Tel. 0172-2779069',
        email: 'verkehrsverein@reileifzen.de',
        impressumPath: 'verkehrsverein/impressum.html',
        datenschutzPath: 'verkehrsverein/datenschutz.html'
    },
    gaensetraenke: {
        orgName: 'Gänsetränke Reileifzen',
        phone: 'Tel. 0172-2779069',
        email: 'gaensetraenke@reileifzen.de',
        impressumPath: 'gaensetraenke/impressum.html',
        datenschutzPath: 'gaensetraenke/datenschutz.html'
    },
    feuerwehr: {
        orgName: 'Feuerwehr Reileifzen',
        phone: 'Tel. 0170-4949242',
        email: 'feuerwehr@reileifzen.de',
        impressumPath: 'feuerwehr/impressum.html',
        datenschutzPath: 'feuerwehr/datenschutz.html'
    }
};

function inferSectionFromPath(path) {
    if (!path || typeof path !== 'string') return 'verkehrsverein';

    const normalizedPath = path.toLowerCase();

    if (normalizedPath.startsWith('gaensetraenke/')) return 'gaensetraenke';
    if (normalizedPath.startsWith('feuerwehr/')) return 'feuerwehr';
    if (normalizedPath.startsWith('verkehrsverein/')) return 'verkehrsverein';

    return 'verkehrsverein';
}

function updateFooterByPath(path) {
    const sectionKey = inferSectionFromPath(path);
    const footerData = FOOTER_DATA[sectionKey] || FOOTER_DATA.verkehrsverein;

    const orgNameElement = document.getElementById('footer-org-name');
    const phoneElement = document.getElementById('footer-phone');
    const emailLinkElement = document.getElementById('footer-email-link');
    const impressumLinkElement = document.getElementById('footer-impressum-link');
    const datenschutzLinkElement = document.getElementById('footer-datenschutz-link');

    if (!orgNameElement || !phoneElement || !emailLinkElement || !impressumLinkElement || !datenschutzLinkElement) return;

    orgNameElement.textContent = footerData.orgName;
    phoneElement.textContent = footerData.phone;
    emailLinkElement.textContent = footerData.email;
    emailLinkElement.href = `mailto:${footerData.email}`;

    impressumLinkElement.href = '#';
    impressumLinkElement.dataset.path = footerData.impressumPath;
    impressumLinkElement.dataset.css = inferCssFromPath(footerData.impressumPath);

    datenschutzLinkElement.href = '#';
    datenschutzLinkElement.dataset.path = footerData.datenschutzPath;
    datenschutzLinkElement.dataset.css = inferCssFromPath(footerData.datenschutzPath);
}

function switchCSS(href) {
    const id = 'section-theme-css';
    let link = document.getElementById(id);
    
    // If it exists and matches, do nothing
    if (link && link.getAttribute('href') === href) return;
    
    // If it exists, update it
    if (link) {
        link.href = href;
    } else {
        // Create it
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

function openGaenseLightbox(imageSrc, imageAlt, images, index) {
    ensureGaenseLightbox();
    const lightbox = document.getElementById('gaense-lightbox');
    const lightboxImage = document.getElementById('gaense-lightbox-image');
    if (!lightbox || !lightboxImage || !imageSrc) return;

    if (Array.isArray(images) && images.length > 1) {
        _lightboxImages = images.map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || 'Großansicht Bild'
        }));
        _lightboxIndex = (typeof index === 'number') ? index : 0;
    } else {
        _lightboxImages = [{ src: imageSrc, alt: imageAlt || 'Großansicht Bild' }];
        _lightboxIndex = 0;
    }

    lightboxImage.src = imageSrc;
    lightboxImage.alt = imageAlt || 'Großansicht Bild';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    updateLightboxNavButtons();
}

function closeGaenseLightbox() {
    const lightbox = document.getElementById('gaense-lightbox');
    const lightboxImage = document.getElementById('gaense-lightbox-image');
    if (!lightbox || lightbox.hidden) return;

    lightbox.hidden = true;
    if (lightboxImage) {
        lightboxImage.src = '';
        lightboxImage.alt = 'Großansicht Bild';
    }
    document.body.style.overflow = '';
    _lightboxImages = [];
    _lightboxIndex  = -1;
}

function ensureGaenseLightbox() {
    if (document.getElementById('gaense-lightbox')) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'gaense-lightbox';
    lightbox.id = 'gaense-lightbox';
    lightbox.hidden = true;
    lightbox.innerHTML = `
        <div class="gaense-lightbox-backdrop" data-lightbox-close="true"></div>
        <div class="gaense-lightbox-content" role="dialog" aria-modal="true" aria-label="Gro\u00dfansicht Bild">
            <button type="button" class="gaense-lightbox-close" data-lightbox-close="true" aria-label="Gro\u00dfansicht schlie\u00dfen">&times;</button>
            <button type="button" class="gaense-lightbox-nav gaense-lightbox-prev" id="gaense-lightbox-prev" aria-label="Vorheriges Bild">&#8249;</button>
            <button type="button" class="gaense-lightbox-nav gaense-lightbox-next" id="gaense-lightbox-next" aria-label="N\u00e4chstes Bild">&#8250;</button>
            <img id="gaense-lightbox-image" src="" alt="Gro\u00dfansicht Bild">
        </div>
    `;

    document.body.appendChild(lightbox);
}

function navigateLightbox(direction) {
    const lightbox = document.getElementById('gaense-lightbox');
    if (!lightbox || lightbox.hidden || _lightboxImages.length <= 1) return;

    _lightboxIndex = (_lightboxIndex + direction + _lightboxImages.length) % _lightboxImages.length;
    const { src, alt } = _lightboxImages[_lightboxIndex];
    const lightboxImage = document.getElementById('gaense-lightbox-image');
    if (lightboxImage) {
        lightboxImage.src = src;
        lightboxImage.alt = alt;
    }
    updateLightboxNavButtons();
}

function updateLightboxNavButtons() {
    const prevBtn = document.getElementById('gaense-lightbox-prev');
    const nextBtn = document.getElementById('gaense-lightbox-next');
    const visible = _lightboxImages.length > 1;
    if (prevBtn) prevBtn.style.display = visible ? '' : 'none';
    if (nextBtn) nextBtn.style.display = visible ? '' : 'none';
}
// Removed legacy loadCSS function entirely to avoid confusion

