rng = () => {

    sel = getSelection();
    if (sel.type == "Range") {
        return sel.getRangeAt(0);
    }

}

let counter = 0;

let prevent = false;
document.addEventListener('click', function(e) {
	if (!e.target.className.match(/\bhl\b/)){
		return;
	}
    console.log('mousedown');
	prevent = true;
	let key = e.target.dataset.hlKey;
	elements = document.querySelectorAll('.hl-'+key);
	for(let i =0; i < elements.length; i ++){
		unwrap(elements[i]);
	}

});

document.addEventListener('mouseup', function() {

    let r = rng();
    if (!r) return;
    console.log('mouseup');
    // if (prevent)
    // {
    // 	prevent = false;
    // 	console.log('prevented');
    // 	return;
    // }


    let key = ++counter;

    let start = r.startContainer,
        end = r.endContainer,
        startRoot = start,
        current = start;


    // find possition 
    while (current != r.commonAncestorContainer) {
        startRoot = current;
        current = current.parentElement;
    }

    let endRoot = end;

    current = end;

    while (current != r.commonAncestorContainer) {
        endRoot = current;
        current = current.parentElement;
    }

    // Highlight middle
    if (start == end) {
        split(start, r.startOffset, r.endOffset);
    }
    // Highlight start and beginnings
    else {
        let newStart = split(start, r.startOffset);
        // let el = newStart;
        // while (
        //     (el = el.nextSibling ||
        //     (el.parentElement && el.parentElement.nextSibling)) &&
        //     (el != endRoot)) {
        //     el = annotateChildren(el);
        // }
        el = split(end, 0, r.endOffset);
        while (
            (el = el.previousSibling || (el.parentElement && el.parentElement.previousSibling)) &&
            (el != r.commonAncestorContainer) &&
            // (el != newStart && el != startRoot)
            (el != newStart && el != startRoot)
        ) {
            el = annotateChildren(el);
        }
    }

    getSelection().removeAllRanges();


    function annotateChildren(el) {
        if (el.nodeType == 3) {
            el = surround(el);
            el.className = 'hl hl-'+key;
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
        midElement.className = 'hl hl-'+key;
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

    function surround(element) {

        let newSpan = document.createElement('span');

        newSpan.appendChild(document.createTextNode(element.nodeValue));

        element.parentElement.replaceChild(newSpan, element);
        return newSpan;

    }
});


function unwrap(element){
	if (element.childNodes.length == 1) {
		let textNode = element.childNodes[0];
		element.parentNode.replaceChild(textNode, element);

		// Not supported everywhere
		textNode.parentNode.normalize();
		// let concat = [textNode];

		// let current = textNode;
		// while(current.nextSibling && current.nextSibling.nodeType === 3){
		// 	concat.push(current.nextSibling);
		// 	current = current.nextSibling
		// }

		// current = textNode;
		// while(current.previousSibling && current.previousSibling.nodeType === 3){
		// 	concat.push(current.previousSibling);
		// 	current = current.previousSibling
		// }
		// if (concat.length > 1){
		// 	debugger;
		// }

	}
}