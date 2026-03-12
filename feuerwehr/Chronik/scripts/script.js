let feuerwehrArticles = window.feuerwehrArticles || [];
let feuerwehrFilteredArticles = [];
let feuerwehrCurrentPage = 1;
const feuerwehrArticlesPerPage = 10;
const feuerwehrLookAheadBehind = 4;
const feuerwehrPaginationSplitter = 10;
const feuerwehrChronikBasePath = 'feuerwehr/Chronik/';

function feuerwehrToChronikPath(resourcePath) {
    if (!resourcePath) return '';

    const value = String(resourcePath).trim();
    if (!value) return '';
    if (value.startsWith('#') || value.startsWith('/') || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) || value.startsWith('//')) return value;

    if (value.startsWith('feuerwehr/Chronik/')) return value;

    return feuerwehrChronikBasePath + value.replace(/^\.\//, '');
}

function feuerwehrIsValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

function feuerwehrRenderArticles(articlesToRender) {
    const container = document.getElementById('articlesContainer');
    if (!container) return;

    const startIndex = (feuerwehrCurrentPage - 1) * feuerwehrArticlesPerPage;
    const endIndex = startIndex + feuerwehrArticlesPerPage;
    const paginatedArticles = articlesToRender.slice(startIndex, endIndex);

    container.innerHTML = '';

    if (paginatedArticles.length === 0) {
        container.innerHTML = '<p>Keine Artikel gefunden.</p>';
        return;
    }

    paginatedArticles.forEach(article => {
        const articleDiv = document.createElement('div');
        articleDiv.className = 'chr_article';

        const docPath = feuerwehrToChronikPath(article.Document);

        const thumbnail = document.createElement('img');
        thumbnail.src = feuerwehrToChronikPath(article.Thumbnail);
        thumbnail.className = 'chr_thumbnail';
        thumbnail.title = 'Artikel öffnen';
        if (docPath) {
            thumbnail.addEventListener('click', function () { feuerwehrOpenPdf(docPath); });
        }
        articleDiv.appendChild(thumbnail);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'chr_article-info';

        const title = document.createElement('h4');
        title.innerText = article.Title;
        infoDiv.appendChild(title);

        const date = document.createElement('p');
        date.innerText = article.Date;
        infoDiv.appendChild(date);

        const summary = document.createElement('p');
        summary.innerText = article.Summary;
        infoDiv.appendChild(summary);

        const link = document.createElement('a');
        link.href = '#';
        link.innerHTML = '... mehr lesen';
        if (docPath) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                feuerwehrOpenPdf(docPath);
            });
        }
        infoDiv.appendChild(link);

        articleDiv.appendChild(infoDiv);
        container.appendChild(articleDiv);
    });
}

function feuerwehrDisplayPagination(totalCount) {
    const container = document.getElementById('pagination');
    if (!container) return;

    container.innerHTML = '';

    const totalPages = Math.ceil(totalCount / feuerwehrArticlesPerPage);

    if (totalPages > feuerwehrPaginationSplitter && feuerwehrCurrentPage > feuerwehrLookAheadBehind) {
        feuerwehrAppendPaginationButton(container, 1);
        feuerwehrAppendPaginationThreeDots(container);
    }

    for (let i = 1; i <= totalPages; i++) {
        if (totalPages <= feuerwehrPaginationSplitter || (i - feuerwehrLookAheadBehind < feuerwehrCurrentPage && i + feuerwehrLookAheadBehind > feuerwehrCurrentPage)) {
            feuerwehrAppendPaginationButton(container, i);
        }
    }

    if (totalPages > feuerwehrPaginationSplitter && feuerwehrCurrentPage < totalPages - feuerwehrLookAheadBehind) {
        feuerwehrAppendPaginationThreeDots(container);
        feuerwehrAppendPaginationButton(container, totalPages);
    }
}

function feuerwehrAppendPaginationButton(container, i) {
    const pageButton = document.createElement('button');
    pageButton.innerText = i;
    pageButton.onclick = function () {
        feuerwehrCurrentPage = i;
        feuerwehrRenderArticles(feuerwehrFilteredArticles);
        feuerwehrDisplayPagination(feuerwehrFilteredArticles.length);
    };

    if (feuerwehrCurrentPage === i) {
        pageButton.classList.add('chr_active');
    }

    container.appendChild(pageButton);
}

