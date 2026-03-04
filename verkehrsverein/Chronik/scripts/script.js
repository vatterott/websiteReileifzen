let articles = window.articles || [];
let filteredArticles = [];
let currentPage = 1;
const articlesPerPage = 5;
const lookAheadBehind = 4;
const paginationSplitter = 10;
const chronikBasePath = 'verkehrsverein/Chronik/';
const ocrReplacements = [
    [/\bciaiilendem\b/gi, 'strahlendem'],
    [/\bBevélkerung\b/g, 'Bevölkerung'],
    [/\bGisten\b/g, 'Gästen'],
    [/\bWaldiest\b/g, 'Waldfest'],
    [/\bAuswartigen\b/g, 'Auswärtigen'],
    [/\btatkriftigen\b/g, 'tatkräftigen'],
    [/\bGtinther\b/g, 'Günther'],
    [/\bGeschiftsfiihrer\b/g, 'Geschäftsführer'],
    [/\bDankeschén\b/g, 'Dankeschön'],
    [/\bGrtlichen\b/g, 'örtlichen'],
    [/\btodlich\b/g, 'tödlich'],
    [/\bverunglickt\b/g, 'verunglückt'],
    [/\bverungliickt\b/g, 'verunglückt'],
    [/\bFutball\b/g, 'Fußball'],
    [/\bGinter\b/g, 'Günter'],
    [/\bzwélf\b/g, 'zwölf'],
    [/\bdartiber\b/g, 'darüber'],
    [/\bverlangerte\b/g, 'verlängerte'],
    [/\bGasten\b/g, 'Gästen'],
    [/\bktirzlich\b/g, 'kürzlich'],
    [/\bmuff\b/g, 'muss'],
    [/\bkénnen\b/g, 'können'],
    [/\bUbungsleiterin\b/g, 'Übungsleiterin'],
    [/\bfiir\b/g, 'für'],
    [/\bSüdlander\b/g, 'Südländer'],
    [/\berpreBten\b/g, 'erpressten'],
    [/\bBliihwunder\b/g, 'Blühwunder']
];

function normalizeOcrText(input) {
    let text = String(input || '');
    for (const [pattern, replacement] of ocrReplacements) {
        text = text.replace(pattern, replacement);
    }
    return text;
}

function normalizeArticle(article) {
    return {
        ...article,
        Title: normalizeOcrText(article.Title),
        Summary: normalizeOcrText(article.Summary)
    };
}

function toChronikPath(resourcePath) {
    if (!resourcePath) return '';

    const value = String(resourcePath).trim();
    if (!value) return '';
    if (value.startsWith('#') || value.startsWith('/') || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) || value.startsWith('//')) return value;

    if (value.startsWith('verkehrsverein/Chronik/')) return value;

    return chronikBasePath + value.replace(/^\.\//, '');
}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

function renderArticles(articlesToRender) {
    const container = document.getElementById('articlesContainer');
    if (!container) return;

    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
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
        thumbnail.src = toChronikPath(article.Thumbnail);
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
        link.href = toChronikPath(article.Document);
        link.innerHTML = '... mehr lesen';
        infoDiv.appendChild(link);

        articleDiv.appendChild(infoDiv);
        container.appendChild(articleDiv);
    });
}

function displayPagination(totalCount) {
    const container = document.getElementById('pagination');
    if (!container) return;

    container.innerHTML = '';

    const totalPages = Math.ceil(totalCount / articlesPerPage);

    if (totalPages > paginationSplitter && currentPage > lookAheadBehind) {
        appendPaginationButton(container, 1);
        appendPaginationThreeDots(container);
    }

    for (let i = 1; i <= totalPages; i++) {
        if (totalPages <= paginationSplitter || (i - lookAheadBehind < currentPage && i + lookAheadBehind > currentPage)) {
            appendPaginationButton(container, i);
        }
    }

    if (totalPages > paginationSplitter && currentPage < totalPages - lookAheadBehind) {
        appendPaginationThreeDots(container);
        appendPaginationButton(container, totalPages);
    }
}

function appendPaginationButton(container, i) {
    const pageButton = document.createElement('button');
    pageButton.innerText = i;
    pageButton.onclick = function () {
        currentPage = i;
        renderArticles(filteredArticles);
        displayPagination(filteredArticles.length);
    };

    if (currentPage === i) {
        pageButton.classList.add('chr_active');
    }

    container.appendChild(pageButton);
}

function appendPaginationThreeDots(container) {
    const span = document.createElement('span');
    span.innerText = '...';
    container.appendChild(span);
}

function runSearch() {
    const searchTermElement = document.getElementById('searchTerm');
    const fromDateElement = document.getElementById('fromDate');
    const toDateElement = document.getElementById('toDate');
    if (!searchTermElement || !fromDateElement || !toDateElement) return;

    const searchTerm = searchTermElement.value.toLowerCase();
    const fromDate = new Date(fromDateElement.value);
    const toDate = new Date(toDateElement.value);

    filteredArticles = articles.filter(article => {
        const articleDate = new Date(article.Date);

        try {
            const matchesSearchTerm = article.Title.toLowerCase().includes(searchTerm) ||
                article.Summary.toLowerCase().includes(searchTerm);

            const matchesDate = (!isValidDate(fromDate) || articleDate >= fromDate) && (!isValidDate(toDate) || articleDate <= toDate);
            return matchesSearchTerm && matchesDate;
        }
        catch {
            return false;
        }
    });

    currentPage = 1;
    renderArticles(filteredArticles);
    displayPagination(filteredArticles.length);
}

function initChronikPage() {
    const searchButton = document.getElementById('searchButton');
    const pagination = document.getElementById('pagination');
    const articlesContainer = document.getElementById('articlesContainer');
    if (!searchButton || !pagination || !articlesContainer) return;

    if (searchButton.dataset.chrInitialized !== 'true') {
        searchButton.addEventListener('click', runSearch);
        searchButton.dataset.chrInitialized = 'true';
    }

    articles = (window.articles || []).map(normalizeArticle);
    const sortedArticles = [...articles].sort((a, b) => new Date(b.Date) - new Date(a.Date));
    filteredArticles = sortedArticles;
    currentPage = 1;

    renderArticles(filteredArticles);
    displayPagination(filteredArticles.length);
}

document.addEventListener('content:loaded', (event) => {
    const path = event && event.detail ? String(event.detail.path || '').toLowerCase() : '';
    if (path.startsWith('verkehrsverein/chronik/')) {
        initChronikPage();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChronikPage);
} else {
    initChronikPage();
}