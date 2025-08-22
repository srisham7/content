import { dictionary, sexistPhrases } from "./dictionary.js";


async function loadDictionary() {
  const response = await fetch(chrome.runtime.getURL("dictionary.json"));
  return await response.json();
}

//palabras individuales con sugerencia
function highlightText(node, dictionary) {
  let text = node.nodeValue;
  let replaced = false;
  let replacementHTML = text;

  for (let word in dictionary) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    if (regex.test(replacementHTML)) {
      replaced = true;
      replacementHTML = replacementHTML.replace(regex, (match) => {
        return `<span class="inclusive-highlight" data-suggestion="${dictionary[word]}">${match}</span>`;
      });
    }
  }

  if (replaced) {
    const span = document.createElement("span");
    span.innerHTML = replacementHTML;
    node.parentNode.replaceChild(span, node);
  }

  return replaced;
}


function walkDOM(dictionary) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  let nodes = [];

  while ((node = walker.nextNode())) {
    if (node.parentNode && node.parentNode.nodeName !== "SCRIPT" && node.nodeValue.trim() !== "") {
      nodes.push(node);
    }
  }

  nodes.forEach(node => {
    highlightText(node, dictionary);
  });
}

// Detectar y resaltar frases 
function highlightSexistPhrases() {
  const bodyHTML = document.body.innerHTML;
  let newHTML = bodyHTML;

  for (let phrase in sexistPhrases) {
    const regex = new RegExp(phrase, "gi");
    newHTML = newHTML.replace(regex, match =>
      `<span class="inclusive-highlight" data-suggestion="${sexistPhrases[phrase]}">${match}</span>`
    );
  }

  if (newHTML !== bodyHTML) {
    document.body.innerHTML = newHTML;
  }
}

// Cargar y ejecutar
loadDictionary().then((dictionary) => {
  walkDOM(dictionary);
  highlightSexistPhrases();

  // Re-escaneo dinámico
  const observer = new MutationObserver(() => {
    walkDOM(dictionary);
    highlightSexistPhrases();
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