function feuerwehrAppendPaginationThreeDots(container) {
    const span = document.createElement('span');
    span.innerText = '...';
    container.appendChild(span);
}

function feuerwehrEnsurePdfViewer() {
    if (document.getElementById('chr_fw_pdf_overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'chr_fw_pdf_overlay';
    overlay.className = 'chr_pdf_overlay';

    const pdfContainer = document.createElement('div');
    pdfContainer.className = 'chr_pdf_container';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'chr_pdf_close';
    closeBtn.id = 'chr_fw_pdf_close';
    closeBtn.title = 'Schließen';
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', feuerwehrClosePdf);

    const frame = document.createElement('iframe');
    frame.className = 'chr_pdf_frame';
    frame.id = 'chr_fw_pdf_frame';
    frame.src = 'about:blank';

    pdfContainer.appendChild(closeBtn);
    pdfContainer.appendChild(frame);
    overlay.appendChild(pdfContainer);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) feuerwehrClosePdf(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') feuerwehrClosePdf(); });
    document.addEventListener('content:loaded', feuerwehrClosePdf);
}

function feuerwehrOpenPdf(url) {
    feuerwehrEnsurePdfViewer();
    const frame = document.getElementById('chr_fw_pdf_frame');
    const overlay = document.getElementById('chr_fw_pdf_overlay');
    if (!frame || !overlay) return;
    frame.src = url;
    overlay.classList.add('chr_pdf_overlay--open');
    document.body.style.overflow = 'hidden';
}

function feuerwehrClosePdf() {
    const frame = document.getElementById('chr_fw_pdf_frame');
    const overlay = document.getElementById('chr_fw_pdf_overlay');
    if (!overlay || !overlay.classList.contains('chr_pdf_overlay--open')) return;
    overlay.classList.remove('chr_pdf_overlay--open');
    document.body.style.overflow = '';
    if (frame) { setTimeout(function () { frame.src = 'about:blank'; }, 300); }
}

function feuerwehrRunSearch() {
    const searchTermElement = document.getElementById('searchTerm');
    const fromDateElement = document.getElementById('fromDate');
    const toDateElement = document.getElementById('toDate');
    if (!searchTermElement || !fromDateElement || !toDateElement) return;

    const searchTerm = searchTermElement.value.toLowerCase();
    const fromDate = new Date(fromDateElement.value);
    const toDate = new Date(toDateElement.value);

    feuerwehrFilteredArticles = feuerwehrArticles.filter(article => {
        const articleDate = new Date(article.Date);

        try {
            const matchesSearchTerm = article.Title.toLowerCase().includes(searchTerm) ||
                article.Summary.toLowerCase().includes(searchTerm);

            const matchesDate = (!feuerwehrIsValidDate(fromDate) || articleDate >= fromDate) &&
                (!feuerwehrIsValidDate(toDate) || articleDate <= toDate);
            return matchesSearchTerm && matchesDate;
        }
        catch {
            return false;
        }
    });

    feuerwehrCurrentPage = 1;
    feuerwehrRenderArticles(feuerwehrFilteredArticles);
    feuerwehrDisplayPagination(feuerwehrFilteredArticles.length);
}

function initFeuerwehrChronikPage() {
    const searchButton = document.getElementById('searchButton');
    const pagination = document.getElementById('pagination');
    const articlesContainer = document.getElementById('articlesContainer');
    if (!searchButton || !pagination || !articlesContainer) return;

    if (searchButton.dataset.fwChrInitialized !== 'true') {
        searchButton.addEventListener('click', feuerwehrRunSearch);
        searchButton.dataset.fwChrInitialized = 'true';
    }

    feuerwehrArticles = (window.feuerwehrArticles || []);
    const sortedArticles = [...feuerwehrArticles].sort((a, b) => new Date(b.Date) - new Date(a.Date));
    feuerwehrFilteredArticles = sortedArticles;
    feuerwehrCurrentPage = 1;

    feuerwehrRenderArticles(feuerwehrFilteredArticles);
    feuerwehrDisplayPagination(feuerwehrFilteredArticles.length);
}

document.addEventListener('content:loaded', (event) => {
    const path = event && event.detail ? String(event.detail.path || '').toLowerCase() : '';
    if (path.startsWith('feuerwehr/chronik/')) {
        initFeuerwehrChronikPage();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeuerwehrChronikPage);
} else {
    initFeuerwehrChronikPage();
}
