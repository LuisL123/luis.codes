import { renderMarkdown } from "./markdown-mini.js";

export function applyBasePlaceholders(){
  const baseMeta = document.querySelector('meta[name="site-base"]');
  const base = baseMeta ? baseMeta.content : "./";

  // Replace {{base}} in the whole document (simple + effective for small sites)
  document.body.innerHTML = document.body.innerHTML.replaceAll("{{base}}", base);
}

export async function loadIndexIntoList(jsonPath, listId, baseLink){
  const list = document.getElementById(listId);
  if(!list) return;

  const res = await fetch(jsonPath);
  const items = await res.json();

  list.innerHTML = items.map(it => {
    const href = `${baseLink}?p=${encodeURIComponent(it.slug)}`;
    const meta = it.date ? `${it.date}${it.reading_time ? " · " + it.reading_time : ""}` : (it.meta || "");
    return `
      <li class="item">
        <div class="item__title"><a href="${href}">${it.title}</a></div>
        ${meta ? `<div class="item__meta">${meta}</div>` : ""}
        ${it.description ? `<div class="item__meta">${it.description}</div>` : ""}
      </li>
    `;
  }).join("");
}

export function getQueryParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export async function injectPostFromIndex(indexJsonPath, contentDir, bodyId, titleId, metaId){
  const slug = getQueryParam("p");
  const body = document.getElementById(bodyId);

  if(!slug){
    body.innerHTML = `<p class="muted">No item selected.</p>`;
    return;
  }

  const indexRes = await fetch(indexJsonPath);
  const items = await indexRes.json();
  const item = items.find(x => x.slug === slug);

  const mdRes = await fetch(`${contentDir}${slug}.md`);
  if(!mdRes.ok){
    body.innerHTML = `<p class="muted">Couldn’t load content.</p>`;
    return;
  }

  const md = await mdRes.text();
  body.innerHTML = renderMarkdown(md);

  if(item){
    const t = document.getElementById(titleId);
    const m = document.getElementById(metaId);
    if(t) t.textContent = item.title;
    if(m) m.textContent = item.date ? `${item.date}${item.reading_time ? " · " + item.reading_time : ""}` : "";
    document.title = `${item.title} · Your Name`;
  }
}
