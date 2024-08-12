pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

let pdfDoc = null;
let currentPage = 1;
let scale = 0.8;
let startX = 0,
  startY;
const pdfName = 'hbs.pdf';
const newspaper = document.querySelector('#newspaper');

function renderPages(leftPageNum) {
  const rightPageNum = leftPageNum + 1;

  const renderPage = (pageNum, containerId) => {
    return pdfDoc.getPage(pageNum).then(function (page) {
      const viewport = page.getViewport({ scale });
      const container = document.querySelector(containerId);
      container.style.height = viewport.height + 'px';
      container.style.width = viewport.width + 'px';
      container.innerHTML = ''; // 기존 내용 삭제

      return page.getOperatorList().then(function (opList) {
        const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
        return svgGfx.getSVG(opList, viewport).then(function (svg) {
          // svg.style.width = viewport.width + 'px';
          // svg.style.height = viewport.height + 'px';
          container.appendChild(svg);
        });
      });
    });
  };

  Promise.all([renderPage(leftPageNum, '#news-page-1'), rightPageNum <= pdfDoc.numPages ? renderPage(rightPageNum, '#news-page-2') : Promise.resolve()]).then(
    () => {
      currentPage = leftPageNum;
      updatePageInfo();
    }
  );
}

function updatePageInfo() {
  document.querySelector('#page-info').textContent = `${currentPage} - ${Math.min(currentPage + 1, pdfDoc.numPages)} of ${pdfDoc.numPages}`;
}

function onPrevPage() {
  if (currentPage <= 1) return;
  renderPages(currentPage - 2);
}

function onNextPage() {
  if (currentPage >= pdfDoc.numPages - 1) return;
  renderPages(currentPage + 2);
}

pdfjsLib.getDocument(pdfName).promise.then(function (pdf) {
  pdfDoc = pdf;
  renderPages(1);
});

newspaper.addEventListener('mousedown', (e) => ((startX = e.clientX), (startY = e.clientY)));
newspaper.addEventListener('mouseup', (e) => {
  if (Math.abs(startX - e.clientX) < 2 && Math.abs(startY - e.clientY) < 2) {
    if (startX < window.innerWidth / 2) onPrevPage();
    else onNextPage();
  }
});
