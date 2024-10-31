// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs';
/** @todo
 * pdf.js 2.x.x버전 테스트 해보기
 * React에서 검색 기능, 나눠서 보여주는 기능 구현
 */

//// @ts-check

pdfjsLib.GlobalWorkerOptions.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

console.log(window.location.search);

const url = `https://withmy27.github.io/hbs/bulletins/${
	window.location.search.substring(1) ?? 185
}.pdf`;
const container1 = document.querySelector('#con-1');
const container2 = document.querySelector('#con-2');
const pageSlider = document.getElementById('page-slider');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const pageNum = document.getElementById('page-num');
const loading = document.createElement('img');
(loading.src = 'hbs_logo.svg'),
	(loading.alt = 'hbs logo'),
	(loading.height = '300px'),
	(loading.width = '300px'),
	loading.classList.add('loading');

const minHeight = 500;
const sqrt2 = 1.4142135624;
const revSqrt2 = 0.7071067812;
const verticalMargin = 80;
const horizontalMargin = 24;

let pdf = null;
let pdfMeta = null;
let currentPage = 1;
let pageRendering = false;
let pageNumPending = null;
let timer = null;
let pagePerWindow = window.innerWidth >= 800 ? 2 : 1;
let scale = null;
let pageHeight;
let pageWidth;
let isMouseOn = false;

async function renderSinglePage(num, target = 1, flush = 0) {
	if (flush) {
		const container = flush === 1 ? container1 : container2;
		container.innerHTML = '';
		container.style.height = 0;
		container.style.width = 0;
	}

	const container = target === 1 ? container1 : container2;
	// const context = canvas.getContext('2d');
	const page = await pdf.getPage(num);
	let viewport = page.getViewport({ scale });

	container.style.height = viewport.height + 'px';
	container.style.width = viewport.width + 'px';
	container.innerHTML = ''; // 기존 내용 삭제
	container.appendChild(loading);

	if (target === 1) {
		if (pagePerWindow === 1) {
			pageNum.textContent = num + ' / ' + pdf.numPages;
		} else if (pagePerWindow === 2) {
			pageNum.textContent = num + '-' + (num + 1) + ' / ' + pdf.numPages;
		}
	}

	const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
	const opList = await page.getOperatorList();
	const svg = await svgGfx.getSVG(opList, viewport);
	/* 아 pdf가 이상했네 이제 필요 없네...
	// 투명 SVG처리
	if (pdfMeta['usingOpacity'] && pdfMeta['opacities'][String(num)] !== undefined) {
	  console.log('SVG 처리중...');
	  // const svgs = svg.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text, g');
	  const svgs = svg.querySelectorAll('path');
	  svgs.forEach((element) => {
	    console.log(element);
	    // element.setAttribute('fill-opacity', pdfMeta['opacities'][String(num)]);
	    // element.setAttribute('stroke-opacity', pdfMeta['opacities'][String(num)]);
	    // const fillOpacity = element.getAttribute('fill-opacity');
	    // const strokeOpacity = element.getAttribute('stroke-opacity');
	    // if (fillOpacity && num !== 14) {
	    //   element.setAttribute('fill-opacity', 0.3); // 기본 투명도 설정
	    // }
	    // if (strokeOpacity && num !== 14) {
	    //   element.setAttribute('stroke-opacity', 0.3); // 기본 투명도 설정
	    // }
	  });
  }
*/
	// 최종 렌더
	container.innerHTML = ''; // 기존 내용 삭제
	container.appendChild(svg);
}

async function renderPages(num) {
	if (pagePerWindow === 1) {
		await renderSinglePage(num, 1, 2);
	}
	if (pagePerWindow === 2) {
		await renderSinglePage(num, 1);
		await renderSinglePage(num + 1, 2);
	}
}

function onPrevPage() {
	if (currentPage <= 1) {
		return;
	}
	currentPage -= pagePerWindow;
	pageSlider.value = currentPage;
	renderPages(currentPage);
}

function onNextPage() {
	if (currentPage >= pdf.numPages - pagePerWindow + 1) {
		return;
	}
	currentPage += pagePerWindow;
	pageSlider.value = currentPage;
	renderPages(currentPage);
}

/// start from here

// const pdfMetaPromise = fetch('pdfdata.json');
const pdfPromise = pdfjsLib.getDocument(url).promise;

// pdfMeta = await (await pdfMetaPromise).json();
pdf = await pdfPromise;

pdf.getPage(1).then((page) => {
	const viewport = page.getViewport({ scale: 1.0 });
	pageWidth = viewport.width;
	pageHeight = viewport.height;
	scale = (window.innerHeight - verticalMargin) / pageHeight;
	pagePerWindow = pageWidth * scale * 2 < window.innerWidth ? 2 : 1;
	scale =
		pageWidth * scale < window.innerWidth
			? scale
			: (window.innerWidth - horizontalMargin) / pageWidth;
	pageSlider.max = pdf.numPages - pagePerWindow + 1;
	renderPages(currentPage);

	prevBtn.addEventListener('click', onPrevPage);
	nextBtn.addEventListener('click', onNextPage);

	window.addEventListener('resize', () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			pdf.getPage(1).then((page) => {
				const viewport = page.getViewport({ scale: 1.0 });
				pageWidth = viewport.width;
				pageHeight = viewport.height;
				scale = (window.innerHeight - verticalMargin) / pageHeight;
				pagePerWindow =
					pageWidth * scale * 2 < window.innerWidth ? 2 : 1;
				scale =
					pageWidth * scale < window.innerWidth
						? scale
						: (window.innerWidth - horizontalMargin) / pageWidth;
				if (pagePerWindow === 2) {
					currentPage = currentPage - !(currentPage & 1);
				}
				pageSlider.max = pdf.numPages - pagePerWindow + 1;
				renderPages(currentPage);
			});
		}, 300);
	});

	window.onkeyup = (e) => {
		if (e.key === 'ArrowRight' || e.key === ' ') {
			e.preventDefault();
			onNextPage();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			onPrevPage();
		}
	};

	pageSlider.addEventListener('input', (e) => {
		let reqPage = parseInt(e.target.value);
		if (pagePerWindow === 1) {
			currentPage = reqPage;
			pageNum.textContent = currentPage + ' / ' + pdf.numPages;
		} else if (pagePerWindow === 2) {
			currentPage = (reqPage & 1) === 1 ? reqPage : reqPage - 1;
			pageNum.textContent =
				currentPage + '-' + (currentPage + 1) + ' / ' + pdf.numPages;
		}
		pageSlider.value = currentPage;
	});
	pageSlider.addEventListener('change', (e) => {
		let reqPage = parseInt(e.target.value);
		if (pagePerWindow === 1) {
			currentPage = reqPage;
		} else if (pagePerWindow === 2) {
			currentPage = (reqPage & 1) === 1 ? reqPage : reqPage - 1;
		}
		console.log(currentPage);
		renderPages(currentPage);
	});
});
