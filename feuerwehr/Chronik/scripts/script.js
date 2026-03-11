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

        const thumbnail = document.createElement('img');
        thumbnail.src = feuerwehrToChronikPath(article.Thumbnail);
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
        link.href = feuerwehrToChronikPath(article.Document);
        link.innerHTML = '... mehr lesen';
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
