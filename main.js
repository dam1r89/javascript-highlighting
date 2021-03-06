var style = document.createElement('style');
style.innerHTML = '.hl { background: rgba(255,255,10,0.3) }';
document.head.appendChild(style);

let storage = JSON.parse(localStorage.getItem('storage')) || {
    highlights: {},
    counter: 0
};

function save() {
    localStorage.setItem('storage', JSON.stringify(storage));
}



document.addEventListener('click', function(e) {
    if (!e.target.className.match(/\bhl\b/)) {
        return;
    }
    let key = e.target.dataset.hlKey;
    elements = document.querySelectorAll('.hl-' + key);
    for (let i = 0; i < elements.length; i++) {
        unwrap(elements[i]);
    }
    delete storage.highlights[key];
    save();

});

let xp = {
    base: 'body',
    toRange: function(obj) {
        let root = document.querySelector(this.base);
        return {
            startContainer: document.evaluate(obj.start, root, null, XPathResult.ANY_TYPE, null).iterateNext(),
            startOffset: obj.startOffset,
            endContainer: document.evaluate(obj.end, root, null, XPathResult.ANY_TYPE, null).iterateNext(),
            endOffset: obj.endOffset,
            commonAncestorContainer: document.evaluate(obj.commonAncestorContainer, root, null, XPathResult.ANY_TYPE, null).iterateNext()
        }
    },
    toObject: function(rng) {

        let root = document.querySelector(this.base);

        return {
            start: this.getPath(rng.startContainer, root),
            startOffset: rng.startOffset,
            end: this.getPath(rng.endContainer, root),
            endOffset: rng.endOffset,
            commonAncestorContainer: this.getPath(rng.commonAncestorContainer, root)
        }
    },
    getPath(from, root) {

        let path = '';
        let current = from;

        while (current && current != root) {
            let selector = current.nodeType == 1 ? current.tagName.toLowerCase() : 'text()';
            path = '/' + selector + '[' + this.getIndex(current) + ']' + path;
            current = current.parentNode;
        }

        path = '.' + path;
        return path;
    },
    getIndex(el) {
        let count = 1;
        let current = el.previousSibling;
        while (current) {
            if (current.tagName == el.tagName) {
                count += 1;
            }
            current = current.previousSibling;
        }
        return count;
    }
}


document.addEventListener('mouseup', function() {


    let sel = getSelection();
    let range = sel.getRangeAt(0);

    let key = ++storage.counter;

    let store = xp.toObject(range)

    if (range.startContainer == range.endContainer && range.startOffset == range.endOffset) return;

    console.log(store);


    storage.highlights[key] = store;
    save();

    r = xp.toRange(store);

    // assertion
    if (range.startOffset != r.startOffset) {
        debugger;
    }
    if (range.endOffset != r.endOffset) {
        debugger;
    }
    if (range.startContainer != r.startContainer) {
        debugger;
    }
    if (range.endContainer != r.endContainer) {
        debugger;
    }

    if (range.commonAncestorContainer != r.commonAncestorContainer) {
        debugger;
    }

    annotate(range, key);

    getSelection().removeAllRanges();

});


function annotate(r, key) {


    if (r.startContainer == r.endContainer && r.startOffset == r.endOffset) return;

    let start = r.startContainer,
        end = r.endContainer,
        startRoot = start,
        current = start;


    // find possition 
    while (current != r.commonAncestorContainer) {
        startRoot = current;
        current = current.parentElement;
    }

    // Highlight middle
    if (start == end) {
        split(start, r.startOffset, r.endOffset);
    }
    // Highlight start and beginnings
    else {
        let newStart = split(start, r.startOffset);
        let el = newStart;
        while (
            (el = el.nextSibling ||
                (el.parentElement && el.parentElement.nextSibling)) &&
            (el.parentElement != r.commonAncestorContainer)) {
            el = annotateChildren(el);
        }

        el = split(end, 0, r.endOffset);
        while (true) {
            if (!el.previousSibling) {
                el = el.parentElement;
                continue;
            } 
            el = el.previousSibling;
            if (el == r.commonAncestorContainer || el == newStart || el == startRoot) {
                break;
            }
            el = annotateChildren(el);
        }


    }



    function annotateChildren(el) {
        if (el.nodeType == 3) {
            el = wrap(el);
            el.className = 'hl hl-' + key;
            el.dataset.hlKey = key;
            return el;
        }
        for (var i = 0; i < el.childNodes.length; i++) {
            annotateChildren(el.childNodes[i], key);
        }
        return el;

    }

    function split(el, index, endIndex) {
        // No need to split if not text node
        if (el.nodeType != 3) {
            return el;
        }

        let start = el.nodeValue.substr(0, index);
        let startElement = document.createTextNode(start);

        let mid = el.nodeValue.substr(index, endIndex ? endIndex - index : undefined);
        let midElement = document.createElement('span');
        midElement.className = 'hl hl-' + key;
        midElement.dataset.hlKey = key;
        midElement.appendChild(document.createTextNode(mid));

        let end = el.nodeValue.substr(endIndex)
        let endElement = endIndex ? document.createTextNode(end) : undefined;


        // Replace split elements instead of old text
        let newElms = [startElement, midElement, endElement].filter(x => !!(x && x.nodeValue !== '')).reverse();

        let parent = el.parentElement;
        newElms.forEach((newEl, ind) => {
            if (ind === 0) {
                parent.replaceChild(newEl, el);
            } else {
                parent.insertBefore(newEl, newElms[ind - 1]);
            }
        });

        return midElement;

    }
}



function wrap(element) {

    let newSpan = document.createElement('span');

    newSpan.appendChild(document.createTextNode(element.nodeValue));

    element.parentElement.replaceChild(newSpan, element);
    return newSpan;

}

function unwrap(element) {

    let childNodes = element.childNodes;

    let first = true;
    let before;
    while (childNodes.length > 0) {
        if (first) {
            before = childNodes[childNodes.length - 1];
            element.parentNode.replaceChild(before, element);
            first = false;
        } else {
            before.parentNode.insertBefore(childNodes[0], before);
        }
    }
    if (before && before.parentNode.normalize) {
        before.parentNode.normalize();
    }
}




Object.keys(storage.highlights).forEach(key => {
    annotate(xp.toRange(storage.highlights[key]), key);
});
